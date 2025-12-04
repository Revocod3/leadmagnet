/**
 * Chat Controller - Versión Minimalista
 * 
 * Controller SIMPLE que orquesta la conversación usando Responses API.
 * ~100 líneas total. CERO lógica conversacional aquí.
 */

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { conversationalAssistant } from '../services/conversational-assistant.service';
import { ValidationService } from '../services/openai/validation.service';
import { DiscountService } from '../services/discount.service';
import { wordPressSyncService } from '../services/wordpress-sync.service';
import { INTERACTION_LIMITS, LIMIT_EXCEEDED_MESSAGES } from '../constants/limits';
import type { SendMessageRequest, ApiResponse, ChatMessage } from '../types';
import multer from 'multer';

const validationService = new ValidationService();
const discountService = new DiscountService();

// Configure multer for memory storage (for optional image uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  },
});

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

      // 1. Crear conversación y obtener mensaje de bienvenida
      const { conversationId, welcomeMessage } = await conversationalAssistant.startConversation(
        session.userName || 'Usuario'
      );

      // 2. Guardar conversationId en sesión
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          flowState: { conversationId } as any, // Guardamos el conversationId en flowState
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
          role: 'assistant',
          content: welcomeMessage,
          metadata: { type: 'welcome' },
        },
      } as ApiResponse<ChatMessage>);

    } catch (error) {
      console.error('Error initializing diagnostic:', error);

      // Mensaje más amigable dependiendo del tipo de error
      let errorMessage = 'Disculpa, estamos teniendo problemas técnicos. Por favor, intenta de nuevo en unos segundos.';

      if (error instanceof Error) {
        if (error.message.includes('Run failed') || error.message.includes('server_error') || error.message.includes('response')) {
          errorMessage = 'Estamos experimentando alta demanda. Por favor, intenta nuevamente en un momento.';
        } else if (error.message.includes('timeout') || error.message.includes('time')) {
          errorMessage = 'La solicitud tardó demasiado. Por favor, intenta de nuevo.';
        }
      }

      res.status(500).json({
        success: false,
        error: errorMessage,
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

      // Obtener sesión (incluye user para verificar role PRO)
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          diagnosis: true,
          user: true, // Para verificar si es PRO
        },
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

      // Verificar límites de interacción (FREEMIUM MODEL)
      const language = session.language || 'es';
      const hasCompletedDiagnosis = session.completedDiagnosis;
      const isPROUser = session.userId && session.user?.role === 'PRO';

      // FREEMIUM: FREE users tienen límites, PRO users NO
      if (!isPROUser) {
        // Check post-diagnosis limit (FREE users)
        if (hasCompletedDiagnosis) {
          if (session.postDiagnosisMessageCount >= INTERACTION_LIMITS.POST_DIAGNOSIS_LIMIT) {
            // Exceeded post-diagnosis limit - Show subscription CTA
            const limitMessage = language === 'es'
              ? 'Has alcanzado el límite de mensajes gratuitos.\n\n¿Quieres continuar con Clara 24/7, planes personalizados, seguimiento diario y toda la comunidad?\n\n **Suscríbete al Método Objetivo Vientre Plano** y transforma tu salud digestiva.'
              : 'You have reached the free message limit.\n\n Want to continue with Clara 24/7, personalized plans, daily tracking, and the entire community?\n\n **Subscribe to the Flat Belly Method** and transform your digestive health.';

            res.json({
              success: true,
              data: {
                role: 'assistant',
                content: limitMessage,
                metadata: {
                  type: 'limit_exceeded',
                  limitType: 'post_diagnosis',
                  shouldShowSubscriptionCTA: true,
                  requiresUpgrade: true,
                },
              },
            } as ApiResponse<ChatMessage>);
            return;
          }
        } else {
          // Check pre-diagnosis limit (FREE users)
          const maxMessages = session.hasSharedImage
            ? INTERACTION_LIMITS.MAX_MESSAGES_WITH_PHOTO
            : INTERACTION_LIMITS.MAX_MESSAGES_WITHOUT_PHOTO;

          if (session.messageCount >= maxMessages) {
            // Force diagnosis generation
            const forceDiagnosis = true;

            // Continue processing to generate diagnosis
            // (will be handled below in the normal flow)
          }
        }
      }
      // PRO users: NO LIMITS - continue to chat

      // Obtener conversationId
      const flowState = session.flowState as any;
      const conversationId = flowState?.conversationId;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: 'Conversación no inicializada. Llamar a /initialize primero.',
        } as ApiResponse);
        return;
      }

      // Contar turnos (número de mensajes del usuario)
      const turnCount = await prisma.message.count({
        where: { sessionId, role: 'user' },
      });

      // Detectar si tiene problema real (simple heurística)
      // Por default, si hay turnos, asumimos que tiene problema real
      // Solo se marca como false si explícitamente el assistant detecta que no tiene problema
      const hasRealProblem = turnCount > 0;

      // Check if there's an image attached (from multer)
      const imageBuffer = (req as any).file?.buffer;

      // Preparar contexto
      const context: {
        userName?: string;
        mainProblem?: string;
        turnCount: number;
        hasRealProblem?: boolean;
        sessionId?: string;
        hasImage?: boolean;
        hasOfferedImage?: boolean;
      } = {
        turnCount: turnCount + 1,
        hasRealProblem,
        sessionId,
        hasImage: !!imageBuffer, // Indicar si hay imagen en este mensaje
        hasOfferedImage: flowState?.hasOfferedImage || false,
      };

      if (session.userName) context.userName = session.userName;
      if (flowState?.mainProblem) context.mainProblem = flowState.mainProblem;

      // If image is provided, mark session as having shared image
      if (imageBuffer && !session.hasSharedImage) {
        await prisma.session.update({
          where: { id: sessionId },
          data: { hasSharedImage: true },
        });
      }

      // Procesar mensaje (con o sin imagen)
      const response = await conversationalAssistant.processMessage(
        conversationId,
        message,
        context,
        imageBuffer
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

      // Actualizar contadores de mensajes
      const messageCountUpdate = hasCompletedDiagnosis
        ? { postDiagnosisMessageCount: session.postDiagnosisMessageCount + 1 }
        : { messageCount: session.messageCount + 1 };

      // Detectar si Clara ofreció compartir imagen en su respuesta
      const offeredImageInResponse = /📷|cámara|foto|imagen.*abdomen|compartir.*foto|subir.*imagen/i.test(response.message);

      // Actualizar flowState
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          ...messageCountUpdate,
          flowState: {
            ...flowState,
            hasRealProblem: response.shouldEndConversation ? false : hasRealProblem,
            hasOfferedImage: flowState?.hasOfferedImage || offeredImageInResponse,
          } as any,
          currentQuestionIndex: turnCount + 1,
        },
      });

      // Generar diagnóstico si está listo
      // FLUJO ESTRUCTURADO: isDiagnosisReady se activa en turno 14+ o con señales de diagnóstico
      let diagnosisContent: string | null = null;
      let discountCode: { code: string; percentage: number } | null = null;

      if (response.isDiagnosisReady) {
        // PASO 1: Primero respondemos con un mensaje de "generando diagnóstico"
        // sin esperar a que se genere el diagnóstico completo
        const generatingMessage = session.language === 'es'
          ? '¡Perfecto! Tengo toda la información que necesito. Déjame analizar tus respuestas y preparar un diagnóstico personalizado para ti...'
          : 'Perfect! I have all the information I need. Let me analyze your responses and prepare a personalized diagnosis for you...';

        // Responder inmediatamente para que el usuario vea el mensaje de "generando"
        res.json({
          success: true,
          data: {
            role: 'assistant',
            content: generatingMessage,
            metadata: {
              type: 'generating_diagnosis',
              step: 'generating_diagnosis',
              turnCount: turnCount + 1,
              shouldEndConversation: false,
            },
          },
        } as ApiResponse<ChatMessage>);

        // PASO 2: Ahora generar el diagnóstico de forma asíncrona
        // y guardarlo en la base de datos para que el frontend lo recoja
        setImmediate(async () => {
          try {
            const diagnosisContent = await conversationalAssistant.generateDiagnosis(
              conversationId,
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
              console.log(`✅ Descuento generado para sesión ${sessionId}: ${discount.code}`);
            } catch (error) {
              console.error('Error generating discount:', error);
            }

            console.log(`✅ Diagnóstico generado y guardado para sesión ${sessionId}`);
          } catch (error) {
            console.error('Error generando diagnóstico asíncrono:', error);
          }
        });

        return; // Salir después de enviar la respuesta de "generando"
      }

      // Flujo normal: Responder con el mensaje del asistente
      const chatMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
      };

      res.json({
        success: true,
        data: {
          ...chatMessage,
          metadata: {
            type: 'question',
            turnCount: turnCount + 1,
            shouldEndConversation: response.shouldEndConversation,
          },
        },
      } as ApiResponse<ChatMessage>);

    } catch (error) {
      console.error('Error sending message:', error);

      // Mensaje más amigable para el usuario
      const errorMessage = error instanceof Error && (error.message.includes('Run failed') || error.message.includes('response'))
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

      const chatMessages: ChatMessage[] = messages.map((msg: any): ChatMessage => ({
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
   * Obtener diagnóstico si está listo
   */
  async getDiagnosis(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
        } as ApiResponse);
        return;
      }

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { diagnosis: true },
      });

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
        } as ApiResponse);
        return;
      }

      if (!session.diagnosis) {
        res.json({
          success: true,
          data: {
            ready: false,
            content: null,
          },
        } as ApiResponse);
        return;
      }

      // Obtener código de descuento si existe
      const discountCode = await prisma.discountCode.findFirst({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: {
          ready: true,
          content: session.diagnosis.content,
          discountCode: discountCode?.code,
          discountPercentage: discountCode?.percentage,
        },
      } as ApiResponse);

    } catch (error) {
      console.error('Error getting diagnosis:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      } as ApiResponse);
    }
  }
}

// Export multer middleware for optional image upload
export const chatUploadMiddleware: any = upload.single('image');
