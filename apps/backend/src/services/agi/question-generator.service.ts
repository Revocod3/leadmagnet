/**
 * Question Generator Service
 * 
 * Genera preguntas dinámicas y contextuales en lugar de preguntas estáticas.
 * Las preguntas varían en formulación, orden y tono según el contexto conversacional.
 */

import type { Language } from '../../types';
import type { CollectedInfo } from '../../constants/questions';
import type { EmotionalTone } from '../../types/agi.types';

export interface DynamicQuestion {
  id: number;
  blockId: number;
  blockName: string;
  question: string;
  questionDetails?: string;
  context?: string; // Por qué se hace esta pregunta ahora
}

export interface QuestionVariant {
  casual: string[];
  professional: string[];
  empathetic: string[];
}

export class QuestionGeneratorService {
  /**
   * Variaciones de preguntas por tema (en lugar de preguntas fijas)
   */
  private questionTemplates = {
    es: {
      age_occupation: {
        casual: [
          '¿Cuántos años tienes y a qué te dedicas?',
          'Cuéntame un poco sobre ti: ¿tu edad y en qué trabajas?',
          'Para conocerte mejor, ¿qué edad tienes y cuál es tu ocupación?',
          'Empecemos por lo básico: ¿cuántos años tienes y qué haces profesionalmente?'
        ],
        professional: [
          'Me gustaría conocer tu contexto: ¿cuál es tu edad y ocupación?',
          'Para personalizar el análisis, ¿podrías compartir tu edad y profesión?',
          '¿Cuál es tu edad y a qué te dedicas actualmente?'
        ],
        empathetic: [
          'Antes de profundizar, me ayudaría conocer tu edad y qué tipo de trabajo realizas',
          'Para entender mejor tu situación, ¿me cuentas tu edad y ocupación?',
          'Cada persona es única. ¿Qué edad tienes y en qué trabajas?'
        ]
      },
      main_problem: {
        casual: [
          '¿Qué es lo que más te molesta de tu abdomen o digestión ahora mismo?',
          'Cuéntame, ¿qué problema digestivo es el que más te afecta en tu día a día?',
          '¿Qué síntoma digestivo es el que te tiene más preocupado/a?',
          '¿Cuál es tu principal molestia relacionada con tu digestión?'
        ],
        professional: [
          '¿Cuál es el síntoma digestivo predominante que experimentas?',
          '¿Qué manifestación digestiva es la que más impacta tu calidad de vida?',
          'Describe el principal problema digestivo que estás enfrentando'
        ],
        empathetic: [
          'Sé que puede ser incómodo, pero ¿qué es lo que más te molesta de tu digestión?',
          'Entiendo que es frustrante. ¿Qué síntoma digestivo es el que más te afecta?',
          'Me gustaría ayudarte. ¿Cuál es tu mayor preocupación digestiva ahora mismo?'
        ]
      },
      duration: {
        casual: [
          '¿Cuánto tiempo llevas sintiendo esto?',
          '¿Desde cuándo notas estos síntomas?',
          '¿Hace cuánto que empezaste a sentirte así?',
          '¿Cuánto llevas con este problema?'
        ],
        professional: [
          '¿Cuál es la duración aproximada de estos síntomas?',
          '¿Desde cuándo experimentas estas manifestaciones?',
          '¿Cuánto tiempo ha transcurrido desde el inicio de los síntomas?'
        ],
        empathetic: [
          'Sé que el tiempo importa. ¿Hace cuánto que vienes sintiendo esto?',
          'Para entender la cronicidad, ¿desde cuándo tienes estos síntomas?',
          'Imagino que llevas tiempo así. ¿Cuánto exactamente?'
        ]
      },
      diet: {
        casual: [
          '¿Cómo describirías tu alimentación en general?',
          'Cuéntame cómo sueles comer en un día normal',
          '¿Qué tal es tu alimentación habitualmente?',
          '¿Cómo es tu dieta en el día a día?'
        ],
        professional: [
          '¿Podrías describir tus patrones alimenticios habituales?',
          '¿Cómo caracterizarías tu alimentación cotidiana?',
          'Describe tu perfil nutricional general'
        ],
        empathetic: [
          'Sin juzgar, ¿cómo es tu alimentación normalmente?',
          'Sé que todos tenemos días buenos y malos. ¿Cómo comes habitualmente?',
          'Para ayudarte mejor, cuéntame sobre tu alimentación típica'
        ]
      },
      bad_foods: {
        casual: [
          '¿Hay algún alimento que notes que te sienta mal?',
          '¿Qué alimentos te provocan molestias digestivas?',
          '¿Has identificado comidas que te inflaman o te caen pesado?',
          '¿Notas que ciertos alimentos te afectan más?'
        ],
        professional: [
          '¿Has identificado intolerancias o sensibilidades alimentarias?',
          '¿Qué alimentos específicos exacerban tus síntomas?',
          '¿Cuáles son los alimentos desencadenantes que has detectado?'
        ],
        empathetic: [
          'Muchas personas tienen alimentos problemáticos. ¿Tú has notado alguno?',
          '¿Hay alguna comida que te haga sentir peor de lo normal?',
          'A veces nuestro cuerpo nos da señales claras. ¿Qué alimentos te afectan?'
        ]
      },
      water: {
        casual: [
          '¿Cuánta agua sueles beber al día?',
          '¿Qué tal tu hidratación? ¿Cuánta agua tomas?',
          '¿Eres de los que beben mucha agua o más bien poca?',
          'Hablando de agua, ¿cuánto bebes normalmente?'
        ],
        professional: [
          '¿Cuál es tu ingesta hídrica diaria aproximada?',
          '¿Qué volumen de agua consumes habitualmente?',
          'Describe tu nivel de hidratación habitual'
        ],
        empathetic: [
          'La hidratación es importante. ¿Bebes suficiente agua cada día?',
          'Sin presión, ¿cuánta agua dirías que tomas al día?',
          'Sé honesto/a, ¿cómo está tu consumo de agua?'
        ]
      },
      exercise: {
        casual: [
          '¿Haces ejercicio regularmente?',
          '¿Qué tal tu actividad física? ¿Te mueves bastante?',
          '¿Eres activo/a o más bien sedentario/a?',
          'Cuéntame sobre tu rutina de ejercicio'
        ],
        professional: [
          '¿Cuál es tu nivel de actividad física habitual?',
          '¿Mantienes una rutina de ejercicio regular?',
          'Describe tu patrón de actividad física semanal'
        ],
        empathetic: [
          'Sin juzgar, ¿haces ejercicio o movimiento regular?',
          'Sé que el tiempo es difícil. ¿Logras hacer algo de ejercicio?',
          'Todos luchamos con esto. ¿Qué tan activo/a eres?'
        ]
      },
      sleep: {
        casual: [
          '¿Cómo duermes habitualmente?',
          '¿Qué tal tu descanso nocturno?',
          '¿Duermes bien o tienes problemas para descansar?',
          'Cuéntame sobre tu sueño: ¿bien, mal, regular?'
        ],
        professional: [
          '¿Cuál es la calidad de tu descanso nocturno?',
          '¿Experimentas alteraciones del sueño?',
          'Describe tu patrón de sueño habitual'
        ],
        empathetic: [
          'El sueño afecta todo. ¿Cómo has estado durmiendo?',
          'Sé que el descanso es clave. ¿Logras dormir bien?',
          '¿Descansas adecuadamente o tienes dificultades para dormir?'
        ]
      },
      stress: {
        casual: [
          '¿Sientes que el estrés o la ansiedad afectan tu cuerpo?',
          '¿Qué tan estresado/a andas últimamente?',
          '¿El estrés te pega duro o lo llevas bien?',
          '¿Notas que tus nervios afectan tu digestión?'
        ],
        professional: [
          '¿Experimentas niveles significativos de estrés?',
          '¿Cómo calificarías tu nivel de estrés habitual?',
          '¿Percibes correlación entre estrés y síntomas digestivos?'
        ],
        empathetic: [
          'Todos lidiamos con estrés. ¿Cómo te afecta a ti?',
          'Sé que la vida puede ser abrumadora. ¿Qué tal tus niveles de estrés?',
          '¿Sientes que la ansiedad o el estrés impactan tu salud física?'
        ]
      },
      medical: {
        casual: [
          '¿Tienes alguna condición médica o tomas medicamentos regularmente?',
          '¿Hay algo de salud que debería saber? ¿Algún medicamento?',
          '¿Tomas algún medicamento o tienes alguna condición diagnosticada?',
          'Cuéntame si tienes algún problema de salud o tomas algún tratamiento'
        ],
        professional: [
          '¿Presentas alguna condición médica diagnosticada o terapia farmacológica activa?',
          '¿Existe algún antecedente médico relevante o medicación actual?',
          'Indica condiciones médicas preexistentes y medicamentos en uso'
        ],
        empathetic: [
          'Para cuidarte mejor, ¿hay algo médico que debería saber?',
          'Si te sientes cómodo/a, ¿tienes alguna condición médica o medicación?',
          '¿Hay algún tema de salud adicional que debamos considerar?'
        ]
      },
      goal: {
        casual: [
          '¿Qué te gustaría cambiar de tu salud en los próximos 3 meses?',
          '¿Cuál es tu objetivo principal con tu salud digestiva?',
          'Si pudieras mejorar algo en 3 meses, ¿qué sería?',
          '¿Qué cambio en tu salud te haría más feliz?'
        ],
        professional: [
          '¿Cuál es tu objetivo terapéutico a corto plazo?',
          '¿Qué resultado específico esperas alcanzar?',
          'Define tu meta de salud para los próximos 90 días'
        ],
        empathetic: [
          'Cuéntame tu sueño: ¿cómo te gustaría sentirte dentro de 3 meses?',
          '¿Qué cambio en tu salud significaría el mundo para ti?',
          'Imagina que todo mejora. ¿Cómo te gustaría estar en 3 meses?'
        ]
      },
      motivation: {
        casual: [
          'Del 1 al 10, ¿qué tan motivado/a estás para hacer cambios reales?',
          '¿Cuál es tu nivel de compromiso del 1 al 10?',
          'En una escala de 1 a 10, ¿qué tan listo/a estás para cambiar?',
          '¿Qué tan decidido/a estás a mejorar? Dame un número del 1 al 10'
        ],
        professional: [
          'Evalúa tu nivel de compromiso terapéutico del 1 al 10',
          '¿Cuál es tu índice de motivación para el cambio? (1-10)',
          'Califica tu disposición al cambio en escala 1-10'
        ],
        empathetic: [
          'Sé honesto/a conmigo: del 1 al 10, ¿qué tan preparado/a te sientes?',
          'Sin presión, ¿cuánta energía tienes para hacer cambios? (1-10)',
          'Del 1 al 10, ¿cuánto deseas realmente mejorar tu salud?'
        ]
      },
      image: {
        casual: [
          '¿Te gustaría compartir una foto de tu abdomen para el análisis?',
          '(Opcional) ¿Quieres enviar una imagen para complementar el diagnóstico?',
          '¿Te sientes cómodo/a compartiendo una foto para análisis visual?',
          'Si quieres, puedes enviar una imagen de tu abdomen'
        ],
        professional: [
          '¿Deseas aportar documentación fotográfica para evaluación?',
          'Opcionalmente, puedes compartir imagen para análisis complementario',
          '¿Autorizas el análisis de imagen abdominal?'
        ],
        empathetic: [
          'Sin presión, ¿te sentirías cómodo/a compartiendo una foto?',
          'Solo si lo deseas, una imagen puede ayudar al diagnóstico',
          'Tu privacidad es importante. ¿Quieres compartir una foto o prefieres no hacerlo?'
        ]
      }
    },
    en: {
      // Similar structure for English...
      age_occupation: {
        casual: [
          'How old are you and what do you do?',
          'Tell me a bit about yourself: your age and what you work as?',
          "Let's start with the basics: how old are you and what's your occupation?"
        ],
        professional: [
          'Could you share your age and current occupation?',
          'What is your age and professional activity?'
        ],
        empathetic: [
          'To understand you better, could you tell me your age and what you do?',
          'Each person is unique. What is your age and occupation?'
        ]
      }
      // ... resto de preguntas en inglés
    }
  };

