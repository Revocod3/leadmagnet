import type { Language } from '../types';

export interface EngagementSignals {
  longAnswers: number;      // Average words per answer
  responseSpeed: number;    // Average time between question and answer (ms)
  emotionalWords: number;   // Count of emotional words detected
  questionsAsked: number;   // User asked questions back
  timeSpent: number;        // Total time spent (ms)
  detailLevel: number;      // Level of detail (0-100)
}

export interface EngagementScore {
  total: number;           // Total score (0-100)
  mode: 'express' | 'standard' | 'deep';
  signals: EngagementSignals;
  updatedAt: Date;
}

/**
 * Service to track and analyze user engagement during diagnostic
 */
export class EngagementTrackerService {
  /**
   * Emotional words dictionary for Spanish
   */
  private readonly EMOTIONAL_WORDS_ES = [
    'sufro', 'frustra', 'molesta', 'dolor', 'cansado', 'cansada',
    'agotado', 'agotada', 'preocupa', 'ansiedad', 'estresado', 'estresada',
    'desesperado', 'desesperada', 'horrible', 'terrible', 'mal', 'peor',
    'ayuda', 'necesito', 'urgente', 'grave', 'serio', 'seria',
    'difícil', 'imposible', 'duro', 'dura', 'miedo', 'temor',
    'triste', 'deprimido', 'deprimida', 'solo', 'sola', 'aislado', 'aislada',
  ];

  /**
   * Emotional words dictionary for English
   */
  private readonly EMOTIONAL_WORDS_EN = [
    'suffer', 'frustrated', 'bothers', 'pain', 'tired', 'exhausted',
    'worried', 'anxiety', 'stressed', 'desperate', 'horrible', 'terrible',
    'bad', 'worse', 'help', 'need', 'urgent', 'serious', 'difficult',
    'impossible', 'hard', 'fear', 'afraid', 'sad', 'depressed',
    'alone', 'isolated', 'scared', 'nervous',
  ];

  /**
   * Weights for calculating engagement score
   */
  private readonly WEIGHTS = {
    answerLength: 0.25,      // 25% - Longer answers = more engaged
    detailLevel: 0.25,       // 25% - More detailed = more engaged
    emotionalWords: 0.20,    // 20% - Emotional investment
    questionsAsked: 0.15,    // 15% - Active participation
    responseSpeed: 0.15,     // 15% - Not too fast (thoughtful)
  };

  /**
   * Thresholds for determining mode
   */
  private readonly MODE_THRESHOLDS = {
    deep: 70,      // >= 70 = deep mode
    standard: 40,  // 40-69 = standard mode
    express: 0,    // < 40 = express mode
  };

  /**
   * Initialize a new engagement score
   */
  initialize(): EngagementScore {
    return {
      total: 50, // Start at medium engagement
      mode: 'standard',
      signals: {
        longAnswers: 0,
        responseSpeed: 0,
        emotionalWords: 0,
        questionsAsked: 0,
        timeSpent: 0,
        detailLevel: 0,
      },
      updatedAt: new Date(),
    };
  }

  /**
   * Analyzes a user's response and updates engagement score
   *
   * @param answer - User's answer text
   * @param timeTaken - Time taken to respond (ms)
   * @param currentScore - Current engagement score
   * @param language - User's language
   * @returns Updated engagement score
   */
  analyzeResponse(
    answer: string,
    timeTaken: number,
    currentScore: EngagementScore,
    language: Language = 'es'
  ): EngagementScore {
    const signals = { ...currentScore.signals };

    // 1. Analyze answer length
    const wordCount = this.countWords(answer);
    const avgAnswerLength = (signals.longAnswers + wordCount) / 2;
    signals.longAnswers = avgAnswerLength;

    // 2. Analyze response speed
    const avgResponseSpeed = (signals.responseSpeed + timeTaken) / 2;
    signals.responseSpeed = avgResponseSpeed;

    // 3. Detect emotional words
    const emotionalWordsCount = this.detectEmotionalWords(answer, language);
    signals.emotionalWords += emotionalWordsCount;

    // 4. Detect if user asked questions
    if (this.detectQuestions(answer)) {
      signals.questionsAsked += 1;
    }

    // 5. Update total time spent
    signals.timeSpent += timeTaken;

    // 6. Calculate detail level (based on word count and structure)
    const detailLevel = this.calculateDetailLevel(answer);
    signals.detailLevel = (signals.detailLevel + detailLevel) / 2;

    // Calculate total engagement score
    const total = this.calculateTotalScore(signals);

    // Determine mode based on score
    const mode = this.calculateMode(total);

    return {
      total,
      mode,
      signals,
      updatedAt: new Date(),
    };
  }

