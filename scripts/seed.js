import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../server/database/database.db');
const dataDir = dirname(dbPath);

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

if (!existsSync(dbPath)) {
  writeFileSync(dbPath, '');
  console.log('✅ Created empty database file');
}

const db = await open({
  filename: dbPath,
  driver: sqlite3.Database
});

console.log('🌱 Inserindo dados iniciais...');

try {
  // Limpar permissões antes de inserir
  await db.run('DELETE FROM permissions');
  // Limpar usuários antes de inserir
  await db.run('DELETE FROM users');
  // Limpar categorias de documentos antes de inserir
  await db.run('DELETE FROM document_categories');
  // Limpar grandezas antes de inserir
  await db.run('DELETE FROM quantities');
  // Limpar tipos de equipamentos antes de inserir
  await db.run('DELETE FROM equipment_types');
  // Limpar marcas antes de inserir
  await db.run('DELETE FROM brands');
  // Limpar modelos antes de inserir
  await db.run('DELETE FROM models');

  // 1. Inserir permissões
  console.log('📋 Inserindo permissões...');
  const permissions = [
    { id: uuidv4(), name: 'users.read', description: 'Visualizar usuários', module: 'users' },
    { id: uuidv4(), name: 'users.create', description: 'Criar usuários', module: 'users' },
    { id: uuidv4(), name: 'users.update', description: 'Editar usuários', module: 'users' },
    { id: uuidv4(), name: 'users.delete', description: 'Excluir usuários', module: 'users' },
    { id: uuidv4(), name: 'clients.read', description: 'Visualizar clientes', module: 'clients' },
    { id: uuidv4(), name: 'clients.create', description: 'Criar clientes', module: 'clients' },
    { id: uuidv4(), name: 'clients.update', description: 'Editar clientes', module: 'clients' },
    { id: uuidv4(), name: 'clients.delete', description: 'Excluir clientes', module: 'clients' },
    { id: uuidv4(), name: 'documents.read', description: 'Visualizar documentos', module: 'documents' },
    { id: uuidv4(), name: 'documents.create', description: 'Criar documentos', module: 'documents' },
    { id: uuidv4(), name: 'documents.update', description: 'Editar documentos', module: 'documents' },
    { id: uuidv4(), name: 'documents.delete', description: 'Excluir documentos', module: 'documents' },
    { id: uuidv4(), name: 'standards.read', description: 'Visualizar padrões', module: 'standards' },
    { id: uuidv4(), name: 'standards.create', description: 'Criar padrões', module: 'standards' },
    { id: uuidv4(), name: 'standards.update', description: 'Editar padrões', module: 'standards' },
    { id: uuidv4(), name: 'standards.delete', description: 'Excluir padrões', module: 'standards' },
    { id: uuidv4(), name: 'certificates.read', description: 'Visualizar certificados', module: 'certificates' },
    { id: uuidv4(), name: 'certificates.create', description: 'Criar certificados', module: 'certificates' },
    { id: uuidv4(), name: 'certificates.update', description: 'Editar certificados', module: 'certificates' },
    { id: uuidv4(), name: 'certificates.delete', description: 'Excluir certificados', module: 'certificates' }
  ];

  for (const permission of permissions) {
    await db.run(`
      INSERT INTO permissions (id, name, description, module)
      VALUES (?, ?, ?, ?)
    `, [permission.id, permission.name, permission.description, permission.module]);
  }

  // 2. Inserir tipos de padrões
  console.log('📋 Inserindo tipos de padrões...');
  const standardTypes = [
    { id: uuidv4(), name: 'Termômetro', description: 'Equipamentos para medição de temperatura' },
    { id: uuidv4(), name: 'Manômetro', description: 'Equipamentos para medição de pressão' },
    { id: uuidv4(), name: 'Paquímetro', description: 'Equipamentos para medição dimensional' },
    { id: uuidv4(), name: 'Micrômetro', description: 'Equipamentos para medição dimensional de alta precisão' },
    { id: uuidv4(), name: 'Termo-higrômetro', description: 'Equipamentos para medição de temperatura e umidade' }
  ];

  for (const type of standardTypes) {
    await db.run(`
      INSERT INTO standard_types (id, name, description)
      VALUES (?, ?, ?)
    `, [type.id, type.name, type.description]);
  }

  // 3. Inserir categorias de documentos (sem duplicidade)
  console.log('📋 Inserindo categorias de documentos...');
  const documentCategories = [
    { id: uuidv4(), name: 'Certificado', description: 'Certificados de calibração', sigla: 'CCA', color: 'blue' },
    { id: uuidv4(), name: 'Manual da Qualidade', description: 'Manual da qualidade da empresa', sigla: 'MQ', color: 'green' },
    { id: uuidv4(), name: 'Instrução de Trabalho', description: 'Instruções detalhadas de trabalho', sigla: 'IT', color: 'yellow' },
    { id: uuidv4(), name: 'Documento de Apoio', description: 'Documentos de apoio técnico', sigla: 'DA', color: 'purple' },
    { id: uuidv4(), name: 'Registro da Qualidade', description: 'Registros de controle da qualidade', sigla: 'RQ', color: 'red' },
    { id: uuidv4(), name: 'Procedimento Operacional', description: 'Procedimentos operacionais padrão', sigla: 'POP', color: 'indigo' }
  ];

  for (const category of documentCategories) {
    await db.run(`
      INSERT INTO document_categories (id, name, description, sigla, color)
      VALUES (?, ?, ?, ?, ?)
    `, [category.id, category.name, category.description, category.sigla, category.color]);
  }

  // 4. Inserir grandezas (sem duplicidade)
  console.log('📋 Inserindo grandezas...');
  const quantities = [
    { id: uuidv4(), name: 'Temperatura', symbol: 'T', unit: '°C' },
    { id: uuidv4(), name: 'Temperatura e Umidade', symbol: 'TU', unit: '°C/%' },
    { id: uuidv4(), name: 'Elétrica', symbol: 'E', unit: 'V/A/Ω' },
    { id: uuidv4(), name: 'Pressão', symbol: 'P', unit: 'Pa' },
    { id: uuidv4(), name: 'Força', symbol: 'F', unit: 'N' },
    { id: uuidv4(), name: 'Dimensional', symbol: 'D', unit: 'm' },
    { id: uuidv4(), name: 'Físico-químico', symbol: 'FQ', unit: 'var' },
    { id: uuidv4(), name: 'Massa', symbol: 'M', unit: 'kg' },
    { id: uuidv4(), name: 'Tempo', symbol: 't', unit: 's' }
  ];

  for (const quantity of quantities) {
    await db.run(`
      INSERT INTO quantities (id, name, symbol, unit)
      VALUES (?, ?, ?, ?)
    `, [quantity.id, quantity.name, quantity.symbol, quantity.unit]);
  }

  // 5. Inserir tipos de equipamentos (sem duplicidade)
  console.log('📋 Inserindo tipos de equipamentos...');
  const equipmentTypes = [
    { id: uuidv4(), name: 'Termômetro Digital', description: 'Medidor de temperatura digital com alta precisão', quantity_id: quantities[0].id },
    { id: uuidv4(), name: 'Termômetro de Resistência', description: 'Termômetro baseado em resistência elétrica', quantity_id: quantities[0].id },
    { id: uuidv4(), name: 'Termo-higrômetro', description: 'Medidor combinado de temperatura e umidade', quantity_id: quantities[1].id },
    { id: uuidv4(), name: 'Multímetro', description: 'Medidor universal de grandezas elétricas', quantity_id: quantities[2].id },
    { id: uuidv4(), name: 'Amperímetro', description: 'Medidor de corrente elétrica', quantity_id: quantities[2].id },
    { id: uuidv4(), name: 'Voltímetro', description: 'Medidor de tensão elétrica', quantity_id: quantities[2].id },
    { id: uuidv4(), name: 'Ohmímetro', description: 'Medidor de resistência elétrica', quantity_id: quantities[2].id },
    { id: uuidv4(), name: 'Manômetro Analógico', description: 'Medidor de pressão com indicação analógica', quantity_id: quantities[3].id },
    { id: uuidv4(), name: 'Manômetro Digital', description: 'Medidor de pressão com indicação digital', quantity_id: quantities[3].id },
    { id: uuidv4(), name: 'Dinamômetro', description: 'Medidor de força e torque', quantity_id: quantities[4].id },
    { id: uuidv4(), name: 'Paquímetro Digital', description: 'Medidor de dimensões lineares', quantity_id: quantities[5].id },
    { id: uuidv4(), name: 'Micrômetro', description: 'Medidor de precisão para dimensões pequenas', quantity_id: quantities[5].id },
    { id: uuidv4(), name: 'Balança Analítica', description: 'Medidor de massa com alta precisão', quantity_id: quantities[7].id },
    { id: uuidv4(), name: 'Cronômetro', description: 'Medidor de tempo com alta precisão', quantity_id: quantities[8].id },
    { id: uuidv4(), name: 'pHmetro', description: 'Medidor de pH e potencial elétrico', quantity_id: quantities[6].id },
    { id: uuidv4(), name: 'Conductivímetro', description: 'Medidor de condutividade elétrica', quantity_id: quantities[6].id }
  ];

  for (const type of equipmentTypes) {
    await db.run(`
      INSERT INTO equipment_types (id, name, description, quantity_id)
      VALUES (?, ?, ?, ?)
    `, [type.id, type.name, type.description, type.quantity_id]);
  }

  // 6. Inserir marcas conhecidas (sem duplicidade)
  console.log('📋 Inserindo marcas...');
  const brands = [
    { id: uuidv4(), name: 'Fluke' },
    { id: uuidv4(), name: 'Wika' },
    { id: uuidv4(), name: 'Mitutoyo' },
    { id: uuidv4(), name: 'Testo' },
    { id: uuidv4(), name: 'Instrutherm' },
    { id: uuidv4(), name: 'Agilent' },
    { id: uuidv4(), name: 'Keysight' },
    { id: uuidv4(), name: 'Tektronix' },
    { id: uuidv4(), name: 'Rohde & Schwarz' },
    { id: uuidv4(), name: 'Keithley' },
    { id: uuidv4(), name: 'HP' },
    { id: uuidv4(), name: 'Yokogawa' },
    { id: uuidv4(), name: 'Omega' },
    { id: uuidv4(), name: 'Honeywell' },
    { id: uuidv4(), name: 'Siemens' }
  ];

  for (const brand of brands) {
    await db.run(`
      INSERT INTO brands (id, name)
      VALUES (?, ?)
    `, [brand.id, brand.name]);
  }

  // 7. Inserir modelos conhecidos (sem duplicidade)
  console.log('📋 Inserindo modelos...');
  const models = [
    { id: uuidv4(), name: '51 II', brand_id: brands[0].id },
    { id: uuidv4(), name: '87V', brand_id: brands[0].id },
    { id: uuidv4(), name: '111', brand_id: brands[1].id },
    { id: uuidv4(), name: '500-196', brand_id: brands[2].id },
    { id: uuidv4(), name: '175 H1', brand_id: brands[3].id },
    { id: uuidv4(), name: 'TH-500', brand_id: brands[4].id },
    { id: uuidv4(), name: '34401A', brand_id: brands[5].id },
    { id: uuidv4(), name: 'U1253B', brand_id: brands[6].id },
    { id: uuidv4(), name: 'TBS1102B', brand_id: brands[7].id },
    { id: uuidv4(), name: 'HMC8012', brand_id: brands[8].id },
    { id: uuidv4(), name: '2000', brand_id: brands[9].id },
    { id: uuidv4(), name: '34465A', brand_id: brands[10].id },
    { id: uuidv4(), name: 'WT3000', brand_id: brands[11].id },
    { id: uuidv4(), name: 'HH309', brand_id: brands[12].id },
    { id: uuidv4(), name: 'ST3000', brand_id: brands[13].id },
    { id: uuidv4(), name: 'S7-1200', brand_id: brands[14].id }
  ];

  for (const model of models) {
    await db.run(`
      INSERT INTO models (id, name, brand_id)
      VALUES (?, ?, ?)
    `, [model.id, model.name, model.brand_id]);
  }

  // 8. Inserir usuários
  console.log('📋 Inserindo usuários...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const techPassword = await bcrypt.hash('tech123', 10);

  const users = [
    {
      id: uuidv4(),
      email: 'admin@metrosass.com',
      password_hash: adminPassword,
      name: 'Administrador',
      role: 'admin',
      status: 'ativo'
    },
    {
      id: uuidv4(),
      email: 'tecnico@metrosass.com',
      password_hash: techPassword,
      name: 'Técnico',
      role: 'tecnico',
      status: 'ativo'
    }
  ];

  for (const user of users) {
    await db.run(`
      INSERT INTO users (id, email, password_hash, name, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [user.id, user.email, user.password_hash, user.name, user.role, user.status]);
  }

  // 9. Atribuir permissões ao admin
  console.log('📋 Atribuindo permissões ao admin...');
  const adminUser = users[0];
  
  for (const permission of permissions) {
    await db.run(`
      INSERT INTO user_permissions (user_id, permission_id, granted)
      VALUES (?, ?, 1)
    `, [adminUser.id, permission.id]);
  }

  // 10. Inserir documentos de exemplo
  console.log('📋 Inserindo documentos de exemplo...');
  const documents = [
    {
      id: uuidv4(),
      title: 'Procedimento de Calibração de Termômetros',
      version: '1.0',
      category_id: documentCategories[0].id,
      code: 'PROC-001',
      prefix: 'PROC',
      revision: 'A',
      revision_date: '2024-01-15'
    },
    {
      id: uuidv4(),
      title: 'Instrução de Trabalho - Calibração de Manômetros',
      version: '2.0',
      category_id: documentCategories[1].id,
      code: 'IT-002',
      prefix: 'IT',
      revision: 'B',
      revision_date: '2024-02-20'
    }
  ];

  for (const doc of documents) {
    await db.run(`
      INSERT INTO documents (id, title, version, category_id, code, prefix, revision, revision_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ativo')
    `, [doc.id, doc.title, doc.version, doc.category_id, doc.code, doc.prefix, doc.revision, doc.revision_date]);
  }

  // 11. Inserir templates de email
  console.log('📋 Inserindo templates de email...');
  const emailTemplates = [
    {
      id: uuidv4(),
      name: 'Boas-vindas',
      subject: 'Bem-vindo ao MetroSaaS',
      body: `<h2>Bem-vindo ao MetroSaaS!</h2>
<p>Olá {{name}},</p>
<p>Sua conta foi criada com sucesso no sistema MetroSaaS.</p>
<p><strong>Credenciais de acesso:</strong></p>
<ul>
  <li><strong>Email:</strong> {{email}}</li>
  <li><strong>Senha temporária:</strong> {{password}}</li>
  <li><strong>Perfil:</strong> {{role}}</li>
</ul>
<p>Por favor, altere sua senha no primeiro acesso.</p>
<p>Atenciosamente,<br>Equipe MetroSaaS</p>`,
      variables: 'name,email,password,role',
      action: 'user_created'
    },
    {
      id: uuidv4(),
      name: 'Certificado Criado',
      subject: 'Novo certificado de calibração',
      body: `<h2>Certificado de Calibração Criado</h2>
<p>Olá {{client_name}},</p>
<p>Um novo certificado de calibração foi criado para seu equipamento.</p>
<p><strong>Detalhes:</strong></p>
<ul>
  <li><strong>Número do certificado:</strong> {{certificate_number}}</li>
  <li><strong>Equipamento:</strong> {{equipment_name}}</li>
  <li><strong>Data de vencimento:</strong> {{expiration_date}}</li>
</ul>
<p>Atenciosamente,<br>Equipe MetroSaaS</p>`,
      variables: 'client_name,certificate_number,equipment_name,expiration_date',
      action: 'certificate_created'
    },
    {
      id: uuidv4(),
      name: 'Certificado Vencendo',
      subject: 'Certificado de calibração vencendo',
      body: `<h2>Certificado Vencendo</h2>
<p>Olá {{client_name}},</p>
<p>Seu certificado de calibração está próximo do vencimento.</p>
<p><strong>Detalhes:</strong></p>
<ul>
  <li><strong>Número do certificado:</strong> {{certificate_number}}</li>
  <li><strong>Equipamento:</strong> {{equipment_name}}</li>
  <li><strong>Data de vencimento:</strong> {{expiration_date}}</li>
  <li><strong>Dias restantes:</strong> {{days_remaining}}</li>
</ul>
<p>Entre em contato conosco para agendar a recalibração.</p>
<p>Atenciosamente,<br>Equipe MetroSaaS</p>`,
      variables: 'client_name,certificate_number,equipment_name,expiration_date,days_remaining',
      action: 'certificate_expiring'
    },
    {
      id: uuidv4(),
      name: 'Reset de Senha',
      subject: 'Nova senha gerada',
      body: `<h2>Nova Senha Gerada</h2>
<p>Olá {{name}},</p>
<p>Uma nova senha foi gerada para sua conta.</p>
<p><strong>Nova senha:</strong> {{new_password}}</p>
<p>Por favor, altere esta senha no próximo acesso.</p>
<p>Atenciosamente,<br>Equipe MetroSaaS</p>`,
      variables: 'name,new_password',
      action: 'password_reset'
    },
    {
      id: uuidv4(),
      name: 'Agendamento Criado',
      subject: 'Novo agendamento de calibração',
      body: `<h2>Agendamento de Calibração</h2>
<p>Olá {{client_name}},</p>
<p>Um novo agendamento foi criado para calibração do seu equipamento.</p>
<p><strong>Detalhes:</strong></p>
<ul>
  <li><strong>Data:</strong> {{scheduled_date}}</li>
  <li><strong>Equipamento:</strong> {{equipment_name}}</li>
  <li><strong>Tipo de serviço:</strong> {{service_type}}</li>
  <li><strong>Local:</strong> {{location}}</li>
</ul>
<p>Atenciosamente,<br>Equipe MetroSaaS</p>`,
      variables: 'client_name,scheduled_date,equipment_name,service_type,location',
      action: 'appointment_created'
    }
  ];

  for (const template of emailTemplates) {
    await db.run(`
      INSERT INTO email_templates (id, name, subject, body, variables, action, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [template.id, template.name, template.subject, template.body, template.variables, template.action]);
  }

  console.log('✅ Dados iniciais inseridos com sucesso!');
  console.log('\n👥 Usuários criados:');
  console.log(`- Admin: admin@metrosass.com / admin123`);
  console.log(`- Técnico: tecnico@metrosass.com / tech123`);

} catch (error) {
  console.error('❌ Erro ao inserir dados iniciais:', error);
} finally {
  await db.close();
}