import nodemailer from 'nodemailer';
import { getAll, getOne } from '../database/connection.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      const settings = await this.getEmailSettings();
      
      if (settings.smtp_host) {
        this.transporter = nodemailer.createTransporter({
          host: settings.smtp_host,
          port: parseInt(settings.smtp_port) || 587,
          secure: settings.smtp_port === '465',
          auth: {
            user: settings.smtp_user,
            pass: settings.smtp_password
          }
        });
      }
    } catch (error) {
      console.error('Erro ao inicializar transporter de email:', error);
    }
  }

  async getEmailSettings() {
    const rows = await getAll('SELECT key, value FROM settings WHERE key LIKE "smtp_%"');
    
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    return settings;
  }

  async sendEmail(to, subject, html, template = null) {
    if (!this.transporter) {
      throw new Error('Configuração de email não encontrada');
    }

    const settings = await this.getEmailSettings();
    
    const mailOptions = {
      from: `"${settings.smtp_from_name || 'Sistema MetroSaaS'}" <${settings.smtp_from_email}>`,
      to,
      subject,
      html
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      
      // Log do email enviado
      await executeQuery(`
        INSERT INTO email_logs (id, recipient, subject, template_used, status, sent_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        `email-${Date.now()}`,
        to,
        subject,
        template,
        'sent',
        new Date().toISOString()
      ]);

      return result;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      
      // Log do erro
      await executeQuery(`
        INSERT INTO email_logs (id, recipient, subject, template_used, status, error_message, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        `email-${Date.now()}`,
        to,
        subject,
        template,
        'failed',
        error.message,
        new Date().toISOString()
      ]);

      throw error;
    }
  }

  async sendPasswordReset(email, newPassword) {
    const template = await this.getTemplate('password_reset');
    const html = template.content
      .replace(/{{email}}/g, email)
      .replace(/{{new_password}}/g, newPassword)
      .replace(/{{system_name}}/g, 'MetroSaaS');

    await this.sendEmail(email, template.subject.replace(/{{system_name}}/g, 'MetroSaaS'), html, 'password_reset');
  }

  async sendWelcomeEmail(email, name, role, password) {
    const template = await this.getTemplate('welcome');
    const roleNames = {
      admin: 'Administrador',
      tecnico: 'Técnico',
      cliente: 'Cliente'
    };

    const html = template.content
      .replace(/{{user_name}}/g, name)
      .replace(/{{email}}/g, email)
      .replace(/{{role}}/g, roleNames[role] || role)
      .replace(/{{system_name}}/g, 'MetroSaaS')
      .replace(/{{password}}/g, password);

    await this.sendEmail(email, template.subject.replace(/{{system_name}}/g, 'MetroSaaS'), html, 'welcome');
  }

  async sendCertificateExpiring(email, certificates) {
    const template = await this.getTemplate('certificate_expiring');
    let certificatesList = '';
    
    certificates.forEach(cert => {
      certificatesList += `<li>${cert.equipment_name} - Vence em ${cert.days_to_expire} dias</li>`;
    });

    const html = template.content
      .replace(/{{certificates_list}}/g, certificatesList)
      .replace(/{{system_name}}/g, 'MetroSaaS');

    await this.sendEmail(email, template.subject.replace(/{{system_name}}/g, 'MetroSaaS'), html, 'certificate_expiring');
  }

  async sendTestEmail(email) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Teste de Configuração SMTP</h2>
        <p>Este é um email de teste para verificar se as configurações SMTP estão funcionando corretamente.</p>
        <p>Se você recebeu este email, a configuração está funcionando perfeitamente!</p>
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          Email enviado pelo sistema MetroSaaS em ${new Date().toLocaleString('pt-BR')}
        </p>
      </div>
    `;

    await this.sendEmail(email, 'Teste de Configuração SMTP - MetroSaaS', html, 'test');
  }

  async getTemplate(templateKey) {
    const template = await getOne('SELECT * FROM email_templates WHERE template_key = ? AND status = ?', [templateKey, 'ativo']);
    
    if (!template) {
      throw new Error(`Template ${templateKey} não encontrado`);
    }
    
    return template;
  }
}

export default new EmailService();