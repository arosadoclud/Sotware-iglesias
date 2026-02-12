/**
 * Clase base para errores personalizados de la aplicación
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error 400 - Bad Request
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Solicitud inválida') {
    super(message, 400);
  }
}

/**
 * Error 401 - Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 401);
  }
}

/**
 * Error 403 - Forbidden
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso prohibido') {
    super(message, 403);
  }
}

/**
 * Error 404 - Not Found
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado') {
    super(message, 404);
  }
}

/**
 * Error 409 - Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflicto con el estado actual') {
    super(message, 409);
  }
}

/**
 * Error 422 - Unprocessable Entity
 */
export class ValidationError extends AppError {
  public errors: any[];
  
  constructor(message: string = 'Error de validación', errors: any[] = []) {
    super(message, 422);
    this.errors = errors;
  }
}

/**
 * Error 500 - Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Error interno del servidor') {
    super(message, 500);
  }
}
