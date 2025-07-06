import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar grandezas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = 'SELECT * FROM quantities WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY name ASC';

    const quantities = await getAll(query, params);
    res.json(quantities);
  } catch (error) {
    console.error('Erro ao listar grandezas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar grandeza
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Verificar se já existe grandeza com mesmo nome
    const existing = await getOne('SELECT id FROM quantities WHERE name = ?', [name]);

    if (existing) {
      return res.status(400).json({ error: 'Já existe uma grandeza com este nome' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO quantities (id, name, description, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `, [id, name, description || null]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'quantities', id, JSON.stringify({ name, description })]);

    res.status(201).json({ id, message: 'Grandeza criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar grandeza:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar grandeza
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Verificar se a grandeza existe
    const existing = await getOne('SELECT * FROM quantities WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Grandeza não encontrada' });
    }

    // Verificar se já existe outra grandeza com mesmo nome
    const duplicate = await getOne('SELECT id FROM quantities WHERE name = ? AND id != ?', [name, id]);

    if (duplicate) {
      return res.status(400).json({ error: 'Já existe uma grandeza com este nome' });
    }

    await executeQuery(`
      UPDATE quantities SET
        name = ?, description = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [name, description || null, id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'quantities', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Grandeza atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar grandeza:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar grandeza
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a grandeza existe
    const existing = await getOne('SELECT * FROM quantities WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Grandeza não encontrada' });
    }

    // Verificar se há tipos de equipamentos usando esta grandeza
    const equipmentTypes = await getOne('SELECT id FROM equipment_types WHERE grandeza = ?', [existing.name]);

    if (equipmentTypes) {
      return res.status(400).json({ error: 'Não é possível deletar uma grandeza que está sendo usada por tipos de equipamentos' });
    }

    await executeQuery('DELETE FROM quantities WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'quantities', id, JSON.stringify(existing)]);

    res.json({ message: 'Grandeza deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar grandeza:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter grandeza por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const quantity = await getOne('SELECT * FROM quantities WHERE id = ?', [id]);

    if (!quantity) {
      return res.status(404).json({ error: 'Grandeza não encontrada' });
    }

    res.json(quantity);
  } catch (error) {
    console.error('Erro ao obter grandeza:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 