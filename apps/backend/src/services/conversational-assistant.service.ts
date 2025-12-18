/**
 * Conversational Assistant Service
 *
 * Refactor: Assistants API -> Responses API (+ Conversations)
 *
 * FILOSOFÍA: 80% lógica en instrucciones, 20% orquestación en código.
 * Este archivo es SOLO orquestación. NO contiene lógica conversacional.
 */

import { openai, MODELS } from '../config/openai';
import { CLARA_INSTRUCTIONS, DIAGNOSIS_INSTRUCTIONS, buildDynamicInstructions } from '../config/assistant-instructions';
import { logger } from '../utils/logger';
import { convertDiagnosisToHTML } from '../utils/markdown-to-html';
import { prisma } from '../config/database';

export class ConversationalAssistantService {

  /**
   * Helper: extrae texto plano de un Response de la Responses API
   */
  private extractTextFromResponse(resp: any): string {
    try {
      // Aggregated convenience field (if present in newer SDKs)
      if (resp?.output_text) return resp.output_text as string;

      const outputs = resp?.output || [];
      for (const item of outputs) {
        if (item?.type === 'message') {
          const parts = item?.content || [];
          const texts: string[] = [];
          for (const p of parts) {
            if (p?.type === 'output_text' && typeof p?.text === 'string') {
              texts.push(p.text);
            }
          }
          if (texts.length) return texts.join('');
        }
      }
    } catch (e) {
      logger.error('Error extracting text from response', { error: e });
    }
    return '';
  }

