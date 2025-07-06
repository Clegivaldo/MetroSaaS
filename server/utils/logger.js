import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  writeLog(level, message, details = null) {
    const timestamp = this.getTimestamp();
    const logEntry = {
      timestamp,
      level,
      message,
      details: details ? JSON.stringify(details, null, 2) : null
    };

    const logFile = path.join(this.logDir, `${level}.log`);
    const logLine = `[${timestamp}] ${level.toUpperCase()}: ${message}${details ? '\n' + JSON.stringify(details, null, 2) : ''}\n`;

    fs.appendFileSync(logFile, logLine);
    
    // Também log no console
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (details) {
      console.log('Details:', details);
    }
  }

  info(message, details = null) {
    this.writeLog('info', message, details);
  }

  error(message, details = null) {
    this.writeLog('error', message, details);
  }

  warn(message, details = null) {
    this.writeLog('warn', message, details);
  }

  debug(message, details = null) {
    this.writeLog('debug', message, details);
  }

  // Log específico para erros de API
  apiError(method, url, error, requestBody = null, userId = null) {
    this.error(`API Error: ${method} ${url}`, {
      method,
      url,
      error: error.message,
      stack: error.stack,
      requestBody,
      userId,
      timestamp: this.getTimestamp()
    });
  }

  // Log específico para erros de banco de dados
  dbError(operation, table, error, query = null, params = null) {
    this.error(`Database Error: ${operation} on ${table}`, {
      operation,
      table,
      error: error.message,
      query,
      params,
      timestamp: this.getTimestamp()
    });
  }

  // Log para auditoria
  audit(userId, action, table, recordId, oldValues = null, newValues = null) {
    this.info(`Audit: ${action} on ${table}`, {
      userId,
      action,
      table,
      recordId,
      oldValues,
      newValues,
      timestamp: this.getTimestamp()
    });
  }
}

export default new Logger(); 