import { Router } from 'express';
import { statsController } from '../controllers/stats.controller';

const router = Router();

// Get user count
router.get('/user-count', statsController.getUserCount.bind(statsController));

// Increment user count
router.post('/user-count/increment', statsController.incrementUserCount.bind(statsController));

export default router;
