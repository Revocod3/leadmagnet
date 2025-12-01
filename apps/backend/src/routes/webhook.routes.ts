import { Router, type Router as ExpressRouter, raw } from 'express';
import { WebhookController } from '../controllers/webhook.controller';
import { StripeWebhookController } from '../controllers/stripe-webhook.controller';

const router: ExpressRouter = Router();
const webhookController = new WebhookController();
const stripeWebhookController = new StripeWebhookController();

/**
 * Verificar que el webhook está activo
 * GET /api/webhooks/wordpress/verify
 */
router.get('/wordpress/verify', (req, res) => {
  webhookController.verifyWebhook(req, res);
});

/**
 * Recibir actualizaciones de leads desde WordPress
 * POST /api/webhooks/wordpress/lead-update
 *
 * Body esperado:
 * {
 *   "leadId": "wp_123",
 *   "name": "Nombre actualizado",
 *   "email": "email@actualizado.com",
 *   "status": "active",
 *   "metadata": {}
 * }
 */
router.post('/wordpress/lead-update', (req, res) => {
  webhookController.handleWordPressLeadUpdate(req, res);
});

/**
 * Stripe webhook endpoint
 * POST /api/webhooks/stripe
 *
 * IMPORTANT: This route requires raw body for signature verification
 * Configure in server.ts with: app.use('/api/webhooks/stripe', raw({ type: 'application/json' }))
 */
router.post('/stripe', (req, res) => {
  stripeWebhookController.handleWebhook(req, res);
});

export { router as webhookRoutes };
