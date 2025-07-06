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
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    // Verificar se o usuário existe
    const existing = await getOne('SELECT * FROM users WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar permissões: apenas admin pode alterar role e status, ou o próprio usuário pode alterar nome e email
    if (req.user.role !== 'admin' && id !== req.user.id) {
      return res.status(403).json({ error: 'Permissão insuficiente' });
    }

    // Se não for admin, só pode alterar nome e email
    if (req.user.role !== 'admin') {
      await executeQuery(`
        UPDATE users SET
          name = ?, email = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [name, email, id]);
    } else {
      // Garantir que role e status não sejam null
      const updateRole = role || existing.role;
      const updateStatus = status || existing.status;
      
      await executeQuery(`
        UPDATE users SET
          name = ?, email = ?, role = ?, status = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [name, email, updateRole, updateStatus, id]);
    }

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

// Obter permissões de um usuário
router.get('/:userId/permissions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userPermissions = await getAll(`
      SELECT up.permission_id, up.granted, p.name, p.description, p.module
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = ?
    `, [userId]);

    res.json(userPermissions);
  } catch (error) {
    console.error('Erro ao obter permissões do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar permissão de um usuário
router.put('/:userId/permissions/:permissionId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId, permissionId } = req.params;
    const { granted } = req.body;

    // Verificar se o usuário existe
    const user = await getOne('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se a permissão existe
    const permission = await getOne('SELECT * FROM permissions WHERE id = ?', [permissionId]);
    if (!permission) {
      return res.status(404).json({ error: 'Permissão não encontrada' });
    }

    // Verificar se já existe registro
    const existing = await getOne('SELECT * FROM user_permissions WHERE user_id = ? AND permission_id = ?', [userId, permissionId]);

    if (existing) {
      await executeQuery(`
        UPDATE user_permissions SET granted = ?, updated_at = datetime('now')
        WHERE user_id = ? AND permission_id = ?
      `, [granted, userId, permissionId]);
    } else {
      await executeQuery(`
        INSERT INTO user_permissions (user_id, permission_id, granted, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `, [userId, permissionId, granted]);
    }

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE_PERMISSION', 'user_permissions', `${userId}-${permissionId}`, JSON.stringify({ granted })]);

    res.json({ message: 'Permissão atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar permissão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter todas as permissões
router.get('/permissions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const permissions = await getAll('SELECT * FROM permissions ORDER BY module, name');
    res.json(permissions);
  } catch (error) {
    console.error('Erro ao obter permissões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter permissões de usuários
router.get('/permissions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    const permissions = await getAll(`
      SELECT p.*, up.granted
      FROM permissions p
      LEFT JOIN user_permissions up ON p.id = up.permission_id AND up.user_id = ?
      ORDER BY p.name
    `, [user_id]);

    res.json(permissions);
  } catch (error) {
    console.error('Erro ao obter permissões do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar permissões de usuário
router.put('/:id/permissions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    // Verificar se o usuário existe
    const user = await getOne('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Limpar permissões existentes
    await executeQuery('DELETE FROM user_permissions WHERE user_id = ?', [id]);

    // Inserir novas permissões
    for (const permission of permissions) {
      await executeQuery(`
        INSERT INTO user_permissions (id, user_id, permission_id, granted, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `, [uuidv4(), id, permission.permission_id, permission.granted ? 1 : 0]);
    }

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE_PERMISSIONS', 'user_permissions', id, JSON.stringify(permissions)]);

    res.json({ message: 'Permissões atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar permissões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;