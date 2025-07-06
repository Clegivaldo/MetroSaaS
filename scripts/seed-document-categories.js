import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../server/database/connection.js';

async function seedDocumentCategories() {
  console.log('Inserindo categorias de documentos de teste...');

  const documentCategories = [
    // Procedimentos
    { name: 'Procedimentos de Calibração', description: 'Procedimentos para calibração de instrumentos', color: 'blue' },
    { name: 'Procedimentos de Medição', description: 'Procedimentos para medições específicas', color: 'green' },
    { name: 'Procedimentos de Qualidade', description: 'Procedimentos do sistema de qualidade', color: 'purple' },
    { name: 'Procedimentos de Segurança', description: 'Procedimentos de segurança do laboratório', color: 'red' },

    // Instruções de Trabalho
    { name: 'Instruções de Calibração', description: 'Instruções detalhadas para calibrações', color: 'blue' },
    { name: 'Instruções de Medição', description: 'Instruções para procedimentos de medição', color: 'green' },
    { name: 'Instruções de Manutenção', description: 'Instruções para manutenção de equipamentos', color: 'yellow' },
    { name: 'Instruções de Segurança', description: 'Instruções de segurança do laboratório', color: 'red' },

    // Formulários
    { name: 'Formulários de Calibração', description: 'Formulários para registros de calibração', color: 'blue' },
    { name: 'Formulários de Medição', description: 'Formulários para registros de medição', color: 'green' },
    { name: 'Formulários de Qualidade', description: 'Formulários do sistema de qualidade', color: 'purple' },
    { name: 'Formulários de Manutenção', description: 'Formulários para registros de manutenção', color: 'yellow' },

    // Registros
    { name: 'Registros de Calibração', description: 'Registros históricos de calibrações', color: 'blue' },
    { name: 'Registros de Medição', description: 'Registros históricos de medições', color: 'green' },
    { name: 'Registros de Qualidade', description: 'Registros do sistema de qualidade', color: 'purple' },
    { name: 'Registros de Manutenção', description: 'Registros históricos de manutenções', color: 'yellow' },

    // Manuais
    { name: 'Manuais de Equipamentos', description: 'Manuais técnicos de equipamentos', color: 'indigo' },
    { name: 'Manuais de Procedimentos', description: 'Manuais de procedimentos do laboratório', color: 'blue' },
    { name: 'Manuais de Qualidade', description: 'Manuais do sistema de qualidade', color: 'purple' },
    { name: 'Manuais de Segurança', description: 'Manuais de segurança do laboratório', color: 'red' },

    // Especificações
    { name: 'Especificações Técnicas', description: 'Especificações técnicas de equipamentos', color: 'indigo' },
    { name: 'Especificações de Calibração', description: 'Especificações para calibrações', color: 'blue' },
    { name: 'Especificações de Medição', description: 'Especificações para medições', color: 'green' },
    { name: 'Especificações de Qualidade', description: 'Especificações do sistema de qualidade', color: 'purple' },

    // Relatórios
    { name: 'Relatórios de Calibração', description: 'Relatórios de calibrações realizadas', color: 'blue' },
    { name: 'Relatórios de Medição', description: 'Relatórios de medições realizadas', color: 'green' },
    { name: 'Relatórios de Qualidade', description: 'Relatórios do sistema de qualidade', color: 'purple' },
    { name: 'Relatórios de Auditoria', description: 'Relatórios de auditorias realizadas', color: 'orange' },

    // Certificados
    { name: 'Certificados de Calibração', description: 'Certificados de calibração emitidos', color: 'blue' },
    { name: 'Certificados de Acreditação', description: 'Certificados de acreditação do laboratório', color: 'purple' },
    { name: 'Certificados de Competência', description: 'Certificados de competência técnica', color: 'green' },

    // Políticas
    { name: 'Políticas de Qualidade', description: 'Políticas do sistema de qualidade', color: 'purple' },
    { name: 'Políticas de Segurança', description: 'Políticas de segurança do laboratório', color: 'red' },
    { name: 'Políticas de Calibração', description: 'Políticas para calibrações', color: 'blue' },

    // Outros
    { name: 'Documentos Legais', description: 'Documentos legais e regulamentares', color: 'gray' },
    { name: 'Documentos de Treinamento', description: 'Documentos para treinamentos', color: 'pink' },
    { name: 'Documentos de Comunicação', description: 'Documentos de comunicação interna', color: 'cyan' },
  ];

  try {
    for (const category of documentCategories) {
      const id = uuidv4();
      await executeQuery(`
        INSERT OR IGNORE INTO document_categories (id, name, description, color, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [id, category.name, category.description, category.color]);
    }

    console.log('Categorias de documentos inseridas com sucesso!');
  } catch (error) {
    console.error('Erro ao inserir categorias de documentos:', error);
  }
}

seedDocumentCategories(); 