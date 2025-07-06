const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const auth = require('../middleware/auth');

const router = express.Router();
const db = new sqlite3.Database(path.join(__dirname, '../database/database.db'));

// Listar layouts
router.get('/', auth, (req, res) => {
  const sql = `
    SELECT l.*, u.name as created_by_name
    FROM layouts l
    LEFT JOIN users u ON l.created_by = u.id
    ORDER BY l.created_at DESC
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Criar layout
router.post('/', auth, (req, res) => {
  const { name, type, design_data, is_default } = req.body;
  
  const sql = `
    INSERT INTO layouts (name, type, design_data, is_default, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `;
  
  db.run(sql, [name, type, JSON.stringify(design_data), is_default, req.user.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, success: true });
  });
});

// Atualizar layout
router.put('/:id', auth, (req, res) => {
  const { id } = req.params;
  const { name, type, design_data, is_default } = req.body;
  
  const sql = `
    UPDATE layouts SET name = ?, type = ?, design_data = ?, 
           is_default = ?, updated_at = datetime('now')
    WHERE id = ?
  `;
  
  db.run(sql, [name, type, JSON.stringify(design_data), is_default, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

module.exports = router;