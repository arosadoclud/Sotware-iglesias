import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Cargar variables de entorno
// Prioridad: .env.local > .env
const envLocalPath = path.join(__dirname, '../../.env.local');
const envPath = path.join(__dirname, '../../.env');

if (fs.existsSync(envLocalPath)) {
  console.log('🔧 Cargando configuración de .env.local (desarrollo local)');
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config({ path: envPath });
}

interface EnvConfig {
  // Server
  nodeEnv: string;
  port: number;
  apiVersion: string;

  // Database
  mongoUri: string;

  // JWT
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;

  // Cloudinary
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;

  // App Config
  frontendUrl: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;

  // Puppeteer
  puppeteerExecutablePath: string;

  // Logging
  logLevel: string;

  // Business Logic
  defaultRotationWeeks: number;
  maxFileSize: number;
  defaultTimezone: string;
}

class Config {
  private config: EnvConfig;

  constructor() {
    this.config = this.validateConfig();
  }

  private validateConfig(): EnvConfig {
    const requiredEnvVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Faltan las siguientes variables de entorno: ${missingVars.join(', ')}`
      );
    }

    return {
      // Server
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '5000', 10),
      apiVersion: process.env.API_VERSION || 'v1',

      // Database
      mongoUri: process.env.MONGODB_URI!,

      // JWT
      jwtSecret: process.env.JWT_SECRET!,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
      jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

      // Cloudinary
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
      cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',

      // App Config
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

      // Puppeteer
      puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '',

      // Logging
      logLevel: process.env.LOG_LEVEL || 'info',

      // Business Logic
      defaultRotationWeeks: parseInt(process.env.DEFAULT_ROTATION_WEEKS || '4', 10),
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
      defaultTimezone: process.env.DEFAULT_TIMEZONE || 'America/Santo_Domingo'
    };
  }

  get(): EnvConfig {
    return this.config;
  }

  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }
}

export const config = new Config();
export default config.get();
