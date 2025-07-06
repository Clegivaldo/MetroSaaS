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

console.log('Criando tabelas de marcas e modelos...');

try {
  // Criar tabela de marcas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Tabela brands criada com sucesso!');

  // Criar tabela de modelos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand_id TEXT NOT NULL,
      equipment_type_id TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
      FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id) ON DELETE CASCADE,
      UNIQUE(brand_id, equipment_type_id, name)
    );
  `);
  console.log('✅ Tabela models criada com sucesso!');

  // Criar tabela de relacionamento marca-tipo de equipamento
  await db.exec(`
    CREATE TABLE IF NOT EXISTS brand_equipment_types (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      equipment_type_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
      FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id) ON DELETE CASCADE,
      UNIQUE(brand_id, equipment_type_id)
    );
  `);
  console.log('✅ Tabela brand_equipment_types criada com sucesso!');

} catch (error) {
  console.error('Erro ao criar tabelas:', error);
} finally {
  await db.close();
} 