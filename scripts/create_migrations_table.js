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

console.log('Criando tabela de migrações...');

try {
  // Criar tabela de migrações se não existir
  await db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Tabela de migrações criada com sucesso!');

  // Verificar se a tabela foi criada
  const tableExists = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'");
  
  if (tableExists) {
    console.log('✅ Tabela migrations existe');
    
    // Listar migrações existentes
    const migrations = await db.all('SELECT * FROM migrations ORDER BY id');
    console.log('Migrações existentes:', migrations.length);
    
    if (migrations.length > 0) {
      migrations.forEach(m => console.log(`  - ${m.name} (${m.executed_at})`));
    }
  } else {
    console.log('❌ Tabela migrations não foi criada');
  }

} catch (error) {
  console.error('Erro ao criar tabela de migrações:', error);
} finally {
  await db.close();
} 