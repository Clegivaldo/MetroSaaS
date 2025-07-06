import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar tipos de equipamentos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = 'SELECT * FROM equipment_types WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY name ASC';

    const equipmentTypes = await getAll(query, params);
    res.json(equipmentTypes);
  } catch (error) {
    console.error('Erro ao listar tipos de equipamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar tipo de equipamento
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description, grandeza } = req.body;

    if (!name || !grandeza) {
      return res.status(400).json({ error: 'Nome e grandeza são obrigatórios' });
    }

    // Verificar se já existe tipo com mesmo nome
    const existing = await getOne('SELECT id FROM equipment_types WHERE name = ?', [name]);

    if (existing) {
      return res.status(400).json({ error: 'Já existe um tipo de equipamento com este nome' });
    }

    // Verificar se a grandeza existe
    const grandezaExists = await getOne('SELECT id FROM quantities WHERE name = ?', [grandeza]);

    if (!grandezaExists) {
      return res.status(400).json({ error: 'Grandeza não encontrada' });
    }

    const id = uuidv4();
    await executeQuery(`
      INSERT INTO equipment_types (id, name, description, grandeza, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [id, name, description || null, grandeza]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'CREATE', 'equipment_types', id, JSON.stringify({ name, description, grandeza })]);

    res.status(201).json({ id, message: 'Tipo de equipamento criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar tipo de equipamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar tipo de equipamento
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, grandeza } = req.body;

    // Verificar se o tipo existe
    const existing = await getOne('SELECT * FROM equipment_types WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Tipo de equipamento não encontrado' });
    }

    // Verificar se já existe outro tipo com mesmo nome
    const duplicate = await getOne('SELECT id FROM equipment_types WHERE name = ? AND id != ?', [name, id]);

    if (duplicate) {
      return res.status(400).json({ error: 'Já existe um tipo de equipamento com este nome' });
    }

    // Verificar se a grandeza existe
    const grandezaExists = await getOne('SELECT id FROM quantities WHERE name = ?', [grandeza]);

    if (!grandezaExists) {
      return res.status(400).json({ error: 'Grandeza não encontrada' });
    }

    await executeQuery(`
      UPDATE equipment_types SET
        name = ?, description = ?, grandeza = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [name, description || null, grandeza, id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'equipment_types', id, JSON.stringify(existing), JSON.stringify(req.body)]);

    res.json({ message: 'Tipo de equipamento atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar tipo de equipamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar tipo de equipamento
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o tipo existe
    const existing = await getOne('SELECT * FROM equipment_types WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Tipo de equipamento não encontrado' });
    }

    // Verificar se há equipamentos usando este tipo
    const equipment = await getOne('SELECT id FROM standards WHERE type = ?', [existing.name]);

    if (equipment) {
      return res.status(400).json({ error: 'Não é possível deletar um tipo que está sendo usado por equipamentos' });
    }

    await executeQuery('DELETE FROM equipment_types WHERE id = ?', [id]);

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'DELETE', 'equipment_types', id, JSON.stringify(existing)]);

    res.json({ message: 'Tipo de equipamento deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar tipo de equipamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter tipo de equipamento por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const equipmentType = await getOne('SELECT * FROM equipment_types WHERE id = ?', [id]);

    if (!equipmentType) {
      return res.status(404).json({ error: 'Tipo de equipamento não encontrado' });
    }

    res.json(equipmentType);
  } catch (error) {
    console.error('Erro ao obter tipo de equipamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 