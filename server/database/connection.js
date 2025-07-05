import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

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

// Cria e exporta o banco
const db = await open({
  filename: dbPath,
  driver: sqlite3.Database
});

// Funções auxiliares
export async function executeQuery(sql, params = []) {
  try {
    return await db.run(sql, params);
  } catch (error) {
    console.error('Erro ao executar query:', error.message);
    throw error;
  }
}

export async function getOne(sql, params = []) {
  try {
    return await db.get(sql, params);
  } catch (error) {
    console.error('Erro ao buscar um registro:', error.message);
    throw error;
  }
}

export async function getAll(sql, params = []) {
  try {
    return await db.all(sql, params);
  } catch (error) {
    console.error('Erro ao buscar todos registros:', error.message);
    throw error;
  }
}

export default db;
