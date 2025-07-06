const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../database/database.db'));
const JWT_SECRET = process.env.JWT_SECRET || 'metrosass_secret_key_2024';

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Buscar usuário no banco
    db.get('SELECT * FROM users WHERE id = ?', [decoded.userId], (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Token inválido' });
      }
      
      req.user = user;
      next();
    });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = auth;