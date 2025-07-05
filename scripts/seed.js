import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../server/database/database.db');
const dataDir = dirname(dbPath);

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Create empty db file if not exists
if (!existsSync(dbPath)) {
  writeFileSync(dbPath, '');
  console.log('✅ Created empty database file');
}

const db = await open({
  filename: dbPath,
  driver: sqlite3.Database
});

console.log('Inserindo dados iniciais...');

try {
  // Usuário admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await db.run(
    `INSERT OR IGNORE INTO users (id, email, password_hash, name, role, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['admin-1', 'admin@metrosass.com', adminPassword, 'Administrador', 'admin', 'ativo']
  );

  // Técnico
  const techPassword = await bcrypt.hash('tech123', 10);
  await db.run(
    `INSERT OR IGNORE INTO users (id, email, password_hash, name, role, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['tech-1', 'tecnico@metrosass.com', techPassword, 'João Silva', 'tecnico', 'ativo']
  );

  // Configurações padrão
  const defaultSettings = [
    ['smtp-host', 'smtp_host', '', 'Servidor SMTP'],
    ['smtp-port', 'smtp_port', '587', 'Porta do servidor SMTP'],
    ['smtp-user', 'smtp_user', '', 'Usuário SMTP'],
    ['smtp-pass', 'smtp_password', '', 'Senha SMTP'],
    ['smtp-from', 'smtp_from_email', '', 'Email remetente'],
    ['smtp-name', 'smtp_from_name', 'Sistema MetroSaaS', 'Nome do remetente'],
    ['lab-name', 'laboratory_name', '', 'Nome do laboratório'],
    ['lab-cnpj', 'laboratory_cnpj', '', 'CNPJ do laboratório'],
    ['lab-address', 'laboratory_address', '', 'Endereço do laboratório'],
    ['lab-accreditation', 'iso17025_accreditation', '', 'Número da acreditação ISO 17025'],
  ];

  for (const [id, key, value, description] of defaultSettings) {
    await db.run(
      `INSERT OR IGNORE INTO settings (id, key, value, description)
       VALUES (?, ?, ?, ?)`,
      [id, key, value, description]
    );
  }

  // Templates de email
  const emailTemplates = [
    [
      'template-1',
      'password_reset',
      'Reset de Senha',
      'Nova senha - {{system_name}}',
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Nova Senha Gerada</h2>
        <p>Olá,</p>
        <p>Uma nova senha foi gerada para sua conta no sistema {{system_name}}.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Email:</strong> {{email}}</p>
          <p><strong>Nova Senha:</strong> {{new_password}}</p>
        </div>
        <p>Por favor, faça login e altere sua senha imediatamente.</p>
        <p>Se você não solicitou esta alteração, entre em contato conosco imediatamente.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          Este é um email automático, não responda.
        </p>
      </div>`,
      '["email", "new_password", "system_name"]',
      'ativo'
    ],
    // ... os demais templates aqui
  ];

  for (const t of emailTemplates) {
    await db.run(
      `INSERT OR IGNORE INTO email_templates (id, template_key, name, subject, content, variables, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      t
    );
  }

  // Clientes de exemplo
  const sampleClients = [
    ['client-1', 'Empresa ABC Ltda', '12.345.678/0001-90', 'contato@empresaabc.com.br', '(11) 9999-9999', 'São Paulo', 'SP', 'ativo'],
    ['client-2', 'Indústria XYZ S.A.', '98.765.432/0001-10', 'laboratorio@industriaxyz.com.br', '(21) 8888-8888', 'Rio de Janeiro', 'RJ', 'ativo'],
  ];

  for (const c of sampleClients) {
    await db.run(
      `INSERT OR IGNORE INTO clients (id, name, cnpj, email, phone, city, state, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      c
    );
  }

  // Padrões de exemplo
  const sampleStandards = [
    ['std-1', 'Padrão de Massa 1kg', 'PM-001', 'Massa', '2024-01-15', '2025-01-15', 'valido'],
    ['std-2', 'Termômetro Padrão', 'TP-002', 'Temperatura', '2023-12-10', '2024-12-10', 'prestes_vencer'],
  ];

  for (const s of sampleStandards) {
    await db.run(
      `INSERT OR IGNORE INTO standards (id, name, serial_number, type, calibration_date, expiration_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      s
    );
  }

  // Treinamentos
  const sampleTrainings = [
    ['train-1', 'Introdução à ISO 17025', 'Fundamentos da norma ISO 17025 para laboratórios', 'https://www.youtube.com/watch?v=example1', 60, 'Qualidade', '["admin", "tecnico"]', 'ativo'],
    ['train-2', 'Calibração de Instrumentos', 'Procedimentos para calibração de instrumentos de medição', 'https://www.youtube.com/watch?v=example2', 90, 'Técnico', '["tecnico"]', 'ativo'],
  ];

  for (const t of sampleTrainings) {
    await db.run(
      `INSERT OR IGNORE INTO trainings (id, title, description, youtube_url, duration, category, required_for, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      t
    );
  }

  // Fornecedores
  const sampleSuppliers = [
    ['supplier-1', 'Fornecedor de Padrões Ltda', '11.222.333/0001-44', 'vendas@padroes.com.br', '(11) 1111-1111', 'São Paulo', 'SP', 'padroes', 'ativo'],
    ['supplier-2', 'Serviços de Calibração S.A.', '55.666.777/0001-88', 'contato@calibracao.com.br', '(21) 2222-2222', 'Rio de Janeiro', 'RJ', 'servicos', 'ativo'],
  ];

  for (const s of sampleSuppliers) {
    await db.run(
      `INSERT OR IGNORE INTO suppliers (id, name, cnpj, email, phone, city, state, type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      s
    );
  }

  console.log('Dados iniciais inseridos com sucesso!');
  console.log('Usuários criados:');
  console.log('- Admin: admin@metrosass.com / admin123');
  console.log('- Técnico: tecnico@metrosass.com / tech123');

} catch (error) {
  console.error('Erro ao inserir dados iniciais:', error);
} finally {
  await db.close();
}
