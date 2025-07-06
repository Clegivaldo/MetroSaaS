import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Obter tipos de padrões
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const types = await getAll('SELECT * FROM standard_types ORDER BY name');
    res.json(types);
  } catch (error) {
    console.error('Erro ao obter tipos de padrões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar tipo de padrão
router.post('/types', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO standard_types (id, name, description, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [id, name, description, category]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'standard_types', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Tipo de padrão criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar tipo de padrão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar tipo de padrão
router.put('/types/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category } = req.body;

    const existing = await getOne('SELECT * FROM standard_types WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Tipo de padrão não encontrado' });
    }

    await executeQuery(`
      UPDATE standard_types SET
        name = ?, description = ?, category = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [name, description, category, id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'standard_types', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Tipo de padrão atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar tipo de padrão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar tipo de padrão
router.delete('/types/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getOne('SELECT * FROM standard_types WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Tipo de padrão não encontrado' });
    }

    // Verificar se há padrões usando este tipo
    const standardsUsingType = await getOne('SELECT COUNT(*) as count FROM standards WHERE type_id = ?', [id]);
    
    if (standardsUsingType.count > 0) {
      return res.status(400).json({ error: 'Não é possível deletar um tipo que está sendo usado por padrões' });
    }

    await executeQuery('DELETE FROM standard_types WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'standard_types', id, JSON.stringify(existing)]);

    res.json({ message: 'Tipo de padrão deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar tipo de padrão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar padrões
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, status, type } = req.query;
    
    let query = 'SELECT * FROM standards WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR serial_number LIKE ? OR manufacturer LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const standards = await getAll(query, params);
    res.json(standards);
  } catch (error) {
    console.error('Erro ao listar padrões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar padrão
router.post('/', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const { 
      name,
      identificacao,
      brand_id, 
      model_id, 
      serial_number, 
      type_id, 
      certificate_number,
      scales
    } = req.body;

    console.log('Dados recebidos para padrão:', req.body);

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (!identificacao && !serial_number) {
      return res.status(400).json({ error: 'Identificação ou número de série é obrigatório' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    console.log('Inserindo padrão com ID:', id);

    // Inserir o padrão principal
    await executeQuery(`
      INSERT INTO standards (id, name, identificacao, brand_id, model_id, serial_number, type_id, certificate_number, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, name, identificacao, brand_id, model_id, serial_number, type_id, certificate_number, now, now]);

    // Inserir as escalas se fornecidas
    if (scales && Array.isArray(scales)) {
      console.log('Inserindo escalas:', scales);
      for (const scale of scales) {
        const scaleId = crypto.randomUUID();
        await executeQuery(`
          INSERT INTO equipment_scales (id, equipment_id, equipment_type, scale_name, scale_min, scale_max, unit)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [scaleId, id, 'standard', scale.name, scale.min, scale.max, scale.unit]);
      }
    }

    res.status(201).json({ 
      message: 'Padrão criado com sucesso',
      id 
    });
  } catch (error) {
    console.error('Erro detalhado ao criar padrão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar padrão
router.put('/:id', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      brand, 
      model, 
      serial_number, 
      type_id, 
      certificate_number,
      ranges,
      uncertainties
    } = req.body;

    const now = new Date().toISOString();

    // Atualizar o padrão principal
    await executeQuery(`
      UPDATE standards 
      SET brand = ?, model = ?, serial_number = ?, type_id = ?, certificate_number = ?, updated_at = ?
      WHERE id = ?
    `, [brand, model, serial_number, type_id, certificate_number, now, id]);

    // Remover faixas e incertezas existentes
    await executeQuery(`DELETE FROM equipment_ranges WHERE equipment_id = ? AND equipment_type = 'standard'`, [id]);
    await executeQuery(`DELETE FROM equipment_uncertainties WHERE equipment_id = ? AND equipment_type = 'standard'`, [id]);

    // Inserir as novas faixas
    if (ranges && Array.isArray(ranges)) {
      for (const range of ranges) {
        const rangeId = crypto.randomUUID();
        await executeQuery(`
          INSERT INTO equipment_ranges (id, equipment_id, equipment_type, range_name, range_min, range_max, unit, uncertainty)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [rangeId, id, 'standard', range.name, range.min, range.max, range.unit, range.uncertainty]);
      }
    }

    // Inserir as novas incertezas
    if (uncertainties && Array.isArray(uncertainties)) {
      for (const uncertainty of uncertainties) {
        const uncertaintyId = crypto.randomUUID();
        await executeQuery(`
          INSERT INTO equipment_uncertainties (id, equipment_id, equipment_type, uncertainty_name, uncertainty_value, unit)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [uncertaintyId, id, 'standard', uncertainty.name, uncertainty.value, uncertainty.unit]);
      }
    }

    res.json({ message: 'Padrão atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar padrão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar padrão
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o padrão existe
    const existing = await getOne('SELECT * FROM standards WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Padrão não encontrado' });
    }

    await executeQuery('DELETE FROM standards WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'standards', id, JSON.stringify(existing)]);

    res.json({ message: 'Padrão deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar padrão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter padrão por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o padrão principal
    const standard = await getOne(`
      SELECT s.*, et.name as type_name
      FROM standards s
      LEFT JOIN equipment_types et ON s.type_id = et.id
      WHERE s.id = ?
    `, [id]);

    if (!standard) {
      return res.status(404).json({ error: 'Padrão não encontrado' });
    }

    // Buscar as faixas
    const ranges = await getAll(`
      SELECT * FROM equipment_ranges 
      WHERE equipment_id = ? AND equipment_type = 'standard'
      ORDER BY range_name
    `, [id]);

    // Buscar as incertezas
    const uncertainties = await getAll(`
      SELECT * FROM equipment_uncertainties 
      WHERE equipment_id = ? AND equipment_type = 'standard'
      ORDER BY uncertainty_name
    `, [id]);

    res.json({
      ...standard,
      ranges,
      uncertainties
    });
  } catch (error) {
    console.error('Erro ao obter padrão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter histórico do padrão
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const history = await getAll(`
      SELECT * FROM standard_history 
      WHERE standard_id = ?
      ORDER BY version DESC
    `, [id]);

    res.json(history);
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;