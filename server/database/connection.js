import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, './database.db');

// Garante que o diretório do banco exista
if (!existsSync(dbPath)) {
  try {
    mkdirSync(dirname(dbPath), { recursive: true });
    console.log('✅ Banco de dados será criado ao conectar.');
  } catch (error) {
    console.error('❌ Erro ao criar diretório do banco:', error.message);
  }
}

let db = null;

export const getDatabase = async () => {
  if (!db) {
    try {
      db = await open({
        filename: './server/database/database.db',
        driver: sqlite3.Database
      });
      
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Failed to connect to database', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  return db;
};

export const executeQuery = async (query, params = []) => {
  try {
    const database = await getDatabase();
    logger.debug('Executing query', { query, params });
    
    const result = await database.run(query, params);
    logger.debug('Query executed successfully', { 
      changes: result.changes,
      lastID: result.lastID 
    });
    
    return result;
  } catch (error) {
    logger.dbError('executeQuery', 'unknown', error, query, params);
    throw error;
  }
};

export const getOne = async (query, params = []) => {
  try {
    const database = await getDatabase();
    logger.debug('Executing getOne query', { query, params });
    
    const result = await database.get(query, params);
    logger.debug('getOne query executed successfully', { 
      found: !!result,
      rowCount: result ? 1 : 0 
    });
    
    return result;
  } catch (error) {
    logger.dbError('getOne', 'unknown', error, query, params);
    throw error;
  }
};

export const getAll = async (query, params = []) => {
  try {
    const database = await getDatabase();
    logger.debug('Executing getAll query', { query, params });
    
    const results = await database.all(query, params);
    logger.debug('getAll query executed successfully', { 
      rowCount: results.length 
    });
    
    return results;
  } catch (error) {
    logger.dbError('getAll', 'unknown', error, query, params);
    throw error;
  }
};

export const closeDatabase = async () => {
  if (db) {
    try {
      await db.close();
      db = null;
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection', {
        error: error.message,
        stack: error.stack
      });
    }
  }
};
