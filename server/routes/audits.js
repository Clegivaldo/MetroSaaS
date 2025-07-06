import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar auditorias
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, status, type } = req.query;
    
    let query = `
      SELECT a.*, u.name as auditor_name
      FROM audits a
      LEFT JOIN users u ON a.auditor = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (a.title LIKE ? OR a.scope LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND a.type = ?';
      params.push(type);
    }

    query += ' ORDER BY a.created_at DESC';

    const audits = await getAll(query, params);
    res.json(audits);
  } catch (error) {
    console.error('Erro ao listar auditorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar auditoria
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      title,
      type,
      scope,
      auditor,
      audit_date,
      follow_up_date
    } = req.body;

    if (!title || !type || !scope || !auditor || !audit_date) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO audits (
        id, title, type, scope, auditor, audit_date, follow_up_date,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, title, type, scope, auditor, audit_date, follow_up_date
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'audits', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Auditoria criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar auditoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar auditoria
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      type,
      scope,
      auditor,
      audit_date,
      status,
      findings,
      recommendations,
      follow_up_date
    } = req.body;

    const existing = await getOne('SELECT * FROM audits WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Auditoria não encontrada' });
    }

    await executeQuery(`
      UPDATE audits SET
        title = ?, type = ?, scope = ?, auditor = ?, audit_date = ?,
        status = ?, findings = ?, recommendations = ?, follow_up_date = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      title, type, scope, auditor, audit_date, status, findings,
      recommendations, follow_up_date, id
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'audits', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Auditoria atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar auditoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar auditoria
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getOne('SELECT * FROM audits WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Auditoria não encontrada' });
    }

    await executeQuery('DELETE FROM audits WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'audits', id, JSON.stringify(existing)]);

    res.json({ message: 'Auditoria deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar auditoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter auditoria por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const audit = await getOne(`
      SELECT a.*, u.name as auditor_name
      FROM audits a
      LEFT JOIN users u ON a.auditor = u.id
      WHERE a.id = ?
    `, [id]);

    if (!audit) {
      return res.status(404).json({ error: 'Auditoria não encontrada' });
    }

    res.json(audit);
  } catch (error) {
    console.error('Erro ao buscar auditoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar achados de auditoria
router.get('/:id/findings', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const findings = await getAll(`
      SELECT af.*, u.name as responsible_person_name
      FROM audit_findings af
      LEFT JOIN users u ON af.responsible_person = u.id
      WHERE af.audit_id = ?
      ORDER BY af.created_at DESC
    `, [id]);

    res.json(findings);
  } catch (error) {
    console.error('Erro ao listar achados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar achado de auditoria
router.post('/:id/findings', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      finding,
      severity,
      requirement,
      corrective_action,
      responsible_person,
      due_date
    } = req.body;

    if (!finding || !severity) {
      return res.status(400).json({ error: 'Achado e severidade são obrigatórios' });
    }

    const findingId = uuidv4();
    await executeQuery(`
      INSERT INTO audit_findings (
        id, audit_id, finding, severity, requirement, corrective_action,
        responsible_person, due_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      findingId, id, finding, severity, requirement, corrective_action,
      responsible_person, due_date
    ]);

    res.status(201).json({ id: findingId, message: 'Achado registrado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar achado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 