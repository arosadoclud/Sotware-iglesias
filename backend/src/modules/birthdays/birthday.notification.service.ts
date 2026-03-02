import cron from 'node-cron';
import https from 'https';
import Person from '../../models/Person.model';
import User from '../../models/User.model';
import { UserRole } from '../../models/User.model';
import logger from '../../utils/logger';

// Roles que tienen acceso a la sección de cumpleaños
const BIRTHDAY_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.PASTOR,
  UserRole.ADMIN,
  UserRole.MINISTRY_LEADER,
];

/**
 * Envía un mensaje de WhatsApp a través de CallMeBot.
 * URL: https://api.callmebot.com/whatsapp.php?phone=PHONE&text=MSG&apikey=APIKEY
 */
function sendCallMeBot(phone: string, apiKey: string, text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(text);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&apikey=${apiKey}&text=${encoded}`;

    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`CallMeBot status ${res.statusCode}: ${body}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Verifica si una fecha coincide con hoy (mismo día y mes).
 */
function matchesDate(birthDate: Date, target: Date): boolean {
  return (
    birthDate.getMonth() === target.getMonth() &&
    birthDate.getDate()  === target.getDate()
  );
}

/**
 * Envía los mensajes de una lista de personas a todos los receptores de una iglesia.
 */
async function notifyChurchUsers(
  usersInChurch: any[],
  message: string,
  label: string
): Promise<void> {
  for (const user of usersInChurch) {
    try {
      await sendCallMeBot(user.callMeBotPhone!, user.callMeBotApiKey!, message);
      logger.info(`[BirthdayNotify] ✅ ${label} → ${user.fullName} (${user.callMeBotPhone})`);
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err: any) {
      logger.error(`[BirthdayNotify] ❌ Error ${label} → ${user.fullName}: ${err.message}`);
    }

    // Destinatarios adicionales
    for (const extra of (user.additionalRecipients || [])) {
      if (!extra.phone || !extra.apiKey) continue;
      try {
        await sendCallMeBot(extra.phone, extra.apiKey, message);
        logger.info(`[BirthdayNotify] ✅ ${label} → adicional ${extra.name || extra.phone}`);
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err: any) {
        logger.error(`[BirthdayNotify] ❌ Error ${label} → adicional ${extra.name || extra.phone}: ${err.message}`);
      }
    }
  }
}

/**
 * Ejecuta la verificación de cumpleaños y envía notificaciones.
 * Alerta el mismo día del cumpleaños Y un día antes como recordatorio anticipado.
 */
export async function runBirthdayNotifications(): Promise<void> {
  try {
    logger.info('[BirthdayNotify] Iniciando verificación de cumpleaños...');

    const today    = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const notifiableUsers = await User.find({
      role: { $in: BIRTHDAY_ROLES },
      isActive: true,
      notifyBirthdays: true,
      callMeBotPhone: { $exists: true, $ne: '' },
      callMeBotApiKey: { $exists: true, $ne: '' },
    }).select('+callMeBotApiKey +additionalRecipients');

    if (notifiableUsers.length === 0) {
      logger.info('[BirthdayNotify] No hay usuarios configurados para notificaciones.');
      return;
    }

    const churchIds = [...new Set(notifiableUsers.map((u) => u.churchId.toString()))];

    for (const churchId of churchIds) {
      const usersInChurch = notifiableUsers.filter(
        (u) => u.churchId.toString() === churchId
      );

      const persons = await Person.find({
        churchId,
        birthDate: { $exists: true, $ne: null },
      }).select('fullName birthDate').lean();

      // ── Cumpleaños HOY ────────────────────────────────────────────────────
      const todayBirthdays = persons.filter(
        (p) => p.birthDate && matchesDate(new Date(p.birthDate), today)
      );

      if (todayBirthdays.length > 0) {
        const names   = todayBirthdays.map((p) => p.fullName).join(', ');
        const dateStr = today.toLocaleDateString('es', { day: 'numeric', month: 'long' });
        const message =
          `🎂 *¡Hoy es su cumpleaños!*\n` +
          `*${names}* ${todayBirthdays.length === 1 ? 'cumple' : 'cumplen'} años hoy ${dateStr}.\n` +
          `¡No olvides felicitarle${todayBirthdays.length === 1 ? '' : 's'}! 🎉`;

        logger.info(`[BirthdayNotify] Iglesia ${churchId}: ${todayBirthdays.length} cumpleaños HOY.`);
        await notifyChurchUsers(usersInChurch, message, 'HOY');
      }

      // ── Cumpleaños MAÑANA (recordatorio anticipado) ───────────────────────
      const tomorrowBirthdays = persons.filter(
        (p) => p.birthDate && matchesDate(new Date(p.birthDate), tomorrow)
      );

      if (tomorrowBirthdays.length > 0) {
        const names      = tomorrowBirthdays.map((p) => p.fullName).join(', ');
        const dateStr    = tomorrow.toLocaleDateString('es', { day: 'numeric', month: 'long' });
        const message =
          `📅 *Recordatorio anticipado de cumpleaños*\n` +
          `Mañana ${dateStr}, *${names}* ${tomorrowBirthdays.length === 1 ? 'cumple' : 'cumplen'} años.\n` +
          `¡Prepara tu felicitación! 🎁`;

        logger.info(`[BirthdayNotify] Iglesia ${churchId}: ${tomorrowBirthdays.length} cumpleaños MAÑANA.`);
        await notifyChurchUsers(usersInChurch, message, 'MAÑANA');
      }

      if (todayBirthdays.length === 0 && tomorrowBirthdays.length === 0) {
        logger.info(`[BirthdayNotify] Iglesia ${churchId}: sin cumpleaños hoy ni mañana.`);
      }
    }

    logger.info('[BirthdayNotify] Verificación completada.');
  } catch (err: any) {
    logger.error(`[BirthdayNotify] Error general: ${err.message}`);
  }
}

/**
 * Inicia el cron job: se ejecuta todos los días a las 08:00 AM (hora del servidor).
 * Para ajustar la hora, cambia el primer parámetro del cron.
 * Formato: 'minuto hora dia-mes mes dia-semana'
 */
export function initBirthdayNotificationCron(): void {
  // Ejecutar a las 08:00 AM cada día
  cron.schedule('0 8 * * *', () => {
    runBirthdayNotifications();
  });

  logger.info('[BirthdayNotify] Cron de notificaciones de cumpleaños iniciado (08:00 AM diario).');
}
