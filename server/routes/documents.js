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

// Obter categorias de documentos
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await getAll('SELECT * FROM document_categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Erro ao obter categorias de documentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar categoria de documento
router.post('/categories', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description, color, sigla } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO document_categories (id, name, description, color, sigla, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [id, name, description, color, sigla]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'document_categories', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Categoria criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar categoria de documento
router.put('/categories/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, sigla } = req.body;

    const existing = await getOne('SELECT * FROM document_categories WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    await executeQuery(`
      UPDATE document_categories SET
        name = ?, description = ?, color = ?, sigla = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [name, description, color, sigla, id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'document_categories', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Categoria atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar categoria de documento
router.delete('/categories/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getOne('SELECT * FROM document_categories WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Verificar se há documentos usando esta categoria
    const documentsUsingCategory = await getOne('SELECT COUNT(*) as count FROM documents WHERE category_id = ?', [id]);
    
    if (documentsUsingCategory.count > 0) {
      return res.status(400).json({ error: 'Não é possível deletar uma categoria que está sendo usada por documentos' });
    }

    await executeQuery('DELETE FROM document_categories WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'document_categories', id, JSON.stringify(existing)]);

    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar documento
router.post('/', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const {
      title,
      file_path,
      approved_by,
      approval_date,
      review_date,
      next_review_date,
      category,
      code,
      prefix,
      revision,
      revision_date
    } = req.body;

    console.log('Dados recebidos:', req.body);

    if (!title) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    const id = uuidv4();
    const params = [
      id, title, '1.0', file_path, 'ativo', approved_by,
      approval_date, review_date, next_review_date, category,
      code, prefix, revision, revision_date
    ];

    console.log('Parâmetros para inserção:', params);

    await executeQuery(`
      INSERT INTO documents (
        id, title, version, file_path, status, approved_by,
        approval_date, review_date, next_review_date, category,
        code, prefix, revision, revision_date,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, params);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'documents', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Documento criado com sucesso' });
  } catch (error) {
    console.error('Erro detalhado ao criar documento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar documento
router.put('/:id', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      version,
      file_path,
      status,
      approved_by,
      approval_date,
      review_date,
      next_review_date,
      category,
      code,
      prefix,
      revision,
      revision_date
    } = req.body;

    // Verificar se o documento existe
    const existing = await getOne('SELECT * FROM documents WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    await executeQuery(`
      UPDATE documents SET
        title = ?, version = ?, file_path = ?, status = ?,
        approved_by = ?, approval_date = ?, review_date = ?, next_review_date = ?,
        category = ?, code = ?, prefix = ?, revision = ?, revision_date = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      title, version, file_path, status, approved_by,
      approval_date, review_date, next_review_date, category,
      code, prefix, revision, revision_date, id
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