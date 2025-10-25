import { Router, type Router as ExpressRouter } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router: ExpressRouter = Router();
const webhookController = new WebhookController();

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

export { router as webhookRoutes };
