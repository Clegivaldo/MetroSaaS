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

  async sendEmail(to, subject, html, templateKey = null) {
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
        templateKey,
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
        templateKey,
        'failed',
        error.message,
        new Date().toISOString()
      ]);

      throw error;
    }
  }

  async sendWithTemplate(templateKey, to, variables = {}) {
    const template = await this.getTemplate(templateKey);
    
    let content = template.content;
    let subject = template.subject;

    // Substituir variáveis
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
      subject = subject.replace(regex, value);
    });

    await this.sendEmail(to, subject, content, templateKey);
  }

  async sendPasswordReset(email, newPassword) {
    await this.sendWithTemplate('password_reset', email, {
      email,
      new_password: newPassword,
      system_name: 'MetroSaaS'
    });
  }

  async sendCertificateCreated(email, certificateData) {
    await this.sendWithTemplate('certificate_created', email, {
      client_name: certificateData.client_name,
      certificate_number: certificateData.certificate_number,
      equipment_name: certificateData.equipment_name,
      expiration_date: new Date(certificateData.expiration_date).toLocaleDateString('pt-BR'),
      system_name: 'MetroSaaS'
    });
  }

  async sendCertificateExpiring(email, certificates) {
    let certificatesList = '';
    certificates.forEach(cert => {
      certificatesList += `<li>${cert.equipment_name} - Vence em ${cert.days_to_expire} dias</li>`;
    });

    await this.sendWithTemplate('certificate_expiring', email, {
      certificates_list: certificatesList,
      system_name: 'MetroSaaS'
    });
  }

  async sendWelcomeEmail(email, name, role, password) {
    const roleNames = {
      admin: 'Administrador',
      tecnico: 'Técnico',
      cliente: 'Cliente'
    };

    await this.sendWithTemplate('welcome', email, {
      user_name: name,
      email,
      role: roleNames[role] || role,
      system_name: 'MetroSaaS',
      password
    });
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