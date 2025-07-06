import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar marcas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { equipment_type_id } = req.query;
    
    let query = 'SELECT * FROM brands';
    const params = [];

    if (equipment_type_id) {
      query = `
        SELECT DISTINCT b.* 
        FROM brands b
        INNER JOIN brand_equipment_types bet ON b.id = bet.brand_id
        WHERE bet.equipment_type_id = ?
        ORDER BY b.name
      `;
      params.push(equipment_type_id);
    } else {
      query += ' ORDER BY name';
    }

    const brands = await getAll(query, params);
    res.json(brands);
  } catch (error) {
    console.error('Erro ao listar marcas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar marca
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description, equipment_type_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const id = uuidv4();
    
    // Inserir marca
    await executeQuery(`
      INSERT INTO brands (id, name, description, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `, [id, name, description]);

    // Se fornecido equipment_type_id, criar relacionamento
    if (equipment_type_id) {
      await executeQuery(`
        INSERT INTO brand_equipment_types (id, brand_id, equipment_type_id, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `, [uuidv4(), id, equipment_type_id]);
    }

    res.status(201).json({ id, message: 'Marca criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar marca:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar marca
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existing = await getOne('SELECT * FROM brands WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Marca não encontrada' });
    }

    await executeQuery(`
      UPDATE brands SET
        name = ?, description = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [name, description, id]);

    res.json({ message: 'Marca atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar marca:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar marca
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getOne('SELECT * FROM brands WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Marca não encontrada' });
    }

    // Verificar se há modelos usando esta marca
    const modelsUsingBrand = await getOne('SELECT COUNT(*) as count FROM models WHERE brand_id = ?', [id]);
    
    if (modelsUsingBrand.count > 0) {
      return res.status(400).json({ error: 'Não é possível deletar uma marca que está sendo usada por modelos' });
    }

    await executeQuery('DELETE FROM brands WHERE id = ?', [id]);

    res.json({ message: 'Marca deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar marca:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 