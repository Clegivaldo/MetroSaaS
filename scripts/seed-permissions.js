import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../server/database/connection.js';

async function seedPermissions() {
  console.log('Inserindo permissões padrão...');

  const permissions = [
    // Gestão de Usuários
    { name: 'Visualizar Usuários', description: 'Pode visualizar lista de usuários', module: 'Usuários' },
    { name: 'Criar Usuários', description: 'Pode criar novos usuários', module: 'Usuários' },
    { name: 'Editar Usuários', description: 'Pode editar informações de usuários', module: 'Usuários' },
    { name: 'Deletar Usuários', description: 'Pode deletar usuários', module: 'Usuários' },
    { name: 'Gerenciar Permissões', description: 'Pode gerenciar permissões de usuários', module: 'Usuários' },

    // Gestão de Clientes
    { name: 'Visualizar Clientes', description: 'Pode visualizar lista de clientes', module: 'Clientes' },
    { name: 'Criar Clientes', description: 'Pode criar novos clientes', module: 'Clientes' },
    { name: 'Editar Clientes', description: 'Pode editar informações de clientes', module: 'Clientes' },
    { name: 'Deletar Clientes', description: 'Pode deletar clientes', module: 'Clientes' },

    // Gestão de Documentos
    { name: 'Visualizar Documentos', description: 'Pode visualizar documentos', module: 'Documentos' },
    { name: 'Criar Documentos', description: 'Pode criar novos documentos', module: 'Documentos' },
    { name: 'Editar Documentos', description: 'Pode editar documentos', module: 'Documentos' },
    { name: 'Deletar Documentos', description: 'Pode deletar documentos', module: 'Documentos' },
    { name: 'Gerenciar Categorias', description: 'Pode gerenciar categorias de documentos', module: 'Documentos' },

    // Gestão de Padrões
    { name: 'Visualizar Padrões', description: 'Pode visualizar padrões', module: 'Padrões' },
    { name: 'Criar Padrões', description: 'Pode criar novos padrões', module: 'Padrões' },
    { name: 'Editar Padrões', description: 'Pode editar padrões', module: 'Padrões' },
    { name: 'Deletar Padrões', description: 'Pode deletar padrões', module: 'Padrões' },
    { name: 'Gerenciar Tipos', description: 'Pode gerenciar tipos de padrões', module: 'Padrões' },

    // Gestão de Certificados
    { name: 'Visualizar Certificados', description: 'Pode visualizar certificados', module: 'Certificados' },
    { name: 'Criar Certificados', description: 'Pode criar novos certificados', module: 'Certificados' },
    { name: 'Editar Certificados', description: 'Pode editar certificados', module: 'Certificados' },
    { name: 'Deletar Certificados', description: 'Pode deletar certificados', module: 'Certificados' },

    // Gestão de Fornecedores
    { name: 'Visualizar Fornecedores', description: 'Pode visualizar fornecedores', module: 'Fornecedores' },
    { name: 'Criar Fornecedores', description: 'Pode criar novos fornecedores', module: 'Fornecedores' },
    { name: 'Editar Fornecedores', description: 'Pode editar fornecedores', module: 'Fornecedores' },
    { name: 'Deletar Fornecedores', description: 'Pode deletar fornecedores', module: 'Fornecedores' },

    // Gestão de Treinamentos
    { name: 'Visualizar Treinamentos', description: 'Pode visualizar treinamentos', module: 'Treinamentos' },
    { name: 'Criar Treinamentos', description: 'Pode criar novos treinamentos', module: 'Treinamentos' },
    { name: 'Editar Treinamentos', description: 'Pode editar treinamentos', module: 'Treinamentos' },
    { name: 'Deletar Treinamentos', description: 'Pode deletar treinamentos', module: 'Treinamentos' },

    // Gestão de Agendamentos
    { name: 'Visualizar Agendamentos', description: 'Pode visualizar agendamentos', module: 'Agendamentos' },
    { name: 'Criar Agendamentos', description: 'Pode criar novos agendamentos', module: 'Agendamentos' },
    { name: 'Editar Agendamentos', description: 'Pode editar agendamentos', module: 'Agendamentos' },
    { name: 'Deletar Agendamentos', description: 'Pode deletar agendamentos', module: 'Agendamentos' },

    // Gestão de Não Conformidades
    { name: 'Visualizar Não Conformidades', description: 'Pode visualizar não conformidades', module: 'Não Conformidades' },
    { name: 'Criar Não Conformidades', description: 'Pode criar novas não conformidades', module: 'Não Conformidades' },
    { name: 'Editar Não Conformidades', description: 'Pode editar não conformidades', module: 'Não Conformidades' },
    { name: 'Deletar Não Conformidades', description: 'Pode deletar não conformidades', module: 'Não Conformidades' },

    // Relatórios e Auditoria
    { name: 'Visualizar Relatórios', description: 'Pode visualizar relatórios', module: 'Relatórios' },
    { name: 'Gerar Relatórios', description: 'Pode gerar relatórios', module: 'Relatórios' },
    { name: 'Visualizar Logs', description: 'Pode visualizar logs de auditoria', module: 'Relatórios' },
    { name: 'Visualizar Atividades', description: 'Pode visualizar histórico de atividades', module: 'Relatórios' },

    // Configurações
    { name: 'Visualizar Configurações', description: 'Pode visualizar configurações', module: 'Configurações' },
    { name: 'Editar Configurações', description: 'Pode editar configurações do sistema', module: 'Configurações' },
  ];

  try {
    for (const permission of permissions) {
      const id = uuidv4();
      await executeQuery(`
        INSERT OR IGNORE INTO permissions (id, name, description, module, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [id, permission.name, permission.description, permission.module]);
    }

    console.log('Permissões inseridas com sucesso!');
  } catch (error) {
    console.error('Erro ao inserir permissões:', error);
  }
}

seedPermissions(); 