import { openai, MODELS } from '../../config/openai';
import type {
  DetectedPattern,
  ExtractedInfo,
  MemoryItem,
  EmotionalTone
} from '../../types/agi.types';

export class PatternDetectorService {
  /**
   * Detecta patrones en las respuestas del usuario
   */
  async detectPatterns(
    answers: MemoryItem[],
    extractedInfo: ExtractedInfo,
    emotionalTone: EmotionalTone
  ): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    // Detectar patrones básicos sin IA primero
    patterns.push(...this.detectBasicPatterns(answers, extractedInfo, emotionalTone));

    // Detectar patrones avanzados con IA si hay suficientes datos
    if (answers.length >= 3) {
      try {
        const aiPatterns = await this.detectAdvancedPatterns(answers, extractedInfo);
        patterns.push(...aiPatterns);
      } catch (error) {
        console.warn('Error detecting advanced patterns:', error);
      }
    }

    // Filtrar y ordenar por confianza
    return patterns
      .filter(p => p.confidence > 0.6) // Solo patrones con alta confianza
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Máximo 3 patrones
  }

  /**
   * Detecta patrones básicos usando reglas predefinidas
   */
  private detectBasicPatterns(
    answers: MemoryItem[],
    extractedInfo: ExtractedInfo,
    emotionalTone: EmotionalTone
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Patrón 1: Eje intestino-cerebro (estrés + problemas digestivos)
    const stressPattern = this.detectStressDigestionCorrelation(answers, extractedInfo);
    if (stressPattern) patterns.push(stressPattern);

    // Patrón 2: Hábitos alimenticios inconsistentes
    const dietPattern = this.detectDietaryInconsistencies(answers, extractedInfo);
    if (dietPattern) patterns.push(dietPattern);

    // Patrón 3: Síntomas de larga duración sin acción
    const chronicPattern = this.detectChronicSymptoms(answers, extractedInfo);
    if (chronicPattern) patterns.push(chronicPattern);

    // Patrón 4: Estado emocional negativo + problemas físicos
    const emotionalPattern = this.detectEmotionalPhysicalCorrelation(emotionalTone, extractedInfo);
    if (emotionalPattern) patterns.push(emotionalPattern);

    // Patrón 5: Falta de ejercicio + problemas metabólicos
    const sedentaryPattern = this.detectSedentaryLifestyle(answers, extractedInfo);
    if (sedentaryPattern) patterns.push(sedentaryPattern);

    return patterns;
  }

  /**
   * Detecta correlación entre estrés y problemas digestivos
   */
  private detectStressDigestionCorrelation(
    answers: MemoryItem[],
    extractedInfo: ExtractedInfo
  ): DetectedPattern | null {
    const hasStress = extractedInfo.lifestyle.stress &&
      (extractedInfo.lifestyle.stress.toLowerCase().includes('alto') ||
        extractedInfo.lifestyle.stress.toLowerCase().includes('mucho'));

    const hasDigestionIssues = extractedInfo.health.mainProblem &&
      (extractedInfo.health.mainProblem.toLowerCase().includes('digest') ||
        extractedInfo.health.mainProblem.toLowerCase().includes('hinchazón') ||
        extractedInfo.health.mainProblem.toLowerCase().includes('estreñimiento'));

    const hasSleepIssues = extractedInfo.lifestyle.sleep &&
      (extractedInfo.lifestyle.sleep.toLowerCase().includes('mal') ||
        extractedInfo.lifestyle.sleep.toLowerCase().includes('poco'));

    if (hasStress && (hasDigestionIssues || hasSleepIssues)) {
      return {
        type: 'correlation',
        description: 'Patrón de eje intestino-cerebro desbalanceado',
        relatedQuestions: [9, 2, 8], // estrés, problema principal, sueño
        confidence: 0.85,
        insight: 'El estrés crónico puede estar afectando tu sistema digestivo y calidad de sueño'
      };
    }

    return null;
  }

  /**
   * Detecta inconsistencias en hábitos alimenticios
   */
  private detectDietaryInconsistencies(
    answers: MemoryItem[],
    extractedInfo: ExtractedInfo
  ): DetectedPattern | null {
    const diet = extractedInfo.lifestyle.diet?.toLowerCase() || '';
    const hasBadFoods = extractedInfo.health.badFoods && extractedInfo.health.badFoods.length > 0;

    // Si dice comer saludable pero menciona alimentos problemáticos
    if (diet.includes('saludable') || diet.includes('equilibrada')) {
      if (hasBadFoods) {
        return {
          type: 'inconsistency',
          description: 'Inconsistencia entre dieta declarada y alimentos problemáticos',
          relatedQuestions: [4, 5], // alimentación, alimentos problemáticos
          confidence: 0.75,
          insight: 'Aunque describes tu alimentación como saludable, identificaste alimentos que te afectan'
        };
      }
    }

    // Si come muchos procesados pero quiere mejorar digestión
    if (diet.includes('procesados') || diet.includes('comida rápida')) {
      if (extractedInfo.health.mainProblem?.toLowerCase().includes('digest')) {
        return {
          type: 'correlation',
          description: 'Alimentación procesada contribuyendo a problemas digestivos',
          relatedQuestions: [4, 2], // alimentación, problema principal
          confidence: 0.8,
          insight: 'La alimentación rica en procesados puede estar exacerbando tus síntomas digestivos'
        };
      }
    }

    return null;
  }

  /**
   * Detecta síntomas crónicos sin intervención
   */
  private detectChronicSymptoms(
    answers: MemoryItem[],
    extractedInfo: ExtractedInfo
  ): DetectedPattern | null {
    const duration = extractedInfo.health.duration?.toLowerCase() || '';
    const hasLongDuration = duration.includes('años') || duration.includes('meses');

    const hasTriedMethods = answers.some(a =>
      a.question.toLowerCase().includes('método') &&
      !a.answer.toLowerCase().includes('nada') &&
      !a.answer.toLowerCase().includes('no he')
    );

    if (hasLongDuration && !hasTriedMethods) {
      return {
        type: 'red_flag',
        description: 'Síntomas crónicos sin intentos previos de solución',
        relatedQuestions: [3, 4], // duración, métodos probados
        confidence: 0.9,
        insight: 'Llevas tiempo con estos síntomas pero aún no has explorado soluciones específicas'
      };
    }

    return null;
  }

  /**
   * Detecta correlación entre estado emocional y problemas físicos
   */
  private detectEmotionalPhysicalCorrelation(
    emotionalTone: EmotionalTone,
    extractedInfo: ExtractedInfo
  ): DetectedPattern | null {
    const negativeEmotions: EmotionalTone[] = ['frustrated', 'resigned', 'anxious', 'overwhelmed'];

    if (negativeEmotions.includes(emotionalTone)) {
      const hasPhysicalSymptoms = extractedInfo.health.mainProblem &&
        (extractedInfo.health.mainProblem.toLowerCase().includes('dolor') ||
          extractedInfo.health.mainProblem.toLowerCase().includes('cansancio') ||
          extractedInfo.health.mainProblem.toLowerCase().includes('digest'));

      if (hasPhysicalSymptoms) {
        return {
          type: 'correlation',
          description: 'Estado emocional negativo correlacionado con síntomas físicos',
          relatedQuestions: [1, 2], // estado emocional, problema principal
          confidence: 0.7,
          insight: 'Tu estado emocional actual puede estar influenciando tus síntomas físicos'
        };
      }
    }

    return null;
  }

  /**
   * Detecta patrón de sedentarismo y problemas metabólicos
   */
  private detectSedentaryLifestyle(
    answers: MemoryItem[],
    extractedInfo: ExtractedInfo
  ): DetectedPattern | null {
    const exercise = extractedInfo.lifestyle.exercise?.toLowerCase() || '';
    const isSedentary = exercise.includes('nada') || exercise.includes('poco') || exercise.includes('sedentario');

    const hasMetabolicIssues = extractedInfo.health.mainProblem &&
      (extractedInfo.health.mainProblem.toLowerCase().includes('peso') ||
        extractedInfo.health.mainProblem.toLowerCase().includes('digest') ||
        extractedInfo.health.mainProblem.toLowerCase().includes('energía'));

    if (isSedentary && hasMetabolicIssues) {
      return {
        type: 'correlation',
        description: 'Sedentarismo contribuyendo a problemas metabólicos',
        relatedQuestions: [6, 2], // ejercicio, problema principal
        confidence: 0.75,
        insight: 'La falta de movimiento regular puede estar afectando tu metabolismo y digestión'
      };
    }

    return null;
  }

  /**
   * Detecta patrones avanzados usando IA
   */
  private async detectAdvancedPatterns(
    answers: MemoryItem[],
    extractedInfo: ExtractedInfo
  ): Promise<DetectedPattern[]> {
    try {
      // Preparar contexto para el prompt
      const answersText = answers
        .map(a => `P${a.questionId}: ${a.question}\nR: ${a.answer}`)
        .join('\n\n');

      const contextText = this.buildContextText(extractedInfo);

      const prompt = `Analiza estas respuestas de un cuestionario de salud digestiva y detecta patrones relevantes:

RESPUESTAS:
${answersText}

CONTEXTO EXTRAÍDO:
${contextText}

INSTRUCCIONES:
Detecta máximo 2 patrones importantes. Para cada patrón, proporciona:
- Tipo: "correlation", "inconsistency", "red_flag", o "consistency"
- Descripción breve del patrón
- Preguntas relacionadas (IDs separados por coma)
- Nivel de confianza (0.0-1.0)
- Insight actionable para el usuario

Responde SOLO con JSON válido:
{
  "patterns": [
    {
      "type": "correlation",
      "description": "Descripción del patrón",
      "relatedQuestions": [1, 2, 3],
      "confidence": 0.85,
      "insight": "Insight específico y útil"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) return [];

      const parsed = JSON.parse(content);
      return parsed.patterns || [];

    } catch (error) {
      console.error('Error in advanced pattern detection:', error);
      return [];
    }
  }

  /**
   * Construye texto de contexto para el prompt de IA
   */
  private buildContextText(extractedInfo: ExtractedInfo): string {
    let context = '';

    if (extractedInfo.demographics.age) {
      context += `Edad: ${extractedInfo.demographics.age}\n`;
    }
    if (extractedInfo.demographics.occupation) {
      context += `Ocupación: ${extractedInfo.demographics.occupation}\n`;
    }
    if (extractedInfo.health.mainProblem) {
      context += `Problema principal: ${extractedInfo.health.mainProblem}\n`;
    }
    if (extractedInfo.health.duration) {
      context += `Duración: ${extractedInfo.health.duration}\n`;
    }
    if (extractedInfo.lifestyle.diet) {
      context += `Alimentación: ${extractedInfo.lifestyle.diet}\n`;
    }
    if (extractedInfo.lifestyle.stress) {
      context += `Estrés: ${extractedInfo.lifestyle.stress}\n`;
    }

    return context || 'Información limitada disponible';
  }

  /**
   * Obtiene insights específicos para un patrón detectado
   */
  getPatternInsights(pattern: DetectedPattern): string[] {
    const insights: Record<string, string[]> = {
      'stress-digestion': [
        'El estrés activa el eje HPA, liberando cortisol que afecta la motilidad intestinal',
        'Considera técnicas de manejo del estrés como meditación o respiración profunda',
        'La conexión intestino-cerebro explica por qué el estrés empeora síntomas digestivos'
      ],
      'diet-inconsistency': [
        'Los alimentos problemáticos pueden causar inflamación intestinal subclínica',
        'Una dieta antiinflamatoria podría reducir significativamente tus síntomas',
        'La consistencia en la alimentación es clave para la salud intestinal'
      ],
      'chronic-symptoms': [
        'Los síntomas crónicos suelen requerir un enfoque integral, no solo dieta',
        'Considera evaluar posibles sensibilidades alimentarias no diagnosticadas',
        'El tiempo de evolución sugiere posibles desbalances en la microbiota'
      ]
    };

    // Buscar por descripción del patrón
    for (const [key, value] of Object.entries(insights)) {
      const keyPart = key.split('-')[0];
      if (pattern.description && keyPart && pattern.description.toLowerCase().includes(keyPart)) {
        return value;
      }
    }

    return [pattern.insight]; // Fallback al insight del patrón
  }
}