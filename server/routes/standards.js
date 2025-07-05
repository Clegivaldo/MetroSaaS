import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

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
      serial_number,
      type,
      manufacturer,
      model,
      calibration_date,
      expiration_date,
      certificate_url,
      uncertainty,
      range_min,
      range_max,
      unit
    } = req.body;

    if (!name || !serial_number || !type || !calibration_date || !expiration_date) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }

    // Verificar se já existe padrão com mesmo número de série
    const existing = await getOne('SELECT id FROM standards WHERE serial_number = ?', [serial_number]);

    if (existing) {
      return res.status(400).json({ error: 'Já existe um padrão com este número de série' });
    }

    // Determinar status baseado na data de vencimento
    const expirationDate = new Date(expiration_date);
    const today = new Date();
    const daysToExpire = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
    
    let status = 'valido';
    if (daysToExpire < 0) {
      status = 'vencido';
    } else if (daysToExpire <= 30) {
      status = 'prestes_vencer';
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO standards (
        id, name, serial_number, type, manufacturer, model,
        calibration_date, expiration_date, status, certificate_url,
        uncertainty, range_min, range_max, unit, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, name, serial_number, type, manufacturer, model,
      calibration_date, expiration_date, status, certificate_url,
      uncertainty, range_min, range_max, unit
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'standards', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Padrão criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar padrão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar padrão
router.put('/:id', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      serial_number,
      type,
      manufacturer,
      model,
      calibration_date,
      expiration_date,
      certificate_url,
      uncertainty,
      range_min,
      range_max,
      unit
    } = req.body;

    // Verificar se o padrão existe
    const existing = await getOne('SELECT * FROM standards WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Padrão não encontrado' });
    }

    // Determinar status baseado na data de vencimento
    const expirationDate = new Date(expiration_date);
    const today = new Date();
    const daysToExpire = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
    
    let status = 'valido';
    if (daysToExpire < 0) {
      status = 'vencido';
    } else if (daysToExpire <= 30) {
      status = 'prestes_vencer';
    }

    await executeQuery(`
      UPDATE standards SET
        name = ?, serial_number = ?, type = ?, manufacturer = ?, model = ?,
        calibration_date = ?, expiration_date = ?, status = ?, certificate_url = ?,
        uncertainty = ?, range_min = ?, range_max = ?, unit = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [
      name, serial_number, type, manufacturer, model,
      calibration_date, expiration_date, status, certificate_url,
      uncertainty, range_min, range_max, unit, id
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'standards', id, JSON.stringify(existing), JSON.stringify(req.body)]);

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
    
    const standard = await getOne('SELECT * FROM standards WHERE id = ?', [id]);

    if (!standard) {
      return res.status(404).json({ error: 'Padrão não encontrado' });
    }

    res.json(standard);
  } catch (error) {
    console.error('Erro ao obter padrão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;