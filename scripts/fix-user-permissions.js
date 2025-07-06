import { executeQuery } from '../server/database/connection.js';

async function fixUserPermissionsTable() {
  try {
    console.log('Corrigindo tabela user_permissions...');
    
    // Dropar a tabela se existir
    await executeQuery('DROP TABLE IF EXISTS user_permissions');
    
    // Recriar com a estrutura correta
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
    
    console.log('Tabela user_permissions corrigida com sucesso!');
  } catch (error) {
    console.error('Erro ao corrigir tabela user_permissions:', error);
  }
}

fixUserPermissionsTable(); 