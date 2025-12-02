/**
 * Challenge Routes - Clara Premium
 */

import { Router, IRouter } from 'express';
import { authenticateJWT, requirePro } from '../middleware/jwt.middleware';
import {
  getCurrent,
  getHistory,
  getStats,
  complete,
  skip,
  assign,
  getRecommended,
  getAll
} from '../controllers/challenge.controller';

const router: IRouter = Router();

// All routes require PRO subscription
router.use(authenticateJWT, requirePro);

// Get current active challenge
router.get('/current', getCurrent);

// Get challenge history
router.get('/history', getHistory);

// Get challenge statistics
router.get('/stats', getStats);

// Get recommended challenge
router.get('/recommended', getRecommended);

// Get all available challenges
router.get('/all', getAll);

// Complete a challenge
router.post('/complete', complete);

// Skip a challenge
router.post('/skip', skip);

// Assign a specific challenge
router.post('/assign', assign);

export default router;
