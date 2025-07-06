import { executeQuery, getOne } from '../server/database/connection.js';

async function checkAndCreateTables() {
  try {
    console.log('Verificando tabelas necessárias...');

    // Verificar se a tabela audit_logs existe
    const auditLogsExists = await getOne("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'");
    if (!auditLogsExists) {
      console.log('Criando tabela audit_logs...');
      await executeQuery(`
        CREATE TABLE audit_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          action TEXT NOT NULL,
          table_name TEXT NOT NULL,
          record_id TEXT,
          old_values TEXT,
          new_values TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Verificar se a tabela permissions existe
    const permissionsExists = await getOne("SELECT name FROM sqlite_master WHERE type='table' AND name='permissions'");
    if (!permissionsExists) {
      console.log('Criando tabela permissions...');
      await executeQuery(`
        CREATE TABLE permissions (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          module TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Verificar se a tabela user_permissions existe
    const userPermissionsExists = await getOne("SELECT name FROM sqlite_master WHERE type='table' AND name='user_permissions'");
    if (!userPermissionsExists) {
      console.log('Criando tabela user_permissions...');
      await executeQuery(`
        CREATE TABLE user_permissions (
          user_id TEXT NOT NULL,
          permission_id TEXT NOT NULL,
          granted BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, permission_id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (permission_id) REFERENCES permissions (id)
        )
      `);
    }

    // Verificar se a tabela standard_types existe
    const standardTypesExists = await getOne("SELECT name FROM sqlite_master WHERE type='table' AND name='standard_types'");
    if (!standardTypesExists) {
      console.log('Criando tabela standard_types...');
      await executeQuery(`
        CREATE TABLE standard_types (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Verificar se a tabela document_categories existe
    const documentCategoriesExists = await getOne("SELECT name FROM sqlite_master WHERE type='table' AND name='document_categories'");
    if (!documentCategoriesExists) {
      console.log('Criando tabela document_categories...');
      await executeQuery(`
        CREATE TABLE document_categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    console.log('Todas as tabelas verificadas e criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao verificar/criar tabelas:', error);
  }
}

checkAndCreateTables(); 