import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../server/database/database.db');

const db = await open({
  filename: dbPath,
  driver: sqlite3.Database
});

console.log('Adicionando coluna identificacao na tabela client_equipment...');

try {
  await db.exec('ALTER TABLE client_equipment ADD COLUMN identificacao TEXT;');
  console.log('✅ Coluna identificacao adicionada com sucesso!');
} catch (error) {
  console.log('ℹ️ Coluna identificacao já existe ou erro:', error.message);
} finally {
  await db.close();
} 