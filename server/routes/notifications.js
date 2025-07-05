import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Listar notificações do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { unread_only } = req.query;
    
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [req.user.id];

    if (unread_only === 'true') {
      query += ' AND read_at IS NULL';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const notifications = await getAll(query, params);
    res.json(notifications);
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Marcar notificação como lida
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a notificação pertence ao usuário
    const notification = await getOne(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    await executeQuery(
      'UPDATE notifications SET read_at = datetime("now") WHERE id = ?',
      [id]
    );

    res.json({ message: 'Notificação marcada como lida' });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Marcar todas as notificações como lidas
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await executeQuery(
      'UPDATE notifications SET read_at = datetime("now") WHERE user_id = ? AND read_at IS NULL',
      [req.user.id]
    );

    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Contar notificações não lidas
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const result = await getOne(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL',
      [req.user.id]
    );

    res.json({ count: result.count });
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar notificação (uso interno do sistema)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { user_id, title, message, type } = req.body;

    if (!user_id || !title || !message) {
      return res.status(400).json({ error: 'Usuário, título e mensagem são obrigatórios' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO notifications (id, user_id, title, message, type, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [id, user_id, title, message, type || 'info']);

    res.status(201).json({ id, message: 'Notificação criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar notificação
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a notificação pertence ao usuário
    const notification = await getOne(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    await executeQuery('DELETE FROM notifications WHERE id = ?', [id]);

    res.json({ message: 'Notificação deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;