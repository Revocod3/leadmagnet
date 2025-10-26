import { openai } from '../../config/openai';
import { MODELS } from '../../config/openai';
import type {
  KeyMoment,
  KeyMomentType,
  EmotionalTone,
  ConversationalMemory,
} from '../../types';

/**
 * KeyMomentDetectorService
 * 
 * Detects important moments in the conversation that require special attention:
 * - Repetition: User repeats same concern
 * - Contradiction: User contradicts previous statement
 * - Breakthrough: Critical information revealed
 * - Vulnerability: Emotional vulnerability shown
 * - Resistance: User deflects or resists
 * - Insight: User has self-realization
 */
export class KeyMomentDetectorService {
  /**
   * Analyze a user response for key moments
   */
  async detectKeyMoments(
    userMessage: string,
    turnNumber: number,
    memory: ConversationalMemory,
    recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<KeyMoment[]> {
    const detectedMoments: KeyMoment[] = [];

    // 1. Check for repetition
    const repetitionMoment = this.detectRepetition(userMessage, memory, turnNumber);
    if (repetitionMoment) {
      detectedMoments.push(repetitionMoment);
    }

    // 2. Check for contradiction
    const contradictionMoment = this.detectContradiction(userMessage, memory, turnNumber);
    if (contradictionMoment) {
      detectedMoments.push(contradictionMoment);
    }

    // 3. Check for vulnerability (emotional markers)
    const vulnerabilityMoment = await this.detectVulnerability(userMessage, turnNumber);
    if (vulnerabilityMoment) {
      detectedMoments.push(vulnerabilityMoment);
    }

    // 4. Check for breakthrough (new critical info)
    const breakthroughMoment = await this.detectBreakthrough(
      userMessage,
      turnNumber,
      memory,
      recentMessages
    );
    if (breakthroughMoment) {
      detectedMoments.push(breakthroughMoment);
    }

    // 5. Check for resistance
    const resistanceMoment = this.detectResistance(userMessage, turnNumber);
    if (resistanceMoment) {
      detectedMoments.push(resistanceMoment);
    }

    return detectedMoments;
  }

  /**
   * Detect if user is repeating the same concern
   */
  private detectRepetition(
    userMessage: string,
    memory: ConversationalMemory,
    turnNumber: number
  ): KeyMoment | null {
    const lowerMessage = userMessage.toLowerCase();

    // Check if user mentions same symptoms/problems mentioned before
    const previousSymptoms = memory.factualInfo.health?.symptoms || [];
    const previousTriggers = memory.factualInfo.health?.triggers || [];

    let repeatedConcern: string | null = null;

    for (const symptom of previousSymptoms) {
      if (lowerMessage.includes(symptom.toLowerCase())) {
        repeatedConcern = symptom;
        break;
      }
    }

    if (!repeatedConcern) {
      for (const trigger of previousTriggers) {
        if (lowerMessage.includes(trigger.toLowerCase())) {
          repeatedConcern = trigger;
          break;
        }
      }
    }

    // Check previous key moments for same type
    const previousRepetitions = memory.keyMoments.filter(m => m.type === 'repetition');

    if (repeatedConcern && previousRepetitions.length > 0) {
      return {
        turn: turnNumber,
        type: 'repetition',
        content: userMessage,
        significance: `Usuario mencionó de nuevo: "${repeatedConcern}". Esto indica que es una preocupación central que necesita atención especial.`,
        followUpAction: `Profundizar en ${repeatedConcern} y validar la frustración del usuario.`,
      };
    }

    return null;
  }

  /**
   * Detect if user contradicts something they said before
   */
  private detectContradiction(
    userMessage: string,
    memory: ConversationalMemory,
    turnNumber: number
  ): KeyMoment | null {
    // Simple heuristic: check for contradictory patterns
    const lowerMessage = userMessage.toLowerCase();

    const contradictionPatterns = [
      { pattern: /pero antes|aunque antes|en realidad|la verdad es que/i, strength: 'medium' },
      { pattern: /me equivoqu|no es así|no exactamente/i, strength: 'high' },
      { pattern: /bueno,? (en realidad|la verdad)/i, strength: 'medium' },
    ];

    for (const { pattern, strength } of contradictionPatterns) {
      if (pattern.test(lowerMessage)) {
        return {
          turn: turnNumber,
          type: 'contradiction',
          content: userMessage,
          significance: `Usuario parece corregir o matizar información previa. Esto puede indicar reflexión más profunda o que se siente más cómodo compartiendo.`,
          followUpAction: 'Clarificar qué es lo correcto y ajustar información recopilada.',
        };
      }
    }

    return null;
  }

  /**
   * Detect vulnerability (emotional openness)
   */
  private async detectVulnerability(
    userMessage: string,
    turnNumber: number
  ): Promise<KeyMoment | null> {
    // Check for emotional words indicating vulnerability
    const vulnerabilityIndicators = [
      'me siento',
      'estoy desesperado',
      'no sé qué hacer',
      'he perdido',
      'me da miedo',
      'estoy cansado de',
      'no aguanto más',
      'me frustra',
      'siento que',
      'me hace sentir',
    ];

    const lowerMessage = userMessage.toLowerCase();
    const hasVulnerabilityMarker = vulnerabilityIndicators.some(indicator =>
      lowerMessage.includes(indicator)
    );

    if (hasVulnerabilityMarker && userMessage.length > 50) {
      // Long response with emotional content = vulnerability
      return {
        turn: turnNumber,
        type: 'vulnerability',
        content: userMessage,
        significance: 'Usuario mostró vulnerabilidad emocional. Momento crítico para empatía y validación.',
        emotionalContext: await this.detectEmotionalTone(userMessage),
        followUpAction: 'Validar emoción, mostrar comprensión, y ofrecer esperanza.',
      };
    }

    return null;
  }

  /**
   * Detect breakthrough (critical new information)
   */
  private async detectBreakthrough(
    userMessage: string,
    turnNumber: number,
    memory: ConversationalMemory,
    recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<KeyMoment | null> {
    // Use AI to detect if this is breakthrough info
    if (userMessage.length < 30) {
      return null; // Too short to be breakthrough
    }

    try {
      const prompt = `Analiza si esta respuesta del usuario contiene información CRÍTICA que explica su problema digestivo.

CONTEXTO:
- Problema principal: ${memory.factualInfo.health?.mainProblem || 'No especificado'}
- Síntomas: ${memory.factualInfo.health?.symptoms?.join(', ') || 'No especificados'}

RESPUESTA DEL USUARIO:
"${userMessage}"

¿Esta respuesta contiene información CRÍTICA que conecta o explica su problema digestivo?

Responde SOLO con: YES o NO

Ejemplos de información CRÍTICA:
- Conexión entre estrés/situación y síntomas
- Patrón temporal revelador
- Trigger alimentario específico
- Condición médica relevante no mencionada antes`;

      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 10,
      });

      const answer = response.choices[0]?.message?.content?.trim().toUpperCase();

      if (answer === 'YES') {
        return {
          turn: turnNumber,
          type: 'breakthrough',
          content: userMessage,
          significance: 'Usuario reveló información crítica que puede ser clave para el diagnóstico.',
          followUpAction: 'Explorar esta información en profundidad inmediatamente.',
        };
      }
    } catch (error) {
      console.error('Error detecting breakthrough:', error);
    }

    return null;
  }

