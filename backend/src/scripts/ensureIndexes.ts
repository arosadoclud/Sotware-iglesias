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
import '../models/LetterTemplate.model';
import '../models/GeneratedLetter.model';
import '../models/NewMember.model';
import '../models/AuditLog.model';
import '../models/LoginAttempt.model';
import '../models/FinanceCategory.model';
import '../models/Fund.model';
import '../models/FinanceTransaction.model';
import '../models/PersonStatus.model';
import '../models/Ministry.model';

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
    logger.info('  Program:        { churchId, programDate, status }');
    logger.info('  Program:        { churchId, activityType.id, programDate } (motor)');
    logger.info('  Person:         { churchId, roles.roleId, status } (motor)');
    logger.info('  Person:         { churchId, status, priority }');
    logger.info('  User:           { email } unique');
    logger.info('  User:           { churchId, role }');
    logger.info('  NewMember:      { churchId, status, assignedTo }');
    logger.info('  FinanceTransaction: { churchId, type, date }');
    logger.info('  Fund:           { churchId, name }');
    logger.info('  AuditLog:       { churchId, userId, action }');
    logger.info('  LoginAttempt:   { userId, createdAt }');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error creando índices:', error);
    process.exit(1);
  }
}

ensureIndexes();