  /**
   * Genera una pregunta dinámica basada en el contexto
   */
  async generateDynamicQuestion(
    topic: string,
    context: {
      collectedInfo: CollectedInfo;
      emotionalTone?: EmotionalTone;
      previousQuestions: number[];
      language: Language;
    }
  ): Promise<DynamicQuestion> {
    // Determinar el tono de la pregunta basado en el contexto emocional
    const tone = this.determineQuestionTone(context.emotionalTone, context.collectedInfo);

    // Obtener variaciones de la pregunta
    const templates = this.getQuestionTemplates(topic, context.language);
    const variants = templates[tone] || templates.casual;

    // Seleccionar una variación aleatoria
    const baseQuestion = this.selectRandomVariant(variants);

    // Contextualizar la pregunta según información previa
    const contextualizedQuestion = await this.contextualizeQuestion(
      baseQuestion,
      topic,
      context
    );

    // Asignar IDs y metadatos
    const questionMetadata = this.getQuestionMetadata(topic);

    return {
      ...questionMetadata,
      question: contextualizedQuestion,
      context: this.generateQuestionContext(topic, context)
    };
  }

  /**
   * Determina el tono apropiado para la pregunta
   */
  private determineQuestionTone(
    emotionalTone?: EmotionalTone,
    collectedInfo?: CollectedInfo
  ): 'casual' | 'professional' | 'empathetic' {
    // Si hay estrés alto o tono negativo, ser más empático
    if (emotionalTone === 'frustrated' || emotionalTone === 'anxious' || emotionalTone === 'overwhelmed') {
      return 'empathetic';
    }

    // Si hay problemas crónicos, ser profesional pero cálido
    if (collectedInfo?.duration &&
      (collectedInfo.duration.toLowerCase().includes('años') ||
        collectedInfo.duration.toLowerCase().includes('mucho'))) {
      return 'professional';
    }

    // Si el usuario está entusiasta, mantener tono casual
    if (emotionalTone === 'enthusiastic' || emotionalTone === 'hopeful') {
      return 'casual';
    }

    // Default: casual y accesible
    return 'casual';
  }

