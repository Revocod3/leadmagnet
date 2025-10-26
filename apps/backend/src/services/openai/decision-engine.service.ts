import { openai } from '../../config/openai';
import { MODELS } from '../../config/openai';
import type {
  DecisionType,
  ConversationalDecision,
  ConversationalMemory,
  KeyMoment,
} from '../../types';

/**
 * DecisionEngineService
 * 
 * The "brain" of the conversational system. Analyzes each user response and decides:
 * - follow-up: Ask deeper about what user just said
 * - pivot: Change topic to something more important
 * - clarify: User was unclear, need clarification
 * - callback: Return to earlier topic user introduced
 * - continue: Move to new exploratory topic
 * - conclude: We have enough information for diagnosis
 */
export class DecisionEngineService {
  /**
   * Main decision method - analyzes response and decides next action
   */
  async decide(
    userMessage: string,
    memory: ConversationalMemory,
    recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>,
    detectedKeyMoments: KeyMoment[]
  ): Promise<ConversationalDecision> {
    // 1. PRIORITY: Handle key moments first
    if (detectedKeyMoments.length > 0) {
      const priorityMoment = detectedKeyMoments.find(
        m => m.type === 'vulnerability' || m.type === 'breakthrough'
      );

      if (priorityMoment) {
        return {
          type: 'follow-up',
          reasoning: `Momento clave detectado (${priorityMoment.type}): ${priorityMoment.significance}`,
          topicToExplore: priorityMoment.content,
          keyMomentToAddress: priorityMoment.turn,
        };
      }
    }

    // 2. Check if user introduced new important topic
    const newTopic = await this.detectNewImportantTopic(userMessage, memory);
    if (newTopic) {
      return {
        type: 'follow-up',
        reasoning: `Usuario introdujo tema importante: ${newTopic}. Debemos profundizar inmediatamente.`,
        topicToExplore: newTopic,
      };
    }

    // 3. Check if response was too vague
    if (this.isResponseVague(userMessage)) {
      return {
        type: 'clarify',
        reasoning: 'Respuesta muy vaga o corta. Necesitamos más detalles.',
        suggestedQuestion: this.generateClarificationQuestion(userMessage, recentMessages),
      };
    }

    // 4. Check if we should conclude
    const shouldConclude = this.shouldConclude(memory);
    if (shouldConclude.should) {
      return {
        type: 'conclude',
        reasoning: shouldConclude.reason,
      };
    }

    // 5. Check if we should callback to earlier topic
    const callbackTopic = this.shouldCallback(memory, recentMessages);
    if (callbackTopic) {
      return {
        type: 'callback',
        reasoning: `Usuario mencionó "${callbackTopic}" antes pero no profundizamos. Es momento de volver a ese tema.`,
        topicToExplore: callbackTopic,
      };
    }

    // 6. Check conversation balance - are we exploring enough?
    const pivotTopic = this.shouldPivot(memory);
    if (pivotTopic) {
      return {
        type: 'pivot',
        reasoning: `Necesitamos explorar "${pivotTopic}" para tener un panorama completo.`,
        topicToExplore: pivotTopic,
      };
    }

    // 7. Default: Continue with natural flow
    return {
      type: 'continue',
      reasoning: 'Continuar con flujo natural de exploración.',
      topicToExplore: this.getNextExploratoryTopic(memory),
    };
  }

  /**
   * Detect if user introduced a new important topic that needs follow-up
   */
  private async detectNewImportantTopic(
    userMessage: string,
    memory: ConversationalMemory
  ): Promise<string | null> {
    // Skip very short messages
    if (userMessage.length < 30) {
      return null;
    }

    // Use AI to detect if user introduced something important
    try {
      const prompt = `Analiza si el usuario introdujo un tema NUEVO y IMPORTANTE sobre su salud digestiva.

INFORMACIÓN PREVIA:
- Problema: ${memory.factualInfo.health?.mainProblem || 'No especificado'}
- Síntomas conocidos: ${memory.factualInfo.health?.symptoms?.join(', ') || 'Ninguno'}
- Triggers conocidos: ${memory.factualInfo.health?.triggers?.join(', ') || 'Ninguno'}

RESPUESTA DEL USUARIO:
"${userMessage}"

Si el usuario mencionó algo NUEVO e IMPORTANTE que no estaba en la información previa, extrae SOLO ese tema específico en 2-4 palabras.
Si NO hay nada nuevo importante, responde: NOTHING

Ejemplos:
- Usuario: "Noto que me pasa más cuando como tarde" → "horarios de comida"
- Usuario: "Sí, algo así" → NOTHING
- Usuario: "Desde que estoy con más estrés en el trabajo" → "estrés laboral"`;

      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 20,
      });

