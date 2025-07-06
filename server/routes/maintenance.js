import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar manutenções
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, status, type, equipment_id } = req.query;
    
    let query = `
      SELECT m.*, e.name as equipment_name, e.serial_number as equipment_serial,
             u.name as technician_name
      FROM maintenance m
      LEFT JOIN equipment e ON m.equipment_id = e.id
      LEFT JOIN users u ON m.technician_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (m.description LIKE ? OR e.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND m.status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND m.type = ?';
      params.push(type);
    }

    if (equipment_id) {
      query += ' AND m.equipment_id = ?';
      params.push(equipment_id);
    }

    query += ' ORDER BY m.created_at DESC';

    const maintenance = await getAll(query, params);
    res.json(maintenance);
  } catch (error) {
    console.error('Erro ao listar manutenções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar manutenção
router.post('/', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const {
      equipment_id,
      type,
      description,
      scheduled_date,
      technician_id,
      cost,
      observations
    } = req.body;

    if (!equipment_id || !type || !description) {
      return res.status(400).json({ error: 'Equipamento, tipo e descrição são obrigatórios' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO maintenance (
        id, equipment_id, type, description, scheduled_date, 
        technician_id, cost, observations, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, equipment_id, type, description, scheduled_date,
      technician_id, cost, observations
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'maintenance', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Manutenção criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar manutenção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar manutenção
router.put('/:id', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      equipment_id,
      type,
      description,
      scheduled_date,
      completed_date,
      technician_id,
      cost,
      observations,
      status
    } = req.body;

    const existing = await getOne('SELECT * FROM maintenance WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Manutenção não encontrada' });
    }

    await executeQuery(`
      UPDATE maintenance SET
        equipment_id = ?, type = ?, description = ?, scheduled_date = ?,
        completed_date = ?, technician_id = ?, cost = ?, observations = ?,
        status = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [
      equipment_id, type, description, scheduled_date, completed_date,
      technician_id, cost, observations, status, id
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'maintenance', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Manutenção atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar manutenção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar manutenção
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getOne('SELECT * FROM maintenance WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Manutenção não encontrada' });
    }

    await executeQuery('DELETE FROM maintenance WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'maintenance', id, JSON.stringify(existing)]);

    res.json({ message: 'Manutenção deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar manutenção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter manutenção por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const maintenance = await getOne(`
      SELECT m.*, e.name as equipment_name, e.serial_number as equipment_serial,
             u.name as technician_name
      FROM maintenance m
      LEFT JOIN equipment e ON m.equipment_id = e.id
      LEFT JOIN users u ON m.technician_id = u.id
      WHERE m.id = ?
    `, [id]);

    if (!maintenance) {
      return res.status(404).json({ error: 'Manutenção não encontrada' });
    }

    res.json(maintenance);
  } catch (error) {
    console.error('Erro ao buscar manutenção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 