/**
 * PRO Routes - Clara PRO chat endpoints
 * 
 * All routes require JWT authentication.
 * Write operations require active subscription.
 */

import { Router } from 'express';
import { proController } from '../controllers/pro.controller';
import { authenticateJWT } from '../middleware/jwt.middleware';
import { requireProSubscription } from '../middleware/subscription.middleware';

const router: Router = Router();

// All PRO routes require authentication
router.use(authenticateJWT);

// GET /api/pro/status - Get user's PRO status and subscription info (no subscription check)
router.get('/status', proController.getStatus.bind(proController));

// GET /api/pro/progress - Get user's Clara Premium progress data
router.get('/progress', proController.getProgress.bind(proController));

// GET /api/pro/conversations - List all conversations (allowed for all authenticated users)
router.get('/conversations', proController.listConversations.bind(proController));

// Routes that require active PRO subscription
// POST /api/pro/conversations - Create new conversation
router.post('/conversations', requireProSubscription, proController.createConversation.bind(proController));

// GET /api/pro/conversations/:id - Get conversation with messages
router.get('/conversations/:id', proController.getConversation.bind(proController));

// POST /api/pro/conversations/:id/message - Send message in conversation
router.post('/conversations/:id/message', requireProSubscription, proController.sendMessage.bind(proController));

// DELETE /api/pro/conversations/:id - Delete conversation
router.delete('/conversations/:id', proController.deleteConversation.bind(proController));

export default router;
