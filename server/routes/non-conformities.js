import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Listar não conformidades
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, status, priority } = req.query;
    
    let query = `
      SELECT nc.*, u.name as reported_by_name, c.name as client_name
      FROM non_conformities nc
      LEFT JOIN users u ON nc.reported_by = u.id
      LEFT JOIN clients c ON nc.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (nc.title LIKE ? OR nc.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND nc.status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND nc.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY nc.created_at DESC';

    const nonConformities = await getAll(query, params);
    res.json(nonConformities);
  } catch (error) {
    logger.error('Erro ao listar não conformidades:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar não conformidade
router.post('/', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      client_id,
      equipment_id,
      due_date
    } = req.body;

    if (!title || !description || !priority) {
      return res.status(400).json({ error: 'Título, descrição e prioridade são obrigatórios' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO non_conformities (
        id, title, description, priority, status, client_id, equipment_id,
        due_date, reported_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, title, description, priority, 'aberta', client_id, equipment_id,
      due_date, req.user.id
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'non_conformities', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Não conformidade criada com sucesso' });
  } catch (error) {
    logger.error('Erro ao criar não conformidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar não conformidade
router.put('/:id', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      status,
      client_id,
      equipment_id,
      due_date,
      resolution
    } = req.body;

    // Verificar se a não conformidade existe
    const existing = await getOne('SELECT * FROM non_conformities WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Não conformidade não encontrada' });
    }

    await executeQuery(`
      UPDATE non_conformities SET
        title = ?, description = ?, priority = ?, status = ?,
        client_id = ?, equipment_id = ?, due_date = ?, resolution = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      title, description, priority, status, client_id, equipment_id,
      due_date, resolution, id
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'non_conformities', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Não conformidade atualizada com sucesso' });
  } catch (error) {
    logger.error('Erro ao atualizar não conformidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar não conformidade
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a não conformidade existe
    const existing = await getOne('SELECT * FROM non_conformities WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Não conformidade não encontrada' });
    }

    await executeQuery('DELETE FROM non_conformities WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'non_conformities', id, JSON.stringify(existing)]);

    res.json({ message: 'Não conformidade deletada com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar não conformidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter não conformidade por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const nonConformity = await getOne(`
      SELECT nc.*, u.name as reported_by_name, c.name as client_name
      FROM non_conformities nc
      LEFT JOIN users u ON nc.reported_by = u.id
      LEFT JOIN clients c ON nc.client_id = c.id
      WHERE nc.id = ?
    `, [id]);

    if (!nonConformity) {
      return res.status(404).json({ error: 'Não conformidade não encontrada' });
    }

    res.json(nonConformity);
  } catch (error) {
    logger.error('Erro ao obter não conformidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 