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

console.log('Corrigindo migrações duplicadas...');

try {
  // Verificar se as colunas já existem antes de adicionar
  const standardsColumns = await db.all("PRAGMA table_info(standards)");
  const clientEquipmentColumns = await db.all("PRAGMA table_info(client_equipment)");
  
  console.log('Colunas da tabela standards:', standardsColumns.map(col => col.name));
  console.log('Colunas da tabela client_equipment:', clientEquipmentColumns.map(col => col.name));

  // Adicionar colunas apenas se não existirem
  const standardsColumnNames = standardsColumns.map(col => col.name);
  const clientEquipmentColumnNames = clientEquipmentColumns.map(col => col.name);

  if (!standardsColumnNames.includes('brand_id')) {
    await db.exec('ALTER TABLE standards ADD COLUMN brand_id TEXT;');
    console.log('✅ Coluna brand_id adicionada em standards');
  }

  if (!standardsColumnNames.includes('model_id')) {
    await db.exec('ALTER TABLE standards ADD COLUMN model_id TEXT;');
    console.log('✅ Coluna model_id adicionada em standards');
  }

  if (!clientEquipmentColumnNames.includes('brand_id')) {
    await db.exec('ALTER TABLE client_equipment ADD COLUMN brand_id TEXT;');
    console.log('✅ Coluna brand_id adicionada em client_equipment');
  }

  if (!clientEquipmentColumnNames.includes('model_id')) {
    await db.exec('ALTER TABLE client_equipment ADD COLUMN model_id TEXT;');
    console.log('✅ Coluna model_id adicionada em client_equipment');
  }

  console.log('✅ Migrações corrigidas com sucesso!');

} catch (error) {
  console.error('Erro ao corrigir migrações:', error);
} finally {
  await db.close();
} 