import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { IProgram } from '../../models/Program.model';
import { IChurch } from '../../models/Church.model';
import Person from '../../models/Person.model';
import {
  enqueueEmail,
  enqueueWhatsApp,
  enqueueReminder,
  onWhatsAppJob,
  WhatsAppJob,
} from '../../infrastructure/queue/QueueManager';

/**
 * NOTIFICATION SERVICE — Paso 6
 *
 * Orquesta notificaciones por Email y WhatsApp cuando:
 *  1. Se publica un programa (status → PUBLISHED)
 *  2. Se acercan las 48h previas al culto (recordatorio)
 *
 * WhatsApp: usa Twilio API o Meta WhatsApp Cloud API.
 * Configuración en .env:
 *   WHATSAPP_PROVIDER=twilio|meta|none
 *   TWILIO_ACCOUNT_SID=...
 *   TWILIO_AUTH_TOKEN=...
 *   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
 *   META_WABA_TOKEN=...
 *   META_PHONE_NUMBER_ID=...
 */

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Registrar handler de WhatsApp según proveedor configurado
const whatsappProvider = process.env.WHATSAPP_PROVIDER || 'none';

if (whatsappProvider !== 'none') {
  onWhatsAppJob(async (job: WhatsAppJob) => {
    if (whatsappProvider === 'twilio') {
      await sendViaTwilio(job);
    } else if (whatsappProvider === 'meta') {
      await sendViaMeta(job);
    }
  });
  console.info(`[WhatsApp] Provider: ${whatsappProvider} ✓`);
}

async function sendViaTwilio(job: WhatsAppJob) {
  let twilio: any;
  try { twilio = require('twilio'); } catch {
    console.warn('[WhatsApp] twilio no instalado. npm install twilio');
    return;
  }
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${job.to}`,
    body: job.message,
  });
  console.info(`[WhatsApp/Twilio] Enviado a ${job.to}`);
}

async function sendViaMeta(job: WhatsAppJob) {
  // Meta WhatsApp Cloud API
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  const token = process.env.META_WABA_TOKEN;

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: job.to.replace('+', ''),
        type: 'text',
        text: { body: job.message },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Meta WhatsApp API error: ${response.status}`);
  }
  console.info(`[WhatsApp/Meta] Enviado a ${job.to}`);
}

function buildWhatsAppMessage(data: {
  churchName: string;
  personName: string;
  activityName: string;
  formattedDate: string;
  roleName: string;
  sectionName: string;
  isReminder: boolean;
}): string {
  if (data.isReminder) {
    return `⏰ *Recordatorio — ${data.churchName}*\n\nHola ${data.personName}, tienes servicio *mañana*:\n\n📅 *${data.activityName}*\n🗓 ${data.formattedDate}\n👤 Rol: *${data.roleName}*\n\nPor favor confirma tu asistencia.`;
  }
  return `🙏 *${data.churchName}*\n\nHola ${data.personName}, tienes el siguiente servicio asignado:\n\n📅 *${data.activityName}*\n🗓 ${data.formattedDate}\n👤 Rol: *${data.roleName}*\n📍 Sección: ${data.sectionName}\n\nResponde ✅ para confirmar o ❌ si no puedes asistir.`;
}

export class NotificationService {
  /**
   * Notifica a todos los asignados cuando un programa se publica.
   * Llamar desde updateProgramStatus cuando status → PUBLISHED.
   */
  async notifyProgramPublished(program: IProgram, church: IChurch): Promise<void> {
    const whatsappEnabled =
      whatsappProvider !== 'none' && (church as any).settings?.whatsappEnabled;

    // Obtener datos completos de las personas asignadas
    const personIds = program.assignments.map((a) => a.person.id);
    const persons = await Person.find({ _id: { $in: personIds } }).select(
      'fullName email phone'
    );

    const personMap = new Map(persons.map((p) => [p._id.toString(), p]));

    const formattedDate = `${DAYS_ES[new Date(program.programDate).getDay()]}, ${format(
      new Date(program.programDate),
      "d 'de' MMMM 'de' yyyy",
      { locale: es }
    )}`;

    const brandColor = (church as any).brandColor || '#1e3a5f';

    for (const assignment of program.assignments) {
      const person = personMap.get(assignment.person.id.toString());
      if (!person) continue;

      const msgData = {
        churchName: church.name,
        personName: person.fullName,
        activityName: program.activityType.name,
        formattedDate,
        roleName: assignment.roleName,
        sectionName: assignment.sectionName,
        isReminder: false,
      };

      // Email
      if (person.email) {
        await enqueueEmail({
          type: 'assignment_notification',
          to: person.email,
          toName: person.fullName,
          subject: `Tu servicio en ${church.name} — ${formattedDate}`,
          templateData: {
            ...msgData,
            brandColor,
            backupName: (assignment as any).backup?.name || null,
          },
        });
      }

      // WhatsApp
      if (whatsappEnabled && person.phone) {
        await enqueueWhatsApp({
          type: 'assignment_notification',
          to: person.phone,
          toName: person.fullName,
          message: buildWhatsAppMessage(msgData),
        });
      }
    }

    // Programar recordatorio 48h antes
    await enqueueReminder(
      { programId: program._id.toString(), churchId: program.churchId.toString() },
      program.programDate
    );

    console.info(
      `[Notifications] Notificaciones encoladas para programa ${program._id} — ${program.assignments.length} asignados`
    );
  }

  /**
   * Envía recordatorios 48h antes del culto.
   * Este método es llamado por el ReminderWorker cuando el job se activa.
   */
  async sendReminders(programId: string): Promise<void> {
    const Program = (await import('../../models/Program.model')).default;
    const Church = (await import('../../models/Church.model')).default;

    const program = await Program.findById(programId);
    if (!program || program.status === 'CANCELLED') return;

    const church = await Church.findById(program.churchId);
    if (!church) return;

    const whatsappEnabled =
      whatsappProvider !== 'none' && (church as any).settings?.whatsappEnabled;

    const formattedDate = `${DAYS_ES[new Date(program.programDate).getDay()]}, ${format(
      new Date(program.programDate),
      "d 'de' MMMM",
      { locale: es }
    )}`;

    const personIds = program.assignments.map((a) => a.person.id);
    const persons = await Person.find({ _id: { $in: personIds } }).select(
      'fullName email phone'
    );
    const personMap = new Map(persons.map((p) => [p._id.toString(), p]));

    for (const assignment of program.assignments) {
      const person = personMap.get(assignment.person.id.toString());
      if (!person) continue;

      const msgData = {
        churchName: church.name,
        personName: person.fullName,
        activityName: program.activityType.name,
        formattedDate,
        roleName: assignment.roleName,
        sectionName: assignment.sectionName,
        isReminder: true,
      };

      if (person.email) {
        await enqueueEmail({
          type: 'reminder',
          to: person.email,
          toName: person.fullName,
          subject: `⏰ Recordatorio: Tienes servicio mañana — ${church.name}`,
          templateData: { ...msgData, brandColor: (church as any).brandColor || '#f59e0b' },
        });
      }

      if (whatsappEnabled && person.phone) {
        await enqueueWhatsApp({
          type: 'reminder',
          to: person.phone,
          toName: person.fullName,
          message: buildWhatsAppMessage(msgData),
        });
      }
    }
  }
}

export const notificationService = new NotificationService();
