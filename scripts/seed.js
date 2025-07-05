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
      </div>`,
      '["email", "new_password", "system_name"]',
      'ativo'
    ],
    [
      'template-2',
      'certificate_created',
      'Certificado Emitido',
      'Certificado de Calibração Emitido - {{certificate_number}}',
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Certificado de Calibração Emitido</h2>
        <p>Prezado(a) {{client_name}},</p>
        <p>Informamos que o certificado de calibração foi emitido com sucesso:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Número do Certificado:</strong> {{certificate_number}}</p>
          <p><strong>Equipamento:</strong> {{equipment_name}}</p>
          <p><strong>Validade:</strong> {{expiration_date}}</p>
        </div>
        <p>O certificado está disponível para download em nosso sistema.</p>
      </div>`,
      '["client_name", "certificate_number", "equipment_name", "expiration_date"]',
      'ativo'
    ],
    [
      'template-3',
      'certificate_expiring',
      'Certificados Vencendo',
      'Certificados próximos ao vencimento - {{system_name}}',
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Certificados Próximos ao Vencimento</h2>
        <p>Os seguintes certificados estão próximos ao vencimento:</p>
        <ul>{{certificates_list}}</ul>
        <p>Entre em contato para agendar a recalibração.</p>
      </div>`,
      '["certificates_list", "system_name"]',
      'ativo'
    ],
    [
      'template-4',
      'welcome',
      'Bem-vindo ao Sistema',
      'Bem-vindo ao {{system_name}}',
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Bem-vindo ao {{system_name}}</h2>
        <p>Olá {{user_name}},</p>
        <p>Sua conta foi criada com sucesso no sistema {{system_name}}.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Email:</strong> {{email}}</p>
          <p><strong>Perfil:</strong> {{role}}</p>
          <p><strong>Senha Temporária:</strong> {{password}}</p>
        </div>
        <p>Por favor, faça login e altere sua senha.</p>
      </div>`,
      '["user_name", "email", "role", "password", "system_name"]',
      'ativo'
    ]
  ];

  for (const t of emailTemplates) {
    await db.run(
      `INSERT OR IGNORE INTO email_templates (id, template_key, name, subject, content, variables, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      t
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