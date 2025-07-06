import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar condições ambientais
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { appointment_id } = req.query;
    
    let query = `
      SELECT ec.*, a.scheduled_date, a.service_type,
             c.name as client_name, e.name as equipment_name
      FROM environmental_conditions ec
      LEFT JOIN appointments a ON ec.appointment_id = a.id
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN equipment e ON a.equipment_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (appointment_id) {
      query += ' AND ec.appointment_id = ?';
      params.push(appointment_id);
    }

    query += ' ORDER BY ec.recorded_at DESC';

    const conditions = await getAll(query, params);
    res.json(conditions);
  } catch (error) {
    console.error('Erro ao listar condições ambientais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar condição ambiental
router.post('/', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const {
      appointment_id,
      temperature,
      humidity,
      pressure,
      notes
    } = req.body;

    if (!appointment_id) {
      return res.status(400).json({ error: 'Agendamento é obrigatório' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO environmental_conditions (
        id, appointment_id, temperature, humidity, pressure, notes, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      id, appointment_id, temperature, humidity, pressure, notes
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'environmental_conditions', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Condição ambiental registrada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar condição ambiental:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar condição ambiental
router.put('/:id', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      appointment_id,
      temperature,
      humidity,
      pressure,
      notes
    } = req.body;

    const existing = await getOne('SELECT * FROM environmental_conditions WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Condição ambiental não encontrada' });
    }

    await executeQuery(`
      UPDATE environmental_conditions SET
        appointment_id = ?, temperature = ?, humidity = ?, pressure = ?,
        notes = ?, recorded_at = datetime('now')
      WHERE id = ?
    `, [
      appointment_id, temperature, humidity, pressure, notes, id
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'environmental_conditions', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Condição ambiental atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar condição ambiental:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar condição ambiental
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getOne('SELECT * FROM environmental_conditions WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Condição ambiental não encontrada' });
    }

    await executeQuery('DELETE FROM environmental_conditions WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'environmental_conditions', id, JSON.stringify(existing)]);

    res.json({ message: 'Condição ambiental deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar condição ambiental:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter condição ambiental por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const condition = await getOne(`
      SELECT ec.*, a.scheduled_date, a.service_type,
             c.name as client_name, e.name as equipment_name
      FROM environmental_conditions ec
      LEFT JOIN appointments a ON ec.appointment_id = a.id
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN equipment e ON a.equipment_id = e.id
      WHERE ec.id = ?
    `, [id]);

    if (!condition) {
      return res.status(404).json({ error: 'Condição ambiental não encontrada' });
    }

    res.json(condition);
  } catch (error) {
    console.error('Erro ao buscar condição ambiental:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 