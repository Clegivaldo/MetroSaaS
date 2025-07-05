import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar fornecedores
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, type, status } = req.query;
    
    let query = 'SELECT * FROM suppliers WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR cnpj LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const suppliers = await getAll(query, params);
    res.json(suppliers);
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar fornecedor
router.post('/', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const {
      name,
      cnpj,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      type
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
    }

    // Verificar se já existe fornecedor com mesmo CNPJ (se fornecido)
    if (cnpj) {
      const existing = await getOne('SELECT id FROM suppliers WHERE cnpj = ?', [cnpj]);
      if (existing) {
        return res.status(400).json({ error: 'Já existe um fornecedor com este CNPJ' });
      }
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO suppliers (
        id, name, cnpj, email, phone, address, city, state, zip_code,
        type, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, name, cnpj, email, phone, address, city, state, zip_code,
      type, 'ativo'
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'suppliers', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Fornecedor criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar fornecedor
router.put('/:id', authenticateToken, requireRole(['admin', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      cnpj,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      type,
      status
    } = req.body;

    // Verificar se o fornecedor existe
    const existing = await getOne('SELECT * FROM suppliers WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    await executeQuery(`
      UPDATE suppliers SET
        name = ?, cnpj = ?, email = ?, phone = ?, address = ?,
        city = ?, state = ?, zip_code = ?, type = ?, status = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      name, cnpj, email, phone, address, city, state, zip_code,
      type, status, id
    ]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'suppliers', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Fornecedor atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar fornecedor
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o fornecedor existe
    const existing = await getOne('SELECT * FROM suppliers WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    await executeQuery('DELETE FROM suppliers WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'suppliers', id, JSON.stringify(existing)]);

    res.json({ message: 'Fornecedor deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar fornecedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter fornecedor por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await getOne('SELECT * FROM suppliers WHERE id = ?', [id]);

    if (!supplier) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Erro ao obter fornecedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;