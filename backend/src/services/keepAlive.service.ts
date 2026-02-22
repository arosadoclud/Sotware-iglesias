import cron, { ScheduledTask } from 'node-cron';
import axios from 'axios';

/**
 * Keep-Alive Service
 * 
 * Mantiene activo el servicio de Render haciendo ping periódicamente
 * para evitar que se duerma después de 15 minutos de inactividad.
 * 
 * En el plan gratuito de Render, los servicios se duermen automáticamente
 * después de inactividad y tardan ~30 segundos en despertar.
 * 
 * Este servicio hace ping cada 10 minutos para mantener el servidor activo.
 */

class KeepAliveService {
  private isEnabled: boolean;
  private cronJob: ScheduledTask | null = null;
  private apiUrl: string;
  private intervalMinutes: number;

  constructor() {
    // Solo activar en producción para evitar pings innecesarios en desarrollo
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.apiUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    this.intervalMinutes = 10; // Ping cada 10 minutos

    if (this.isEnabled) {
      console.log('🔄 Keep-Alive Service: ACTIVADO');
      console.log(`   URL: ${this.apiUrl}`);
      console.log(`   Intervalo: cada ${this.intervalMinutes} minutos`);
    } else {
      console.log('🔄 Keep-Alive Service: DESACTIVADO (solo activo en producción)');
    }
  }

  /**
   * Inicia el servicio de keep-alive
   */
  start(): void {
    if (!this.isEnabled) {
      return;
    }

    // Verificar que tengamos una URL válida
    if (!this.apiUrl || this.apiUrl.includes('localhost')) {
      console.warn('⚠️  Keep-Alive: URL no válida para producción, servicio desactivado');
      return;
    }

    // Configurar cron job: cada 10 minutos
    // Formato: minutos horas días mes día-semana
    this.cronJob = cron.schedule(`*/${this.intervalMinutes} * * * *`, async () => {
      await this.ping();
    });

    console.log('✅ Keep-Alive Service iniciado correctamente');
    
    // Hacer un ping inicial después de 2 minutos
    setTimeout(() => {
      this.ping().catch(err => console.error('Error en ping inicial:', err));
    }, 2 * 60 * 1000);
  }

  /**
   * Detiene el servicio de keep-alive
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('🛑 Keep-Alive Service detenido');
    }
  }

  /**
   * Hace ping al endpoint de health check
   */
  private async ping(): Promise<void> {
    try {
      const startTime = Date.now();
      const healthUrl = `${this.apiUrl}/health`;
      
      const response = await axios.get(healthUrl, {
        timeout: 30000, // 30 segundos timeout
        headers: {
          'User-Agent': 'KeepAlive-Service/1.0',
        },
      });

      const duration = Date.now() - startTime;

      if (response.status === 200) {
        console.log(`✓ Keep-Alive ping exitoso (${duration}ms) - ${new Date().toLocaleString()}`);
      } else {
        console.warn(`⚠️  Keep-Alive ping con status ${response.status}`);
      }
    } catch (error: any) {
      // No es crítico si falla un ping, solo lo registramos
      console.error('❌ Error en Keep-Alive ping:', {
        message: error.message,
        code: error.code,
        time: new Date().toLocaleString(),
      });
      
      // Si el error es de timeout, el servidor probablemente se está despertando
      if (error.code === 'ECONNABORTED') {
        console.log('   ℹ️  Servidor posiblemente despertando...');
      }
    }
  }

  /**
   * Ping manual para testing
   */
  async testPing(): Promise<boolean> {
    try {
      await this.ping();
      return true;
    } catch {
      return false;
    }
  }
}

// Exportar instancia singleton
export const keepAliveService = new KeepAliveService();
export default keepAliveService;
