import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';
import { authenticateToken, requireRole } from './middleware/auth.js';
import { getAll } from './database/connection.js';
import logger from './utils/logger.js';

// Routes
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import certificateRoutes from './routes/certificates.js';
import standardRoutes from './routes/standards.js';
import appointmentRoutes from './routes/appointments.js';
import documentsRoutes from './routes/documents.js';
import supplierRoutes from './routes/suppliers.js';
import trainingRoutes from './routes/trainings.js';
import userRoutes from './routes/users.js';
import settingsRoutes from './routes/settings.js';
import templateRoutes from './routes/templates.js';
import notificationRoutes from './routes/notifications.js';
import dashboardRoutes from './routes/dashboard.js';
import cnpjRoutes from './routes/cnpj.js';
import uploadRoutes from './routes/upload.js';
import maintenanceRoutes from './routes/maintenance.js';
import nonConformityRoutes from './routes/non-conformities.js';
import complaintRoutes from './routes/complaints.js';
import auditRoutes from './routes/audits.js';
import environmentalRoutes from './routes/environmental.js';
import testResultRoutes from './routes/test-results.js';
import quantitiesRoutes from './routes/grandezas.js';
import equipmentTypeRoutes from './routes/equipment-types.js';
import clientEquipmentRoutes from './routes/client-equipment.js';
import brandRoutes from './routes/brands.js';
import modelRoutes from './routes/models.js';
import emailTemplatesRoutes from './routes/email-templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de logging para todas as requisições
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Muitas tentativas. Tente novamente em 15 minutos.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  skipSuccessfulRequests: true
});

app.use(limiter);
app.use('/api/auth/login', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/standards', standardRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/document-categories', (req, res, next) => {
  req.url = '/categories' + req.url.replace(/^\/?/, '/');
  documentsRoutes(req, res, next);
});
app.use('/api/suppliers', supplierRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cnpj', cnpjRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/non-conformities', nonConformityRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/environmental', environmentalRoutes);
app.use('/api/test-results', testResultRoutes);
app.use('/api/quantities', quantitiesRoutes);
app.use('/api/grandezas', (req, res, next) => {
  req.url = req.url.replace(/^\/?/, '/');
  quantitiesRoutes(req, res, next);
});
app.use('/api/equipment-types', equipmentTypeRoutes);
app.use('/api/client-equipment', clientEquipmentRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/email-templates', emailTemplatesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rota para permissões de usuários
app.get('/api/users/permissions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const permissions = await getAll('SELECT * FROM permissions ORDER BY module, name');
    res.json(permissions);
  } catch (error) {
    console.error('Erro ao obter permissões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware de tratamento de rotas não encontradas
app.use('*', (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info(`📊 Dashboard: http://localhost:5173`);
  logger.info(`🔧 API: http://localhost:${PORT}/api`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack
  });
  process.exit(1);
});