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
  CLARA_INSTRUCTIONS,
  buildDynamicInstructions,
  DIAGNOSIS_INSTRUCTIONS
} from '../config/assistant-instructions';
import { logger } from '../utils/logger';

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
        content: `Mi nombre es ${userName}. Hola.`
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
    }
  ): Promise<{
    message: string;
    isDiagnosisReady?: boolean;
    shouldEndConversation?: boolean;
  }> {
    try {
      // 1. Agregar mensaje del usuario al thread
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: userMessage
      });

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
        throw new Error('Run did not complete successfully');
      }

      // 5. Obtener respuesta del assistant
      const messages = await openai.beta.threads.messages.list(threadId, {
        limit: 1,
        order: 'desc'
      });

      const firstContent = messages.data[0]?.content[0];
      const messageText = firstContent && firstContent.type === 'text'
        ? firstContent.text.value
        : 'Lo siento, hubo un error.';

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

      logger.info(`Message processed, turn: ${context.turnCount}, diagnosis ready: ${isDiagnosisReady}`);

      return {
        message: messageText,
        isDiagnosisReady,
        shouldEndConversation
      };

    } catch (error) {
      logger.error('Error processing message:', { error });
      throw error;
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

      if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
        return run;
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

    // Si ya hay muchos turnos (12+)
    if (turnCount >= 12) return true;

    // Si el mensaje contiene señales de diagnóstico
    const diagnosisSignals = [
      'basándome en lo que me has contado',
      'hola ' + '\\w+, ',
      'puntos clave',
      'necesitas enfoque integral'
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