  /**
   * Detect resistance (deflection, avoidance)
   */
  private detectResistance(
    userMessage: string,
    turnNumber: number
  ): KeyMoment | null {
    const lowerMessage = userMessage.toLowerCase().trim();

    // Check for very short, evasive answers
    if (userMessage.length < 15) {
      const evasivePatterns = [
        /^no sé$/i,
        /^no estoy seguro/i,
        /^normal$/i,
        /^bien$/i,
        /^mal$/i,
        /^depende$/i,
        /^a veces$/i,
      ];

      if (evasivePatterns.some(p => p.test(lowerMessage))) {
        return {
          turn: turnNumber,
          type: 'resistance',
          content: userMessage,
          significance: 'Usuario dio respuesta evasiva. Puede indicar incomodidad con el tema o falta de información.',
          followUpAction: 'Replantear pregunta de forma más específica o cambiar de ángulo.',
        };
      }
    }

    return null;
  }

  /**
   * Detect emotional tone (helper method)
   */
  private async detectEmotionalTone(text: string): Promise<EmotionalTone> {
    try {
      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [
          {
            role: 'system',
            content:
              'Detecta el tono emocional y responde SOLO con una palabra: hopeful, frustrated, resigned, enthusiastic, anxious, neutral, overwhelmed.',
          },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        max_tokens: 10,
      });

      const tone = response.choices[0]?.message?.content?.trim().toLowerCase() as EmotionalTone;
      return ['hopeful', 'frustrated', 'resigned', 'enthusiastic', 'anxious', 'neutral', 'overwhelmed'].includes(
        tone
      )
        ? tone
        : 'neutral';
    } catch (error) {
      console.error('Error detecting emotional tone:', error);
      return 'neutral';
    }
  }

  /**
   * Check if a key moment requires immediate attention
   */
  shouldPrioritize(moment: KeyMoment): boolean {
    // Vulnerability and breakthrough always require immediate follow-up
    if (moment.type === 'vulnerability' || moment.type === 'breakthrough') {
      return true;
    }

    // Repetition after 2+ previous mentions is critical
    if (moment.type === 'repetition') {
      return true;
    }

    return false;
  }
}
