const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../server/database/database.db');
const dbDir = path.dirname(dbPath);

// Criar diretório se não existir
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Executar migrações
db.serialize(() => {
  // Tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'usuario',
      status TEXT DEFAULT 'ativo',
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de módulos de permissões
  db.run(`
    CREATE TABLE IF NOT EXISTS permission_modules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de permissões
  db.run(`
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      code TEXT UNIQUE NOT NULL,
      module_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (module_id) REFERENCES permission_modules(id)
    )
  `);

  // Tabela de permissões de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      user_id TEXT,
      permission_id TEXT,
      granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, permission_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )
  `);

  // Tabela de clientes
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cnpj TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      status TEXT DEFAULT 'ativo',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de grandezas
  db.run(`
    CREATE TABLE IF NOT EXISTS grandezas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de tipos de equipamentos
  db.run(`
    CREATE TABLE IF NOT EXISTS equipment_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      grandeza TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de marcas
  db.run(`
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      equipment_type_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id)
    )
  `);

  // Tabela de modelos
  db.run(`
    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      brand_id TEXT,
      equipment_type_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id)
    )
  `);

  // Tabela de equipamentos de clientes
  db.run(`
    CREATE TABLE IF NOT EXISTS client_equipment (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      type_id TEXT NOT NULL,
      brand_id TEXT,
      model_id TEXT,
      name TEXT NOT NULL,
      identificacao TEXT,
      serial_number TEXT,
      scales TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (type_id) REFERENCES equipment_types(id),
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (model_id) REFERENCES models(id)
    )
  `);

  // Tabela de padrões
  db.run(`
    CREATE TABLE IF NOT EXISTS standards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type_id TEXT NOT NULL,
      brand_id TEXT,
      model_id TEXT,
      identificacao TEXT,
      serial_number TEXT,
      certificate_number TEXT,
      scales TEXT,
      certificate_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (type_id) REFERENCES equipment_types(id),
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (model_id) REFERENCES models(id)
    )
  `);

  // Tabela de calibrações
  db.run(`
    CREATE TABLE IF NOT EXISTS calibrations (
      id TEXT PRIMARY KEY,
      equipment_id TEXT NOT NULL,
      technician_id TEXT NOT NULL,
      standards_used TEXT,
      environmental_conditions TEXT,
      measurement_points TEXT,
      observations TEXT,
      status TEXT DEFAULT 'em_andamento',
      signature_data TEXT,
      signed_by TEXT,
      signed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES client_equipment(id),
      FOREIGN KEY (technician_id) REFERENCES users(id),
      FOREIGN KEY (signed_by) REFERENCES users(id)
    )
  `);

  // Tabela de layouts
  db.run(`
    CREATE TABLE IF NOT EXISTS layouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      design_data TEXT,
      is_default INTEGER DEFAULT 0,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Tabela de templates de email
  db.run(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      variables TEXT,
      status TEXT DEFAULT 'ativo',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de ações de email
  db.run(`
    CREATE TABLE IF NOT EXISTS email_actions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de vinculação template-ação
  db.run(`
    CREATE TABLE IF NOT EXISTS email_action_templates (
      action_id TEXT,
      template_id TEXT,
      PRIMARY KEY (action_id, template_id),
      FOREIGN KEY (action_id) REFERENCES email_actions(id),
      FOREIGN KEY (template_id) REFERENCES email_templates(id)
    )
  `);

  // Inserir dados iniciais
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  // Usuário admin padrão
  const adminId = uuidv4();
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  
  db.run(`
    INSERT OR IGNORE INTO users (id, name, email, password, role, status)
    VALUES (?, 'Administrador', 'admin@metrosass.com', ?, 'admin', 'ativo')
  `, [adminId, hashedPassword]);

  // Módulos de permissões
  const modules = [
    { id: uuidv4(), name: 'Gestão', description: 'Módulo de gestão de usuários e clientes' },
    { id: uuidv4(), name: 'Certificação', description: 'Módulo de certificados e calibrações' },
    { id: uuidv4(), name: 'Documentação', description: 'Módulo de documentos e padrões' },
    { id: uuidv4(), name: 'Qualidade', description: 'Módulo de qualidade e não conformidades' },
    { id: uuidv4(), name: 'Sistema', description: 'Configurações e administração do sistema' }
  ];

  modules.forEach(module => {
    db.run(`
      INSERT OR IGNORE INTO permission_modules (id, name, description)
      VALUES (?, ?, ?)
    `, [module.id, module.name, module.description]);
  });

  // Permissões básicas
  const permissions = [
    // Gestão
    { name: 'Visualizar Clientes', code: 'clients.view', module: 'Gestão' },
    { name: 'Criar Clientes', code: 'clients.create', module: 'Gestão' },
    { name: 'Editar Clientes', code: 'clients.edit', module: 'Gestão' },
    { name: 'Deletar Clientes', code: 'clients.delete', module: 'Gestão' },
    { name: 'Gerenciar Usuários', code: 'users.manage', module: 'Gestão' },
    { name: 'Gerenciar Permissões', code: 'permissions.manage', module: 'Gestão' },
    
    // Certificação
    { name: 'Visualizar Certificados', code: 'certificates.view', module: 'Certificação' },
    { name: 'Criar Certificados', code: 'certificates.create', module: 'Certificação' },
    { name: 'Editar Certificados', code: 'certificates.edit', module: 'Certificação' },
    { name: 'Realizar Calibrações', code: 'calibrations.perform', module: 'Certificação' },
    { name: 'Assinar Calibrações', code: 'calibrations.sign', module: 'Certificação' },
    
    // Documentação
    { name: 'Visualizar Documentos', code: 'documents.view', module: 'Documentação' },
    { name: 'Criar Documentos', code: 'documents.create', module: 'Documentação' },
    { name: 'Gerenciar Padrões', code: 'standards.manage', module: 'Documentação' },
    
    // Sistema
    { name: 'Configurações do Sistema', code: 'system.settings', module: 'Sistema' },
    { name: 'Backup e Restauração', code: 'system.backup', module: 'Sistema' },
    { name: 'Designer de Layouts', code: 'layouts.design', module: 'Sistema' }
  ];

  permissions.forEach(perm => {
    const moduleId = modules.find(m => m.name === perm.module)?.id;
    if (moduleId) {
      db.run(`
        INSERT OR IGNORE INTO permissions (id, name, code, description, module_id)
        VALUES (?, ?, ?, ?, ?)
      `, [uuidv4(), perm.name, perm.code, perm.name, moduleId]);
    }
  });

  // Ações de email
  const emailActions = [
    { name: 'Reset de Senha', code: 'password_reset', description: 'Envio de nova senha por email' },
    { name: 'Certificado Criado', code: 'certificate_created', description: 'Notificação de novo certificado' },
    { name: 'Certificado Vencendo', code: 'certificate_expiring', description: 'Alerta de vencimento' },
    { name: 'Calibração Concluída', code: 'calibration_completed', description: 'Notificação de calibração finalizada' }
  ];

  emailActions.forEach(action => {
    db.run(`
      INSERT OR IGNORE INTO email_actions (id, name, code, description)
      VALUES (?, ?, ?, ?)
    `, [uuidv4(), action.name, action.code, action.description]);
  });

  console.log('Migrações executadas com sucesso!');
});

db.close();