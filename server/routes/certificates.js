import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar certificados
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, status, client_id } = req.query;
    
    let query = `
      SELECT c.*, cl.name as client_name, e.name as equipment_name
      FROM certificates c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN equipment e ON c.equipment_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (cl.name LIKE ? OR e.name LIKE ? OR c.certificate_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    if (client_id) {
      query += ' AND c.client_id = ?';
      params.push(client_id);
    }

    query += ' ORDER BY c.created_at DESC';

    const certificates = await getAll(query, params);
    res.json(certificates);
  } catch (error) {
    console.error('Erro ao listar certificados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar certificado
router.post('/', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const {
      client_id,
      equipment_id,
      certificate_number,
      calibration_date,
      expiration_date,
      temperature,
      humidity,
      observations
    } = req.body;

    if (!client_id || !equipment_id || !certificate_number || !calibration_date || !expiration_date) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }

    // Verificar se já existe certificado com mesmo número
    const existing = await getOne('SELECT id FROM certificates WHERE certificate_number = ?', [certificate_number]);

    if (existing) {
      return res.status(400).json({ error: 'Já existe um certificado com este número' });
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
      INSERT INTO certificates (
        id, client_id, equipment_id, certificate_number, calibration_date, 
        expiration_date, status, technician_id, temperature, humidity, 
        observations, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, client_id, equipment_id, certificate_number, calibration_date,
      expiration_date, status, req.user.id, temperature, humidity, observations
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'certificates', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Certificado criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar certificado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar certificado
router.put('/:id', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_id,
      equipment_id,
      certificate_number,
      calibration_date,
      expiration_date,
      temperature,
      humidity,
      observations,
      pdf_url
    } = req.body;

    // Verificar se o certificado existe
    const existing = await getOne('SELECT * FROM certificates WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Certificado não encontrado' });
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
      UPDATE certificates SET
        client_id = ?, equipment_id = ?, certificate_number = ?, 
        calibration_date = ?, expiration_date = ?, status = ?, 
        temperature = ?, humidity = ?, observations = ?, pdf_url = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      client_id, equipment_id, certificate_number, calibration_date,
      expiration_date, status, temperature, humidity, observations, pdf_url, id
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'certificates', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Certificado atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar certificado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar certificado
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o certificado existe
    const existing = await getOne('SELECT * FROM certificates WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Certificado não encontrado' });
    }

    await executeQuery('DELETE FROM certificates WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'certificates', id, JSON.stringify(existing)]);

    res.json({ message: 'Certificado deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar certificado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter certificado por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const certificate = await getOne(`
      SELECT c.*, cl.name as client_name, e.name as equipment_name, u.name as technician_name
      FROM certificates c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN equipment e ON c.equipment_id = e.id
      LEFT JOIN users u ON c.technician_id = u.id
      WHERE c.id = ?
    `, [id]);

    if (!certificate) {
      return res.status(404).json({ error: 'Certificado não encontrado' });
    }

    res.json(certificate);
  } catch (error) {
    console.error('Erro ao obter certificado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;