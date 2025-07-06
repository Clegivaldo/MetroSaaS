import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../server/database/connection.js';

async function seedStandardTypes() {
  console.log('Inserindo tipos de padrões de teste...');

  const standardTypes = [
    // Tipos de Massa
    { name: 'Massa Padrão 1kg', description: 'Massa padrão de 1 quilograma', category: 'Massa' },
    { name: 'Massa Padrão 500g', description: 'Massa padrão de 500 gramas', category: 'Massa' },
    { name: 'Massa Padrão 100g', description: 'Massa padrão de 100 gramas', category: 'Massa' },
    { name: 'Massa Padrão 50g', description: 'Massa padrão de 50 gramas', category: 'Massa' },
    { name: 'Massa Padrão 20g', description: 'Massa padrão de 20 gramas', category: 'Massa' },
    { name: 'Massa Padrão 10g', description: 'Massa padrão de 10 gramas', category: 'Massa' },
    { name: 'Massa Padrão 5g', description: 'Massa padrão de 5 gramas', category: 'Massa' },
    { name: 'Massa Padrão 2g', description: 'Massa padrão de 2 gramas', category: 'Massa' },
    { name: 'Massa Padrão 1g', description: 'Massa padrão de 1 grama', category: 'Massa' },

    // Tipos de Temperatura
    { name: 'Termômetro de Contato', description: 'Termômetro para medição de temperatura por contato', category: 'Temperatura' },
    { name: 'Termômetro de Imersão', description: 'Termômetro para medição de temperatura por imersão', category: 'Temperatura' },
    { name: 'Termômetro de Infravermelho', description: 'Termômetro para medição de temperatura sem contato', category: 'Temperatura' },
    { name: 'Termômetro de Resistência', description: 'Termômetro de resistência elétrica (RTD)', category: 'Temperatura' },
    { name: 'Termopar Tipo K', description: 'Termopar tipo K para medição de temperatura', category: 'Temperatura' },
    { name: 'Termopar Tipo J', description: 'Termopar tipo J para medição de temperatura', category: 'Temperatura' },
    { name: 'Termopar Tipo T', description: 'Termopar tipo T para medição de temperatura', category: 'Temperatura' },

    // Tipos de Pressão
    { name: 'Manômetro Digital', description: 'Manômetro digital para medição de pressão', category: 'Pressão' },
    { name: 'Manômetro Analógico', description: 'Manômetro analógico para medição de pressão', category: 'Pressão' },
    { name: 'Transdutor de Pressão', description: 'Transdutor para medição de pressão', category: 'Pressão' },
    { name: 'Calibrador de Pressão', description: 'Calibrador para calibração de instrumentos de pressão', category: 'Pressão' },
    { name: 'Manômetro de Teste', description: 'Manômetro para testes de pressão', category: 'Pressão' },

    // Tipos Dimensional
    { name: 'Paquímetro Digital', description: 'Paquímetro digital para medições dimensionais', category: 'Dimensional' },
    { name: 'Paquímetro Analógico', description: 'Paquímetro analógico para medições dimensionais', category: 'Dimensional' },
    { name: 'Micrômetro Digital', description: 'Micrômetro digital para medições precisas', category: 'Dimensional' },
    { name: 'Micrômetro Analógico', description: 'Micrômetro analógico para medições precisas', category: 'Dimensional' },
    { name: 'Relógio Comparador', description: 'Relógio comparador para medições de deslocamento', category: 'Dimensional' },
    { name: 'Blocos Padrão', description: 'Blocos padrão para calibração dimensional', category: 'Dimensional' },
    { name: 'Régua Padrão', description: 'Régua padrão para calibração dimensional', category: 'Dimensional' },

    // Tipos Elétricos
    { name: 'Multímetro Digital', description: 'Multímetro digital para medições elétricas', category: 'Elétrico' },
    { name: 'Multímetro Analógico', description: 'Multímetro analógico para medições elétricas', category: 'Elétrico' },
    { name: 'Calibrador de Multímetro', description: 'Calibrador para multímetros', category: 'Elétrico' },
    { name: 'Osciloscópio', description: 'Osciloscópio para análise de sinais elétricos', category: 'Elétrico' },
    { name: 'Gerador de Sinais', description: 'Gerador de sinais para calibração', category: 'Elétrico' },
    { name: 'Fonte de Alimentação', description: 'Fonte de alimentação para testes elétricos', category: 'Elétrico' },

    // Tipos de Tempo
    { name: 'Cronômetro Digital', description: 'Cronômetro digital para medição de tempo', category: 'Tempo' },
    { name: 'Cronômetro Analógico', description: 'Cronômetro analógico para medição de tempo', category: 'Tempo' },
    { name: 'Relógio Padrão', description: 'Relógio padrão para calibração de tempo', category: 'Tempo' },
    { name: 'Gerador de Frequência', description: 'Gerador de frequência para calibração', category: 'Tempo' },
  ];

  try {
    for (const type of standardTypes) {
      const id = uuidv4();
      await executeQuery(`
        INSERT OR IGNORE INTO standard_types (id, name, description, category, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [id, type.name, type.description, type.category]);
    }

    console.log('Tipos de padrões inseridos com sucesso!');
  } catch (error) {
    console.error('Erro ao inserir tipos de padrões:', error);
  }
}

seedStandardTypes(); 