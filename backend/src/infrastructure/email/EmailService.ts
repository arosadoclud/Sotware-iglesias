import nodemailer from 'nodemailer';
import { EmailJob, onEmailJob } from '../../infrastructure/queue/QueueManager';

/**
 * EMAIL SERVICE — Paso 6
 *
 * Usa Nodemailer con soporte para múltiples providers:
 *   - SendGrid (producción recomendada)
 *   - SMTP genérico (cualquier servidor)
 *   - Mailtrap (desarrollo/testing)
 *
 * Configuración en .env:
 *   EMAIL_PROVIDER=sendgrid|smtp|mailtrap
 *   EMAIL_FROM=noreply@miglesia.com
 *   EMAIL_FROM_NAME=Mi Iglesia
 *   SENDGRID_API_KEY=SG...   (si EMAIL_PROVIDER=sendgrid)
 *   SMTP_HOST=...             (si EMAIL_PROVIDER=smtp)
 *   SMTP_PORT=587
 *   SMTP_USER=...
 *   SMTP_PASS=...
 *
 * Instalación: npm install nodemailer @types/nodemailer
 */

function createTransporter() {
  const provider = process.env.EMAIL_PROVIDER || 'smtp';

  if (provider === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  if (provider === 'mailtrap') {
    return nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER || '',
        pass: process.env.MAILTRAP_PASS || '',
      },
    });
  }

  // SMTP genérico
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
}

// Templates de email en HTML
function buildAssignmentEmailHtml(data: Record<string, any>): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  body { font-family: Arial, sans-serif; background:#f8fafc; margin:0; padding:20px; }
  .container { max-width:520px; margin:0 auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08); }
  .header { background:${data.brandColor || '#1e3a5f'}; padding:24px 28px; }
  .header h1 { color:#fff; margin:0; font-size:20px; }
  .header p  { color:rgba(255,255,255,0.8); margin:4px 0 0; font-size:13px; }
  .body { padding:24px 28px; }
  .greeting { font-size:15px; color:#1e293b; margin-bottom:16px; }
  .assignment-box { background:#f0f9ff; border-left:4px solid ${data.brandColor || '#1e3a5f'}; padding:14px 16px; border-radius:0 8px 8px 0; margin:16px 0; }
  .assignment-box .label { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; }
  .assignment-box .value { font-size:16px; font-weight:700; color:#1e293b; margin-top:2px; }
  .detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:13px; }
  .detail-row:last-child { border-bottom:none; }
  .detail-label { color:#64748b; }
  .detail-value { font-weight:600; color:#1e293b; }
  .footer { padding:16px 28px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; text-align:center; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>⛪ ${data.churchName}</h1>
    <p>Notificación de Servicio</p>
  </div>
  <div class="body">
    <p class="greeting">Hola <strong>${data.personName}</strong>,</p>
    <p style="color:#475569;font-size:14px;">
      Tienes el siguiente servicio asignado en <strong>${data.churchName}</strong>:
    </p>
    <div class="assignment-box">
      <div class="label">Tu rol</div>
      <div class="value">${data.roleName}</div>
    </div>
    <div style="margin:16px 0;">
      <div class="detail-row">
        <span class="detail-label">📅 Actividad</span>
        <span class="detail-value">${data.activityName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">📅 Fecha</span>
        <span class="detail-value">${data.formattedDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">🏛 Sección</span>
        <span class="detail-value">${data.sectionName}</span>
      </div>
      ${data.backupName ? `
      <div class="detail-row">
        <span class="detail-label">👤 Suplente</span>
        <span class="detail-value">${data.backupName}</span>
      </div>` : ''}
    </div>
    <p style="color:#64748b;font-size:12px;margin-top:16px;">
      Por favor confirma tu disponibilidad respondiendo a este email.<br/>
      Si no puedes asistir, comunícate con el administrador con anticipación.
    </p>
  </div>
  <div class="footer">
    Church Program Manager · ${data.churchName}<br/>
    Este es un mensaje automático, por favor no respondas a esta dirección.
  </div>
</div>
</body>
</html>`;
}

function buildReminderEmailHtml(data: Record<string, any>): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/>
<style>
  body { font-family: Arial, sans-serif; background:#f8fafc; margin:0; padding:20px; }
  .container { max-width:520px; margin:0 auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08); }
  .header { background:#f59e0b; padding:20px 28px; }
  .header h1 { color:#fff; margin:0; font-size:18px; }
  .body { padding:24px 28px; }
  .reminder-badge { display:inline-block; background:#fef3c7; color:#d97706; padding:6px 14px; border-radius:20px; font-weight:700; font-size:13px; margin-bottom:16px; }
  .footer { padding:12px 28px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; text-align:center; }
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>⏰ Recordatorio de Servicio — ${data.churchName}</h1></div>
  <div class="body">
    <div class="reminder-badge">⚡ Servicio en 48 horas</div>
    <p style="color:#1e293b;font-size:15px;">Hola <strong>${data.personName}</strong>,</p>
    <p style="color:#475569;font-size:13px;">
      Este es un recordatorio de que tienes servicio el <strong>${data.formattedDate}</strong>
      como <strong>${data.roleName}</strong> en <strong>${data.activityName}</strong>.
    </p>
    <p style="color:#64748b;font-size:12px;margin-top:16px;">
      Si no puedes asistir, avisa al administrador lo antes posible.
    </p>
  </div>
  <div class="footer">Church Program Manager · ${data.churchName}</div>
</div>
</body>
</html>`;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress = process.env.EMAIL_FROM || 'noreply@churchmanager.app';
  private fromName = process.env.EMAIL_FROM_NAME || 'Church Program Manager';
  private enabled = !!process.env.EMAIL_FROM;

  constructor() {
    if (this.enabled) {
      this.transporter = createTransporter();
      // Registrar el handler en la queue
      onEmailJob(this.processJob.bind(this));
      console.info('[Email] Servicio de email inicializado ✓');
    } else {
      console.warn('[Email] EMAIL_FROM no configurado — emails desactivados');
    }
  }

  private async processJob(job: EmailJob) {
    if (!this.transporter || !this.enabled) return;

    let html = '';
    switch (job.type) {
      case 'assignment_notification':
        html = buildAssignmentEmailHtml(job.templateData);
        break;
      case 'reminder':
        html = buildReminderEmailHtml(job.templateData);
        break;
      default:
        html = `<p>${job.subject}</p>`;
    }

    await this.transporter.sendMail({
      from: `"${this.fromName}" <${this.fromAddress}>`,
      to: `"${job.toName}" <${job.to}>`,
      subject: job.subject,
      html,
    });

    console.info(`[Email] Enviado a ${job.to}: ${job.subject}`);
  }

  isEnabled() { return this.enabled; }
}

export const emailService = new EmailService();
