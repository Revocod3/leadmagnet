import type {
  InstructionContext,
  ConversationalMemory,
  ConversationalDecision,
  Language,
} from '../../types';

/**
 * InstructionsBuilderService
 * 
 * Builds DYNAMIC instructions for the OpenAI Assistant.
 * Instead of static prompts, instructions change based on:
 * - Current conversation context
 * - Decision from DecisionEngine
 * - Memory state
 * - User's communication style
 */
export class InstructionsBuilderService {
  /**
   * Build dynamic instructions for the Assistant
   */
  buildInstructions(context: InstructionContext, language: Language): string {
    const { memory, lastUserMessage, decision, recentMessages } = context;

    const sections = [
      this.buildRoleSection(),
      this.buildContextSection(memory),
      this.buildDecisionSection(decision, memory),
      this.buildStyleAdaptationSection(memory),
      this.buildPhaseGuidance(memory),
      this.buildConstraints(),
    ];

    return sections.join('\n\n');
  }

  /**
   * Build role section (who Clara is)
   */
  private buildRoleSection(): string {
    return `Eres Clara, experta en salud digestiva del Método Objetivo Vientre Plano.

TU ROL:
- Especialista empática y profesional en problemas digestivos
- Tienes una conversación REAL, no sigues un formulario
- Tu objetivo es entender profundamente el caso del usuario`;
  }

  /**
   * Build context section with all collected information
   */
  private buildContextSection(memory: ConversationalMemory): string {
    const info = memory.factualInfo;
    const firstName = info.demographics?.occupation ? info.demographics.occupation.split(' ')[0] : 'usuario';

    let context = `INFORMACIÓN RECOPILADA HASTA AHORA:\n───────────────────────────────────────────────────────────`;

    // Demographics
    if (info.demographics?.age || info.demographics?.occupation) {
      context += `\n• Nombre: ${firstName}`;
      if (info.demographics.age) {
        context += `\n• Edad: ${info.demographics.age} años`;
      }
      if (info.demographics.occupation) {
        context += `\n• Ocupación: ${info.demographics.occupation} (tipo: ${info.demographics.occupationType || 'general'})`;
      }
    }

    // Health
    if (info.health?.mainProblem) {
      context += `\n• Problema principal: ${info.health.mainProblem}`;
    }
    if (info.health?.duration) {
      context += `\n• Duración: ${info.health.duration}`;
    }
    if (info.health?.symptoms && info.health.symptoms.length > 0) {
      context += `\n• Síntomas: ${info.health.symptoms.join(', ')}`;
    }
    if (info.health?.triggers && info.health.triggers.length > 0) {
      context += `\n• Triggers identificados: ${info.health.triggers.join(', ')}`;
    }

    // Lifestyle (if any)
    const lifestyleItems = [];
    if (info.lifestyle?.diet) lifestyleItems.push(`Dieta: ${info.lifestyle.diet}`);
    if (info.lifestyle?.stress) lifestyleItems.push(`Estrés: ${info.lifestyle.stress}`);
    if (info.lifestyle?.sleep) lifestyleItems.push(`Sueño: ${info.lifestyle.sleep}`);
    if (info.lifestyle?.exercise) lifestyleItems.push(`Ejercicio: ${info.lifestyle.exercise}`);

    if (lifestyleItems.length > 0) {
      context += `\n• Estilo de vida: ${lifestyleItems.join(', ')}`;
    }

    return context;
  }

  /**
   * Build section about key moments detected
   */
  private buildKeyMomentsSection(memory: ConversationalMemory): string {
    if (memory.keyMoments.length === 0) {
      return '';
    }

    let section = `\n\nMOMENTOS CLAVE DETECTADOS:\n───────────────────────────────────────────────────────────`;

    const recentMoments = memory.keyMoments.slice(-3); // Last 3 key moments

    for (const moment of recentMoments) {
      section += `\n[Turno ${moment.turn}] ${moment.type.toUpperCase()}: ${moment.significance}`;
      if (moment.followUpAction && !moment.followUpAction.includes('EXPLORED')) {
        section += `\n  → Acción pendiente: ${moment.followUpAction}`;
      }
    }

    return section;
  }

