import { Router, type Router as ExpressRouter } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/jwt.middleware';
import passport from '../config/passport';

const router: ExpressRouter = Router();

/**
 * POST /api/auth/register
 * Register new user with email/password
 */
router.post('/register', (req, res) => authController.register(req, res));

/**
 * POST /api/auth/login
 * Login with email/password
 */
router.post('/login', (req, res) => authController.login(req, res));

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticateJWT, (req, res) => authController.me(req, res));

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login?error=auth_failed',
  }),
  (req, res) => authController.googleCallback(req, res)
);

/**
 * POST /api/auth/set-password
 * Set password for user (for users created via Stripe webhook)
 * Body: { email, password, resetToken? }
 */
router.post('/set-password', (req, res) => authController.setPassword(req, res));

/**
 * POST /api/auth/request-password-reset
 * Request password reset token
 * Body: { email }
 */
router.post('/request-password-reset', (req, res) => authController.requestPasswordReset(req, res));

export default router;
