import 'dotenv/config';
import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { prisma } from './config/database';
import { redis } from './config/redis';
import apiRoutes from './routes';
import { errorMiddleware } from './middleware/error.middleware';
import { validationMiddleware } from './middleware/validation.middleware';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { logger } from './utils/logger';
import passport from './config/passport';
import { StripeWebhookController } from './controllers/stripe-webhook.controller';

const app: Express = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// IMPORTANT: Stripe webhook must be registered BEFORE any body parsing middleware
// This is required for signature verification - the raw body is needed to verify the signature
const stripeWebhookController = new StripeWebhookController();
app.post('/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  (req, res) => stripeWebhookController.handleWebhook(req, res)
);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Body parsing for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Passport
app.use(passport.initialize());

// Global middleware
app.use(validationMiddleware);
app.use(rateLimitMiddleware);
app.use(authMiddleware);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req.method, req.url, res.statusCode, duration);
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '2.0.0',
  });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
  });
});

// Error handling (must be last)
app.use(errorMiddleware);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    // Close database connections
    await prisma.$disconnect();

    // Close Redis connection
    if (redis) {
      redis.disconnect();
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', { error });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

// Start server
const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Server running on port ${env.PORT}`);
  logger.info(`📝 Environment: ${env.NODE_ENV}`);
  logger.info(`🔗 API URL: http://localhost:${env.PORT}`);
  logger.info(`🗄️  Database: ${env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  logger.info(`🤖 OpenAI: ${env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
  logger.info(`🔴 Redis: ${redis ? 'Connected' : 'Not configured'}`);
});

// Handle server errors
server.on('error', (error) => {
  logger.error('Server error:', { error });
  process.exit(1);
});

export default app;