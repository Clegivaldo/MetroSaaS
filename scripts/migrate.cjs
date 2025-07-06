const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'server', 'database', 'database.db');

// Create database with optimized settings for memory usage
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar com o banco de dados:', err);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite');
});

// Optimize SQLite for better memory usage
db.serialize(() => {
  // Set pragmas for better memory management
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA synchronous = NORMAL');
  db.run('PRAGMA cache_size = 1000');
  db.run('PRAGMA temp_store = MEMORY');
  db.run('PRAGMA mmap_size = 268435456'); // 256MB

  // Create tables with smaller initial size and better constraints
  const tables = [
    {
      name: 'users',
      sql: `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      name: 'clients',
      sql: `CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cnpj TEXT UNIQUE,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      name: 'equipment_types',
      sql: `CREATE TABLE IF NOT EXISTS equipment_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      name: 'client_equipment',
      sql: `CREATE TABLE IF NOT EXISTS client_equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        equipment_type_id INTEGER NOT NULL,
        serial_number TEXT,
        model TEXT,
        manufacturer TEXT,
        calibration_interval INTEGER DEFAULT 12,
        last_calibration DATE,
        next_calibration DATE,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients (id),
        FOREIGN KEY (equipment_type_id) REFERENCES equipment_types (id)
      )`
    },
    {
      name: 'grandezas',
      sql: `CREATE TABLE IF NOT EXISTS grandezas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        unit TEXT NOT NULL,
        symbol TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      name: 'standard_types',
      sql: `CREATE TABLE IF NOT EXISTS standard_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      name: 'standards',
      sql: `CREATE TABLE IF NOT EXISTS standards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        serial_number TEXT UNIQUE,
        manufacturer TEXT,
        model TEXT,
        standard_type_id INTEGER,
        grandeza_id INTEGER,
        range_min REAL,
        range_max REAL,
        uncertainty REAL,
        calibration_interval INTEGER DEFAULT 12,
        last_calibration DATE,
        next_calibration DATE,
        certificate_path TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (standard_type_id) REFERENCES standard_types (id),
        FOREIGN KEY (grandeza_id) REFERENCES grandezas (id)
      )`
    },
    {
      name: 'calibrations',
      sql: `CREATE TABLE IF NOT EXISTS calibrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER NOT NULL,
        standard_id INTEGER,
        calibration_date DATE NOT NULL,
        next_calibration DATE,
        temperature REAL,
        humidity REAL,
        observations TEXT,
        certificate_number TEXT,
        certificate_path TEXT,
        status TEXT DEFAULT 'completed',
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES client_equipment (id),
        FOREIGN KEY (standard_id) REFERENCES standards (id),
        FOREIGN KEY (created_by) REFERENCES users (id)
      )`
    },
    {
      name: 'appointments',
      sql: `CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        equipment_id INTEGER,
        scheduled_date DATETIME NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'scheduled',
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients (id),
        FOREIGN KEY (equipment_id) REFERENCES client_equipment (id),
        FOREIGN KEY (created_by) REFERENCES users (id)
      )`
    },
    {
      name: 'certificates',
      sql: `CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        calibration_id INTEGER NOT NULL,
        certificate_number TEXT UNIQUE NOT NULL,
        issue_date DATE NOT NULL,
        file_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (calibration_id) REFERENCES calibrations (id)
      )`
    },
    {
      name: 'documents',
      sql: `CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        file_path TEXT,
        uploaded_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users (id)
      )`
    },
    {
      name: 'suppliers',
      sql: `CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cnpj TEXT UNIQUE,
        email TEXT,
        phone TEXT,
        address TEXT,
        services TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      name: 'trainings',
      sql: `CREATE TABLE IF NOT EXISTS trainings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        duration INTEGER,
        instructor TEXT,
        max_participants INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      name: 'user_trainings',
      sql: `CREATE TABLE IF NOT EXISTS user_trainings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        training_id INTEGER NOT NULL,
        completion_date DATE,
        status TEXT DEFAULT 'enrolled',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (training_id) REFERENCES trainings (id)
      )`
    },
    {
      name: 'activities',
      sql: `CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`
    },
    {
      name: 'maintenance',
      sql: `CREATE TABLE IF NOT EXISTS maintenance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER,
        standard_id INTEGER,
        type TEXT NOT NULL,
        description TEXT,
        scheduled_date DATE,
        completed_date DATE,
        cost REAL,
        supplier_id INTEGER,
        status TEXT DEFAULT 'scheduled',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES client_equipment (id),
        FOREIGN KEY (standard_id) REFERENCES standards (id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
      )`
    },
    {
      name: 'non_conformities',
      sql: `CREATE TABLE IF NOT EXISTS non_conformities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        calibration_id INTEGER,
        equipment_id INTEGER,
        description TEXT NOT NULL,
        severity TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'open',
        corrective_action TEXT,
        responsible_user INTEGER,
        due_date DATE,
        closed_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (calibration_id) REFERENCES calibrations (id),
        FOREIGN KEY (equipment_id) REFERENCES client_equipment (id),
        FOREIGN KEY (responsible_user) REFERENCES users (id)
      )`
    },
    {
      name: 'notifications',
      sql: `CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        read_status INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`
    },
    {
      name: 'user_permissions',
      sql: `CREATE TABLE IF NOT EXISTS user_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        permission TEXT NOT NULL,
        granted_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (granted_by) REFERENCES users (id)
      )`
    },
    {
      name: 'document_categories',
      sql: `CREATE TABLE IF NOT EXISTS document_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      name: 'layouts',
      sql: `CREATE TABLE IF NOT EXISTS layouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        config TEXT NOT NULL,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )`
    }
  ];

  // Create tables one by one with error handling
  let tableIndex = 0;
  
  function createNextTable() {
    if (tableIndex >= tables.length) {
      // All tables created, now insert initial data
      insertInitialData();
      return;
    }

    const table = tables[tableIndex];
    console.log(`Criando tabela ${table.name}...`);
    
    db.run(table.sql, (err) => {
      if (err) {
        console.error(`Erro ao criar tabela ${table.name}:`, err);
      } else {
        console.log(`Tabela ${table.name} criada com sucesso`);
      }
      tableIndex++;
      // Small delay to prevent memory issues
      setTimeout(createNextTable, 10);
    });
  }

  createNextTable();
});

