import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar agendamentos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, status, date, technician_id } = req.query;
    
    let query = `
      SELECT a.*, c.name as client_name, e.name as equipment_name, u.name as technician_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN equipment e ON a.equipment_id = e.id
      LEFT JOIN users u ON a.technician_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (c.name LIKE ? OR a.service_type LIKE ? OR a.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND DATE(a.scheduled_date) = ?';
      params.push(date);
    }

    if (technician_id) {
      query += ' AND a.technician_id = ?';
      params.push(technician_id);
    }

    query += ' ORDER BY a.scheduled_date ASC';

    const appointments = await getAll(query, params);
    res.json(appointments);
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar agendamento
router.post('/', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const {
      client_id,
      equipment_id,
      scheduled_date,
      service_type,
      description,
      technician_id,
      location,
      estimated_duration
    } = req.body;

    if (!client_id || !scheduled_date || !service_type) {
      return res.status(400).json({ error: 'Cliente, data e tipo de serviço são obrigatórios' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO appointments (
        id, client_id, equipment_id, scheduled_date, status, service_type,
        description, technician_id, location, estimated_duration, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, client_id, equipment_id, scheduled_date, 'agendado', service_type,
      description, technician_id, location, estimated_duration
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'appointments', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Agendamento criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar agendamento
router.put('/:id', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_id,
      equipment_id,
      scheduled_date,
      status,
      service_type,
      description,
      technician_id,
      location,
      estimated_duration
    } = req.body;

    // Verificar se o agendamento existe
    const existing = await getOne('SELECT * FROM appointments WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    await executeQuery(`
      UPDATE appointments SET
        client_id = ?, equipment_id = ?, scheduled_date = ?, status = ?,
        service_type = ?, description = ?, technician_id = ?, location = ?,
        estimated_duration = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [
      client_id, equipment_id, scheduled_date, status, service_type,
      description, technician_id, location, estimated_duration, id
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'appointments', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Agendamento atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar agendamento
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o agendamento existe
    const existing = await getOne('SELECT * FROM appointments WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    await executeQuery('DELETE FROM appointments WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'appointments', id, JSON.stringify(existing)]);

    res.json({ message: 'Agendamento deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter agendamento por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await getOne(`
      SELECT a.*, c.name as client_name, e.name as equipment_name, u.name as technician_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN equipment e ON a.equipment_id = e.id
      LEFT JOIN users u ON a.technician_id = u.id
      WHERE a.id = ?
    `, [id]);

    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Erro ao obter agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;