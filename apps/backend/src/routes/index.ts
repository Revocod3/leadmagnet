import { Router } from 'express';
import sessionRoutes from './session.routes';
import chatRoutes from './chat.routes';
import quizRoutes from './quiz.routes';
import { ImageController, uploadMiddleware } from '../controllers/image.controller';

const router = Router();
const imageController = new ImageController();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
router.use('/sessions', sessionRoutes);
router.use('/chat', chatRoutes);
router.use('/quiz', quizRoutes);

// Image upload route (needs to be before other routes to avoid conflicts)
router.post('/images', uploadMiddleware, imageController.uploadImage.bind(imageController));
router.get('/images/:sessionId', imageController.getImageAnalysis.bind(imageController));

export default router;