function insertInitialData() {
  console.log('Inserindo dados iniciais...');
  
  // Check if admin user exists
  db.get('SELECT id FROM users WHERE email = ?', ['admin@metrosass.com'], async (err, user) => {
    if (err) {
      console.error('Erro ao verificar usuário admin:', err);
      return;
    }

    if (!user) {
      try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.run(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          ['Administrador', 'admin@metrosass.com', hashedPassword, 'admin'],
          (err) => {
            if (err) {
              console.error('Erro ao criar usuário admin:', err);
            } else {
              console.log('Usuário admin criado com sucesso');
            }
          }
        );
      } catch (error) {
        console.error('Erro ao criar hash da senha:', error);
      }
    }
  });

  // Insert basic grandezas with smaller batches
  const grandezas = [
    { name: 'Comprimento', unit: 'metro', symbol: 'm' },
    { name: 'Massa', unit: 'quilograma', symbol: 'kg' },
    { name: 'Tempo', unit: 'segundo', symbol: 's' },
    { name: 'Temperatura', unit: 'grau Celsius', symbol: '°C' },
    { name: 'Pressão', unit: 'pascal', symbol: 'Pa' }
  ];

  grandezas.forEach((grandeza, index) => {
    setTimeout(() => {
      db.run(
        'INSERT OR IGNORE INTO grandezas (name, unit, symbol) VALUES (?, ?, ?)',
        [grandeza.name, grandeza.unit, grandeza.symbol],
        (err) => {
          if (err) {
            console.error('Erro ao inserir grandeza:', err);
          }
        }
      );
    }, index * 50); // Stagger insertions
  });

  // Insert basic equipment types
  const equipmentTypes = [
    'Balança',
    'Termômetro',
    'Manômetro',
    'Multímetro',
    'Paquímetro'
  ];

  equipmentTypes.forEach((type, index) => {
    setTimeout(() => {
      db.run(
        'INSERT OR IGNORE INTO equipment_types (name) VALUES (?)',
        [type],
        (err) => {
          if (err) {
            console.error('Erro ao inserir tipo de equipamento:', err);
          }
        }
      );
    }, (index + grandezas.length) * 50);
  });

  // Insert basic standard types
  const standardTypes = [
    'Padrão Primário',
    'Padrão Secundário',
    'Padrão de Trabalho',
    'Padrão de Referência'
  ];

  standardTypes.forEach((type, index) => {
    setTimeout(() => {
      db.run(
        'INSERT OR IGNORE INTO standard_types (name) VALUES (?)',
        [type],
        (err) => {
          if (err) {
            console.error('Erro ao inserir tipo de padrão:', err);
          }
        }
      );
    }, (index + grandezas.length + equipmentTypes.length) * 50);
  });

  console.log('Migração concluída!');
  
  // Close database after a delay to ensure all operations complete
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error('Erro ao fechar o banco de dados:', err);
      } else {
        console.log('Conexão com o banco de dados fechada.');
      }
      process.exit(0);
    });
  }, 5000);
}