  /**
   * Build hypothesis section
   */
  private buildHypothesisSection(memory: ConversationalMemory): string {
    if (!memory.currentHypothesis.primary) {
      return '';
    }

    let section = `\n\nHIPÓTESIS ACTUAL:\n───────────────────────────────────────────────────────────`;
    section += `\nDiagnóstico principal: ${memory.currentHypothesis.primary}`;
    section += `\nConfianza: ${memory.currentHypothesis.confidence}%`;

    if (memory.currentHypothesis.evidence && memory.currentHypothesis.evidence.length > 0) {
      section += `\nEvidencias:`;
      memory.currentHypothesis.evidence.slice(0, 3).forEach(e => {
        section += `\n  • ${e}`;
      });
    }

    if (memory.currentHypothesis.needsConfirmation && memory.currentHypothesis.needsConfirmation.length > 0) {
      section += `\nNecesitamos confirmar:`;
      memory.currentHypothesis.needsConfirmation.slice(0, 2).forEach(n => {
        section += `\n  • ${n}`;
      });
    }

    return section;
  }

  /**
   * Build decision section - what to do next
   */
  private buildDecisionSection(decision: ConversationalDecision, memory: ConversationalMemory): string {
    let section = this.buildKeyMomentsSection(memory);
    section += this.buildHypothesisSection(memory);

    section += `\n\nTU PRÓXIMA ACCIÓN DEBE SER:\n═══════════════════════════════════════════════════════════`;
    section += `\nTIPO: ${decision.type}`;

    switch (decision.type) {
      case 'follow-up':
        section += `\n\nPROFUNDIZA en lo que el usuario acaba de decir.`;
        if (decision.topicToExplore) {
          section += `\n\nEspecíficamente sobre: ${decision.topicToExplore}`;
        }
        section += `\n\nPor qué es importante: ${decision.reasoning}`;
        if (decision.suggestedQuestion) {
          section += `\n\nSugerencia de pregunta: ${decision.suggestedQuestion}`;
          section += `\n\nPERO no uses esa pregunta textualmente. Hazla natural y conecta con lo que acaba de decir.`;
        }
        break;

      case 'clarify':
        section += `\n\nNECESITAS CLARIFICACIÓN - la respuesta fue demasiado vaga.`;
        section += `\n\nRazón: ${decision.reasoning}`;
        section += `\n\nPregunta de forma más específica para obtener detalles útiles.`;
        if (decision.suggestedQuestion) {
          section += `\nEjemplo: ${decision.suggestedQuestion}`;
        }
        break;

      case 'pivot':
        section += `\n\nCAMBIA DE TEMA a algo esencial que aún no hemos explorado.`;
        section += `\n\nNuevo tema: ${decision.topicToExplore}`;
        section += `\n\nPor qué cambiar: ${decision.reasoning}`;
        section += `\n\nHaz una transición NATURAL conectando con algo que el usuario dijo.`;
        break;

      case 'callback':
        section += `\n\nVUELVE a un tema anterior que quedó inconcluso.`;
        section += `\n\nTema: ${decision.topicToExplore}`;
        section += `\n\nCómo hacerlo: "Antes mencionaste que... ¿podrías contarme más sobre eso?"`;
        break;

      case 'continue':
        section += `\n\nCONTINÚA la exploración natural.`;
        if (decision.topicToExplore) {
          section += `\n\nSiguiente tema a explorar: ${decision.topicToExplore}`;
        }
        section += `\n\nMantén el flujo conversacional natural.`;
        break;

      case 'conclude':
        section += `\n\nTENEMOS SUFICIENTE INFORMACIÓN para el diagnóstico.`;
        section += `\n\nRazón: ${decision.reasoning}`;
        section += `\n\nHaz una pregunta final de cierre o confirmación antes de generar el diagnóstico.`;
        break;
    }

    return section;
  }

