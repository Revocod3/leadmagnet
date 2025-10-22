export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export const errorMessages = {
  es: {
    SESSION_NOT_FOUND: 'Sesión no encontrada',
    SESSION_EXPIRED: 'La sesión ha expirado',
    INVALID_SESSION_ID: 'ID de sesión inválido',
    INVALID_INPUT: 'Datos de entrada inválidos',
    OPENAI_ERROR: 'Error en el servicio de IA',
    DATABASE_ERROR: 'Error en la base de datos',
    FILE_TOO_LARGE: 'Archivo demasiado grande',
    INVALID_FILE_TYPE: 'Tipo de archivo inválido',
    RATE_LIMIT_EXCEEDED: 'Demasiadas solicitudes',
  },
  en: {
    SESSION_NOT_FOUND: 'Session not found',
    SESSION_EXPIRED: 'Session has expired',
    INVALID_SESSION_ID: 'Invalid session ID',
    INVALID_INPUT: 'Invalid input data',
    OPENAI_ERROR: 'AI service error',
    DATABASE_ERROR: 'Database error',
    FILE_TOO_LARGE: 'File too large',
    INVALID_FILE_TYPE: 'Invalid file type',
    RATE_LIMIT_EXCEEDED: 'Too many requests',
  },
};

export const getErrorMessage = (key: keyof typeof errorMessages.es, language: 'es' | 'en' = 'es'): string => {
  return errorMessages[language][key] || key;
};