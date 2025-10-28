/**
 * Chat Controller - Versión Minimalista
 * 
 * Controller SIMPLE que orquesta la conversación usando Assistants API.
 * ~100 líneas total. CERO lógica conversacional aquí.
 */

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { conversationalAssistant } from '../services/conversational-assistant.service';
import { ValidationService } from '../services/openai/validation.service';
import { DiscountService } from '../services/discount.service';
import { wordPressSyncService } from '../services/wordpress-sync.service';
import type { SendMessageRequest, ApiResponse, ChatMessage } from '../types';

const validationService = new ValidationService();
const discountService = new DiscountService();

export class ChatController {

  /**
   * Inicializar nueva conversación
   */
  async initializeDiagnostic(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.body;

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

      // 1. Crear thread y obtener mensaje de bienvenida
      const { threadId, welcomeMessage } = await conversationalAssistant.startConversation(
        session.userName || 'Usuario'
      );

      // 2. Guardar threadId en sesión
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          flowState: { threadId } as any, // Guardamos el threadId en flowState
          step: 'asking_questions',
        },
      });

      // 3. Guardar mensaje de bienvenida
      await prisma.message.create({
        data: {
          sessionId,
          role: 'assistant',
          content: welcomeMessage,
          metadata: { type: 'welcome' },
        },
      });

      res.json({
        success: true,
        data: {
          message: welcomeMessage,
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

  /**
   * Enviar mensaje del usuario
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, message }: SendMessageRequest = req.body;

      // Validar input
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

      // Obtener sesión
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { diagnosis: true },
      });

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Sesión no encontrada',
        } as ApiResponse);
        return;
      }

      // Verificar expiración
      if (new Date() > session.expiresAt) {
        res.status(410).json({
          success: false,
          error: 'Sesión expirada',
        } as ApiResponse);
        return;
      }

      // Obtener threadId
      const flowState = session.flowState as any;
      const threadId = flowState?.threadId;

      if (!threadId) {
        res.status(400).json({
          success: false,
          error: 'Thread no inicializado. Llamar a /initialize primero.',
        } as ApiResponse);
        return;
      }

      // Contar turnos (número de mensajes del usuario)
      const turnCount = await prisma.message.count({
        where: { sessionId, role: 'user' },
      });

      // Detectar si tiene problema real (simple heurística)
      const hasRealProblem = flowState?.hasRealProblem ?? turnCount > 0;

      // Preparar contexto
      const context: {
        userName?: string;
        mainProblem?: string;
        turnCount: number;
        hasRealProblem?: boolean;
        sessionId?: string;
      } = {
        turnCount: turnCount + 1,
        hasRealProblem,
        sessionId,
      };

      if (session.userName) context.userName = session.userName;
      if (flowState?.mainProblem) context.mainProblem = flowState.mainProblem;

      // Procesar mensaje
      const response = await conversationalAssistant.processMessage(
        threadId,
        message,
        context
      );

      // Guardar mensajes
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
          content: response.message,
        },
      });

      // Actualizar flowState
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          flowState: {
            ...flowState,
            hasRealProblem: response.shouldEndConversation ? false : hasRealProblem,
          } as any,
          currentQuestionIndex: turnCount + 1,
        },
      });

      // Generar diagnóstico si está listo
      let diagnosisContent: string | null = null;
      let discountCode: { code: string; percentage: number } | null = null;

      if (response.isDiagnosisReady && hasRealProblem) {
        diagnosisContent = await conversationalAssistant.generateDiagnosis(
          threadId,
          session.userName || 'Usuario'
        );

        // Guardar diagnóstico
        if (!session.diagnosis) {
          await prisma.diagnosis.create({
            data: {
              sessionId,
              userId: session.userId || null,
              content: diagnosisContent,
              questionsAsked: turnCount + 1,
            },
          });
        }

        // Actualizar sesión
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            step: 'diagnosis_ready',
            completionTime: new Date(),
            completedDiagnosis: true,
          },
        });

        // Sincronizar con WordPress
        try {
          await wordPressSyncService.syncDiagnosisCompletion(sessionId);
        } catch (syncError) {
          console.error('Error sincronizando con WordPress:', syncError);
        }

        // Generar código de descuento
        try {
          const discount = await discountService.createDiscountForSession(
            sessionId,
            'deep',
            0
          );
          discountCode = {
            code: discount.code,
            percentage: discount.percentage,
          };
        } catch (error) {
          console.error('Error generating discount:', error);
        }
      }

      // Responder
      const chatMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
      };

      res.json({
        success: true,
        data: {
          ...chatMessage,
          metadata: {
            type: response.isDiagnosisReady ? 'diagnosis_ready' : 'question',
            turnCount: turnCount + 1,
            diagnosisContent,
            discountCode: discountCode?.code,
            discountPercentage: discountCode?.percentage,
            shouldEndConversation: response.shouldEndConversation,
          },
        },
      } as ApiResponse<ChatMessage>);

    } catch (error) {
      console.error('Error sending message:', error);

      // Mensaje más amigable para el usuario
      const errorMessage = error instanceof Error && error.message.includes('Run failed')
        ? 'Disculpa, tuve un pequeño problema procesando tu respuesta. ¿Podrías reformularla de otra manera?'
        : 'Error interno del servidor';

      res.status(500).json({
        success: false,
        error: errorMessage,
      } as ApiResponse);
    }
  }

  /**
   * Obtener historial de chat
   */
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
}
