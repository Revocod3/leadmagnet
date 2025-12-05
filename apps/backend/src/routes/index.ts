import { Router, type Router as ExpressRouter } from 'express';
import sessionRoutes from './session.routes';
import chatRoutes from './chat.routes';
import proRoutes from './pro.routes';
import discountRoutes from './discount.routes';
import diaryRoutes from './diary.routes';
import pushRoutes from './push.routes';
import challengeRoutes from './challenge.routes';
import { webhookRoutes } from './webhook.routes';
import { ImageController, uploadMiddleware } from '../controllers/image.controller';
import authRoutes from './auth.routes';
import ratingRoutes from './rating.routes';
import statsRoutes from './stats.routes';

const router: ExpressRouter = Router();
const imageController = new ImageController();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
router.use('/auth', authRoutes);
router.use('/sessions', sessionRoutes);
router.use('/chat', chatRoutes);
router.use('/pro', proRoutes);  // PRO chat routes (separate from FREE diagnostic)
router.use('/diary', diaryRoutes);  // Diary routes (PRO only)
router.use('/push', pushRoutes);  // Push notification routes (PRO only)
router.use('/challenges', challengeRoutes);  // Micro-challenges routes (PRO only)
router.use('/discount', discountRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/ratings', ratingRoutes);
router.use('/stats', statsRoutes);  // Global statistics

// Image upload route (needs to be before other routes to avoid conflicts)
router.post('/images', uploadMiddleware, imageController.uploadImage.bind(imageController));
router.get('/images/:sessionId', imageController.getImageAnalysis.bind(imageController));

export default router;