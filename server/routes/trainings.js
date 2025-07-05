import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar treinamentos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, category, status } = req.query;
    
    let query = 'SELECT * FROM trainings WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const trainings = await getAll(query, params);
    res.json(trainings);
  } catch (error) {
    console.error('Erro ao listar treinamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar treinamento
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      title,
      description,
      youtube_url,
      duration,
      category,
      required_for
    } = req.body;

    if (!title || !youtube_url || !category) {
      return res.status(400).json({ error: 'Título, URL do YouTube e categoria são obrigatórios' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO trainings (
        id, title, description, youtube_url, duration, category,
        required_for, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, title, description, youtube_url, duration, category,
      JSON.stringify(required_for), 'ativo'
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'trainings', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Treinamento criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar treinamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar treinamento
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      youtube_url,
      duration,
      category,
      required_for,
      status
    } = req.body;

    // Verificar se o treinamento existe
    const existing = await getOne('SELECT * FROM trainings WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Treinamento não encontrado' });
    }

    await executeQuery(`
      UPDATE trainings SET
        title = ?, description = ?, youtube_url = ?, duration = ?,
        category = ?, required_for = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [
      title, description, youtube_url, duration, category,
      JSON.stringify(required_for), status, id
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'trainings', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Treinamento atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar treinamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar treinamento
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o treinamento existe
    const existing = await getOne('SELECT * FROM trainings WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Treinamento não encontrado' });
    }

    await executeQuery('DELETE FROM trainings WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'trainings', id, JSON.stringify(existing)]);

    res.json({ message: 'Treinamento deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar treinamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter treinamento por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const training = await getOne('SELECT * FROM trainings WHERE id = ?', [id]);

    if (!training) {
      return res.status(404).json({ error: 'Treinamento não encontrado' });
    }

    res.json(training);
  } catch (error) {
    console.error('Erro ao obter treinamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Marcar treinamento como concluído
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;

    // Verificar se o treinamento existe
    const training = await getOne('SELECT * FROM trainings WHERE id = ?', [id]);

    if (!training) {
      return res.status(404).json({ error: 'Treinamento não encontrado' });
    }

    // Verificar se já existe participação
    const existing = await getOne(
      'SELECT * FROM training_participations WHERE user_id = ? AND training_id = ?',
      [req.user.id, id]
    );

    if (existing) {
      // Atualizar participação existente
      await executeQuery(`
        UPDATE training_participations SET
          completed_at = datetime('now'), score = ?, status = ?
        WHERE user_id = ? AND training_id = ?
      `, [score, 'concluido', req.user.id, id]);
    } else {
      // Criar nova participação
      await executeQuery(`
        INSERT INTO training_participations (
          id, user_id, training_id, completed_at, score, status, created_at
        ) VALUES (?, ?, ?, datetime('now'), ?, ?, datetime('now'))
      `, [uuidv4(), req.user.id, id, score, 'concluido']);
    }

    res.json({ message: 'Treinamento marcado como concluído' });
  } catch (error) {
    console.error('Erro ao completar treinamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter participações do usuário
router.get('/user/participations', authenticateToken, async (req, res) => {
  try {
    const participations = await getAll(`
      SELECT tp.*, t.title, t.category, t.duration
      FROM training_participations tp
      JOIN trainings t ON tp.training_id = t.id
      WHERE tp.user_id = ?
      ORDER BY tp.created_at DESC
    `, [req.user.id]);

    res.json(participations);
  } catch (error) {
    console.error('Erro ao obter participações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;