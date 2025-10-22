import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';

const router = Router();
const sessionController = new SessionController();

// POST /api/sessions - Create new session
router.post('/', sessionController.createSession.bind(sessionController));

// GET /api/sessions/:sessionId - Get session by ID
router.get('/:sessionId', sessionController.getSession.bind(sessionController));

// PUT /api/sessions/:sessionId - Update session
router.put('/:sessionId', sessionController.updateSession.bind(sessionController));

export default router;