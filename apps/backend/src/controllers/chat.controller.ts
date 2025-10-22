import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AssistantService, getOrCreateAssistant } from '../services/openai/assistant.service';
import { ValidationService } from '../services/openai/validation.service';
import type { SendMessageRequest, ApiResponse, ChatMessage } from '../types';

const validationService = new ValidationService();
let assistantService: AssistantService | null = null;

async function getAssistantService(): Promise<AssistantService> {
  if (!assistantService) {
    const assistantId = await getOrCreateAssistant();
    assistantService = new AssistantService(assistantId);
  }
  return assistantService;
}

export class ChatController {
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, message, language }: SendMessageRequest = req.body;

      // Validate input
      const sessionValidation = validationService.validateSessionId(sessionId);
      if (!sessionValidation.isValid) {
        res.status(400).json({
          success: false,
          error: sessionValidation.feedback,
        } as ApiResponse);
        return;
      }

      const messageValidation = validationService.validateMessage(message);
      if (!messageValidation.isValid) {
        res.status(400).json({
          success: false,
          error: messageValidation.feedback,
        } as ApiResponse);
        return;
      }

      // Get or create session
      let session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Sesión no encontrada',
        } as ApiResponse);
        return;
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        res.status(410).json({
          success: false,
          error: 'Sesión expirada',
        } as ApiResponse);
        return;
      }

      // Get assistant service
      const assistant = await getAssistantService();

      // Create thread if not exists
      let threadId = session.threadId;
      if (!threadId) {
        threadId = await assistant.createThread();
        await prisma.session.update({
          where: { id: sessionId },
          data: { threadId },
        });
        session.threadId = threadId;
      }

      // Send message and get response
      const assistantResponse = await assistant.sendMessage(threadId, message);

      // Save messages to database
      await prisma.message.create({
        data: {
          sessionId,
          role: 'user',
          content: message,
        },
      });

      await prisma.message.create({
        data: {
          sessionId,
          role: 'assistant',
          content: assistantResponse,
        },
      });

      // Update session step
      const newStep = this.determineNextStep(session.step, message);
      if (newStep !== session.step) {
        await prisma.session.update({
          where: { id: sessionId },
          data: { step: newStep },
        });
      }

      const chatMessage: ChatMessage = {
        role: 'assistant',
        content: assistantResponse,
      };

      res.json({
        success: true,
        data: chatMessage,
      } as ApiResponse<ChatMessage>);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      } as ApiResponse);
    }
  }

  async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const sessionValidation = validationService.validateSessionId(sessionId);
      if (!sessionValidation.isValid) {
        res.status(400).json({
          success: false,
          error: sessionValidation.feedback,
        } as ApiResponse);
        return;
      }

      const messages = await prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
      });

      const chatMessages: ChatMessage[] = messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: msg.createdAt,
      }));

      res.json({
        success: true,
        data: chatMessages,
      } as ApiResponse<ChatMessage[]>);
    } catch (error) {
      console.error('Error getting chat history:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      } as ApiResponse);
    }
  }

  private determineNextStep(currentStep: string, message: string): string {
    // Simple logic to determine next step based on conversation flow
    // This could be enhanced with more sophisticated logic
    if (currentStep === 'initial') {
      return 'name_question_sent';
    }
    if (currentStep === 'name_question_sent') {
      return 'asking_questions';
    }
    // Add more step logic as needed
    return currentStep;
  }
}