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

// Obter configurações de segurança
router.get('/security/policies', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const policies = await getAll(`
      SELECT * FROM settings 
      WHERE key LIKE 'security_%' OR key LIKE 'password_%' OR key LIKE 'login_%'
      ORDER BY key
    `);
    
    const policiesObj = {};
    policies.forEach(policy => {
      policiesObj[policy.key] = policy.value;
    });
    
    res.json(policiesObj);
  } catch (error) {
    console.error('Erro ao obter políticas de segurança:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar configurações de segurança
router.put('/security/policies', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const policies = req.body;

    for (const [key, value] of Object.entries(policies)) {
      const existing = await getOne('SELECT * FROM settings WHERE key = ?', [key]);
      
      if (existing) {
        await executeQuery(`
          UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?
        `, [value, key]);
      } else {
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
    `, [uuidv4(), req.user.id, 'UPDATE', 'security_policies', JSON.stringify(policies)]);

    res.json({ message: 'Políticas de segurança atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar políticas de segurança:', error);
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

// Obter configurações de email por ação
router.get('/email/actions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const emailActions = await getAll(`
      SELECT * FROM settings 
      WHERE key LIKE 'email_action_%'
      ORDER BY key
    `);
    
    const actionsObj = {};
    emailActions.forEach(action => {
      actionsObj[action.key] = action.value;
    });
    
    res.json(actionsObj);
  } catch (error) {
    console.error('Erro ao obter configurações de email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar configurações de email por ação
router.put('/email/actions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const emailActions = req.body;

    for (const [key, value] of Object.entries(emailActions)) {
      const existing = await getOne('SELECT * FROM settings WHERE key = ?', [key]);
      
      if (existing) {
        await executeQuery(`
          UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?
        `, [value, key]);
      } else {
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
    `, [uuidv4(), req.user.id, 'UPDATE', 'email_actions', JSON.stringify(emailActions)]);

    res.json({ message: 'Configurações de email atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configurações de email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter lista de ações disponíveis
router.get('/email/available-actions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const availableActions = [
      {
        key: 'email_action_user_welcome',
        name: 'Boas-vindas do Usuário',
        description: 'Enviado quando um novo usuário é criado'
      },
      {
        key: 'email_action_password_reset',
        name: 'Reset de Senha',
        description: 'Enviado quando a senha é resetada'
      },
      {
        key: 'email_action_certificate_ready',
        name: 'Certificado Pronto',
        description: 'Enviado quando um certificado está pronto'
      },
      {
        key: 'email_action_appointment_reminder',
        name: 'Lembrete de Agendamento',
        description: 'Enviado antes de um agendamento'
      },
      {
        key: 'email_action_test_result',
        name: 'Resultado de Teste',
        description: 'Enviado quando um resultado de teste está disponível'
      },
      {
        key: 'email_action_maintenance_due',
        name: 'Manutenção Devida',
        description: 'Enviado quando equipamento precisa de manutenção'
      },
      {
        key: 'email_action_calibration_due',
        name: 'Calibração Devida',
        description: 'Enviado quando equipamento precisa de calibração'
      },
      {
        key: 'email_action_non_conformity',
        name: 'Não Conformidade',
        description: 'Enviado quando uma não conformidade é registrada'
      },
      {
        key: 'email_action_complaint_received',
        name: 'Reclamação Recebida',
        description: 'Enviado quando uma reclamação é recebida'
      },
      {
        key: 'email_action_audit_scheduled',
        name: 'Auditoria Agendada',
        description: 'Enviado quando uma auditoria é agendada'
      }
    ];
    
    res.json(availableActions);
  } catch (error) {
    console.error('Erro ao obter ações disponíveis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter logs do sistema
router.get('/logs/system', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const logs = await getAll(`
      SELECT * FROM system_logs 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    res.json(logs);
  } catch (error) {
    console.error('Erro ao obter logs do sistema:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter logs de auditoria
router.get('/logs/audit', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { limit = 100, offset = 0, user_id, action, table_name } = req.query;
    
    let query = 'SELECT al.*, u.name as user_name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1';
    const params = [];

    if (user_id) {
      query += ' AND al.user_id = ?';
      params.push(user_id);
    }

    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }

    if (table_name) {
      query += ' AND al.table_name = ?';
      params.push(table_name);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = await getAll(query, params);
    res.json(logs);
  } catch (error) {
    console.error('Erro ao obter logs de auditoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter logs de erro
router.get('/logs/errors', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const logs = await getAll(`
      SELECT * FROM system_logs 
      WHERE level = 'error' 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    res.json(logs);
  } catch (error) {
    console.error('Erro ao obter logs de erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Limpar logs antigos
router.delete('/logs/cleanup', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Limpar logs do sistema mais antigos que X dias
    await executeQuery(`
      DELETE FROM system_logs 
      WHERE created_at < datetime('now', '-${days} days')
    `);
    
    // Limpar logs de auditoria mais antigos que X dias
    await executeQuery(`
      DELETE FROM audit_logs 
      WHERE created_at < datetime('now', '-${days} days')
    `);
    
    res.json({ message: `Logs mais antigos que ${days} dias foram removidos` });
  } catch (error) {
    console.error('Erro ao limpar logs:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;