  /**
   * Counts words in a text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Detects emotional words in the text
   */
  detectEmotionalWords(text: string, language: Language): number {
    const lowerText = text.toLowerCase();
    const dictionary = language === 'es'
      ? this.EMOTIONAL_WORDS_ES
      : this.EMOTIONAL_WORDS_EN;

    let count = 0;
    for (const word of dictionary) {
      if (lowerText.includes(word)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Detects if the user asked a question
   */
  detectQuestions(text: string): boolean {
    // Check for question marks or question words
    if (text.includes('?')) {
      return true;
    }

    const questionWords = [
      'qué', 'cómo', 'cuándo', 'dónde', 'por qué', 'cuál',
      'what', 'how', 'when', 'where', 'why', 'which', 'who',
    ];

    const lowerText = text.toLowerCase();
    return questionWords.some(word => lowerText.includes(word));
  }

  /**
   * Calculates detail level based on answer characteristics
   */
  private calculateDetailLevel(answer: string): number {
    const wordCount = this.countWords(answer);

    // Very short answer (1-5 words) = low detail
    if (wordCount <= 5) return 20;

    // Short answer (6-15 words) = medium-low detail
    if (wordCount <= 15) return 40;

    // Medium answer (16-30 words) = medium detail
    if (wordCount <= 30) return 60;

    // Long answer (31-50 words) = high detail
    if (wordCount <= 50) return 80;

    // Very long answer (50+ words) = very high detail
    return 100;
  }

  /**
   * Calculates total engagement score based on signals
   */
  private calculateTotalScore(signals: EngagementSignals): number {
    // Normalize each signal to 0-100 scale

    // Answer length score (0-100 words = 0-100 score)
    const answerLengthScore = Math.min(signals.longAnswers * 2, 100);

    // Detail level already 0-100
    const detailScore = signals.detailLevel;

    // Emotional words (0-5 words = 0-100 score)
    const emotionalScore = Math.min(signals.emotionalWords * 20, 100);

    // Questions asked (0-3 questions = 0-100 score)
    const questionsScore = Math.min(signals.questionsAsked * 33, 100);

    // Response speed (optimal: 5-30 seconds = 100, too fast or too slow = lower)
    const responseSpeedScore = this.scoreResponseSpeed(signals.responseSpeed);

    // Calculate weighted total
    const total =
      (answerLengthScore * this.WEIGHTS.answerLength) +
      (detailScore * this.WEIGHTS.detailLevel) +
      (emotionalScore * this.WEIGHTS.emotionalWords) +
      (questionsScore * this.WEIGHTS.questionsAsked) +
      (responseSpeedScore * this.WEIGHTS.responseSpeed);

    return Math.round(Math.min(Math.max(total, 0), 100));
  }

  /**
   * Scores response speed (sweet spot is thoughtful but not too slow)
   */
  private scoreResponseSpeed(avgSpeed: number): number {
    const seconds = avgSpeed / 1000;

    // Too fast (< 3 seconds) = probably not reading carefully
    if (seconds < 3) return 30;

    // Optimal range (3-30 seconds) = thoughtful
    if (seconds <= 30) return 100;

    // Slow but ok (30-60 seconds)
    if (seconds <= 60) return 70;

    // Very slow (60-120 seconds)
    if (seconds <= 120) return 50;

    // Too slow (> 120 seconds) = might be distracted
    return 30;
  }

  /**
   * Determines engagement mode based on total score
   */
  calculateMode(score: number): 'express' | 'standard' | 'deep' {
    if (score >= this.MODE_THRESHOLDS.deep) {
      return 'deep';
    } else if (score >= this.MODE_THRESHOLDS.standard) {
      return 'standard';
    } else {
      return 'express';
    }
  }

  /**
   * Determines if engagement is dropping (user losing interest)
   */
  isEngagementDropping(
    currentScore: number,
    previousScore: number
  ): boolean {
    // Significant drop (more than 20 points)
    return (previousScore - currentScore) > 20;
  }

  /**
   * Determines if engagement is increasing
   */
  isEngagementIncreasing(
    currentScore: number,
    previousScore: number
  ): boolean {
    // Significant increase (more than 15 points)
    return (currentScore - previousScore) > 15;
  }

  /**
   * Gets a human-readable summary of engagement
   */
  getEngagementSummary(score: EngagementScore, language: Language = 'es'): string {
    const { total, mode, signals } = score;

    if (language === 'es') {
      return `
Engagement Score: ${total}/100
Modo: ${mode}
Palabras promedio: ${Math.round(signals.longAnswers)}
Palabras emocionales: ${signals.emotionalWords}
Preguntas del usuario: ${signals.questionsAsked}
Tiempo total: ${Math.round(signals.timeSpent / 1000)}s
      `.trim();
    } else {
      return `
Engagement Score: ${total}/100
Mode: ${mode}
Average words: ${Math.round(signals.longAnswers)}
Emotional words: ${signals.emotionalWords}
User questions: ${signals.questionsAsked}
Total time: ${Math.round(signals.timeSpent / 1000)}s
      `.trim();
    }
  }
}
