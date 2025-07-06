const express = require('express');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');

const router = express.Router();
const db = new sqlite3.Database(path.join(__dirname, '../database/database.db'));

// Listar usuários
router.get('/', auth, (req, res) => {
  const sql = 'SELECT id, name, email, role, status, created_at, last_login FROM users ORDER BY created_at DESC';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Criar usuário
router.post('/', auth, async (req, res) => {
  const { name, email, role, status } = req.body;
  const id = uuidv4();
  const defaultPassword = 'temp123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const sql = `
    INSERT INTO users (id, name, email, password, role, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `;

  db.run(sql, [id, name, email, hashedPassword, role, status || 'ativo'], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id, success: true });
  });
});

// Atualizar usuário
router.put('/:id', auth, (req, res) => {
  const { id } = req.params;
  const { name, email, role, status } = req.body;

  const sql = `
    UPDATE users SET name = ?, email = ?, role = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `;

  db.run(sql, [name, email, role, status, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

// Deletar usuário
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

// Reset de senha
router.post('/:id/reset-password', auth, async (req, res) => {
  const { id } = req.params;
  const newPassword = 'temp123';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, newPassword });
  });
});

module.exports = router;