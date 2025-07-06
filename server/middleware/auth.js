import jwt from 'jsonwebtoken';
import { getOne } from '../database/connection.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        url: req.url,
        method: req.method,
        ip: req.ip
      });
      return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    jwt.verify(token, JWT_SECRET, async (err, user) => {
      if (err) {
        logger.warn('Authentication failed: Invalid token', {
          url: req.url,
          method: req.method,
          ip: req.ip,
          error: err.message
        });
        return res.status(403).json({ error: 'Token inválido' });
      }

      try {
        // Verificar se o usuário ainda existe e está ativo
        const userExists = await getOne('SELECT * FROM users WHERE id = ? AND status = ?', [user.id, 'ativo']);

        if (!userExists) {
          logger.warn('Authentication failed: User not found or inactive', {
            userId: user.id,
            userEmail: user.email,
            url: req.url,
            method: req.method
          });
          return res.status(403).json({ error: 'Usuário não encontrado ou inativo' });
        }

        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
        logger.debug('Authentication successful', {
          userId: user.id,
          userEmail: user.email,
          url: req.url,
          method: req.method
        });
        next();
      } catch (dbError) {
        logger.error('Database error during authentication', {
          error: dbError.message,
          userId: user.id,
          url: req.url,
          method: req.method
        });
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });
  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        logger.warn('Role check failed: No user in request', {
          url: req.url,
          method: req.method,
          requiredRoles: roles
        });
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (!roles.includes(req.user.role)) {
        logger.warn('Role check failed: Insufficient permissions', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: roles,
          url: req.url,
          method: req.method
        });
        return res.status(403).json({ error: 'Permissão insuficiente' });
      }

      logger.debug('Role check successful', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        url: req.url,
        method: req.method
      });
      next();
    } catch (error) {
      logger.error('Role check middleware error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
};

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