  /**
   * Crea una nueva conversación (OpenAI Conversations) y obtiene mensaje de bienvenida
   */
  async startConversation(userName: string): Promise<{
    conversationId: string;
    welcomeMessage: string;
  }> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    let conversationId: string | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 1) Crear conversación si aún no existe
        if (!conversationId) {
          const conv = await (openai as any).conversations.create();
          conversationId = conv.id;
          logger.info(`Conversation created: ${conversationId} for ${userName}`);
        }

        // 2) Verificar que conversationId existe antes de continuar
        if (!conversationId) {
          throw new Error('Conversation ID is null after creation');
        }

        // 3) Crear respuesta con instrucciones base + dinámicas (turno 1) y el input del usuario
        const instructions = `${CLARA_INSTRUCTIONS}\n\n${buildDynamicInstructions({
          userName,
          turnCount: 1,
          hasRealProblem: false,
        })}`;

        const response = await openai.responses.create({
          model: MODELS.TEXT,
          conversation: conversationId,
          instructions,
          input: [
            {
              type: 'message',
              role: 'user',
              content: [
                { type: 'input_text', text: `Mi nombre es ${userName}. Comienza el diagnóstico.` },
              ],
            },
          ],
        } as any);

        const messageText = this.extractTextFromResponse(response) ||
          'Hola, soy Clara. ¿Qué te trae por aquí?';

        logger.info(`Conversation started successfully for ${userName}, conversation: ${conversationId}`);

        return {
          conversationId: conversationId!,
          welcomeMessage: messageText,
        };

      } catch (error) {
        lastError = error as Error;
        logger.error(`Error starting conversation (attempt ${attempt + 1}/${maxRetries + 1}):`, {
          error,
          conversationId,
          userName,
        });

        if (attempt < maxRetries) {
          logger.info(`Retrying startConversation... attempt ${attempt + 2}/${maxRetries + 1}`);
          await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
          continue;
        }
      }
    }

    // Si llegamos aquí, todos los reintentos fallaron
    logger.error('All retry attempts failed for startConversation', {
      lastError,
      conversationId,
      userName,
    });
    throw lastError || new Error('Failed to start conversation after all retries');
  }

  /**
   * Procesa un mensaje del usuario
   */
  async processMessage(
    conversationId: string,
    userMessage: string,
    context: {
      userName?: string;
      mainProblem?: string;
      turnCount: number;
      hasRealProblem?: boolean;
      sessionId?: string;
      hasImage?: boolean;
      hasCompletedDiagnosis?: boolean;
      nameUsageCount?: number;
    },
    imageBuffer?: Buffer
  ): Promise<{
    message: string;
    isDiagnosisReady?: boolean;
    shouldEndConversation?: boolean;
  }> {
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 1) Construir instrucciones (base + dinámicas)
        const instructions = `${CLARA_INSTRUCTIONS}\n\n${buildDynamicInstructions(context)}`;

        // 2) Crear respuesta dentro de la conversación con el input del usuario (incluye imagen si aplica)
        const content: any[] = [{ type: 'input_text', text: userMessage }];
        if (imageBuffer) {
          const base64Image = imageBuffer.toString('base64');
          content.push({ type: 'input_image', image_url: `data:image/jpeg;base64,${base64Image}` });
        }
        const response = await openai.responses.create({
          model: MODELS.TEXT,
          conversation: conversationId,
          instructions,
          input: [
            {
              type: 'message',
              role: 'user',
              content,
            },
          ],
        } as any);

        const messageText = this.extractTextFromResponse(response);

        if (!messageText) {
          logger.error('Invalid message format from Responses API', {
            conversationId,
            response,
          });
          throw new Error('Invalid response format from model');
        }

        // 4) Señales para diagnóstico y fin de conversación
        // Si ya se completó el diagnóstico, NO activar señales
        const isDiagnosisReady = context.hasCompletedDiagnosis
          ? false
          : this.shouldGenerateDiagnosis(
            messageText,
            context.turnCount,
          );

        const shouldEndConversation = this.shouldEndConversation(
          messageText,
          context.hasRealProblem
        );

        // 5) Métricas de engagement
        if (context.sessionId) {
          if (context.turnCount === 5) {
            await this.trackConversationMetrics(context.sessionId, 'MILESTONE_5_QUESTIONS');
          } else if (context.turnCount === 10) {
            await this.trackConversationMetrics(context.sessionId, 'MILESTONE_10_QUESTIONS');
          }
        }

        logger.info(`Message processed successfully, turn: ${context.turnCount}, diagnosis ready: ${isDiagnosisReady}`);

        return {
          message: messageText,
          isDiagnosisReady,
          shouldEndConversation,
        };

      } catch (error) {
        lastError = error as Error;
        logger.error(`Error processing message (attempt ${attempt + 1}/${maxRetries + 1}):`, { error });

        if (attempt < maxRetries) {
          logger.info(`Retrying... attempt ${attempt + 2}/${maxRetries + 1}`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
      }
    }

    // Si llegamos aquí, todos los reintentos fallaron
    logger.error('All retry attempts failed', { lastError });
    throw lastError || new Error('Failed to process message after all retries');
  }

  /**
   * Tracks conversation metrics for optimization
   */
  private async trackConversationMetrics(
    sessionId: string,
    event: string,
    metadata?: any
  ): Promise<void> {
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          engagementSignals: {
            lastEvent: event,
            timestamp: new Date(),
            ...metadata
          }
        }
      });

      // Log para análisis
      logger.info(`[METRICS] ${event}`, {
        sessionId,
        ...metadata
      });
    } catch (error) {
      logger.error('Error tracking metrics:', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Genera el diagnóstico final usando toda la conversación
   */
  async generateDiagnosis(conversationId: string, userName: string): Promise<string> {
    try {
      // 1) Crear respuesta con instrucciones de diagnóstico y un input explícito del usuario
      const response = await openai.responses.create({
        model: MODELS.TEXT,
        conversation: conversationId,
        instructions: `${CLARA_INSTRUCTIONS}\n\n${DIAGNOSIS_INSTRUCTIONS}`,
        input: [
          {
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text: 'Genera mi diagnóstico personalizado ahora.' }],
          },
        ],
      } as any);

      const diagnosisMarkdown = this.extractTextFromResponse(response) || 'No se pudo generar el diagnóstico.';

      // 2) Convertir Markdown a HTML formateado
      const diagnosisHTML = convertDiagnosisToHTML(diagnosisMarkdown);

      logger.info(`Diagnosis generated for ${userName}`);

      return diagnosisHTML;

    } catch (error) {
      logger.error('Error generating diagnosis:', { error });
      throw error;
    }
  }

  /**
   * Detecta si es momento de generar diagnóstico
   */
  private shouldGenerateDiagnosis(
    message: string,
    turnCount: number,
  ): boolean {
    // FLUJO ESTRUCTURADO: En turno 23+ siempre generar diagnóstico
    // (turno 23 = después de responder las 21 preguntas + bienvenida + confirmación)
    if (turnCount >= 23) return true;

    // Si el mensaje contiene señales de diagnóstico (ampliado para instrucciones Ulises)
    const diagnosisSignals = [
      // Señales originales
      'basándome en lo que me has contado',
      'basandome en lo que',
      'puntos clave',
      'necesitas enfoque integral',
      'necesitas un enfoque',
      'diagnóstico de',
      'diagnóstico personalizado',
      'conclusión integradora',
      'preparar tu diagnóstico',
      'ya tengo todo',
      'dame un momento para preparar',
      'listo para tu diagnóstico',
      'generar tu diagnóstico',
      // Señales nuevas (instrucciones Ulises)
      'ya tengo bastante para darte',
      'tengo suficiente información',
      'con la información que me has dado',
      'con todo lo que me has contado',
      'veo un patrón muy claro',
      'veo un patrón claro',
      'gracias por todo lo que has compartido',
      'gracias por abrirte así',
      'este conjunto encaja perfectamente',
      'encaja perfectamente con un perfil',
      'perfil digestivo',
      'perfil emocional',
      'perfil mixto',
      'perfil estético',
      'tu diagnóstico',
      'mi diagnóstico para ti',
    ];

    return diagnosisSignals.some(signal =>
      new RegExp(signal, 'i').test(message)
    );
  }

  /**
   * Detecta si debe terminar conversación (usuario no tiene problema)
   */
  private shouldEndConversation(
    message: string,
    hasRealProblem?: boolean
  ): boolean {
    if (hasRealProblem) return false;

    const endSignals = [
      'lo dejamos aquí',
      'aquí estoy si necesitas',
      'si en algún momento tienes dudas'
    ];

    return endSignals.some(signal =>
      new RegExp(signal, 'i').test(message)
    );
  }
}

export const conversationalAssistant = new ConversationalAssistantService();
