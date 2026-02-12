/**
 * QUEUE MANAGER — Paso 6: Infraestructura de Colas
 *
 * Usa Bull (Redis-backed) para procesar notificaciones de forma asíncrona.
 * Las notificaciones NO bloquean la API — se encolan y procesan en background.
 *
 * Si Redis no está disponible, las notificaciones se procesan síncronamente
 * como fallback (útil en desarrollo sin Redis).
 *
 * Instalación: npm install bull @types/bull
 * Para Redis: Redis debe estar corriendo en REDIS_URL del .env
 */

// Import dinámico para que el server arranque sin Redis instalado
let Queue: any = null;

try {
  Queue = require('bull');
} catch {
  console.warn('[Queue] Bull no instalado — notificaciones en modo síncrono');
}

export interface EmailJob {
  type: 'assignment_notification' | 'program_published' | 'reminder';
  to: string;
  toName: string;
  subject: string;
  templateData: Record<string, any>;
}

export interface WhatsAppJob {
  type: 'assignment_notification' | 'reminder';
  to: string;         // Número con código de país: +18095551234
  toName: string;
  message: string;
}

export interface ReminderJob {
  programId: string;
  churchId: string;
}

// Handlers registrados por los workers
const emailHandlers: ((job: EmailJob) => Promise<void>)[] = [];
const whatsappHandlers: ((job: WhatsAppJob) => Promise<void>)[] = [];

// Instancias de queues (null si Redis no disponible)
let emailQueue: any = null;
let whatsappQueue: any = null;
let reminderQueue: any = null;

export function initQueues(redisUrl?: string) {
  if (!Queue || !redisUrl) {
    console.info('[Queue] Corriendo en modo síncrono (sin Redis)');
    return;
  }

  const redisOpts = { redis: redisUrl };

  emailQueue = new Queue('email-notifications', redisOpts);
  whatsappQueue = new Queue('whatsapp-notifications', redisOpts);
  reminderQueue = new Queue('reminder-notifications', redisOpts);

  // Procesar jobs de email
  emailQueue.process(async (job: any) => {
    for (const handler of emailHandlers) {
      await handler(job.data as EmailJob);
    }
  });

  // Procesar jobs de WhatsApp
  whatsappQueue.process(async (job: any) => {
    for (const handler of whatsappHandlers) {
      await handler(job.data as WhatsAppJob);
    }
  });

  // Error handling
  emailQueue.on('failed', (job: any, err: Error) => {
    console.error(`[EmailQueue] Job ${job.id} falló:`, err.message);
  });
  whatsappQueue.on('failed', (job: any, err: Error) => {
    console.error(`[WhatsAppQueue] Job ${job.id} falló:`, err.message);
  });

  console.info('[Queue] Colas inicializadas con Redis ✓');
}

/**
 * Registra un handler para procesar emails.
 * Si no hay Redis, el handler se llama síncronamente.
 */
export function onEmailJob(handler: (job: EmailJob) => Promise<void>) {
  emailHandlers.push(handler);
}

export function onWhatsAppJob(handler: (job: WhatsAppJob) => Promise<void>) {
  whatsappHandlers.push(handler);
}

/**
 * Encola un email. Si no hay Redis, lo procesa inmediatamente.
 */
export async function enqueueEmail(job: EmailJob, opts?: { delay?: number }) {
  if (emailQueue) {
    await emailQueue.add(job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      delay: opts?.delay || 0,
      removeOnComplete: 100, // Mantener últimos 100 completados
      removeOnFail: 50,
    });
  } else {
    // Fallback síncrono
    for (const handler of emailHandlers) {
      try { await handler(job); } catch (e) { console.error('[EmailFallback]', e); }
    }
  }
}

export async function enqueueWhatsApp(job: WhatsAppJob, opts?: { delay?: number }) {
  if (whatsappQueue) {
    await whatsappQueue.add(job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10000 },
      delay: opts?.delay || 0,
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  } else {
    for (const handler of whatsappHandlers) {
      try { await handler(job); } catch (e) { console.error('[WhatsAppFallback]', e); }
    }
  }
}

/**
 * Encola recordatorio con delay hasta 48h antes del culto.
 */
export async function enqueueReminder(job: ReminderJob, programDate: Date) {
  const reminderDate = new Date(programDate);
  reminderDate.setHours(reminderDate.getHours() - 48);
  const delay = Math.max(0, reminderDate.getTime() - Date.now());

  if (reminderQueue) {
    await reminderQueue.add(job, { delay, attempts: 2, removeOnComplete: 50 });
  }
  // Si no hay Redis, los recordatorios se omiten (no hay forma de schedularlos sin persistencia)
}