      const result = response.choices[0]?.message?.content?.trim();
      return result && result !== 'NOTHING' ? result : null;
    } catch (error) {
      console.error('Error detecting new topic:', error);
      return null;
    }
  }

  /**
   * Check if response is too vague
   */
  private isResponseVague(userMessage: string): boolean {
    const trimmed = userMessage.trim();

    // Very short responses
    if (trimmed.length < 15) {
      const vaguePatterns = [
        /^sí$/i,
        /^no$/i,
        /^normal$/i,
        /^bien$/i,
        /^mal$/i,
        /^más o menos$/i,
        /^a veces$/i,
        /^depende$/i,
        /^no sé$/i,
      ];

      return vaguePatterns.some(p => p.test(trimmed));
    }

    return false;
  }

  /**
   * Generate clarification question
   */
  private generateClarificationQuestion(
    vagueResponse: string,
    recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): string {
    // Get the last assistant question
    const lastAssistantMsg = [...recentMessages].reverse().find(m => m.role === 'assistant');

    if (lastAssistantMsg) {
      return `Podrías darme más detalles sobre eso? Quiero entender mejor tu situación.`;
    }

    return 'Cuéntame más sobre eso.';
  }

  /**
   * Determine if we have enough information to conclude
   */
  private shouldConclude(memory: ConversationalMemory): { should: boolean; reason: string } {
    const info = memory.factualInfo;
    const turnCount = memory.turnCount;

    // Minimum criteria for conclusion
    const hasBasicInfo = !!(
      info.demographics?.age &&
      info.demographics?.occupation &&
      info.health?.mainProblem &&
      info.health?.duration
    );

    const hasLifestyleInfo = !!(info.lifestyle?.diet || info.lifestyle?.stress || info.lifestyle?.sleep);

    const hasEnoughTurns = turnCount >= 10;

    const hasHighConfidenceHypothesis = (memory.currentHypothesis?.confidence || 0) >= 70;

    // Can conclude if:
    // 1. Basic info + lifestyle info + enough turns
    // 2. OR basic info + high confidence hypothesis + at least 8 turns
    if (hasBasicInfo && hasLifestyleInfo && hasEnoughTurns) {
      return {
        should: true,
        reason: 'Tenemos información completa sobre demografía, problema, duración, y estilo de vida. Podemos generar diagnóstico.',
      };
    }

    if (hasBasicInfo && hasHighConfidenceHypothesis && turnCount >= 8) {
      return {
        should: true,
        reason: `Hipótesis de alta confianza (${memory.currentHypothesis.confidence}%) con información básica completa.`,
      };
    }

    // Don't conclude yet
    return {
      should: false,
      reason: `Necesitamos más información. Turnos: ${turnCount}, Info básica: ${hasBasicInfo}, Lifestyle: ${hasLifestyleInfo}`,
    };
  }

  /**
   * Check if we should callback to earlier topic
   */
  private shouldCallback(
    memory: ConversationalMemory,
    recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): string | null {
    // Check key moments that weren't fully explored
    const unexploredMoments = memory.keyMoments.filter(m => !m.followUpAction?.includes('EXPLORED'));

    if (unexploredMoments.length > 0 && memory.turnCount > 6) {
      const moment = unexploredMoments[0];
      return moment?.content || null;
    }

    return null;
  }

  /**
   * Check if we should pivot to unexplored essential topic
   */
  private shouldPivot(memory: ConversationalMemory): string | null {
    const info = memory.factualInfo;
    const explored = memory.topicsExplored;

    // Essential topics to cover
    const essentialTopics = [
      { topic: 'alimentación', covered: !!info.lifestyle?.diet },
      { topic: 'estrés', covered: !!info.lifestyle?.stress },
      { topic: 'sueño', covered: !!info.lifestyle?.sleep },
      { topic: 'ejercicio', covered: !!info.lifestyle?.exercise },
      { topic: 'triggers', covered: (info.health?.triggers?.length || 0) > 0 },
    ];

    // Find first uncovered essential topic
    const uncovered = essentialTopics.find(t => !t.covered && !explored.includes(t.topic));

    if (uncovered && memory.turnCount > 4) {
      return uncovered.topic;
    }

    return null;
  }

  /**
   * Get next exploratory topic
   */
  private getNextExploratoryTopic(memory: ConversationalMemory): string {
    const explored = memory.topicsExplored;

    const potentialTopics = [
      'alimentación',
      'síntomas específicos',
      'triggers',
      'estilo de vida',
      'estrés',
      'sueño',
      'ejercicio',
      'historial médico',
      'objetivos',
    ];

    const unexplored = potentialTopics.filter(t => !explored.includes(t));

    return unexplored[0] || 'exploración general';
  }

  /**
   * Analyze response quality to help instruction builder
   */
  analyzeResponseQuality(userMessage: string): {
    length: 'short' | 'medium' | 'long';
    specificity: 'vague' | 'general' | 'specific';
    emotionalContent: 'low' | 'medium' | 'high';
  } {
    const wordCount = userMessage.split(/\s+/).length;

    const length: 'short' | 'medium' | 'long' =
      wordCount < 10 ? 'short' : wordCount < 30 ? 'medium' : 'long';

    const specificity: 'vague' | 'general' | 'specific' = this.isResponseVague(userMessage)
      ? 'vague'
      : wordCount > 20
        ? 'specific'
        : 'general';

    const emotionalWords = [
      'siento',
      'me hace',
      'frustrado',
      'desesperado',
      'preocupado',
      'ansioso',
      'feliz',
      'esperanza',
    ];
    const hasEmotionalContent = emotionalWords.some(word =>
      userMessage.toLowerCase().includes(word)
    );

    const emotionalContent: 'low' | 'medium' | 'high' =
      hasEmotionalContent && wordCount > 20 ? 'high' : hasEmotionalContent ? 'medium' : 'low';

    return { length, specificity, emotionalContent };
  }
}