  /**
   * Obtiene las variaciones de pregunta para un tema
   */
  private getQuestionTemplates(topic: string, language: Language): QuestionVariant {
    const lang = language === 'en' ? 'en' : 'es';
    return (this.questionTemplates[lang] as any)[topic] || this.questionTemplates[lang].age_occupation;
  }

  /**
   * Selecciona una variante aleatoria
   */
  private selectRandomVariant(variants: string[]): string {
    if (variants.length === 0) return '';
    const index = Math.floor(Math.random() * variants.length);
    return variants[index] || '';
  }

  /**
   * Contextualiza la pregunta según información previa
   */
  private async contextualizeQuestion(
    baseQuestion: string,
    topic: string,
    context: {
      collectedInfo: CollectedInfo;
      emotionalTone?: EmotionalTone;
      language: Language;
    }
  ): Promise<string> {
    // Para ciertas preguntas, agregar contexto basado en respuestas previas
    switch (topic) {
      case 'bad_foods':
        if (context.collectedInfo.diet?.toLowerCase().includes('procesados')) {
          return baseQuestion.replace('¿Hay algún alimento', 'Mencionaste alimentos procesados. ¿Hay algún alimento específico');
        }
        break;

      case 'exercise':
        if (context.collectedInfo.occupation?.toLowerCase().includes('oficina') ||
          context.collectedInfo.occupation?.toLowerCase().includes('programador')) {
          return baseQuestion.replace('¿Haces ejercicio', 'Veo que trabajas sentado/a. ¿Haces ejercicio');
        }
        break;

      case 'stress':
        if (context.collectedInfo.sleep?.toLowerCase().includes('mal')) {
          return `Noté que duermes mal. ${baseQuestion}`;
        }
        break;

      case 'duration':
        if (context.collectedInfo.mainProblem?.toLowerCase().includes('hinchazón')) {
          return baseQuestion.replace('esto', 'la hinchazón');
        }
        if (context.collectedInfo.mainProblem?.toLowerCase().includes('dolor')) {
          return baseQuestion.replace('esto', 'el dolor');
        }
        break;
    }

    return baseQuestion;
  }

