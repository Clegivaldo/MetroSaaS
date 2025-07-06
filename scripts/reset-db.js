import { executeQuery } from '../server/database/connection.js';

async function resetDatabase() {
  try {
    console.log('🔄 Iniciando reset completo do banco de dados...');
    
    // Lista de todas as tabelas para deletar
    const tables = [
      'user_permissions',
      'permissions', 
      'standard_types',
      'document_categories',
      'audit_logs',
      'users',
      'clients',
      'certificates',
      'standards',
      'appointments',
      'documents',
      'suppliers',
      'trainings',
      'system_trainings',
      'settings',
      'templates',
      'notifications',
      'maintenance',
      'non_conformities',
      'complaints',
      'audits',
      'environmental_conditions',
      'test_results'
    ];

    // Deletar todas as tabelas
    for (const table of tables) {
      try {
        await executeQuery(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✅ Tabela ${table} deletada`);
      } catch (error) {
        console.log(`⚠️ Erro ao deletar tabela ${table}:`, error.message);
      }
    }

    console.log('✅ Reset do banco concluído!');
    console.log('📝 Execute "npm run db:migrate" para recriar as tabelas');
    console.log('📝 Execute "npm run db:seed" para inserir dados iniciais');
    
  } catch (error) {
    console.error('❌ Erro no reset do banco:', error);
  }
}

resetDatabase(); 