import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { DiagnosticFlowService, DiagnosticFlowState } from '../services/openai/diagnostic-flow.service';
import { ValidationService } from '../services/openai/validation.service';
import type { SendMessageRequest, ApiResponse, ChatMessage, Language } from '../types';

const validationService = new ValidationService();
const diagnosticFlowService = new DiagnosticFlowService();

export class ChatController {
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, message, language, imageData }: SendMessageRequest & { imageData?: { base64: string; mimeType: string } } = req.body;

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
        include: {
          diagnosis: true,
        },
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

      // Simply save messages - frontend handles the flow
      // Save user message
      await prisma.message.create({
        data: {
          sessionId,
          role: 'user',
          content: message,
        },
      });

      // Echo back a simple response
      const assistantContent = '¡Hola! Gracias por tu mensaje.';

      await prisma.message.create({
        data: {
          sessionId,
          role: 'assistant',
          content: assistantContent,
        },
      });

      const chatMessage: ChatMessage = {
        role: 'assistant',
        content: assistantContent,
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

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
        } as ApiResponse);
        return;
      }

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

  /**
   * Initialize diagnostic flow for a session
   */
  async initializeDiagnostic(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, language } = req.body;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
        } as ApiResponse);
        return;
      }

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Sesión no encontrada',
        } as ApiResponse);
        return;
      }

      const initialized = diagnosticFlowService.initializeFlow(language as Language || 'es');

      // Save welcome message
      await prisma.message.create({
        data: {
          sessionId,
          role: 'assistant',
          content: initialized.message,
          metadata: { type: 'welcome' },
        },
      });

      // Update session with initial flow state
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          flowState: initialized.state as any,
          language: initialized.state.language,
        },
      });

      res.json({
        success: true,
        data: {
          message: initialized.message,
          state: initialized.state,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Error initializing diagnostic:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      } as ApiResponse);
    }
  }
}