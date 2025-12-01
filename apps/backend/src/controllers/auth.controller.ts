import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const setPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  resetToken: z.string().optional(),
});

const requestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export class AuthController {
  /**
   * POST /api/auth/register
   * Register new user with email/password
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);

      // Register user
      const result = await authService.register(validatedData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Registration error', { error });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      if (error instanceof Error && error.message === 'User already exists with this email') {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Registration failed',
      });
    }
  }

  /**
   * POST /api/auth/login
   * Login with email/password
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);

      // Login user
      const result = await authService.login(validatedData);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Login error', { 
        error,
        message: error instanceof Error ? error.message : String(error)
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      if (error instanceof Error && error.message === 'Invalid credentials') {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Login failed',
      });
    }
  }

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      const user = await authService.getUserById(req.user.userId);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logger.error('Get user error', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get user',
      });
    }
  }

  /**
   * GET /api/auth/google
   * Initiate Google OAuth flow (handled by passport)
   */
  // This is handled by passport middleware

  /**
   * GET /api/auth/google/callback
   * Google OAuth callback
   */
  async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        // Redirect to frontend with error
        res.redirect(`${process.env.CORS_ORIGIN}/login?error=auth_failed`);
        return;
      }

      // Generate JWT for the user
      const token = authService.generateToken(req.user);

      // Redirect to frontend with token
      res.redirect(`${process.env.CORS_ORIGIN}/auth/callback?token=${token}`);
    } catch (error) {
      logger.error('Google callback error', { error });
      res.redirect(`${process.env.CORS_ORIGIN}/login?error=auth_failed`);
    }
  }

  /**
   * POST /api/auth/set-password
   * Set password for user (for users created via Stripe webhook)
   */
  async setPassword(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = setPasswordSchema.parse(req.body);

      const result = await authService.setPassword(
        validatedData.email,
        validatedData.password,
        validatedData.resetToken
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Set password error', { error });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to set password',
      });
    }
  }

  /**
   * POST /api/auth/request-password-reset
   * Request password reset token
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = requestPasswordResetSchema.parse(req.body);

      const result = await authService.requestPasswordReset(validatedData.email);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Request password reset error', { error });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to request password reset',
      });
    }
  }
}

export const authController = new AuthController();
