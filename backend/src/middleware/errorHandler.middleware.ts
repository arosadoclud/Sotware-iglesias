import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import envConfig from '../config/env';

/**
 * Manejador global de errores
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Valores por defecto
  let statusCode = 500;
  let message = 'Error interno del servidor';
  let errors: any[] = [];

  // Si es un error de aplicación personalizado
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    
    // Si tiene errores de validación
    if ('errors' in err) {
      errors = (err as any).errors;
    }
  }
  // Error de validación de Mongoose
  else if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Error de validación';
    errors = Object.values((err as any).errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
  }
  // Error de cast de Mongoose (ID inválido)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'ID inválido';
  }
  // Error de duplicado de Mongoose (unique constraint)
  else if ((err as any).code === 11000) {
    statusCode = 409;
    message = 'Ya existe un registro con estos datos';
    const field = Object.keys((err as any).keyPattern)[0];
    errors = [{ field, message: `El ${field} ya está en uso` }];
  }
  // Error de JWT
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // Log del error
  if (statusCode >= 500) {
    logger.error('Error del servidor:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn('Error del cliente:', {
      message: err.message,
      statusCode,
      url: req.originalUrl,
      method: req.method,
    });
  }

  // Respuesta
  const response: any = {
    success: false,
    message,
  };

  if (errors.length > 0) {
    response.errors = errors;
  }

  // Incluir stack trace solo en desarrollo
  if (envConfig.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Manejador de rutas no encontradas (404)
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.originalUrl}`,
  });
};
