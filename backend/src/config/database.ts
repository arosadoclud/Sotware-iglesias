import mongoose from 'mongoose';
import envConfig from './env';
import logger from '../utils/logger';

class Database {
  private isConnected: boolean = false;

  /**
   * Conectar a MongoDB
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Base de datos ya está conectada');
      return;
    }

    try {
      // Configuración de Mongoose
      mongoose.set('strictQuery', true);

      // Eventos de conexión
      mongoose.connection.on('connected', () => {
        logger.info('✅ MongoDB conectado exitosamente');
        this.isConnected = true;
      });

      mongoose.connection.on('error', (err) => {
        logger.error('❌ Error de conexión MongoDB:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️  MongoDB desconectado');
        this.isConnected = false;
      });

      // Manejo de cierre de aplicación
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      // Conectar
      await mongoose.connect(envConfig.mongoUri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        family: 4, // Usar IPv4
      });

      logger.info(`🌍 Entorno: ${envConfig.nodeEnv}`);
      logger.info(`📊 Base de datos: ${mongoose.connection.name}`);

    } catch (error) {
      logger.error('❌ Error al conectar a MongoDB:', error);
      process.exit(1);
    }
  }

  /**
   * Desconectar de MongoDB
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      logger.info('🔌 MongoDB desconectado correctamente');
      this.isConnected = false;
    } catch (error) {
      logger.error('❌ Error al desconectar MongoDB:', error);
      throw error;
    }
  }

  /**
   * Verificar estado de conexión
   */
  isReady(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Limpiar base de datos (solo para testing)
   */
  async clearDatabase(): Promise<void> {
    if (envConfig.nodeEnv !== 'test') {
      throw new Error('clearDatabase solo puede usarse en entorno de testing');
    }

    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }

    logger.info('🧹 Base de datos limpiada (test)');
  }
}

export const database = new Database();
export default database;
