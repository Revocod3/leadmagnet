/**
 * Diary Routes
 * 
 * Routes for diary functionality (PRO users only)
 */

import { Router, IRouter } from 'express';
import { authenticateJWT, requirePro } from '../middleware/jwt.middleware';
import {
  createDiaryEntry,
  getDiaryEntry,
  getDiaryEntryByDate,
  getDiaryEntries,
  getCalendarData,
  updateDiaryEntry,
  deleteDiaryEntry,
  getDiaryStats
} from '../controllers/diary.controller';

const router: IRouter = Router();

// All diary routes require authentication and PRO status
router.use(authenticateJWT);
router.use(requirePro);

// Get diary stats
router.get('/stats', getDiaryStats);

// Get calendar data for a month
router.get('/calendar/:year/:month', getCalendarData);

// Get entry by date
router.get('/date/:date', getDiaryEntryByDate);

// CRUD operations
router.get('/', getDiaryEntries);
router.get('/:id', getDiaryEntry);
router.post('/', createDiaryEntry);
router.put('/:id', updateDiaryEntry);
router.delete('/:id', deleteDiaryEntry);

export default router;
