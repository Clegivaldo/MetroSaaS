import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Listar templates de email
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const templates = await getAll(`
      SELECT * FROM email_templates 
      ORDER BY name
    `);
    
    res.json(templates);
  } catch (error) {
    logger.error('Erro ao listar templates de email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter template por ID
router.get('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await getOne('SELECT * FROM email_templates WHERE id = ?', [id]);
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    res.json(template);
  } catch (error) {
    logger.error('Erro ao obter template de email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar template
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, body, variables, action } = req.body;

    // Verificar se o template existe
    const existing = await getOne('SELECT * FROM email_templates WHERE id = ?', [id]);
    
    if (!existing) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    await executeQuery(`
      UPDATE email_templates SET
        name = ?, subject = ?, body = ?, variables = ?, action = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [name, subject, body, variables, action, id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'email_templates', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Template atualizado com sucesso' });
  } catch (error) {
    logger.error('Erro ao atualizar template de email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo template
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, subject, body, variables, action } = req.body;

    if (!name || !subject || !body || !action) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO email_templates (id, name, subject, body, variables, action, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [id, name, subject, body, variables, action]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'email_templates', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Template criado com sucesso' });
  } catch (error) {
    logger.error('Erro ao criar template de email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar template
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o template existe
    const existing = await getOne('SELECT * FROM email_templates WHERE id = ?', [id]);
    
    if (!existing) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    await executeQuery('DELETE FROM email_templates WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'email_templates', id, JSON.stringify(existing)]);

    res.json({ message: 'Template deletado com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar template de email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 