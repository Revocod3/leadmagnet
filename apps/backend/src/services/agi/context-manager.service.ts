import { prisma } from '../../config/database';
import type {
  AGIContext,
  MemoryItem,
  ExtractedInfo,
  EmotionalProfile,
  PersonalityProfile,
  EmotionalTone
} from '../../types/agi.types';

export class ContextManagerService {
  private contexts: Map<string, AGIContext> = new Map();

  /**
   * Obtiene o crea el contexto AGI para una sesión
   */
  async getOrCreateContext(sessionId: string, userId?: string): Promise<AGIContext> {
    // Verificar si ya existe en memoria
    if (this.contexts.has(sessionId)) {
      return this.contexts.get(sessionId)!;
    }

    // Intentar buscar en base de datos (opcional - puede no existir aún)
    let session = null;
    try {
      session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 20 // Últimos 20 mensajes para contexto
          }
        }
      });
    } catch (error) {
      console.log('Session not found in DB, creating in-memory context');
    }

    // Crear contexto inicial (con o sin sesión de DB)
    const context: AGIContext = {
      conversationId: sessionId,
      userId: userId || session?.userId || '',
      sessionStart: session?.startTime || new Date(),
      shortTermMemory: [],
      longTermMemory: this.initializeExtractedInfo(),
      emotionalState: this.initializeEmotionalProfile(),
      personalityProfile: this.initializePersonalityProfile()
    };

    // Cargar memoria desde mensajes existentes si hay sesión
    if (session?.messages) {
      await this.loadMemoryFromMessages(context, session.messages);
    }

    // Guardar en memoria
    this.contexts.set(sessionId, context);

    return context;
  }

  /**
   * Actualiza el contexto con nueva información
   */
  async updateContext(
    sessionId: string,
    updates: {
      newAnswer?: { questionId: number; question: string; answer: string };
      extractedInfo?: Partial<ExtractedInfo>;
      emotionalTone?: EmotionalTone;
      personalityAdjustments?: Partial<PersonalityProfile>;
    }
  ): Promise<AGIContext> {
    const context = await this.getOrCreateContext(sessionId);

    // Agregar nueva respuesta a memoria corta
    if (updates.newAnswer) {
      const memoryItem: MemoryItem = {
        questionId: updates.newAnswer.questionId,
        question: updates.newAnswer.question,
        answer: updates.newAnswer.answer,
        timestamp: new Date(),
        extractedInfo: {},
        emotionalTone: updates.emotionalTone || 'neutral'
      };

      context.shortTermMemory.unshift(memoryItem);

      // Mantener solo las últimas 5 respuestas
      if (context.shortTermMemory.length > 5) {
        context.shortTermMemory = context.shortTermMemory.slice(0, 5);
      }
    }

    // Actualizar información extraída
    if (updates.extractedInfo) {
      context.longTermMemory = {
        ...context.longTermMemory,
        ...updates.extractedInfo
      };
    }

    // Actualizar estado emocional
    if (updates.emotionalTone) {
      context.emotionalState.currentTone = updates.emotionalTone;
      context.emotionalState.toneHistory.push({
        tone: updates.emotionalTone,
        timestamp: new Date()
      });

      // Mantener solo últimos 10 estados emocionales
      if (context.emotionalState.toneHistory.length > 10) {
        context.emotionalState.toneHistory = context.emotionalState.toneHistory.slice(-10);
      }

      // Actualizar emoción dominante
      context.emotionalState.dominantEmotion = this.calculateDominantEmotion(context.emotionalState.toneHistory);
    }

    // Actualizar perfil de personalidad
    if (updates.personalityAdjustments) {
      context.personalityProfile = {
        ...context.personalityProfile,
        ...updates.personalityAdjustments
      };
    }

    // Persistir cambios en base de datos
    await this.persistContext(sessionId, context);

    return context;
  }

  /**
   * Obtiene resumen contextual para prompts
   */
  getContextSummary(context: AGIContext): string {
    const { longTermMemory, emotionalState, personalityProfile } = context;

    let summary = 'CONTEXTO DEL USUARIO:\n';

    // Información demográfica
    if (longTermMemory.demographics.age) {
      summary += `• Edad: ${longTermMemory.demographics.age} años\n`;
    }
    if (longTermMemory.demographics.occupation) {
      summary += `• Ocupación: ${longTermMemory.demographics.occupation}\n`;
    }

    // Información de salud
    if (longTermMemory.health.mainProblem) {
      summary += `• Problema principal: ${longTermMemory.health.mainProblem}\n`;
    }
    if (longTermMemory.health.duration) {
      summary += `• Duración: ${longTermMemory.health.duration}\n`;
    }

    // Estilo de vida
    if (longTermMemory.lifestyle.diet) {
      summary += `• Alimentación: ${longTermMemory.lifestyle.diet}\n`;
    }
    if (longTermMemory.lifestyle.stress) {
      summary += `• Estrés: ${longTermMemory.lifestyle.stress}\n`;
    }

    // Estado emocional actual
    summary += `• Estado emocional: ${emotionalState.currentTone}\n`;

    // Perfil de personalidad aplicado
    summary += `• Estilo de comunicación: ${personalityProfile.formalityLevel}, ${personalityProfile.empathyLevel} empatía\n`;

    return summary;
  }

  /**
   * Obtiene las últimas N respuestas para contexto inmediato
   */
  getRecentAnswers(context: AGIContext, count: number = 3): MemoryItem[] {
    return context.shortTermMemory.slice(0, count);
  }

  /**
   * Limpia contexto de memoria (útil para testing)
   */
  clearContext(sessionId: string): void {
    this.contexts.delete(sessionId);
  }

  // ========== MÉTODOS PRIVADOS ==========

  private initializeExtractedInfo(): ExtractedInfo {
    return {
      demographics: {},
      health: {},
      lifestyle: {},
      goals: {},
      patterns: []
    };
  }

  private initializeEmotionalProfile(): EmotionalProfile {
    return {
      currentTone: 'neutral',
      toneHistory: [],
      dominantEmotion: 'neutral'
    };
  }

  private initializePersonalityProfile(): PersonalityProfile {
    return {
      formalityLevel: 'balanced',
      empathyLevel: 'medium',
      technicalLevel: 'moderate',
      encouragementStyle: 'motivational'
    };
  }

  private async loadMemoryFromMessages(context: AGIContext, messages: any[]): Promise<void> {
    // Convertir mensajes de la BD a MemoryItems
    // Esto es una simplificación - en producción necesitaríamos más lógica
    for (const message of messages.slice(0, 5)) { // Solo últimos 5
      if (message.role === 'user' && message.metadata?.questionId) {
        const memoryItem: MemoryItem = {
          questionId: message.metadata.questionId,
          question: message.metadata.question || 'Pregunta anterior',
          answer: message.content,
          timestamp: message.createdAt,
          extractedInfo: {},
          emotionalTone: 'neutral' // Simplificación
        };

        context.shortTermMemory.push(memoryItem);
      }
    }
  }

  private calculateDominantEmotion(toneHistory: { tone: EmotionalTone; timestamp: Date }[]): EmotionalTone {
    if (toneHistory.length === 0) return 'neutral';

    const counts: Record<EmotionalTone, number> = {
      hopeful: 0,
      frustrated: 0,
      resigned: 0,
      enthusiastic: 0,
      anxious: 0,
      neutral: 0,
      overwhelmed: 0
    };

    // Contar últimas 5 emociones
    toneHistory.slice(-5).forEach(item => {
      counts[item.tone]++;
    });

    // Encontrar el más frecuente
    let dominant: EmotionalTone = 'neutral';
    let maxCount = 0;

    Object.entries(counts).forEach(([tone, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominant = tone as EmotionalTone;
      }
    });

    return dominant;
  }

  private async persistContext(sessionId: string, context: AGIContext): Promise<void> {
    // NOTA: sessionId aquí es el agiSessionId (agi_username_timestamp_random)
    // NO es el ID real de la sesión en la base de datos
    // Por ahora, guardamos el contexto solo en memoria
    // En producción, podríamos tener una tabla dedicada para contextos AGI

    // NO hacer update a session porque el sessionId no es el ID correcto
    // await prisma.session.update({
    //   where: { id: sessionId },
    //   data: {
    //     // Aquí podríamos guardar un resumen serializado
    //   }
    // });
  }
}