import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar reclamações
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, status, complaint_type, priority } = req.query;
    
    let query = `
      SELECT cc.*, 
             c.name as client_name,
             u.name as assigned_to_name
      FROM customer_complaints cc
      LEFT JOIN clients c ON cc.client_id = c.id
      LEFT JOIN users u ON cc.assigned_to = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (cc.title LIKE ? OR cc.description LIKE ? OR c.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND cc.status = ?';
      params.push(status);
    }

    if (complaint_type) {
      query += ' AND cc.complaint_type = ?';
      params.push(complaint_type);
    }

    if (priority) {
      query += ' AND cc.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY cc.created_at DESC';

    const complaints = await getAll(query, params);
    res.json(complaints);
  } catch (error) {
    console.error('Erro ao listar reclamações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar reclamação
router.post('/', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const {
      client_id,
      title,
      description,
      received_date,
      complaint_type,
      priority,
      assigned_to
    } = req.body;

    if (!client_id || !title || !description || !received_date || !complaint_type || !priority) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO customer_complaints (
        id, client_id, title, description, received_date, complaint_type,
        priority, assigned_to, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, client_id, title, description, received_date, complaint_type,
      priority, assigned_to
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'customer_complaints', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Reclamação registrada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar reclamação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar reclamação
router.put('/:id', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_id,
      title,
      description,
      received_date,
      complaint_type,
      priority,
      status,
      assigned_to,
      resolution,
      resolution_date,
      customer_satisfaction
    } = req.body;

    const existing = await getOne('SELECT * FROM customer_complaints WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Reclamação não encontrada' });
    }

    await executeQuery(`
      UPDATE customer_complaints SET
        client_id = ?, title = ?, description = ?, received_date = ?,
        complaint_type = ?, priority = ?, status = ?, assigned_to = ?,
        resolution = ?, resolution_date = ?, customer_satisfaction = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      client_id, title, description, received_date, complaint_type,
      priority, status, assigned_to, resolution, resolution_date,
      customer_satisfaction, id
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'customer_complaints', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Reclamação atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar reclamação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar reclamação
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getOne('SELECT * FROM customer_complaints WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Reclamação não encontrada' });
    }

    await executeQuery('DELETE FROM customer_complaints WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'customer_complaints', id, JSON.stringify(existing)]);

    res.json({ message: 'Reclamação deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar reclamação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter reclamação por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const complaint = await getOne(`
      SELECT cc.*, 
             c.name as client_name,
             u.name as assigned_to_name
      FROM customer_complaints cc
      LEFT JOIN clients c ON cc.client_id = c.id
      LEFT JOIN users u ON cc.assigned_to = u.id
      WHERE cc.id = ?
    `, [id]);

    if (!complaint) {
      return res.status(404).json({ error: 'Reclamação não encontrada' });
    }

    res.json(complaint);
  } catch (error) {
    console.error('Erro ao buscar reclamação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 