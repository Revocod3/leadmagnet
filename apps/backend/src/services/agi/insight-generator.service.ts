import { openai, MODELS } from '../../config/openai';
import type {
  AGIInsight,
  InsightType,
  MemoryItem,
  ExtractedInfo,
  EmotionalTone,
  DetectedPattern
} from '../../types/agi.types';

export class InsightGeneratorService {
  /**
   * Genera insights basados en una respuesta específica
   */
  async generateInsightsForAnswer(
    questionId: number,
    question: string,
    answer: string,
    context: {
      extractedInfo: ExtractedInfo;
      recentAnswers: MemoryItem[];
      emotionalTone: EmotionalTone;
      detectedPatterns: DetectedPattern[];
    }
  ): Promise<AGIInsight[]> {
    const insights: AGIInsight[] = [];

    // Generar insights básicos primero
    insights.push(...this.generateBasicInsights(questionId, question, answer, context));

    // Generar insights avanzados con IA si es apropiado
    try {
      const aiInsights = await this.generateAIInsights(questionId, question, answer, context);
      insights.push(...aiInsights);
    } catch (error) {
      console.warn('Error generating AI insights:', error);
    }

    // Filtrar y priorizar insights
    return this.prioritizeInsights(insights);
  }

  /**
   * Genera insights básicos usando reglas predefinidas
   */
  private generateBasicInsights(
    questionId: number,
    question: string,
    answer: string,
    context: {
      extractedInfo: ExtractedInfo;
      recentAnswers: MemoryItem[];
      emotionalTone: EmotionalTone;
      detectedPatterns: DetectedPattern[];
    }
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];

    // Insights específicos por pregunta
    switch (questionId) {
      case 1: // Edad y ocupación
        insights.push(...this.generateDemographicsInsights(answer, context));
        break;

      case 2: // Estado emocional
        insights.push(...this.generateEmotionalInsights(answer, context.emotionalTone));
        break;

      case 3: // Problema principal
        insights.push(...this.generateProblemInsights(answer, context));
        break;

      case 4: // Duración
        insights.push(...this.generateDurationInsights(answer, context));
        break;

      case 5: // Métodos previos
        insights.push(...this.generateMethodsInsights(answer, context));
        break;

      case 6: // Alimentación
        insights.push(...this.generateDietInsights(answer, context));
        break;

      case 7: // Alimentos problemáticos
        insights.push(...this.generateFoodInsights(answer, context));
        break;

      case 8: // Agua
        insights.push(...this.generateWaterInsights(answer, context));
        break;

      case 9: // Ejercicio
        insights.push(...this.generateExerciseInsights(answer, context));
        break;

      case 10: // Sueño
        insights.push(...this.generateSleepInsights(answer, context));
        break;

      case 11: // Estrés
        insights.push(...this.generateStressInsights(answer, context));
        break;

      case 12: // Condiciones médicas
        insights.push(...this.generateMedicalInsights(answer, context));
        break;

      case 13: // Medicamentos
        insights.push(...this.generateMedicationInsights(answer, context));
        break;

      case 14: // Ciclo menstrual
        insights.push(...this.generateCycleInsights(answer, context));
        break;

      case 15: // Objetivo
        insights.push(...this.generateGoalInsights(answer, context));
        break;

      case 16: // Motivación
        insights.push(...this.generateMotivationInsights(answer, context));
        break;
    }

    // Insights basados en patrones detectados
    insights.push(...this.generatePatternBasedInsights(context.detectedPatterns, questionId));

