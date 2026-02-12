/**
 * SCRIPT DE MIGRACIÓN DE ÍNDICES — Paso 4
 *
 * Ejecutar una vez en producción para garantizar que todos los índices
 * críticos existan antes del despliegue.
 *
 * Uso: npx ts-node src/scripts/ensureIndexes.ts
 *
 * Mongoose crea índices automáticamente al iniciar el servidor si
 * autoIndex está activado (por defecto en desarrollo). En producción
 * suele estar desactivado. Este script los crea explícitamente.
 */

import mongoose from 'mongoose';
import envConfig from '../config/env';
import logger from '../utils/logger';

// Importar todos los modelos para registrarlos
import '../models/Program.model';
import '../models/Person.model';
import '../models/User.model';
import '../models/Church.model';
import '../models/ActivityType.model';
import '../models/Role.model';

async function ensureIndexes() {
  try {
    await mongoose.connect(envConfig.mongoUri);
    logger.info('Conectado a MongoDB — creando índices...');

    const models = Object.values(mongoose.modelNames());

    for (const modelName of models) {
      const model = mongoose.model(modelName);
      await model.ensureIndexes();
      logger.info(`✓ Índices asegurados: ${modelName}`);
    }

    logger.info('');
    logger.info('✅ Todos los índices creados correctamente');
    logger.info('');
    logger.info('Índices críticos asegurados:');
    logger.info('  Program:  { churchId, programDate, status }');
    logger.info('  Program:  { churchId, activityType.id, programDate } (motor)');
    logger.info('  Person:   { churchId, roles.roleId, status } (motor)');
    logger.info('  Person:   { churchId, status, priority }');
    logger.info('  User:     { email } unique');
    logger.info('  User:     { churchId, role }');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error creando índices:', error);
    process.exit(1);
  }
}

ensureIndexes();
