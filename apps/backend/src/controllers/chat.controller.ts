import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { DiagnosticFlowService, DiagnosticFlowState } from '../services/openai/diagnostic-flow.service';
import { ConversationalAssistantService } from '../services/openai/conversational-assistant.service';
import { ValidationService } from '../services/openai/validation.service';
import { DiscountService } from '../services/discount.service';
import { wordPressSyncService } from '../services/wordpress-sync.service';
import type { SendMessageRequest, ApiResponse, ChatMessage, Language } from '../types';

const validationService = new ValidationService();
const diagnosticFlowService = new DiagnosticFlowService();
const conversationalAssistantService = new ConversationalAssistantService();
const discountService = new DiscountService();

export class ChatController {
  async sendMessage(req: Request, res: Response): Promise<void> {
    // Check which system to use
    if (env.USE_NEW_CONVERSATIONAL_SYSTEM) {
      return this.sendMessageConversational(req, res);
    } else {
      return this.sendMessageDiagnosticFlow(req, res);
    }
  }

  /**
   * Send message using NEW Conversational Assistant System
   */
  private async sendMessageConversational(req: Request, res: Response): Promise<void> {
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

      // Get session
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

      // Save user message
      await prisma.message.create({
        data: {
          sessionId,
          role: 'user',
          content: message,
        },
      });

      // Process message through conversational assistant
      const conversationalResponse = await conversationalAssistantService.processMessage(
        sessionId,
        message,
        (language as Language) || 'es'
      );

      // Save assistant response
      await prisma.message.create({
        data: {
          sessionId,
          role: 'assistant',
          content: conversationalResponse.message,
          metadata: {
            type: 'conversational',
            decision: conversationalResponse.decision.type,
            keyMomentsDetected: conversationalResponse.keyMomentsDetected?.length || 0,
            conversationPhase: conversationalResponse.updatedMemory.conversationPhase,
            turnCount: conversationalResponse.updatedMemory.turnCount,
          },
        },
      });

      // Update session
      const updateData: any = {
        step: conversationalResponse.shouldConclude ? 'diagnosis_ready' : 'asking_questions',
        currentQuestionIndex: conversationalResponse.updatedMemory.turnCount,
        userName: session.userName,
        language: language || session.language,
      };

      // Update engagement tracking
      updateData.engagementScore = conversationalResponse.updatedMemory.currentHypothesis.confidence;
      updateData.questionsAsked = conversationalResponse.updatedMemory.turnCount;

      // Mark completion if concluded
      if (conversationalResponse.shouldConclude) {
        updateData.completionTime = new Date();
        updateData.completedDiagnosis = true;
      }

      await prisma.session.update({
        where: { id: sessionId },
        data: updateData,
      });

      // Generate diagnosis if concluded
      let diagnosisContent: string | null = null;
      if (conversationalResponse.shouldConclude) {
        diagnosisContent = await conversationalAssistantService.generateDiagnosis(
          sessionId,
          session.userName || 'Usuario',
          (language as Language) || 'es'
        );

        // Save diagnosis
        await prisma.diagnosis.create({
          data: {
            sessionId,
            userId: session.userId || null,
            content: diagnosisContent,
            engagementScore: conversationalResponse.updatedMemory.currentHypothesis.confidence,
            questionsAsked: conversationalResponse.updatedMemory.turnCount,
          },
        });

        // Sync with WordPress
        try {
          console.log('🔄 Sincronizando diagnóstico completado con WordPress...', { sessionId });
          await wordPressSyncService.syncDiagnosisCompletion(sessionId);
        } catch (syncError) {
          console.error('❌ Error sincronizando con WordPress:', syncError);
        }
      }

      // Generate discount code if concluded
      let discountCode: { code: string; percentage: number } | null = null;
      if (conversationalResponse.shouldConclude) {
        try {
          const discount = await discountService.createDiscountForSession(
            sessionId,
            'deep', // Conversational system is always deep mode
            conversationalResponse.updatedMemory.currentHypothesis.confidence
          );

          discountCode = {
            code: discount.code,
            percentage: discount.percentage,
          };

          console.log('✅ Discount code generated:', discountCode.code);
        } catch (error) {
          console.error('Error generating discount code:', error);
        }
      }

      // Build response
      const chatMessage: ChatMessage = {
        role: 'assistant',
        content: conversationalResponse.message,
      };

      res.json({
        success: true,
        data: {
          ...chatMessage,
          metadata: {
            type: 'conversational',
            step: conversationalResponse.shouldConclude ? 'diagnosis_ready' : 'asking_questions',
            turnCount: conversationalResponse.updatedMemory.turnCount,
            conversationPhase: conversationalResponse.updatedMemory.conversationPhase,
            decisionType: conversationalResponse.decision.type,
            diagnosisContent,
            discountCode: discountCode?.code,
            discountPercentage: discountCode?.percentage,
          },
        },
      } as ApiResponse<ChatMessage>);
    } catch (error) {
      console.error('Error sending message (conversational):', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      } as ApiResponse);
    }
  }

  /**
   * Send message using OLD Diagnostic Flow System (for backwards compatibility)
   */
  private async sendMessageDiagnosticFlow(req: Request, res: Response): Promise<void> {
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

      // Sincronizar con WordPress cuando se complete el diagnóstico
      if (flowResponse.newState.step === 'completed' || flowResponse.newState.step === 'diagnosis_ready') {
        try {
          console.log('🔄 Sincronizando diagnóstico completado con WordPress...', { sessionId });
          await wordPressSyncService.syncDiagnosisCompletion(sessionId);
        } catch (syncError) {
          console.error('❌ Error sincronizando con WordPress:', syncError);
          // No fallar la respuesta si falla la sincronización
        }
      }

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
    // Check which system to use
    if (env.USE_NEW_CONVERSATIONAL_SYSTEM) {
      return this.initializeConversational(req, res);
    } else {
      return this.initializeDiagnosticFlow(req, res);
    }
  }

  /**
   * Initialize NEW Conversational System
   */
  private async initializeConversational(req: Request, res: Response): Promise<void> {
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

      // Initialize conversational assistant
      const welcomeMessage = await conversationalAssistantService.initialize(
        sessionId,
        session.userName || 'Usuario',
        (language as Language) || session.language as Language || 'es'
      );

      // Save welcome message
      await prisma.message.create({
        data: {
          sessionId,
          role: 'assistant',
          content: welcomeMessage,
          metadata: { type: 'welcome', system: 'conversational' },
        },
      });

      // Update session
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          language: (language as Language) || session.language || 'es',
          step: 'asking_questions',
        },
      });

      res.json({
        success: true,
        data: {
          message: welcomeMessage,
          system: 'conversational',
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Error initializing conversational system:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      } as ApiResponse);
    }
  }

  /**
   * Initialize OLD Diagnostic Flow System (for backwards compatibility)
   */
  private async initializeDiagnosticFlow(req: Request, res: Response): Promise<void> {
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