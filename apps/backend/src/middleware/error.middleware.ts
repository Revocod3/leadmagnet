import { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../types';

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
    } as ApiResponse);
    return;
  }

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: 'Ya existe un registro con estos datos',
      } as ApiResponse);
      return;
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Token inválido',
    } as ApiResponse);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expirado',
    } as ApiResponse);
    return;
  }

  // Multer errors
  if (error.name === 'MulterError') {
    if (error.message.includes('File too large')) {
      res.status(400).json({
        success: false,
        error: 'Archivo demasiado grande',
      } as ApiResponse);
      return;
    }
  }

  // Default error
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
  } as ApiResponse);
};