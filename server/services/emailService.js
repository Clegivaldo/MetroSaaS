import nodemailer from 'nodemailer';
import { getAll, getOne, executeQuery } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
    this.emailActions = {
      user_created: 'Boas-vindas',
      certificate_created: 'Certificado Criado',
      certificate_expiring: 'Certificado Vencendo',
      password_reset: 'Reset de Senha',
      appointment_created: 'Agendamento Criado'
    };
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
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `, [
        uuidv4(),
        to,
        subject,
        templateKey,
        'sent'
      ]);

      return result;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      
      // Log do erro
      await executeQuery(`
        INSERT INTO email_logs (id, recipient, subject, template_used, status, error_message, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        uuidv4(),
        to,
        subject,
        templateKey,
        'failed',
        error.message
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

  async sendTestEmail(email) {
    const subject = 'Teste de Configuração SMTP - MetroSaaS';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Teste de Email</h2>
        <p>Este é um email de teste para verificar a configuração SMTP do sistema MetroSaaS.</p>
        <p>Se você recebeu este email, a configuração está funcionando corretamente!</p>
        <p>Data/Hora: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    `;

    await this.sendEmail(email, subject, html, 'test_email');
  }

  async getTemplate(templateKey) {
    const template = await getOne('SELECT * FROM email_templates WHERE template_key = ? AND status = ?', [templateKey, 'ativo']);
    
    if (!template) {
      throw new Error(`Template ${templateKey} não encontrado`);
    }
    
    return template;
  }

  async getTemplateByAction(action) {
    try {
      const template = await getOne(
        'SELECT * FROM email_templates WHERE action = ?',
        [action]
      );
      
      if (!template) {
        logger.warn(`Template não encontrado para ação: ${action}`);
        return null;
      }
      
      return template;
    } catch (error) {
      logger.error('Erro ao buscar template de email:', error);
      return null;
    }
  }

  async sendEmailByAction(action, recipientEmail, variables) {
    try {
      const template = await this.getTemplateByAction(action);
      
      if (!template) {
        logger.error(`Template não encontrado para ação: ${action}`);
        return false;
      }

      // Substituir variáveis no template
      let subject = template.subject;
      let body = template.body;

      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        body = body.replace(new RegExp(placeholder, 'g'), value);
      }

      // Aqui você implementaria o envio real do email
      // Por enquanto, apenas logamos
      logger.info('Email enviado:', {
        action,
        recipient: recipientEmail,
        subject,
        body: body.substring(0, 100) + '...'
      });

      return true;
    } catch (error) {
      logger.error('Erro ao enviar email:', error);
      return false;
    }
  }

  // Métodos específicos para cada ação
  async sendWelcomeEmailByAction(email, name, role, password) {
    return this.sendEmailByAction('user_created', email, {
      name,
      email,
      role,
      password
    });
  }

  async sendCertificateCreatedByAction(email, data) {
    return this.sendEmailByAction('certificate_created', email, data);
  }

  async sendCertificateExpiringByAction(email, data) {
    return this.sendEmailByAction('certificate_expiring', email, data);
  }

  async sendPasswordResetByAction(email, name, newPassword) {
    return this.sendEmailByAction('password_reset', email, {
      name,
      new_password: newPassword
    });
  }

  async sendAppointmentCreatedByAction(email, data) {
    return this.sendEmailByAction('appointment_created', email, data);
  }
}

export default new EmailService();