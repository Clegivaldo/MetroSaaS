import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../server/database/database.db');

async function addDocumentsColumns() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    console.log('Adicionando colunas em documents...');
    const columns = await db.all("PRAGMA table_info(documents)");
    const colNames = columns.map(col => col.name);
    if (!colNames.includes('code')) {
      await db.exec('ALTER TABLE documents ADD COLUMN code TEXT');
      console.log('Coluna code adicionada!');
    }
    if (!colNames.includes('prefix')) {
      await db.exec('ALTER TABLE documents ADD COLUMN prefix TEXT');
      console.log('Coluna prefix adicionada!');
    }
    if (!colNames.includes('revision')) {
      await db.exec('ALTER TABLE documents ADD COLUMN revision TEXT');
      console.log('Coluna revision adicionada!');
    }
    if (!colNames.includes('revision_date')) {
      await db.exec('ALTER TABLE documents ADD COLUMN revision_date TEXT');
      console.log('Coluna revision_date adicionada!');
    }
    const updatedColumns = await db.all("PRAGMA table_info(documents)");
    console.log('Colunas atuais:', updatedColumns.map(col => col.name));
  } catch (error) {
    console.error('Erro ao adicionar colunas:', error);
  } finally {
    await db.close();
  }
}

addDocumentsColumns(); 