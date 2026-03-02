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
 * Verifica si hoy es el cumpleaños de una fecha dada.
 */
function isBirthdayToday(birthDate: Date): boolean {
  const today = new Date();
  return (
    birthDate.getMonth() === today.getMonth() &&
    birthDate.getDate() === today.getDate()
  );
}

/**
 * Ejecuta la verificación de cumpleaños y envía notificaciones.
 * Se puede invocar manualmente (para probar) o desde el cron.
 */
export async function runBirthdayNotifications(): Promise<void> {
  try {
    logger.info('[BirthdayNotify] Iniciando verificación de cumpleaños...');

    // 1. Obtener todos los usuarios con notificaciones activas y clave CallMeBot
    //    Usamos .select('+callMeBotApiKey') para incluir el campo oculto (select: false)
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

    // 2. Para cada iglesia representada entre los usuarios notificables,
    //    obtener los cumpleaños de hoy
    const churchIds = [...new Set(notifiableUsers.map((u) => u.churchId.toString()))];

    for (const churchId of churchIds) {
      const usersInChurch = notifiableUsers.filter(
        (u) => u.churchId.toString() === churchId
      );

      // Buscar personas de esta iglesia con fecha de cumpleaños
      const persons = await Person.find({
        churchId,
        birthDate: { $exists: true, $ne: null },
      }).select('fullName birthDate ministry').lean();

      // Filtrar los que cumplen hoy
      const todayBirthdays = persons.filter(
        (p) => p.birthDate && isBirthdayToday(new Date(p.birthDate))
      );

      if (todayBirthdays.length === 0) {
        logger.info(`[BirthdayNotify] Iglesia ${churchId}: sin cumpleaños hoy.`);
        continue;
      }

      // Construir mensaje
      const names = todayBirthdays.map((p) => p.fullName).join(', ');
      const plural = todayBirthdays.length === 1 ? 'cumpleaños' : 'cumpleaños';
      const message =
        `🎂 *Recordatorio de cumpleaños*\n` +
        `Hoy ${new Date().toLocaleDateString('es', { day: 'numeric', month: 'long' })} ` +
        `${plural === 'cumpleaños' ? 'cumple años' : 'cumplen años'}: *${names}*.\n` +
        `¡No olvides felicitarles! 🎉`;

      logger.info(
        `[BirthdayNotify] Iglesia ${churchId}: ${todayBirthdays.length} cumpleaños hoy. Notificando a ${usersInChurch.length} usuarios.`
      );

      // Enviar a cada usuario de esa iglesia
      for (const user of usersInChurch) {
        try {
          await sendCallMeBot(user.callMeBotPhone!, user.callMeBotApiKey!, message);
          logger.info(`[BirthdayNotify] ✅ WhatsApp enviado a ${user.fullName} (${user.callMeBotPhone})`);
          await new Promise((r) => setTimeout(r, 1500));
        } catch (err: any) {
          logger.error(`[BirthdayNotify] ❌ Error enviando a ${user.fullName}: ${err.message}`);
        }

        // Enviar a destinatarios adicionales configurados por este usuario
        const extras = user.additionalRecipients || [];
        for (const extra of extras) {
          if (!extra.phone || !extra.apiKey) continue;
          try {
            await sendCallMeBot(extra.phone, extra.apiKey, message);
            logger.info(`[BirthdayNotify] ✅ WhatsApp enviado a adicional ${extra.name || extra.phone}`);
            await new Promise((r) => setTimeout(r, 1500));
          } catch (err: any) {
            logger.error(`[BirthdayNotify] ❌ Error enviando a adicional ${extra.name || extra.phone}: ${err.message}`);
          }
        }
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
