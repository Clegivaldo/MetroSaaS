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

console.log('Corrigindo status das migrações...');

try {
  // Verificar migrações existentes
  const migrations = await db.all('SELECT * FROM migrations ORDER BY id');
  console.log('Migrações existentes:', migrations.map(m => m.id));

  // Migrações que causam erro de coluna duplicada
  const problematicMigrations = [
    'add_brand_model_to_standards',
    'add_brand_model_to_client_equipment'
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

  console.log('✅ Status das migrações corrigido com sucesso!');

} catch (error) {
  console.error('Erro ao corrigir status das migrações:', error);
} finally {
  await db.close();
} 