import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar modelos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { brand_id, equipment_type_id } = req.query;
    
    let query = `
      SELECT m.*, b.name as brand_name, et.name as equipment_type_name
      FROM models m
      INNER JOIN brands b ON m.brand_id = b.id
      INNER JOIN equipment_types et ON m.equipment_type_id = et.id
      WHERE 1=1
    `;
    const params = [];

    if (brand_id) {
      query += ' AND m.brand_id = ?';
      params.push(brand_id);
    }

    if (equipment_type_id) {
      query += ' AND m.equipment_type_id = ?';
      params.push(equipment_type_id);
    }

    query += ' ORDER BY b.name, m.name';

    const models = await getAll(query, params);
    res.json(models);
  } catch (error) {
    console.error('Erro ao listar modelos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar modelo
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, brand_id, equipment_type_id, description } = req.body;

    if (!name || !brand_id || !equipment_type_id) {
      return res.status(400).json({ error: 'Nome, marca e tipo de equipamento são obrigatórios' });
    }

    const id = uuidv4();
    
    await executeQuery(`
      INSERT INTO models (id, name, brand_id, equipment_type_id, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [id, name, brand_id, equipment_type_id, description]);

    res.status(201).json({ id, message: 'Modelo criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar modelo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar modelo
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand_id, equipment_type_id, description } = req.body;

    const existing = await getOne('SELECT * FROM models WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Modelo não encontrado' });
    }

    await executeQuery(`
      UPDATE models SET
        name = ?, brand_id = ?, equipment_type_id = ?, description = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [name, brand_id, equipment_type_id, description, id]);

    res.json({ message: 'Modelo atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar modelo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar modelo
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getOne('SELECT * FROM models WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Modelo não encontrado' });
    }

    // Verificar se há equipamentos usando este modelo
    const equipmentUsingModel = await getOne('SELECT COUNT(*) as count FROM standards WHERE model_id = ?', [id]);
    const clientEquipmentUsingModel = await getOne('SELECT COUNT(*) as count FROM client_equipment WHERE model_id = ?', [id]);
    
    if (equipmentUsingModel.count > 0 || clientEquipmentUsingModel.count > 0) {
      return res.status(400).json({ error: 'Não é possível deletar um modelo que está sendo usado por equipamentos' });
    }

    await executeQuery('DELETE FROM models WHERE id = ?', [id]);

    res.json({ message: 'Modelo deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar modelo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 