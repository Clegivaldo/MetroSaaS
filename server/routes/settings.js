import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getOne, getAll } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Obter todas as configurações
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const settings = await getAll('SELECT * FROM settings ORDER BY key');
    
    // Converter para objeto para facilitar o uso no frontend
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    res.json(settingsObj);
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar configurações
router.put('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      // Verificar se a configuração existe
      const existing = await getOne('SELECT * FROM settings WHERE key = ?', [key]);
      
      if (existing) {
        // Atualizar configuração existente
        await executeQuery(`
          UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?
        `, [value, key]);
      } else {
        // Criar nova configuração
        await executeQuery(`
          INSERT INTO settings (id, key, value, updated_at)
          VALUES (?, ?, ?, datetime('now'))
        `, [uuidv4(), key, value]);
      }
    }

    // Log de auditoria
    await executeQuery(`
      INSERT INTO audit_logs (id, user_id, action, table_name, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), req.user.id, 'UPDATE', 'settings', JSON.stringify(settings)]);

    res.json({ message: 'Configurações atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter configuração específica
router.get('/:key', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await getOne('SELECT * FROM settings WHERE key = ?', [key]);
    
    if (!setting) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }
    
    res.json(setting);
  } catch (error) {
    console.error('Erro ao obter configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Testar configuração SMTP
router.post('/test-smtp', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório para teste' });
    }

    // Importar o serviço de email dinamicamente para evitar problemas de inicialização
    const emailService = await import('../services/emailService.js');
    
    // Tentar enviar email de teste
    await emailService.default.sendTestEmail(email);
    
    res.json({ message: 'Email de teste enviado com sucesso' });
  } catch (error) {
    console.error('Erro ao testar SMTP:', error);
    res.status(500).json({ error: 'Erro ao enviar email de teste: ' + error.message });
  }
});

export default router;