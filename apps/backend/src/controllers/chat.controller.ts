import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { DiagnosticFlowService, DiagnosticFlowState } from '../services/openai/diagnostic-flow.service';
import { ValidationService } from '../services/openai/validation.service';
import { DiscountService } from '../services/discount.service';
import type { SendMessageRequest, ApiResponse, ChatMessage, Language } from '../types';

const validationService = new ValidationService();
const diagnosticFlowService = new DiagnosticFlowService();
const discountService = new DiscountService();

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

      // Update engagement tracking fields
      if ((flowResponse.newState as any).engagementScore) {
        const engScore = (flowResponse.newState as any).engagementScore;
        updateData.engagementScore = engScore.total;
        updateData.engagementSignals = engScore.signals;
      }

      if ((flowResponse.newState as any).diagnosticMode) {
        updateData.diagnosticMode = (flowResponse.newState as any).diagnosticMode;
      }

      if ((flowResponse.newState as any).askedQuestionIds) {
        updateData.questionsAsked = (flowResponse.newState as any).askedQuestionIds.length;
      }

      if ((flowResponse.newState as any).engagementScore?.signals?.longAnswers) {
        updateData.avgResponseLength = (flowResponse.newState as any).engagementScore.signals.longAnswers;
      }

      if ((flowResponse.newState as any).engagementScore?.signals?.timeSpent) {
        updateData.timeSpent = (flowResponse.newState as any).engagementScore.signals.timeSpent;
      }

      // Mark completion time if completed or diagnosis ready
      if (flowResponse.newState.step === 'completed' || flowResponse.newState.step === 'diagnosis_ready') {
        updateData.completionTime = new Date();
        updateData.completedDiagnosis = true;
      }

      await prisma.session.update({
        where: { id: sessionId },
        data: updateData,
      });

      // Save diagnosis if generated
      if (flowResponse.newState.diagnosisContent && !session.diagnosis) {
        const diagnosisData: any = {
          sessionId,
          content: flowResponse.newState.diagnosisContent,
        };

        if (session.userId) {
          diagnosisData.userId = session.userId;
        }

        // Add engagement tracking to diagnosis
        if ((flowResponse.newState as any).diagnosticMode) {
          diagnosisData.diagnosticMode = (flowResponse.newState as any).diagnosticMode;
        }

        if ((flowResponse.newState as any).askedQuestionIds) {
          diagnosisData.questionsAsked = (flowResponse.newState as any).askedQuestionIds.length;
        }

        if ((flowResponse.newState as any).engagementScore) {
          diagnosisData.engagementScore = (flowResponse.newState as any).engagementScore.total;
        }

        await prisma.diagnosis.create({
          data: diagnosisData,
        });
      }

      // Generate discount code when diagnosis is ready
      let discountCode: { code: string; percentage: number } | null = null;
      if (flowResponse.newState.step === 'diagnosis_ready') {
        try {
          const discount = await discountService.createDiscountForSession(
            sessionId,
            (flowResponse.newState as any).diagnosticMode || 'standard',
            (flowResponse.newState as any).engagementScore?.total || 0
          );

          discountCode = {
            code: discount.code,
            percentage: discount.percentage,
          };

          console.log('✅ Discount code generated:', discountCode.code);
        } catch (error) {
          console.error('Error generating discount code:', error);
          // Don't block the flow if discount generation fails
        }
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
            diagnosisContent: flowResponse.newState.diagnosisContent, // CRÍTICO: Enviar diagnosis content
            discountCode: discountCode?.code, // Discount code if generated
            discountPercentage: discountCode?.percentage, // Discount percentage (30%)
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