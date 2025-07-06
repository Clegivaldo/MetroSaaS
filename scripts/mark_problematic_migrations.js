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

console.log('Marcando migrações problemáticas como executadas...');

try {
  // Migrações que causam erro de coluna duplicada
  const problematicMigrations = [
    'add_brand_to_standards',
    'add_brand_to_client_equipment',
    'add_type_id_to_standards',
    'add_type_id_to_client_equipment',
    'add_certificate_number_to_standards',
    'add_certificate_number_to_client_equipment',
    'add_sigla_to_document_categories',
    'add_identificacao_to_standards',
    'add_identificacao_to_client_equipment'
  ];

  for (const migrationName of problematicMigrations) {
    // Verificar se a migração já foi executada
    const existing = await db.get('SELECT * FROM migrations WHERE name = ?', [migrationName]);
    
    if (!existing) {
      // Marcar como executada
      await db.run('INSERT INTO migrations (name, executed_at) VALUES (?, datetime("now"))', [migrationName]);
      console.log(`✅ Migração ${migrationName} marcada como executada`);
    } else {
      console.log(`ℹ️ Migração ${migrationName} já existe`);
    }
  }

  // Verificar colunas existentes nas tabelas
  const standardsColumns = await db.all("PRAGMA table_info(standards)");
  const clientEquipmentColumns = await db.all("PRAGMA table_info(client_equipment)");
  
  console.log('\nColunas da tabela standards:', standardsColumns.map(col => col.name));
  console.log('Colunas da tabela client_equipment:', clientEquipmentColumns.map(col => col.name));

  console.log('\n✅ Migrações problemáticas marcadas com sucesso!');

} catch (error) {
  console.error('Erro ao marcar migrações:', error);
} finally {
  await db.close();
} 