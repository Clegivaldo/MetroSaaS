import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { unlinkSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../server/database/database.db');

console.log('🔄 Resetando banco de dados...');

// Deletar banco existente
if (existsSync(dbPath)) {
  try {
    unlinkSync(dbPath);
    console.log('✅ Banco de dados anterior deletado');
  } catch (error) {
    console.log('⚠️ Erro ao deletar banco anterior:', error.message);
  }
}

const db = await open({
  filename: dbPath,
  driver: sqlite3.Database
});

console.log('📊 Criando nova estrutura do banco...');

const migrations = [
  // 1. Tabela de usuários
  `
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'tecnico', 'cliente')) NOT NULL,
    status TEXT CHECK(status IN ('ativo', 'inativo')) DEFAULT 'ativo',
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME NULL,
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // 2. Tabela de clientes
  `
  CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    status TEXT CHECK(status IN ('ativo', 'inativo')) DEFAULT 'ativo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // 3. Tabela de fornecedores
  `
  CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    type TEXT NOT NULL,
    status TEXT CHECK(status IN ('ativo', 'inativo')) DEFAULT 'ativo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // 4. Tabela de permissões
  `
  CREATE TABLE permissions (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    module TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // 5. Tabela de permissões de usuários
  `
  CREATE TABLE user_permissions (
    user_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    granted BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, permission_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
  );
  `,

  // 6. Tabela de tipos de padrões
  `
  CREATE TABLE standard_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // 7. Tabela de padrões (estrutura definitiva)
  `
  CREATE TABLE standards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    identificacao TEXT,
    serial_number TEXT,
    type_id TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    manufacturer TEXT,
    certificate_number TEXT,
    calibration_date DATE,
    expiration_date DATE,
    status TEXT CHECK(status IN ('valido', 'vencido', 'prestes_vencer')) DEFAULT 'valido',
    certificate_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (type_id) REFERENCES standard_types(id)
  );
  `,

  // 8. Tabela de equipamentos de clientes (estrutura definitiva)
  `
  CREATE TABLE client_equipment (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    identificacao TEXT,
    serial_number TEXT,
    type_id TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    manufacturer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (type_id) REFERENCES standard_types(id)
  );
  `,

  // 9. Tabela de escalas de equipamentos
  `
  CREATE TABLE equipment_scales (
    id TEXT PRIMARY KEY,
    equipment_id TEXT NOT NULL,
    equipment_type TEXT NOT NULL,
    scale_name TEXT NOT NULL,
    scale_min REAL,
    scale_max REAL,
    unit TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES standards(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES client_equipment(id) ON DELETE CASCADE
  );
  `,

  // 10. Tabela de certificados
  `
  CREATE TABLE certificates (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    equipment_id TEXT NOT NULL,
    certificate_number TEXT NOT NULL,
    calibration_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    status TEXT CHECK(status IN ('valido', 'vencido', 'prestes_vencer')) NOT NULL,
    pdf_path TEXT,
    observations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES client_equipment(id) ON DELETE CASCADE
  );
  `,

  // 11. Tabela de categorias de documentos
  `
  CREATE TABLE document_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sigla TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // 12. Tabela de documentos (estrutura definitiva)
  `
  CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    version TEXT NOT NULL,
    file_path TEXT,
    status TEXT CHECK(status IN ('ativo', 'obsoleto', 'em_revisao')) DEFAULT 'ativo',
    approved_by TEXT,
    approval_date DATE,
    review_date DATE,
    next_review_date DATE,
    category_id TEXT,
    code TEXT,
    prefix TEXT,
    revision TEXT,
    revision_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES document_categories(id)
  );
  `,

  // 13. Tabela de agendamentos
  `
  CREATE TABLE appointments (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    equipment_id TEXT,
    scheduled_date DATETIME NOT NULL,
    status TEXT CHECK(status IN ('agendado', 'em_andamento', 'concluido', 'cancelado')) DEFAULT 'agendado',
    service_type TEXT NOT NULL,
    description TEXT,
    technician_id TEXT,
    location TEXT,
    estimated_duration INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES client_equipment(id) ON DELETE SET NULL,
    FOREIGN KEY (technician_id) REFERENCES users(id)
  );
  `,

  // 14. Tabela de treinamentos
  `
  CREATE TABLE trainings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    youtube_url TEXT,
    duration INTEGER,
    type TEXT CHECK(type IN ('iso', 'sistema')) NOT NULL,
    status TEXT CHECK(status IN ('ativo', 'inativo')) DEFAULT 'ativo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // 15. Tabela de grandezas
  `
  CREATE TABLE quantities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    unit TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // 16. Tabela de tipos de equipamentos
  `
  CREATE TABLE equipment_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    quantity_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quantity_id) REFERENCES quantities(id)
  );
  `,

  // 17. Tabela de marcas
  `
  CREATE TABLE brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // 18. Tabela de modelos
  `
  CREATE TABLE models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
  );
  `,

  // 19. Tabela de logs de auditoria
  `
  CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  `,

  // 20. Tabela de migrações
  `
  CREATE TABLE migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // 21. Tabela de configurações do sistema
  `
  CREATE TABLE settings (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // 22. Tabela de notificações
  `
  CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    read INTEGER DEFAULT 0,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  `
];

try {
  console.log('🔄 Executando migrações...');
  
  for (let i = 0; i < migrations.length; i++) {
    console.log(`📋 Executando migração ${i + 1}...`);
    await db.exec(migrations[i]);
  }
  
  console.log('✅ Banco de dados criado com sucesso!');
  console.log('📊 Estrutura definitiva aplicada');
  
} catch (error) {
  console.error('❌ Erro ao criar banco de dados:', error);
} finally {
  await db.close();
} 