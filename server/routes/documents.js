import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar documentos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, type, status, category } = req.query;
    
    let query = `
      SELECT d.*, u.name as approved_by_name
      FROM documents d
      LEFT JOIN users u ON d.approved_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (d.title LIKE ? OR d.category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type) {
      query += ' AND d.type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }

    if (category) {
      query += ' AND d.category = ?';
      params.push(category);
    }

    query += ' ORDER BY d.created_at DESC';

    const documents = await getAll(query, params);
    res.json(documents);
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar documento
router.post('/', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const {
      title,
      type,
      version,
      file_url,
      approved_by,
      approval_date,
      review_date,
      next_review_date,
      category
    } = req.body;

    if (!title || !type || !version) {
      return res.status(400).json({ error: 'Título, tipo e versão são obrigatórios' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO documents (
        id, title, type, version, file_url, status, approved_by,
        approval_date, review_date, next_review_date, category,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, title, type, version, file_url, 'ativo', approved_by,
      approval_date, review_date, next_review_date, category
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'documents', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Documento criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar documento
router.put('/:id', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      type,
      version,
      file_url,
      status,
      approved_by,
      approval_date,
      review_date,
      next_review_date,
      category
    } = req.body;

    // Verificar se o documento existe
    const existing = await getOne('SELECT * FROM documents WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    await executeQuery(`
      UPDATE documents SET
        title = ?, type = ?, version = ?, file_url = ?, status = ?,
        approved_by = ?, approval_date = ?, review_date = ?, next_review_date = ?,
        category = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [
      title, type, version, file_url, status, approved_by,
      approval_date, review_date, next_review_date, category, id
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'documents', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Documento atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar documento
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o documento existe
    const existing = await getOne('SELECT * FROM documents WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    await executeQuery('DELETE FROM documents WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'documents', id, JSON.stringify(existing)]);

    res.json({ message: 'Documento deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar documento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter documento por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await getOne(`
      SELECT d.*, u.name as approved_by_name
      FROM documents d
      LEFT JOIN users u ON d.approved_by = u.id
      WHERE d.id = ?
    `, [id]);

    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    res.json(document);
  } catch (error) {
    console.error('Erro ao obter documento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;