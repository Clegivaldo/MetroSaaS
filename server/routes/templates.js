import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar templates
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { search, status } = req.query;
    
    let query = 'SELECT * FROM email_templates WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR template_key LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const templates = await getAll(query, params);
    res.json(templates);
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar template
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      template_key,
      name,
      subject,
      content,
      variables
    } = req.body;

    if (!template_key || !name || !subject || !content) {
      return res.status(400).json({ error: 'Chave, nome, assunto e conteúdo são obrigatórios' });
    }

    // Verificar se já existe template com mesma chave
    const existing = await getOne('SELECT id FROM email_templates WHERE template_key = ?', [template_key]);

    if (existing) {
      return res.status(400).json({ error: 'Já existe um template com esta chave' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO email_templates (
        id, template_key, name, subject, content, variables, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, template_key, name, subject, content, JSON.stringify(variables || []), 'ativo'
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'email_templates', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Template criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar template:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar template
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      template_key,
      name,
      subject,
      content,
      variables,
      status
    } = req.body;

    // Verificar se o template existe
    const existing = await getOne('SELECT * FROM email_templates WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    await executeQuery(`
      UPDATE email_templates SET
        template_key = ?, name = ?, subject = ?, content = ?, 
        variables = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [
      template_key, name, subject, content, 
      JSON.stringify(variables || []), status, id
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'email_templates', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Template atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
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
    console.error('Erro ao deletar template:', error);
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
    console.error('Erro ao obter template:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Visualizar template (preview)
router.post('/:id/preview', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { variables } = req.body;
    
    const template = await getOne('SELECT * FROM email_templates WHERE id = ?', [id]);

    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    let content = template.content;
    let subject = template.subject;

    // Substituir variáveis no conteúdo e assunto
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, value);
        subject = subject.replace(regex, value);
      });
    }

    res.json({
      subject,
      content,
      original_subject: template.subject,
      original_content: template.content
    });
  } catch (error) {
    console.error('Erro ao visualizar template:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;