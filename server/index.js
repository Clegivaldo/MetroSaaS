const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});
app.use(limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/permissions', require('./routes/permissions'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/standards', require('./routes/standards'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/calibrations', require('./routes/calibrations'));
app.use('/api/layouts', require('./routes/layouts'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/email-templates', require('./routes/email-templates'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/upload', require('./routes/upload'));

// Criar diretórios necessários
const dirs = [
  'uploads/certificates',
  'uploads/standards', 
  'uploads/documents',
  'uploads/signatures',
  'uploads/layouts',
  'uploads/profiles',
  'backups'
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});