  /**
   * Obtiene metadatos de la pregunta (ID, bloque, etc.)
   */
  private getQuestionMetadata(topic: string): { id: number; blockId: number; blockName: string } {
    const metadata: Record<string, { id: number; blockId: number; blockName: string }> = {
      age_occupation: { id: 1, blockId: 1, blockName: 'Conocerte Mejor' },
      main_problem: { id: 2, blockId: 2, blockName: 'El Problema Principal' },
      duration: { id: 3, blockId: 2, blockName: 'El Problema Principal' },
      diet: { id: 4, blockId: 3, blockName: 'Estilo de Vida' },
      bad_foods: { id: 5, blockId: 3, blockName: 'Estilo de Vida' },
      water: { id: 6, blockId: 3, blockName: 'Estilo de Vida' },
      exercise: { id: 7, blockId: 3, blockName: 'Estilo de Vida' },
      sleep: { id: 8, blockId: 4, blockName: 'Salud & Bienestar' },
      stress: { id: 9, blockId: 4, blockName: 'Salud & Bienestar' },
      medical: { id: 10, blockId: 4, blockName: 'Salud & Bienestar' },
      goal: { id: 11, blockId: 5, blockName: 'Motivación' },
      motivation: { id: 12, blockId: 5, blockName: 'Motivación' },
      image: { id: 13, blockId: 5, blockName: 'Motivación' }
    };

    return metadata[topic] || { id: 0, blockId: 0, blockName: 'General' };
  }

