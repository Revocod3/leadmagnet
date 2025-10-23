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

      // Get current flow state from session
      const flowState: DiagnosticFlowState = (session.flowState as unknown as DiagnosticFlowState) || {
        step: 'initial',
        currentQuestionIndex: 0,
        userName: null,
        language: (language as Language) || 'es',
        answers: [],
        imageAnalysis: null,
        diagnosisContent: null,
      };

      // Process message through diagnostic flow
      const flowResponse = await diagnosticFlowService.processMessage(
        message,
        flowState,
        imageData
      );

      // Save user message
      await prisma.message.create({
        data: {
          sessionId,
          role: 'user',
          content: message,
        },
      });

      // Save assistant response
      await prisma.message.create({
        data: {
          sessionId,
          role: 'assistant',
          content: flowResponse.message,
          metadata: {
            type: flowResponse.type,
            nextQuestion: flowResponse.nextQuestion,
            questionDetails: flowResponse.questionDetails,
            etymology: flowResponse.etymology,
            requiresWelcomeAnimation: flowResponse.requiresWelcomeAnimation,
          },
        },
      });

      // Update session with new flow state
      const updateData: any = {
        flowState: flowResponse.newState as any,
        step: flowResponse.newState.step,
        currentQuestionIndex: flowResponse.newState.currentQuestionIndex,
      };

      if (flowResponse.newState.userName) {
        updateData.userName = flowResponse.newState.userName;
      }

      if (flowResponse.newState.language) {
        updateData.language = flowResponse.newState.language;
      }

      if (flowResponse.newState.imageAnalysis) {
        updateData.imageAnalysisText = flowResponse.newState.imageAnalysis;
      }

      // Mark completion time if completed
      if (flowResponse.newState.step === 'completed' || flowResponse.newState.step === 'cta') {
        updateData.completionTime = new Date();
      }

      await prisma.session.update({
        where: { id: sessionId },
        data: updateData,
      });

      // Save diagnosis if generated
      if (flowResponse.newState.diagnosisContent && !session.diagnosis) {
        const diagnosisData: {
          sessionId: string;
          userId?: string;
          content: string;
        } = {
          sessionId,
          content: flowResponse.newState.diagnosisContent,
        };

        if (session.userId) {
          diagnosisData.userId = session.userId;
        }

        await prisma.diagnosis.create({
          data: diagnosisData,
        });
      }

      // Build response
      const chatMessage: ChatMessage = {
        role: 'assistant',
        content: flowResponse.message,
      };

      res.json({
        success: true,
        data: {
          ...chatMessage,
          metadata: {
            type: flowResponse.type,
            step: flowResponse.newState.step,
            currentQuestionIndex: flowResponse.newState.currentQuestionIndex,
            nextQuestion: flowResponse.nextQuestion,
            questionDetails: flowResponse.questionDetails,
            etymology: flowResponse.etymology,
            requiresWelcomeAnimation: flowResponse.requiresWelcomeAnimation,
            userName: flowResponse.newState.userName,
          },
        },
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

      // Usar el nombre de la sesión para personalizar el mensaje de bienvenida
      const initialized = diagnosticFlowService.initializeFlow(
        (language as Language) || session.language as Language || 'es',
        session.userName || undefined
      );

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