    return insights;
  }

  // ========== INSIGHTS ESPECÍFICOS POR PREGUNTA ==========

  private generateDemographicsInsights(
    answer: string,
    context: any
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];
    const age = context.extractedInfo.demographics.age;

    if (age) {
      if (age < 30) {
        insights.push({
          type: 'validation_positive',
          message: 'Excelente momento para establecer hábitos saludables desde joven',
          relatedTo: [1],
          priority: 'medium',
          shouldDisplay: true
        });
      } else if (age > 50) {
        insights.push({
          type: 'encouragement',
          message: 'Tu experiencia de vida es un gran activo para este proceso de cambio',
          relatedTo: [1],
          priority: 'medium',
          shouldDisplay: true
        });
      }
    }

    return insights;
  }

  private generateEmotionalInsights(
    answer: string,
    emotionalTone: EmotionalTone
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];

    if (emotionalTone === 'frustrated' || emotionalTone === 'resigned') {
      insights.push({
        type: 'encouragement',
        message: 'Es completamente válido sentirse así. Muchos llegan aquí con esa misma frustración',
        relatedTo: [2],
        priority: 'high',
        shouldDisplay: true
      });
    }

    if (emotionalTone === 'hopeful' || emotionalTone === 'enthusiastic') {
      insights.push({
        type: 'validation_positive',
        message: 'Tu actitud positiva es el mejor punto de partida para el cambio',
        relatedTo: [2],
        priority: 'medium',
        shouldDisplay: true
      });
    }

    return insights;
  }

  private generateProblemInsights(
    answer: string,
    context: any
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('hinchazón') || lowerAnswer.includes('gases')) {
      insights.push({
        type: 'connection',
        message: 'La hinchazón abdominal es uno de los síntomas más comunes que tratamos aquí',
        relatedTo: [3],
        priority: 'medium',
        shouldDisplay: true
      });
    }

    if (lowerAnswer.includes('estreñimiento') || lowerAnswer.includes('irregular')) {
      insights.push({
        type: 'suggestion',
        message: 'Los problemas de tránsito intestinal suelen mejorar significativamente con cambios en la alimentación',
        relatedTo: [3],
        priority: 'medium',
        shouldDisplay: true
      });
    }

    return insights;
  }

  private generateDurationInsights(
    answer: string,
    context: any
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('años') || lowerAnswer.includes('meses')) {
      insights.push({
        type: 'encouragement',
        message: 'Que hayas lidiado con esto por tiempo muestra tu resiliencia. Ahora vamos a resolverlo',
        relatedTo: [4],
        priority: 'high',
        shouldDisplay: true
      });
    }

    return insights;
  }

  private generateMethodsInsights(
    answer: string,
    context: any
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('dietas') && lowerAnswer.includes('no funcionaron')) {
      insights.push({
        type: 'validation_positive',
        message: 'Muchas dietas genéricas fallan porque no consideran tu situación específica',
        relatedTo: [5],
        priority: 'medium',
        shouldDisplay: true
      });
    }

    if (lowerAnswer.includes('nada') || lowerAnswer.includes('no he')) {
      insights.push({
        type: 'encouragement',
        message: 'Perfecto punto de partida. Vamos a construir tu plan desde cero',
        relatedTo: [5],
        priority: 'medium',
        shouldDisplay: true
      });
    }

    return insights;
  }

  private generateDietInsights(
    answer: string,
    context: any
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('procesados') || lowerAnswer.includes('comida rápida')) {
      insights.push({
        type: 'connection',
        message: 'Los alimentos procesados pueden causar inflamación intestinal subclínica',
        relatedTo: [6],
        priority: 'high',
        shouldDisplay: true
      });
    }

    if (lowerAnswer.includes('frutas') && lowerAnswer.includes('verduras')) {
      insights.push({
        type: 'validation_positive',
        message: 'Excelente base. Las frutas y verduras son fundamentales para la salud intestinal',
        relatedTo: [6],
        priority: 'medium',
        shouldDisplay: true
      });
    }

    return insights;
  }

  private generateFoodInsights(
    answer: string,
    context: any
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('lácteos')) {
      insights.push({
        type: 'pattern_detected',
        message: 'La intolerancia a lácteos es muy común y puede causar síntomas digestivos',
        relatedTo: [7],
        priority: 'high',
        shouldDisplay: true
      });
    }

    if (lowerAnswer.includes('gluten')) {
      insights.push({
        type: 'connection',
        message: 'El gluten puede afectar a personas sensibles aunque no tengan celiaquía diagnosticada',
        relatedTo: [7],
        priority: 'high',
        shouldDisplay: true
      });
    }

    return insights;
  }

  private generateWaterInsights(
    answer: string,
    context: any
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('poco') || lowerAnswer.includes('1 litro') || lowerAnswer.includes('menos')) {
      insights.push({
        type: 'suggestion',
        message: 'La deshidratación puede causar estreñimiento y afectar la digestión',
        relatedTo: [8],
        priority: 'medium',
        shouldDisplay: true
      });
    }

    return insights;
  }

  private generateExerciseInsights(
    answer: string,
    context: any
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('nada') || lowerAnswer.includes('poco') || lowerAnswer.includes('sedentario')) {
      insights.push({
        type: 'connection',
        message: 'El sedentarismo puede ralentizar el tránsito intestinal y afectar el metabolismo',
        relatedTo: [9],
        priority: 'medium',
        shouldDisplay: true
      });
    }

    return insights;
  }

  private generateSleepInsights(
    answer: string,
    context: any
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('mal') || lowerAnswer.includes('poco') || lowerAnswer.includes('duermo')) {
      insights.push({
        type: 'connection',
        message: 'El sueño deficiente afecta la producción de hormonas que regulan la digestión',
        relatedTo: [10],
        priority: 'high',
        shouldDisplay: true
      });
    }

    return insights;
  }

  private generateStressInsights(
    answer: string,
    context: any
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('alto') || lowerAnswer.includes('mucho') || lowerAnswer.includes('siempre')) {
      insights.push({
        type: 'pattern_detected',
        message: 'El estrés crónico puede alterar la motilidad intestinal y causar síntomas digestivos',
        relatedTo: [11],
        priority: 'high',
        shouldDisplay: true
      });
    }

    return insights;
  }

  private generateMedicalInsights(
    answer: string,
    context: any
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('hipotiroidismo')) {
      insights.push({
        type: 'connection',
        message: 'El hipotiroidismo puede causar estreñimiento y afectar la digestión',
        relatedTo: [12],
        priority: 'high',
        shouldDisplay: true
      });
    }

    if (lowerAnswer.includes('sii') || lowerAnswer.includes('intestino irritable')) {
      insights.push({
        type: 'validation_positive',
        message: 'Conozco bien el SII. Hay enfoques naturales muy efectivos para manejarlo',
        relatedTo: [12],
        priority: 'high',
        shouldDisplay: true
      });
    }

    return insights;
  }

  private generateMedicationInsights(
    answer: string,
    context: any
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('antidepresivos') || lowerAnswer.includes('ansiolíticos')) {
      insights.push({
        type: 'connection',
        message: 'Algunos medicamentos pueden afectar la motilidad intestinal y causar estreñimiento',
        relatedTo: [13],
        priority: 'medium',
        shouldDisplay: true
      });
    }

    return insights;
  }

  private generateCycleInsights(
    answer: string,
    context: any
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('hinchazón') || lowerAnswer.includes('cambios')) {
      insights.push({
        type: 'pattern_detected',
        message: 'Los cambios hormonales durante el ciclo pueden afectar la digestión',
        relatedTo: [14],
        priority: 'medium',
        shouldDisplay: true
      });
    }

    return insights;
  }

  private generateGoalInsights(
    answer: string,
    context: any
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];

    if (answer.length > 50) { // Respuesta detallada
      insights.push({
        type: 'validation_positive',
        message: 'Tu claridad sobre lo que quieres lograr es un gran motivador para el cambio',
        relatedTo: [15],
        priority: 'medium',
        shouldDisplay: true
      });
    }

    return insights;
  }

  private generateMotivationInsights(
    answer: string,
    context: any
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];
    const motivationMatch = answer.match(/(\d+)/);
    const motivation = motivationMatch && motivationMatch[1] ? parseInt(motivationMatch[1]) : null;

    if (motivation) {
      if (motivation >= 8) {
        insights.push({
          type: 'validation_positive',
          message: 'Tu alta motivación es el ingrediente más importante para el éxito',
          relatedTo: [16],
          priority: 'high',
          shouldDisplay: true
        });
      } else if (motivation <= 5) {
        insights.push({
          type: 'encouragement',
          message: 'No te preocupes por el número. Lo importante es que estás dando el primer paso',
          relatedTo: [16],
          priority: 'high',
          shouldDisplay: true
        });
      }
    }

    return insights;
  }

  private generatePatternBasedInsights(
    patterns: DetectedPattern[],
    currentQuestionId: number
  ): AGIInsight[] {
    const insights: AGIInsight[] = [];

    for (const pattern of patterns) {
      if (pattern.relatedQuestions.includes(currentQuestionId)) {
        insights.push({
          type: 'pattern_detected',
          message: pattern.insight,
          relatedTo: pattern.relatedQuestions,
          priority: pattern.confidence > 0.8 ? 'high' : 'medium',
          shouldDisplay: true
        });
      }
    }

    return insights;
  }

  // ========== INSIGHTS CON IA ==========

  private async generateAIInsights(
    questionId: number,
    question: string,
    answer: string,
    context: any
  ): Promise<AGIInsight[]> {
    // Solo generar insights con IA para preguntas complejas
    if (![2, 3, 6, 11, 15].includes(questionId)) {
      return [];
    }

    try {
      const contextSummary = this.buildContextForAI(context);

      const prompt = `Genera un micro-insight empático y útil basado en esta respuesta del cuestionario de salud digestiva.

PREGUNTA: "${question}"
RESPUESTA: "${answer}"

CONTEXTO: ${contextSummary}

INSTRUCCIONES:
- Máximo 1 insight (1 frase corta)
- Debe ser empático, específico y actionable
- NO usar emojis
- Enfocarse en salud digestiva
- Tono profesional pero cálido

TIPOS POSIBLES:
- Validación positiva de su respuesta
- Conexión con síntomas digestivos
- Sugerencia práctica y específica
- Reconocimiento de patrón común

Responde SOLO con el insight, sin explicaciones adicionales.`;

      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 100,
      });

      const insightText = response.choices[0]?.message?.content?.trim();
      if (!insightText) return [];

      return [{
        type: 'suggestion',
        message: insightText,
        relatedTo: [questionId],
        priority: 'medium',
        shouldDisplay: true
      }];

    } catch (error) {
      console.error('Error generating AI insights:', error);
      return [];
    }
  }

  private buildContextForAI(context: any): string {
    let summary = '';

    if (context.extractedInfo.demographics.age) {
      summary += `Edad: ${context.extractedInfo.demographics.age}. `;
    }

    if (context.extractedInfo.health.mainProblem) {
      summary += `Problema principal: ${context.extractedInfo.health.mainProblem}. `;
    }

    if (context.emotionalTone !== 'neutral') {
      summary += `Estado emocional: ${context.emotionalTone}. `;
    }

    return summary || 'Información básica disponible.';
  }

  // ========== UTILIDADES ==========

  private prioritizeInsights(insights: AGIInsight[]): AGIInsight[] {
    // Ordenar por prioridad y limitar cantidad
    const priorityOrder = { high: 3, medium: 2, low: 1 };

    return insights
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, 2); // Máximo 2 insights por respuesta
  }

  /**
   * Genera un insight de "pensamiento" para mostrar durante el procesamiento
   */
  generateThinkingInsight(questionId: number): string {
    const thinkingMessages: Record<number, string[]> = {
      1: ['Analizando tu perfil demográfico...', 'Conectando edad y ocupación con salud digestiva...'],
      2: ['Procesando tu estado emocional...', 'Evaluando cómo tu bienestar emocional afecta tu cuerpo...'],
      3: ['Identificando tu síntoma principal...', 'Relacionando tu molestia con posibles causas digestivas...'],
      6: ['Evaluando tus hábitos alimentarios...', 'Analizando patrones en tu nutrición diaria...'],
      11: ['Explorando el impacto del estrés...', 'Conectando estrés con síntomas digestivos...']
    };

    const messages = thinkingMessages[questionId] || ['Procesando tu respuesta...'];
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex] || 'Procesando tu respuesta...';
  }
}