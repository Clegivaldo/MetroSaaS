import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar clientes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, status } = req.query;
    
    let query = 'SELECT * FROM clients WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR cnpj LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const clients = await getAll(query, params);
    res.json(clients);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar cliente
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
      zip_code
    } = req.body;

    if (!name || !cnpj || !email) {
      return res.status(400).json({ error: 'Nome, CNPJ e email são obrigatórios' });
    }

    // Verificar se já existe cliente com mesmo CNPJ
    const existing = await getOne('SELECT id FROM clients WHERE cnpj = ?', [cnpj]);

    if (existing) {
      return res.status(400).json({ error: 'Já existe um cliente com este CNPJ' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO clients (
        id, name, cnpj, email, phone, address, city, state, zip_code, 
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [id, name, cnpj, email, phone, address, city, state, zip_code, 'ativo']);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'clients', id, JSON.stringify(req.body)]);

    res.status(201).json({ id, message: 'Cliente criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar cliente
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
      status
    } = req.body;

    // Verificar se o cliente existe
    const existing = await getOne('SELECT * FROM clients WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    await executeQuery(`
      UPDATE clients SET
        name = ?, cnpj = ?, email = ?, phone = ?, address = ?, 
        city = ?, state = ?, zip_code = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [name, cnpj, email, phone, address, city, state, zip_code, status, id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'clients', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Cliente atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar cliente
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o cliente existe
    const existing = await getOne('SELECT * FROM clients WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    await executeQuery('DELETE FROM clients WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'clients', id, JSON.stringify(existing)]);

    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter cliente por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await getOne('SELECT * FROM clients WHERE id = ?', [id]);

    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(client);
  } catch (error) {
    console.error('Erro ao obter cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;