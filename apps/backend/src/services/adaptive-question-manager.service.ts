import { getDiagnosticQuestions, type DiagnosticQuestion, type CollectedInfo } from '../constants/questions';
import type { Language } from '../types';

export type QuestionPriority = 'essential' | 'standard' | 'deep';
export type DiagnosticMode = 'express' | 'standard' | 'deep';

export interface QuestionConfig {
  id: number;
  priority: QuestionPriority;
  condition?: (info: CollectedInfo) => boolean;
}

/**
 * Service to adaptively manage which questions to ask based on engagement
 */
export class AdaptiveQuestionManagerService {
  /**
   * Question ranges by mode
   * - Express: 6-7 questions (minimum required)
   * - Standard: 8-10 questions
   * - Deep: 12-15 questions
   */
  private readonly QUESTION_RANGES = {
    express: { min: 6, max: 7 },
    standard: { min: 8, max: 10 },
    deep: { min: 12, max: 15 },
  };

  /**
   * Question priorities configuration
   * Essential: Always asked (6 questions minimum)
   * Standard: Asked in standard and deep modes
   * Deep: Only asked in deep mode
   */
  private readonly QUESTION_PRIORITIES: QuestionConfig[] = [
    // ESSENTIAL - Always asked (6 questions minimum)
    { id: 1, priority: 'essential' },  // Age/occupation
    { id: 2, priority: 'essential' },  // Main problem
    { id: 3, priority: 'essential' },  // Duration
    { id: 4, priority: 'essential' },  // Diet general
    { id: 5, priority: 'essential' },  // Problematic foods
    { id: 6, priority: 'essential' },  // Water intake

    // STANDARD - Asked in standard and deep modes (7-10)
    { id: 7, priority: 'standard' },   // Previous attempts
    { id: 8, priority: 'standard' },   // Exercise
    { id: 9, priority: 'standard' },   // Sleep
    { id: 10, priority: 'standard' },  // Stress

    // DEEP - Only in deep mode (11-15)
    { id: 11, priority: 'deep' },      // Medical conditions
    { id: 12, priority: 'deep' },      // Medications
    { id: 13, priority: 'deep' },      // Image upload (optional)

    // Note: Questions 14-17 from frontend are not in backend yet
    // Will use questions 1-13 for now
  ];

  /**
   * Gets the next question to ask based on mode and collected info
   *
   * @param mode - Current diagnostic mode
   * @param collectedInfo - Information collected so far
   * @param askedQuestionIds - IDs of questions already asked
   * @param language - User's language
   * @returns Next question to ask, or null if done
   */
  getNextQuestion(
    mode: DiagnosticMode,
    collectedInfo: CollectedInfo,
    askedQuestionIds: number[],
    language: Language
  ): DiagnosticQuestion | null {
    const questions = getDiagnosticQuestions(language);

    // Get applicable priorities for current mode
    const applicablePriorities = this.getApplicablePriorities(mode);

    // Find next question that:
    // 1. Hasn't been asked yet
    // 2. Matches current mode priority
    // 3. Passes condition check (if any)
    for (const config of this.QUESTION_PRIORITIES) {
      // Skip if already asked
      if (askedQuestionIds.includes(config.id)) {
        continue;
      }

      // Skip if priority doesn't match mode
      if (!applicablePriorities.includes(config.priority)) {
        continue;
      }

      // Check condition if exists
      if (config.condition && !config.condition(collectedInfo)) {
        continue;
      }

      // Find the actual question
      const question = questions.find(q => q.id === config.id);
      if (question) {
        // Additional check for conditional questions
        if (question.isConditional && question.conditionCheck) {
          if (!question.conditionCheck(collectedInfo)) {
            continue;
          }
        }

        return question;
      }
    }

    return null;
  }

  /**
   * Gets priorities applicable to the current mode
   */
  private getApplicablePriorities(mode: DiagnosticMode): QuestionPriority[] {
    switch (mode) {
      case 'express':
        return ['essential'];
      case 'standard':
        return ['essential', 'standard'];
      case 'deep':
        return ['essential', 'standard', 'deep'];
      default:
        return ['essential'];
    }
  }

  /**
   * Gets total questions for a given mode
   */
  getTotalQuestionsForMode(mode: DiagnosticMode): number {
    return this.QUESTION_RANGES[mode].max;
  }

