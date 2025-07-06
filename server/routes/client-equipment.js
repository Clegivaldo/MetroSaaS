import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Listar equipamentos de clientes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, status, client_id } = req.query;
    
    let query = `
      SELECT ce.*, c.name as client_name 
      FROM client_equipment ce
      JOIN clients c ON ce.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (ce.name LIKE ? OR ce.serial_number LIKE ? OR c.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND ce.status = ?';
      params.push(status);
    }

    if (client_id) {
      query += ' AND ce.client_id = ?';
      params.push(client_id);
    }

    query += ' ORDER BY ce.created_at DESC';

    const equipments = await getAll(query, params);
    res.json(equipments);
  } catch (error) {
    console.error('Erro ao listar equipamentos de clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar equipamento de cliente
router.post('/', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const { 
      client_id,
      name,
      identificacao,
      brand, 
      model, 
      serial_number, 
      type_id,
      scales
    } = req.body;

    if (!client_id || !name) {
      return res.status(400).json({ error: 'Cliente e nome são obrigatórios' });
    }

    if (!identificacao && !serial_number) {
      return res.status(400).json({ error: 'Identificação ou número de série é obrigatório' });
    }

    // Verificar se o cliente existe
    const client = await getOne('SELECT id FROM clients WHERE id = ?', [client_id]);
    if (!client) {
      return res.status(400).json({ error: 'Cliente não encontrado' });
    }

    // Verificar se já existe equipamento com mesma identificação para este cliente
    const existing = await getOne('SELECT id FROM client_equipment WHERE client_id = ? AND (identificacao = ? OR serial_number = ?)', [client_id, identificacao, serial_number]);
    if (existing) {
      return res.status(400).json({ error: 'Já existe um equipamento com esta identificação para este cliente' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    // Inserir o equipamento principal
    await executeQuery(`
      INSERT INTO client_equipment (id, client_id, name, identificacao, brand, model, serial_number, type_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, client_id, name, identificacao, brand, model, serial_number, type_id, now, now]);

    // Inserir as escalas se fornecidas
    if (scales && Array.isArray(scales)) {
      for (const scale of scales) {
        const scaleId = uuidv4();
        await executeQuery(`
          INSERT INTO equipment_scales (id, equipment_id, equipment_type, scale_name, scale_min, scale_max, unit)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [scaleId, id, 'client_equipment', scale.name, scale.min, scale.max, scale.unit]);
      }
    }

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'client_equipment', id, JSON.stringify(req.body)]);

    res.status(201).json({ 
      message: 'Equipamento de cliente criado com sucesso',
      id 
    });
  } catch (error) {
    console.error('Erro ao criar equipamento de cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar equipamento de cliente
router.put('/:id', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      client_id,
      brand, 
      model, 
      serial_number, 
      type_id, 
      calibration_date,
      expiration_date,
      certificate_number,
      ranges,
      uncertainties
    } = req.body;

    // Verificar se o equipamento existe
    const existing = await getOne('SELECT * FROM client_equipment WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }

    // Verificar se o cliente existe
    const client = await getOne('SELECT id FROM clients WHERE id = ?', [client_id]);
    if (!client) {
      return res.status(400).json({ error: 'Cliente não encontrado' });
    }

    // Verificar se já existe outro equipamento com mesmo número de série para este cliente
    const duplicate = await getOne('SELECT id FROM client_equipment WHERE client_id = ? AND serial_number = ? AND id != ?', [client_id, serial_number, id]);
    if (duplicate) {
      return res.status(400).json({ error: 'Já existe um equipamento com este número de série para este cliente' });
    }

    const now = new Date().toISOString();

    // Atualizar o equipamento principal
    await executeQuery(`
      UPDATE client_equipment 
      SET client_id = ?, brand = ?, model = ?, serial_number = ?, type_id = ?, calibration_date = ?, expiration_date = ?, certificate_number = ?, updated_at = ?
      WHERE id = ?
    `, [client_id, brand, model, serial_number, type_id, calibration_date, expiration_date, certificate_number, now, id]);

    // Remover faixas e incertezas existentes
    await executeQuery(`DELETE FROM equipment_ranges WHERE equipment_id = ? AND equipment_type = 'client_equipment'`, [id]);
    await executeQuery(`DELETE FROM equipment_uncertainties WHERE equipment_id = ? AND equipment_type = 'client_equipment'`, [id]);

    // Inserir as novas faixas
    if (ranges && Array.isArray(ranges)) {
      for (const range of ranges) {
        const rangeId = uuidv4();
        await executeQuery(`
          INSERT INTO equipment_ranges (id, equipment_id, equipment_type, range_name, range_min, range_max, unit, uncertainty)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [rangeId, id, 'client_equipment', range.name, range.min, range.max, range.unit, range.uncertainty]);
      }
    }

    // Inserir as novas incertezas
    if (uncertainties && Array.isArray(uncertainties)) {
      for (const uncertainty of uncertainties) {
        const uncertaintyId = uuidv4();
        await executeQuery(`
          INSERT INTO equipment_uncertainties (id, equipment_id, equipment_type, uncertainty_name, uncertainty_value, unit)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [uncertaintyId, id, 'client_equipment', uncertainty.name, uncertainty.value, uncertainty.unit]);
      }
    }

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'client_equipment', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Equipamento de cliente atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar equipamento de cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar equipamento de cliente
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o equipamento existe
    const existing = await getOne('SELECT * FROM client_equipment WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }

    await executeQuery('DELETE FROM client_equipment WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'client_equipment', id, JSON.stringify(existing)]);

    res.json({ message: 'Equipamento de cliente deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar equipamento de cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter equipamento de cliente por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o equipamento principal
    const equipment = await getOne(`
      SELECT ce.*, et.name as type_name, c.name as client_name
      FROM client_equipment ce
      LEFT JOIN equipment_types et ON ce.type_id = et.id
      LEFT JOIN clients c ON ce.client_id = c.id
      WHERE ce.id = ?
    `, [id]);

    if (!equipment) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }

    // Buscar as faixas
    const ranges = await getAll(`
      SELECT * FROM equipment_ranges 
      WHERE equipment_id = ? AND equipment_type = 'client_equipment'
      ORDER BY range_name
    `, [id]);

    // Buscar as incertezas
    const uncertainties = await getAll(`
      SELECT * FROM equipment_uncertainties 
      WHERE equipment_id = ? AND equipment_type = 'client_equipment'
      ORDER BY uncertainty_name
    `, [id]);

    res.json({
      ...equipment,
      ranges,
      uncertainties
    });
  } catch (error) {
    console.error('Erro ao obter equipamento de cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 