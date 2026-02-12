import app, { setupQueues } from './app';
import database from './config/database';
import envConfig from './config/env';
import logger from './utils/logger';

const PORT = envConfig.port;

async function start() {
  try {
    // 1. Conectar a MongoDB
    await database.connect();

    // 2. Iniciar colas de notificaciones (Bull + Redis si disponible)
    setupQueues();

    // 3. Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      logger.info('');
      logger.info('╔═══════════════════════════════════════════╗');
      logger.info('║   Church Program Manager — API v2         ║');
      logger.info('╠═══════════════════════════════════════════╣');
      logger.info(`║  Puerto:    ${PORT}                           ║`);
      logger.info(`║  Entorno:   ${envConfig.nodeEnv.padEnd(10)}                  ║`);
      logger.info(`║  URL:       http://localhost:${PORT}           ║`);
      logger.info('╠═══════════════════════════════════════════╣');
      logger.info('║  Pasos implementados:                     ║');
      logger.info('║  ✅ 1. Tenant Guard (seguridad multi-tenant)║');
      logger.info('║  ✅ 2. RBAC 6 roles granulares            ║');
      logger.info('║  ✅ 3. AssignmentEngine v2 (algoritmo)    ║');
      logger.info('║  ✅ 4. Índices MongoDB optimizados        ║');
      logger.info('║  ✅ 5. PDF con Puppeteer + Handlebars     ║');
      logger.info('║  ✅ 6. Notificaciones Email + WhatsApp    ║');
      logger.info('║  ✅ 7. Church model expandido (plan+branding)║');
      logger.info('║  ✅ 8. Cache Redis (tenant+stats+history) ║');
      logger.info('╚═══════════════════════════════════════════╝');
      logger.info('');
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.info(`${signal} recibido — cerrando servidor...`);
      server.close(() => {
        logger.info('Servidor HTTP cerrado');
        process.exit(0);
      });
      // Forzar cierre después de 10s
      setTimeout(() => { logger.error('Cierre forzado'); process.exit(1); }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

start();
