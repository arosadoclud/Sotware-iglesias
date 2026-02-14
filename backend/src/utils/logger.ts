import winston from 'winston';
import envConfig from '../config/env';

// Formato de logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para consola (desarrollo)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      msg += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return msg;
  })
);

// Configuración de transportes
const transports: winston.transport[] = [];

// Consola (siempre activa)
transports.push(
  new winston.transports.Console({
    format: envConfig.nodeEnv === 'development' ? consoleFormat : logFormat,
  })
);

// Archivos (solo en producción)
if (envConfig.nodeEnv === 'production') {
  // Logs de errores
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Todos los logs
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Crear logger
const logger = winston.createLogger({
  level: envConfig.logLevel,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Método helper para log HTTP (usando verbose para evitar conflicto de tipos)
export const logHttp = (message: string, meta?: any) => {
  logger.info(message, { type: 'http', ...meta });
};

export default logger;
