import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../server/database/database.db');

async function createEquipmentScalesTable() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    console.log('Criando tabela equipment_scales se não existir...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS equipment_scales (
        id TEXT PRIMARY KEY,
        equipment_id TEXT NOT NULL,
        equipment_type TEXT NOT NULL,
        scale_name TEXT NOT NULL,
        scale_min REAL,
        scale_max REAL,
        unit TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabela equipment_scales pronta!');
  } catch (error) {
    console.error('Erro ao criar tabela equipment_scales:', error);
  } finally {
    await db.close();
  }
}

createEquipmentScalesTable(); 