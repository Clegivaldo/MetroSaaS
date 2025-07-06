import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar resultados de testes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { appointment_id, result } = req.query;
    
    let query = `
      SELECT tr.*, a.scheduled_date, a.service_type,
             c.name as client_name, e.name as equipment_name
      FROM test_results tr
      LEFT JOIN appointments a ON tr.appointment_id = a.id
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN equipment e ON a.equipment_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (appointment_id) {
      query += ' AND tr.appointment_id = ?';
      params.push(appointment_id);
    }

    if (result) {
      query += ' AND tr.result = ?';
      params.push(result);
    }

    query += ' ORDER BY tr.created_at DESC';

    const results = await getAll(query, params);
    res.json(results);
  } catch (error) {
    console.error('Erro ao listar resultados de testes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar resultado de teste
router.post('/', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const {
      appointment_id,
      parameter,
      measured_value,
      reference_value,
      uncertainty,
      unit,
      acceptance_criteria,
      result,
      observations
    } = req.body;

    if (!appointment_id || !parameter || !result) {
      return res.status(400).json({ error: 'Agendamento, parâmetro e resultado são obrigatórios' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO test_results (
        id, appointment_id, parameter, measured_value, reference_value,
        uncertainty, unit, acceptance_criteria, result, observations, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      id, appointment_id, parameter, measured_value, reference_value,
      uncertainty, unit, acceptance_criteria, result, observations
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'test_results', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Resultado de teste registrado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar resultado de teste:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar resultado de teste
router.put('/:id', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      appointment_id,
      parameter,
      measured_value,
      reference_value,
      uncertainty,
      unit,
      acceptance_criteria,
      result,
      observations
    } = req.body;

    const existing = await getOne('SELECT * FROM test_results WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Resultado de teste não encontrado' });
    }

    await executeQuery(`
      UPDATE test_results SET
        appointment_id = ?, parameter = ?, measured_value = ?, reference_value = ?,
        uncertainty = ?, unit = ?, acceptance_criteria = ?, result = ?,
        observations = ?, created_at = datetime('now')
      WHERE id = ?
    `, [
      appointment_id, parameter, measured_value, reference_value,
      uncertainty, unit, acceptance_criteria, result, observations, id
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'test_results', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Resultado de teste atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar resultado de teste:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar resultado de teste
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getOne('SELECT * FROM test_results WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Resultado de teste não encontrado' });
    }

    await executeQuery('DELETE FROM test_results WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'test_results', id, JSON.stringify(existing)]);

    res.json({ message: 'Resultado de teste deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar resultado de teste:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter resultado de teste por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getOne(`
      SELECT tr.*, a.scheduled_date, a.service_type,
             c.name as client_name, e.name as equipment_name
      FROM test_results tr
      LEFT JOIN appointments a ON tr.appointment_id = a.id
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN equipment e ON a.equipment_id = e.id
      WHERE tr.id = ?
    `, [id]);

    if (!result) {
      return res.status(404).json({ error: 'Resultado de teste não encontrado' });
    }

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar resultado de teste:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 