  /**
   * Gets minimum questions for a given mode
   */
  getMinQuestionsForMode(mode: DiagnosticMode): number {
    return this.QUESTION_RANGES[mode].min;
  }

  /**
   * Determines if we should continue asking questions
   *
   * @param mode - Current diagnostic mode
   * @param askedCount - Number of questions asked so far
   * @param engagementScore - Current engagement score
   * @returns Whether to continue asking questions
   */
  shouldContinue(
    mode: DiagnosticMode,
    askedCount: number,
    engagementScore: number
  ): boolean {
    const range = this.QUESTION_RANGES[mode];

    // Always ask at least the minimum
    if (askedCount < range.min) {
      return true;
    }

    // If we've reached the maximum, stop
    if (askedCount >= range.max) {
      return false;
    }

    // Between min and max, decide based on engagement
    // If engagement is dropping significantly, stop early
    if (engagementScore < 30 && askedCount >= range.min) {
      return false; // User is losing interest, wrap up
    }

    // If engagement is high, continue
    if (engagementScore >= 60) {
      return true;
    }

    // Medium engagement, continue but be cautious
    if (askedCount >= range.min + 2) {
      return false; // Asked enough for medium engagement
    }

    return true;
  }

  /**
   * Suggests mode upgrade/downgrade based on engagement changes
   *
   * @param currentMode - Current mode
   * @param newEngagementScore - New engagement score
   * @returns Suggested new mode, or null if no change
   */
  suggestModeChange(
    currentMode: DiagnosticMode,
    newEngagementScore: number
  ): DiagnosticMode | null {
    // Engagement thresholds
    const DEEP_THRESHOLD = 70;
    const STANDARD_THRESHOLD = 40;

    const suggestedMode = this.getModeForScore(newEngagementScore);

    // Only suggest upgrade, not downgrade (don't frustrate users)
    if (currentMode === 'express' && suggestedMode === 'standard') {
      return 'standard';
    }

    if (currentMode === 'express' && suggestedMode === 'deep') {
      return 'standard'; // Gradual upgrade
    }

    if (currentMode === 'standard' && suggestedMode === 'deep') {
      return 'deep';
    }

    return null; // No change
  }

  /**
   * Gets recommended mode for an engagement score
   */
  private getModeForScore(score: number): DiagnosticMode {
    if (score >= 70) return 'deep';
    if (score >= 40) return 'standard';
    return 'express';
  }

  /**
   * Gets progress percentage for UI
   *
   * @param mode - Current mode
   * @param askedCount - Questions asked so far
   * @returns Progress percentage (0-100)
   */
  getProgressPercentage(mode: DiagnosticMode, askedCount: number): number {
    const total = this.QUESTION_RANGES[mode].max;
    return Math.round((askedCount / total) * 100);
  }

  /**
   * Gets a progress message for the user
   *
   * @param mode - Current mode
   * @param askedCount - Questions asked
   * @param language - User's language
   * @returns Progress message
   */
  getProgressMessage(
    mode: DiagnosticMode,
    askedCount: number,
    language: Language
  ): string | null {
    const range = this.QUESTION_RANGES[mode];
    const remaining = range.max - askedCount;

    // Show message when getting close to the end
    if (remaining <= 2 && remaining > 0) {
      if (language === 'es') {
        return 'Ya casi terminamos, esto es importante...';
      } else {
        return "We're almost done, this is important...";
      }
    }

    // Halfway message
    if (askedCount === Math.floor(range.max / 2)) {
      if (language === 'es') {
        return 'Gracias por compartir eso, me ayuda a entenderte mejor...';
      } else {
        return 'Thanks for sharing that, it helps me understand you better...';
      }
    }

    return null;
  }

  /**
   * Gets statistics about question distribution
   */
  getQuestionStats(mode: DiagnosticMode): {
    essential: number;
    standard: number;
    deep: number;
    total: number;
  } {
    const priorities = this.getApplicablePriorities(mode);

    const stats = {
      essential: 0,
      standard: 0,
      deep: 0,
      total: 0,
    };

    for (const config of this.QUESTION_PRIORITIES) {
      if (priorities.includes(config.priority)) {
        stats[config.priority]++;
        stats.total++;
      }
    }

    return stats;
  }
}
