import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne } from '../database/connection.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Verificar tentativas de login
    const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar se a conta está bloqueada
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({ 
        error: 'Conta temporariamente bloqueada devido a muitas tentativas de login' 
      });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // Incrementar tentativas falhadas
      await executeQuery(`
        UPDATE users 
        SET failed_login_attempts = failed_login_attempts + 1,
            locked_until = CASE 
              WHEN failed_login_attempts >= 2 THEN datetime('now', '+15 minutes')
              ELSE NULL 
            END
        WHERE id = ?
      `, [user.id]);

      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (user.status !== 'ativo') {
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    // Reset tentativas e atualizar último login
    await executeQuery(`
      UPDATE users 
      SET failed_login_attempts = 0, 
          locked_until = NULL, 
          last_login = datetime('now')
      WHERE id = ?
    `, [user.id]);

    // Gerar token
    const token = generateToken(user);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), user.id, 'LOGIN', req.ip, req.get('User-Agent')]);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Reset de senha
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      // Por segurança, não revelar se o email existe
      return res.json({ message: 'Se o email existir, uma nova senha será enviada' });
    }

    // Gerar nova senha
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha no banco
    await executeQuery('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, user.id]);

    // Enviar email com nova senha
    try {
      await emailService.sendPasswordReset(email, newPassword);
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      return res.status(500).json({ error: 'Erro ao enviar email' });
    }

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), user.id, 'PASSWORD_RESET', req.ip, req.get('User-Agent')]);

    res.json({ message: 'Nova senha enviada por email' });
  } catch (error) {
    console.error('Erro no reset de senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  // Log de auditoria
  await executeQuery(`
    INSERT INTO audit_logs (id, user_id, action, ip_address, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `, [uuidv4(), req.user.id, 'LOGOUT', req.ip, req.get('User-Agent')]);

  res.json({ message: 'Logout realizado com sucesso' });
});

export default router;