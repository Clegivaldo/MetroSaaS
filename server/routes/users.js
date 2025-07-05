import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// Listar usuários
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { search, role, status } = req.query;
    
    let query = 'SELECT id, email, name, role, status, last_login, created_at, updated_at FROM users WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const users = await getAll(query, params);
    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar usuário
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Nome, email e perfil são obrigatórios' });
    }

    // Verificar se já existe usuário com mesmo email
    const existing = await getOne('SELECT id FROM users WHERE email = ?', [email]);

    if (existing) {
      return res.status(400).json({ error: 'Já existe um usuário com este email' });
    }

    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO users (
        id, email, password_hash, name, role, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [id, email, hashedPassword, name, role, 'ativo']);

    // Enviar email de boas-vindas com senha
    try {
      await emailService.sendWelcomeEmail(email, name, role, tempPassword);
    } catch (emailError) {
      console.error('Erro ao enviar email de boas-vindas:', emailError);
    }

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'users', id, JSON.stringify({ name, email, role })]);

    res.status(201).json({ id, message: 'Usuário criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar usuário
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    // Verificar se o usuário existe
    const existing = await getOne('SELECT * FROM users WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await executeQuery(`
      UPDATE users SET
        name = ?, email = ?, role = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [name, email, role, status, id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'users', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar usuário
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Não permitir deletar o próprio usuário
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Não é possível deletar seu próprio usuário' });
    }

    // Verificar se o usuário existe
    const existing = await getOne('SELECT * FROM users WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await executeQuery('DELETE FROM users WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'users', id, JSON.stringify(existing)]);

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter usuário por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await getOne(
      'SELECT id, email, name, role, status, last_login, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Alterar senha
router.put('/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Verificar se é o próprio usuário ou admin
    if (id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permissão insuficiente' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    // Se não for admin, verificar senha atual
    if (id === req.user.id && currentPassword) {
      const user = await getOne('SELECT password_hash FROM users WHERE id = ?', [id]);
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await executeQuery('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?', [hashedPassword, id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'PASSWORD_CHANGE', 'users', id]);

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Resetar senha de usuário (admin)
router.post('/:id/reset-password', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o usuário existe
    const user = await getOne('SELECT * FROM users WHERE id = ?', [id]);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Gerar nova senha
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await executeQuery('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?', [hashedPassword, id]);

    // Enviar email com nova senha
    try {
      await emailService.sendPasswordReset(user.email, newPassword);
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      return res.status(500).json({ error: 'Erro ao enviar email' });
    }

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'PASSWORD_RESET_ADMIN', 'users', id]);

    res.json({ message: 'Nova senha enviada por email' });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;