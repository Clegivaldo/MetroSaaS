import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbPath = './server/database/database.db';

async function addEmailActionColumn() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    console.log('🔄 Adicionando coluna action na tabela email_templates...');
    
    // Verificar se a coluna já existe
    const columns = await db.all("PRAGMA table_info(email_templates)");
    const hasActionColumn = columns.some(col => col.name === 'action');
    
    if (!hasActionColumn) {
      await db.run('ALTER TABLE email_templates ADD COLUMN action TEXT');
      console.log('✅ Coluna action adicionada com sucesso!');
    } else {
      console.log('ℹ️ Coluna action já existe');
    }
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna action:', error);
  } finally {
    await db.close();
  }
}

addEmailActionColumn(); 