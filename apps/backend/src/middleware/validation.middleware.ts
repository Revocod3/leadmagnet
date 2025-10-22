import { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../types';

export const validationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Add any global validation logic here
  // For example, sanitize inputs, check content types, etc.

  // Sanitize string inputs
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '').slice(0, 10000);
  };

  // Recursively sanitize request body
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Check content type for POST/PUT/PATCH requests
  const contentTypeMethods = ['POST', 'PUT', 'PATCH'];
  if (contentTypeMethods.includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType?.includes('application/json') && !contentType?.includes('multipart/form-data')) {
      res.status(400).json({
        success: false,
        error: 'Content-Type debe ser application/json o multipart/form-data',
      } as ApiResponse);
      return;
    }
  }

  next();
};