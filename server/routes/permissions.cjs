const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const auth = require('../middleware/auth');

const router = express.Router();
const db = new sqlite3.Database(path.join(__dirname, '../database/database.db'));

// Listar todas as permissões disponíveis
router.get('/', auth, (req, res) => {
  const sql = `
    SELECT p.*, pm.name as module_name 
    FROM permissions p
    LEFT JOIN permission_modules pm ON p.module_id = pm.id
    ORDER BY pm.name, p.name
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Listar permissões de um usuário específico
router.get('/user/:userId', auth, (req, res) => {
  const { userId } = req.params;
  
  const sql = `
    SELECT p.*, pm.name as module_name,
           CASE WHEN up.user_id IS NOT NULL THEN 1 ELSE 0 END as granted
    FROM permissions p
    LEFT JOIN permission_modules pm ON p.module_id = pm.id
    LEFT JOIN user_permissions up ON p.id = up.permission_id AND up.user_id = ?
    ORDER BY pm.name, p.name
  `;
  
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Atualizar permissão de usuário
router.put('/user/:userId/:permissionId', auth, (req, res) => {
  const { userId, permissionId } = req.params;
  const { granted } = req.body;
  
  if (granted) {
    const sql = `INSERT OR REPLACE INTO user_permissions (user_id, permission_id) VALUES (?, ?)`;
    db.run(sql, [userId, permissionId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    });
  } else {
    const sql = `DELETE FROM user_permissions WHERE user_id = ? AND permission_id = ?`;
    db.run(sql, [userId, permissionId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    });
  }
});

// Verificar se usuário tem permissão específica
router.get('/check/:userId/:permission', auth, (req, res) => {
  const { userId, permission } = req.params;
  
  const sql = `
    SELECT COUNT(*) as count
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = ? AND p.code = ?
  `;
  
  db.get(sql, [userId, permission], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ hasPermission: row.count > 0 });
  });
});

module.exports = router;