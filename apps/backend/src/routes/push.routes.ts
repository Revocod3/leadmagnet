/**
 * Push Notifications Routes - Clara Premium
 */

import { Router, IRouter } from 'express';
import { authenticateJWT, requirePro } from '../middleware/jwt.middleware';
import {
  getPublicKey,
  subscribe,
  unsubscribe,
  getReminders,
  updateReminder,
  sendTest
} from '../controllers/push.controller';

const router: IRouter = Router();

// Public route - get VAPID public key
router.get('/vapid-public-key', getPublicKey);

// Protected routes - require PRO subscription
router.post('/subscribe', authenticateJWT, requirePro, subscribe);
router.post('/unsubscribe', authenticateJWT, requirePro, unsubscribe);

// Reminder management
router.get('/reminders', authenticateJWT, requirePro, getReminders);
router.put('/reminders', authenticateJWT, requirePro, updateReminder);

// Test route (dev only)
router.post('/test', authenticateJWT, sendTest);

export default router;
