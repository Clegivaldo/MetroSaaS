import jwt from 'jsonwebtoken';
import { getOne } from '../database/connection.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verificar se o usuário ainda existe e está ativo
    const user = await getOne('SELECT * FROM users WHERE id = ? AND status = ?', [decoded.id, 'ativo']);

    if (!user) {
      return res.status(403).json({ error: 'Usuário não encontrado ou inativo' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissão insuficiente' });
    }

    next();
  };
}

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}