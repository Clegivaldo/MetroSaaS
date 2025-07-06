import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../server/database/database.db');

async function addSiglaColumn() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    console.log('Adicionando coluna sigla na tabela document_categories...');
    
    // Verificar se a coluna já existe
    const columns = await db.all("PRAGMA table_info(document_categories)");
    const hasSigla = columns.some(col => col.name === 'sigla');
    
    if (!hasSigla) {
      await db.exec('ALTER TABLE document_categories ADD COLUMN sigla TEXT');
      console.log('Coluna sigla adicionada com sucesso!');
    } else {
      console.log('Coluna sigla já existe!');
    }
    
    // Verificar se a coluna foi adicionada
    const updatedColumns = await db.all("PRAGMA table_info(document_categories)");
    console.log('Colunas da tabela document_categories:', updatedColumns.map(col => col.name));
    
  } catch (error) {
    console.error('Erro ao adicionar coluna sigla:', error);
  } finally {
    await db.close();
  }
}

addSiglaColumn(); 