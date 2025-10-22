import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';

const router = Router();
const chatController = new ChatController();

// POST /api/chat - Send message
router.post('/', chatController.sendMessage.bind(chatController));

// GET /api/chat/:sessionId - Get chat history
router.get('/:sessionId', chatController.getChatHistory.bind(chatController));

export default router;