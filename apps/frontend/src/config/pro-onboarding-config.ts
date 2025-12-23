/**
 * PRO Onboarding Config - Simplified for Conversational Flow
 *
 * El onboarding PRO ya no usa preguntas estructuradas.
 * Clara tiene una conversación natural con el usuario.
 * Este archivo mantiene solo stubs para compatibilidad.
 */

// ============================================================================
// TIPOS (mantenidos para compatibilidad)
// ============================================================================

export interface OnboardingBlockConfig {
  id: string;
  name: string;
  questionsCount: number;
  color: string;
  colorDark: string;
  bgColor: string;
  bgColorDark: string;
  infoWedge: string;
}

export interface QuickReplyOption {
  text: string;
  shortText?: string;
}

// ============================================================================
// DEPRECATED - Stubs para compatibilidad
// ============================================================================

/** @deprecated No se usa en flujo conversacional */
export const ONBOARDING_BLOCKS: OnboardingBlockConfig[] = [];

/** @deprecated No se usa en flujo conversacional */
export const TOTAL_ONBOARDING_QUESTIONS = 0;

/** @deprecated No se usa en flujo conversacional */
export const QUESTION_PATTERNS: Record<string, RegExp[]> = {};

/** @deprecated No se usa en flujo conversacional */
export const QUICK_REPLIES: Record<string, QuickReplyOption[]> = {};

/** @deprecated No se usa en flujo conversacional */
export const QUESTION_ID_TO_TURN: Record<string, number> = {};

/** @deprecated No se usa en flujo conversacional */
export function calculateOnboardingProgress(
  _blockId: string,
  _questionInBlock: number
): {
  blockIndex: number;
  questionInBlock: number;
  totalQuestions: number;
  questionsCompleted: number;
  percentComplete: number;
} {
  return {
    blockIndex: 0,
    questionInBlock: 0,
    totalQuestions: 0,
    questionsCompleted: 0,
    percentComplete: 0,
  };
}

/** @deprecated No se usa en flujo conversacional */
export function shouldShowInfoWedge(
  _blockId: string,
  _questionInBlock: number
): { show: false; wedgeBlock: null } {
  return { show: false, wedgeBlock: null };
}

/** @deprecated No se usa en flujo conversacional */
export function getQuestionByTurn(_turn: number): null {
  return null;
}
