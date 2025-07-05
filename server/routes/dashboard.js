import express from 'express';
import { getAll, getOne } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Obter estatísticas do dashboard
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Total de clientes
    const clientsCount = await getOne('SELECT COUNT(*) as count FROM clients WHERE status = ?', ['ativo']);
    
    // Total de certificados ativos
    const certificatesCount = await getOne('SELECT COUNT(*) as count FROM certificates WHERE status = ?', ['valido']);
    
    // Agendamentos de hoje
    const todayAppointments = await getOne(`
      SELECT COUNT(*) as count FROM appointments 
      WHERE DATE(scheduled_date) = DATE('now') AND status IN ('agendado', 'em_andamento')
    `);
    
    // Certificados vencendo nos próximos 30 dias
    const expiringCertificates = await getOne(`
      SELECT COUNT(*) as count FROM certificates 
      WHERE status = 'prestes_vencer' OR 
      (DATE(expiration_date) BETWEEN DATE('now') AND DATE('now', '+30 days'))
    `);

    // Padrões vencendo nos próximos 30 dias
    const expiringStandards = await getOne(`
      SELECT COUNT(*) as count FROM standards 
      WHERE status = 'prestes_vencer' OR 
      (DATE(expiration_date) BETWEEN DATE('now') AND DATE('now', '+30 days'))
    `);

    res.json({
      clients: clientsCount.count,
      certificates: certificatesCount.count,
      todayAppointments: todayAppointments.count,
      expiringCertificates: expiringCertificates.count,
      expiringStandards: expiringStandards.count
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter atividades recentes
router.get('/recent-activities', authenticateToken, async (req, res) => {
  try {
    const activities = await getAll(`
      SELECT 
        al.action,
        al.table_name,
        al.created_at,
        u.name as user_name,
        CASE 
          WHEN al.table_name = 'clients' THEN 'Cliente'
          WHEN al.table_name = 'certificates' THEN 'Certificado'
          WHEN al.table_name = 'standards' THEN 'Padrão'
          WHEN al.table_name = 'appointments' THEN 'Agendamento'
          ELSE al.table_name
        END as entity_type
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

    res.json(activities);
  } catch (error) {
    console.error('Erro ao obter atividades recentes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter dados para gráfico de certificados por mês
router.get('/certificates-chart', authenticateToken, async (req, res) => {
  try {
    const { months = 6 } = req.query;
    
    const chartData = await getAll(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM certificates
      WHERE created_at >= date('now', '-${months} months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `);

    res.json(chartData);
  } catch (error) {
    console.error('Erro ao obter dados do gráfico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter certificados próximos ao vencimento
router.get('/expiring-certificates', authenticateToken, async (req, res) => {
  try {
    const expiringCertificates = await getAll(`
      SELECT 
        c.id,
        c.certificate_number,
        c.expiration_date,
        cl.name as client_name,
        e.name as equipment_name,
        CAST(julianday(c.expiration_date) - julianday('now') AS INTEGER) as days_to_expire
      FROM certificates c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN equipment e ON c.equipment_id = e.id
      WHERE DATE(c.expiration_date) BETWEEN DATE('now') AND DATE('now', '+30 days')
      ORDER BY c.expiration_date ASC
    `);

    res.json(expiringCertificates);
  } catch (error) {
    console.error('Erro ao obter certificados vencendo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter padrões próximos ao vencimento
router.get('/expiring-standards', authenticateToken, async (req, res) => {
  try {
    const expiringStandards = await getAll(`
      SELECT 
        id,
        name,
        serial_number,
        expiration_date,
        CAST(julianday(expiration_date) - julianday('now') AS INTEGER) as days_to_expire
      FROM standards
      WHERE DATE(expiration_date) BETWEEN DATE('now') AND DATE('now', '+30 days')
      ORDER BY expiration_date ASC
    `);

    res.json(expiringStandards);
  } catch (error) {
    console.error('Erro ao obter padrões vencendo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;