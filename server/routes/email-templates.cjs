const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const auth = require('../middleware/auth');

const router = express.Router();
const db = new sqlite3.Database(path.join(__dirname, '../database/database.db'));

// Listar templates
router.get('/', auth, (req, res) => {
  const sql = `SELECT * FROM email_templates ORDER BY name`;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Listar ações de email
router.get('/actions', auth, (req, res) => {
  const sql = `SELECT * FROM email_actions ORDER BY name`;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Vincular template à ação
router.post('/link', auth, (req, res) => {
  const { action_id, template_id } = req.body;
  
  const sql = `
    INSERT OR REPLACE INTO email_action_templates (action_id, template_id)
    VALUES (?, ?)
  `;
  
  db.run(sql, [action_id, template_id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

// Obter template por ação
router.get('/by-action/:action', auth, (req, res) => {
  const { action } = req.params;
  
  const sql = `
    SELECT et.* FROM email_templates et
    JOIN email_action_templates eat ON et.id = eat.template_id
    JOIN email_actions ea ON eat.action_id = ea.id
    WHERE ea.code = ?
  `;
  
  db.get(sql, [action], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row || null);
  });
});

module.exports = router;