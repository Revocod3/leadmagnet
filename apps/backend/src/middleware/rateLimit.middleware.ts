import { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../types';

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // requests per window

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const key = req.ip || 'unknown';
  const now = Date.now();

  const userRequests = rateLimitStore.get(key);

  if (!userRequests || now > userRequests.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    next();
    return;
  }

  if (userRequests.count >= MAX_REQUESTS) {
    const resetIn = Math.ceil((userRequests.resetTime - now) / 1000);
    res.status(429).json({
      success: false,
      error: `Demasiadas solicitudes. Inténtalo de nuevo en ${resetIn} segundos.`,
    } as ApiResponse);
    return;
  }

  // Increment counter
  userRequests.count++;
  rateLimitStore.set(key, userRequests);

  next();
};