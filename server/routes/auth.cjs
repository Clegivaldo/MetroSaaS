const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const db = req.app.get('db');
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    try {
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Erro ao verificar senha:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
});

// Register endpoint
router.post('/register', async (req, res) => {
  const { name, email, password, role = 'user' } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  const db = req.app.get('db');
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role],
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: 'Email já está em uso' });
          }
          console.error('Erro ao criar usuário:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        const token = jwt.sign(
          { userId: this.lastID, email, role },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        );

        res.status(201).json({
          token,
          user: {
            id: this.lastID,
            name,
            email,
            role
          }
        });
      }
    );
  } catch (error) {
    console.error('Erro ao criar hash da senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;