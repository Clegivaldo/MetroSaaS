import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
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

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS users (
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
  `
  CREATE TABLE IF NOT EXISTS clients (
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
  `
  CREATE TABLE IF NOT EXISTS standards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    serial_number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    manufacturer TEXT,
    model TEXT,
    calibration_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    status TEXT CHECK(status IN ('valido', 'vencido', 'prestes_vencer')) NOT NULL,
    certificate_path TEXT,
    uncertainty TEXT,
    range_min REAL,
    range_max REAL,
    unit TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    name TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    manufacturer TEXT,
    model TEXT,
    type TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    equipment_id TEXT NOT NULL,
    certificate_number TEXT UNIQUE NOT NULL,
    calibration_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    status TEXT CHECK(status IN ('valido', 'vencido', 'prestes_vencer')) NOT NULL,
    pdf_path TEXT,
    technician_id TEXT,
    observations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS certificate_history (
    id TEXT PRIMARY KEY,
    certificate_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    pdf_path TEXT NOT NULL,
    calibration_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    technician_id TEXT,
    observations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS standard_history (
    id TEXT PRIMARY KEY,
    standard_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    certificate_path TEXT NOT NULL,
    calibration_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (standard_id) REFERENCES standards(id) ON DELETE CASCADE
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS appointments (
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
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
    FOREIGN KEY (technician_id) REFERENCES users(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS suppliers (
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
  `
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    version TEXT NOT NULL,
    file_path TEXT,
    status TEXT CHECK(status IN ('ativo', 'obsoleto', 'em_revisao')) DEFAULT 'ativo',
    approved_by TEXT,
    approval_date DATE,
    review_date DATE,
    next_review_date DATE,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (approved_by) REFERENCES users(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS trainings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    youtube_url TEXT,
    duration INTEGER,
    category TEXT NOT NULL,
    required_for TEXT NOT NULL,
    status TEXT CHECK(status IN ('ativo', 'inativo')) DEFAULT 'ativo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS training_participations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    training_id TEXT NOT NULL,
    completed_at DATETIME,
    score INTEGER,
    status TEXT CHECK(status IN ('em_andamento', 'concluido', 'reprovado')) DEFAULT 'em_andamento',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE,
    UNIQUE(user_id, training_id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS email_templates (
    id TEXT PRIMARY KEY,
    template_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    variables TEXT,
    status TEXT CHECK(status IN ('ativo', 'inativo')) DEFAULT 'ativo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_used TEXT,
    status TEXT CHECK(status IN ('sent', 'failed')) NOT NULL,
    error_message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK(type IN ('info', 'warning', 'error', 'success')) DEFAULT 'info',
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  `
];

console.log('Executando migrações...');

try {
  for (let i = 0; i < migrations.length; i++) {
    console.log(`Executando migração ${i + 1}...`);
    await db.exec(migrations[i]);
  }
  console.log('Migrações executadas com sucesso!');
} catch (error) {
  console.error('Erro ao executar migrações:', error);
} finally {
  await db.close();
}