  /**
   * Build style adaptation section
   */
  private buildStyleAdaptationSection(memory: ConversationalMemory): string {
    const style = memory.userStyle;

    let section = `\n\nADAPTACIÓN AL ESTILO DEL USUARIO:\n───────────────────────────────────────────────────────────`;

    // Formality
    section += `\nFormalidad: ${style.formality}/10`;
    if (style.formality > 7) {
      section += `\n→ Usuario es formal. Usa usted, evita coloquialismos.`;
    } else if (style.formality < 4) {
      section += `\n→ Usuario es muy casual. Puedes ser más relajada, usar "tú", expresiones coloquiales.`;
    } else {
      section += `\n→ Usuario tiene tono moderado. Equilibra profesionalismo con cercanía.`;
    }

    // Verbosity
    section += `\n\nVerbosidad: ${style.verbosity}/10`;
    if (style.verbosity > 7) {
      section += `\n→ Usuario da respuestas muy detalladas. Puedes hacer preguntas más abiertas.`;
    } else if (style.verbosity < 4) {
      section += `\n→ Usuario responde brevemente. Haz preguntas más específicas con ejemplos.`;
    }

    // Emotional level
    section += `\n\nEmoción dominante: ${this.getRecentEmotion(memory)}`;
    const emotionLevel = style.emotionLevel;
    if (emotionLevel > 7) {
      section += `\n→ Usuario muestra mucha emoción. Valida sus sentimientos con empatía.`;
    } else if (emotionLevel < 3) {
      section += `\n→ Usuario es más factual. Mantén tono profesional y objetivo.`;
    }

    return section;
  }

  /**
   * Get most recent emotion
   */
  private getRecentEmotion(memory: ConversationalMemory): string {
    if (memory.emotionalMarkers.length === 0) {
      return 'neutral';
    }

    const recent = memory.emotionalMarkers[memory.emotionalMarkers.length - 1];
    return recent ? recent.emotion : 'neutral';
  }

  /**
   * Build phase guidance
   */
  private buildPhaseGuidance(memory: ConversationalMemory): string {
    let section = `\n\nCONTEXTO DE FASE CONVERSACIONAL:\n───────────────────────────────────────────────────────────`;
    section += `\nFase actual: ${memory.conversationPhase}`;
    section += `\nTurnos: ${memory.turnCount}`;
    section += `\nTemas explorados: ${memory.topicsExplored.length}`;

    switch (memory.conversationPhase) {
      case 'introduction':
        section += `\n\nOBJETIVO: Establecer rapport y entender el problema principal`;
        section += `\n• Sé cálida y acogedora`;
        section += `\n• Haz que se sienta escuchado`;
        section += `\n• Identifica su preocupación central`;
        break;

      case 'exploration':
        section += `\n\nOBJETIVO: Explorar patrones y factores lifestyle`;
        section += `\n• Busca triggers y patrones`;
        section += `\n• Conecta síntomas con hábitos`;
        section += `\n• Sigue hilos que el usuario introduce`;
        break;

      case 'deepening':
        section += `\n\nOBJETIVO: Profundizar en conexiones importantes`;
        section += `\n• Explora la conexión mente-cuerpo`;
        section += `\n• Busca el "por qué" detrás de los patrones`;
        section += `\n• Valida experiencias emocionales`;
        break;

      case 'conclusion':
        section += `\n\nOBJETIVO: Confirmar información y preparar para diagnóstico`;
        section += `\n• Verifica información clave`;
        section += `\n• Llena gaps importantes`;
        section += `\n• Pregunta sobre objetivos y motivación`;
        break;
    }

    return section;
  }

  /**
   * Build constraints section
   */
  private buildConstraints(): string {
    return `\n\n═══════════════════════════════════════════════════════════
REGLAS FUNDAMENTALES:
═══════════════════════════════════════════════════════════

ESTILO:
✓ Habla como persona real, no como chatbot
✓ Conecta ideas entre mensajes - recuerda lo dicho antes
✓ Usa lenguaje natural ("¿verdad?", "exacto", "entiendo")
✗ NO uses frases robóticas: "Gracias por compartir", "Entiendo que", "Comprendo que"
✗ NO uses emojis en exceso (máximo 1 por mensaje, y solo si es natural)
✗ NO hagas múltiples preguntas en un mensaje

SEGUIMIENTO:
✓ Si el usuario menciona algo importante, profundiza INMEDIATAMENTE
✓ Si detectas emoción, valida antes de continuar
✓ Si hay contradicción, clarifica con sensibilidad

RESTRICCIONES:
✗ NO des diagnósticos médicos definitivos
✗ NO recomiendes medicamentos específicos
✗ NO ignores lo que el usuario acaba de decir
✗ NO cambies de tema si el usuario introdujo algo importante

═══════════════════════════════════════════════════════════
AHORA RESPONDE AL USUARIO DE FORMA NATURAL
═══════════════════════════════════════════════════════════`;
  }
}
