import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../server/database/database.db');

async function addIdentificacaoColumn() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    console.log('Adicionando coluna identificacao na tabela standards...');
    const columns = await db.all("PRAGMA table_info(standards)");
    const hasIdentificacao = columns.some(col => col.name === 'identificacao');
    if (!hasIdentificacao) {
      await db.exec('ALTER TABLE standards ADD COLUMN identificacao TEXT');
      console.log('Coluna identificacao adicionada com sucesso!');
    } else {
      console.log('Coluna identificacao já existe!');
    }
    const updatedColumns = await db.all("PRAGMA table_info(standards)");
    console.log('Colunas atuais:', updatedColumns.map(col => col.name));
  } catch (error) {
    console.error('Erro ao adicionar coluna identificacao:', error);
  } finally {
    await db.close();
  }
}

addIdentificacaoColumn(); 