  /**
   * Genera contexto sobre por qué se hace esta pregunta
   */
  private generateQuestionContext(
    topic: string,
    context: { collectedInfo: CollectedInfo }
  ): string {
    const contexts: Record<string, string> = {
      bad_foods: 'Las intolerancias alimentarias son clave en problemas digestivos',
      water: 'La hidratación afecta directamente el tránsito intestinal',
      exercise: 'El movimiento es crucial para la motilidad digestiva',
      sleep: 'El sueño impacta la regeneración intestinal',
      stress: 'El eje intestino-cerebro conecta emociones y digestión',
      medical: 'Necesito saber el contexto médico completo para personalizar',
      duration: 'El tiempo de evolución indica cronicidad y urgencia',
      goal: 'Tus objetivos guían el enfoque del tratamiento',
      motivation: 'Tu compromiso determina el éxito del proceso'
    };

    return contexts[topic] || 'Información importante para el diagnóstico';
  }

  /**
   * Genera orden dinámico de preguntas
   */
  generateDynamicQuestionOrder(
    mode: 'express' | 'standard' | 'deep',
    collectedInfo: CollectedInfo
  ): string[] {
    // Preguntas obligatorias siempre
    const mandatory = ['age_occupation', 'main_problem', 'duration'];

    // Preguntas de alta prioridad (casi siempre)
    const highPriority = ['diet', 'stress', 'goal', 'motivation'];

    // Preguntas contextuales (según modo y situación)
    const contextual = ['bad_foods', 'water', 'exercise', 'sleep', 'medical', 'image'];

    let questionOrder = [...mandatory];

    // Agregar preguntas según el modo
    if (mode === 'express') {
      // Modo express: solo esenciales
      questionOrder.push('diet', 'stress', 'goal', 'motivation');
    } else if (mode === 'standard') {
      // Modo standard: esenciales + algunas contextuales
      questionOrder.push(...highPriority);
      questionOrder.push(...this.selectContextualQuestions(contextual, 2, collectedInfo));
    } else {
      // Modo deep: todas las preguntas
      questionOrder.push(...highPriority);
      questionOrder.push(...contextual);
    }

    // Mezclar ligeramente el orden para que no sea siempre igual
    // (excepto las 3 primeras que son introductorias)
    const intro = questionOrder.slice(0, 3);
    const rest = this.shuffleWithConstraints(questionOrder.slice(3));

    return [...intro, ...rest];
  }

  /**
   * Selecciona preguntas contextuales relevantes
   */
  private selectContextualQuestions(
    questions: string[],
    count: number,
    collectedInfo: CollectedInfo
  ): string[] {
    // Priorizar según el contexto
    const prioritized = questions.sort((a, b) => {
      const scoreA = this.getQuestionRelevanceScore(a, collectedInfo);
      const scoreB = this.getQuestionRelevanceScore(b, collectedInfo);
      return scoreB - scoreA;
    });

    return prioritized.slice(0, count);
  }

  /**
   * Calcula relevancia de una pregunta según contexto
   */
  private getQuestionRelevanceScore(question: string, info: CollectedInfo): number {
    let score = 0;

    switch (question) {
      case 'bad_foods':
        if (info.diet?.toLowerCase().includes('procesados')) score += 2;
        if (info.mainProblem?.toLowerCase().includes('hinchazón')) score += 2;
        break;
      case 'water':
        if (info.mainProblem?.toLowerCase().includes('estreñimiento')) score += 3;
        break;
      case 'exercise':
        if (info.occupation?.toLowerCase().includes('oficina')) score += 2;
        if (info.occupation?.toLowerCase().includes('sedentari')) score += 2;
        break;
      case 'sleep':
        if (info.stress?.toLowerCase().includes('alto')) score += 2;
        break;
      case 'medical':
        score += 1; // Siempre algo relevante
        break;
    }

    return score;
  }

  /**
   * Mezcla con restricciones (mantener bloques coherentes)
   */
  private shuffleWithConstraints(questions: string[]): string[] {
    // Agrupar por bloques
    const lifestyle = questions.filter(q => ['diet', 'bad_foods', 'water', 'exercise'].includes(q));
    const health = questions.filter(q => ['sleep', 'stress', 'medical'].includes(q));
    const motivation = questions.filter(q => ['goal', 'motivation', 'image'].includes(q));

    // Mezclar dentro de cada grupo
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = shuffled[i];
        if (temp !== undefined && shuffled[j] !== undefined) {
          shuffled[i] = shuffled[j]!;
          shuffled[j] = temp;
        }
      }
      return shuffled;
    };

    return [
      ...shuffleArray(lifestyle),
      ...shuffleArray(health),
      ...shuffleArray(motivation)
    ];
  }
}
