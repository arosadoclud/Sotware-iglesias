import cron, { ScheduledTask } from 'node-cron';
import { BackupService } from '../services/backup.service';

/**
 * Programador de Backups Automáticos
 * 
 * Configuraciones recomendadas:
 * - Diario a las 2 AM: `0 2 * * *`
 * - Cada 6 horas: `0 *_/6 * * *`
 * - Cada lunes a las 3 AM: `0 3 * * 1`
 */

export class BackupScheduler {
  private backupService: BackupService;
  private jobs: ScheduledTask[] = [];

  constructor() {
    this.backupService = new BackupService();
  }

  /**
   * Iniciar backup automático diario a las 2 AM
   */
  startDailyBackup() {
    const job = cron.schedule('0 2 * * *', async () => {
      console.log('⏰ Ejecutando backup programado...');
      try {
        await this.backupService.createBackup({
          format: 'json',
          compress: true,
          maxBackups: 7
        });
      } catch (error: any) {
        console.error('❌ Error en backup programado:', error.message);
      }
    }, {
      timezone: 'America/Santo_Domingo'
    });

    this.jobs.push(job);
    console.log('✅ Backup diario programado (2 AM)');
  }

  /**
   * Iniciar backup cada 6 horas
   */
  startFrequentBackup() {
    const job = cron.schedule('0 */6 * * *', async () => {
      console.log('⏰ Ejecutando backup frecuente...');
      try {
        await this.backupService.createBackup({
          format: 'json',
          compress: true,
          maxBackups: 14 // Mantener último día completo (24h)
        });
      } catch (error: any) {
        console.error('❌ Error en backup frecuente:', error.message);
      }
    });

    this.jobs.push(job);
    console.log('✅ Backup cada 6 horas programado');
  }

  /**
   * Backup semanal completo (domingos a las 3 AM)
   */
  startWeeklyBackup() {
    const job = cron.schedule('0 3 * * 0', async () => {
      console.log('⏰ Ejecutando backup semanal...');
      try {
        await this.backupService.createBackup({
          format: 'json',
          compress: true,
          maxBackups: 4 // Mantener último mes
        });
      } catch (error: any) {
        console.error('❌ Error en backup semanal:', error.message);
      }
    }, {
      timezone: 'America/Santo_Domingo'
    });

    this.jobs.push(job);
    console.log('✅ Backup semanal programado (Domingo 3 AM)');
  }

  /**
   * Detener todos los backups programados
   */
  stopAll() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('🛑 Backups programados detenidos');
  }
}

// Exportar singleton
export const backupScheduler = new BackupScheduler();
