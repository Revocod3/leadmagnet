import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = authService.verifyToken(token);

    // Attach user to request
    req.user = payload;

    next();
  } catch (error) {
    logger.error('JWT authentication failed', { error });
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

/**
 * Middleware to check if user has PRO role
 */
export const requirePro = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'PRO') {
    res.status(403).json({
      success: false,
      error: 'PRO subscription required',
      upgradeUrl: '/upgrade', // TODO: Add upgrade URL
    });
    return;
  }

  next();
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // Silently fail and continue without user
    next();
  }
};
