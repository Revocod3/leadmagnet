/**
 * Conversational Assistant Service
 * 
 * Servicio MINIMALISTA que orquesta la conversación usando Assistants API.
 * 
 * FILOSOFÍA: 80% lógica en instrucciones, 20% orquestación en código.
 * Este archivo es SOLO orquestación. NO contiene lógica conversacional.
 */

import { openai } from '../config/openai';
import {
  buildDynamicInstructions,
  DIAGNOSIS_INSTRUCTIONS
} from '../config/assistant-instructions-optimized';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

// ID del Assistant (se crea una vez y se reutiliza)
const ASSISTANT_ID = process.env.CLARA_ASSISTANT_ID || '';

export class ConversationalAssistantService {

  /**
   * Crea un nuevo thread y obtiene mensaje de bienvenida
   */
  async startConversation(userName: string): Promise<{
    threadId: string;
    welcomeMessage: string;
  }> {
    try {
      // 1. Crear thread nuevo
      const thread = await openai.beta.threads.create();

      // 2. Agregar mensaje de sistema para inicializar
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: `Mi nombre es ${userName}. Comienza el diagnóstico.`
      });

      // 3. Ejecutar assistant con instrucciones iniciales
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: ASSISTANT_ID,
        additional_instructions: buildDynamicInstructions({
          userName,
          turnCount: 1,
          hasRealProblem: false
        })
      });

      // 4. Esperar respuesta
      const completedRun = await this.waitForCompletion(thread.id, run.id);

      if (completedRun.status !== 'completed') {
        throw new Error('Run did not complete successfully');
      }

      // 5. Obtener mensaje de bienvenida
      const messages = await openai.beta.threads.messages.list(thread.id);
      const firstMessage = messages.data[0]?.content[0];

      const messageText = firstMessage && firstMessage.type === 'text'
        ? firstMessage.text.value
        : 'Hola, soy Clara. ¿Qué te trae por aquí?';

      logger.info(`Conversation started for ${userName}, thread: ${thread.id}`);

      return {
        threadId: thread.id,
        welcomeMessage: messageText
      };

    } catch (error) {
      logger.error('Error starting conversation:', { error });
      throw error;
    }
  }

  /**
   * Procesa un mensaje del usuario
   */
  async processMessage(
    threadId: string,
    userMessage: string,
    context: {
      userName?: string;
      mainProblem?: string;
      turnCount: number;
      hasRealProblem?: boolean;
      sessionId?: string;
      hasImage?: boolean;
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
        // 1. Agregar mensaje del usuario al thread (solo en el primer intento)
        if (attempt === 0) {
          // Si hay imagen, convertirla a base64 y agregarla al mensaje
          if (imageBuffer) {
            const base64Image = imageBuffer.toString('base64');

            await openai.beta.threads.messages.create(threadId, {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: userMessage
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ] as any
            });
          } else {
            // Sin imagen, solo texto
            await openai.beta.threads.messages.create(threadId, {
              role: 'user',
              content: userMessage
            });
          }
        }

        // 2. Construir instrucciones dinámicas basadas en contexto
        const additionalInstructions = buildDynamicInstructions(context);

        // 3. Ejecutar run con instrucciones dinámicas
        const run = await openai.beta.threads.runs.create(threadId, {
          assistant_id: ASSISTANT_ID,
          additional_instructions: additionalInstructions
        });

        // 4. Esperar completación
        const completedRun = await this.waitForCompletion(threadId, run.id);

        if (completedRun.status !== 'completed') {
          logger.error('Run did not complete successfully', {
            status: completedRun.status,
            lastError: completedRun.last_error,
            threadId,
            runId: run.id,
            attempt: attempt + 1
          });

          if (attempt < maxRetries) {
            logger.info(`Retrying... attempt ${attempt + 2}/${maxRetries + 1}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
            continue;
          }

          throw new Error(`Run failed with status: ${completedRun.status}`);
        }

        // 5. Obtener respuesta del assistant
        const messages = await openai.beta.threads.messages.list(threadId, {
          limit: 1,
          order: 'desc'
        });

        const firstContent = messages.data[0]?.content[0];

        if (!firstContent || firstContent.type !== 'text') {
          logger.error('Invalid message format from assistant', {
            threadId,
            runId: run.id,
            messageData: messages.data[0]
          });
          throw new Error('Invalid response format from assistant');
        }

        const messageText = firstContent.text.value;

        // 6. Detectar si es momento de generar diagnóstico
        const isDiagnosisReady = this.shouldGenerateDiagnosis(
          messageText,
          context.turnCount,
          context.hasRealProblem
        );

        // 7. Detectar si debe terminar conversación (usuario no tiene problema)
        const shouldEndConversation = this.shouldEndConversation(
          messageText,
          context.hasRealProblem
        );

        // 8. Tracking de progreso (solo si hay sessionId)
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
          shouldEndConversation
        };

      } catch (error) {
        lastError = error as Error;
        logger.error(`Error processing message (attempt ${attempt + 1}/${maxRetries + 1}):`, { error });

        if (attempt < maxRetries) {
          logger.info(`Retrying... attempt ${attempt + 2}/${maxRetries + 1}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
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
   * Genera el diagnóstico final usando todo el thread
   */
  async generateDiagnosis(threadId: string, userName: string): Promise<string> {
    try {
      // 1. Agregar instrucción para generar diagnóstico
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: 'Genera mi diagnóstico personalizado ahora.'
      });

      // 2. Ejecutar con instrucciones de diagnóstico
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: ASSISTANT_ID,
        additional_instructions: DIAGNOSIS_INSTRUCTIONS
      });

      // 3. Esperar completación
      const completedRun = await this.waitForCompletion(threadId, run.id);

      if (completedRun.status !== 'completed') {
        throw new Error('Diagnosis generation failed');
      }

      // 4. Obtener diagnóstico
      const messages = await openai.beta.threads.messages.list(threadId, {
        limit: 1,
        order: 'desc'
      });

      const firstContent = messages.data[0]?.content[0];
      const diagnosis = firstContent && firstContent.type === 'text'
        ? firstContent.text.value
        : 'No se pudo generar el diagnóstico.';

      logger.info(`Diagnosis generated for ${userName}`);

      return diagnosis;

    } catch (error) {
      logger.error('Error generating diagnosis:', { error });
      throw error;
    }
  }

  /**
   * Espera a que un run se complete
   */
  private async waitForCompletion(threadId: string, runId: string, maxAttempts = 30) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const run = await openai.beta.threads.runs.retrieve(threadId, runId);

      if (run.status === 'completed') {
        return run;
      }

      if (run.status === 'failed') {
        logger.error('Run failed:', {
          threadId,
          runId,
          status: run.status,
          last_error: run.last_error
        });
        throw new Error(`Run failed: ${run.last_error?.message || 'Unknown error'}`);
      }

      if (run.status === 'cancelled') {
        logger.error('Run was cancelled:', { threadId, runId });
        throw new Error('Run was cancelled');
      }

      // Esperar 1 segundo antes de verificar de nuevo
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Run did not complete in time');
  }

  /**
   * Detecta si es momento de generar diagnóstico
   */
  private shouldGenerateDiagnosis(
    message: string,
    turnCount: number,
    hasRealProblem?: boolean
  ): boolean {
    // No generar diagnóstico si no hay problema real
    if (!hasRealProblem) return false;

    // Si ya hay muchos turnos (16+), generar diagnóstico
    if (turnCount >= 16) return true;

    // Si el mensaje contiene señales de diagnóstico
    const diagnosisSignals = [
      'basándome en lo que me has contado',
      'basandome en lo que',
      'hola \\w+,',
      'puntos clave',
      'necesitas enfoque integral',
      'necesitas un enfoque',
      'diagnóstico de',
      'diagnóstico personalizado',
      'conclusión integradora'
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
