import { Router, type Router as RouterType } from 'express';
import { statsController } from '../controllers/stats.controller';

const router: RouterType = Router();

// Get user count
router.get('/user-count', statsController.getUserCount.bind(statsController));

// Increment user count
router.post('/user-count/increment', statsController.incrementUserCount.bind(statsController));

export default router;
