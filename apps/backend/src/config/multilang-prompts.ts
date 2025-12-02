/**
 * Clara's System Prompts - Multilanguage Support
 * Auto-generated translations from Spanish base
 */

import { CLARA_INSTRUCTIONS } from './assistant-instructions-optimized';

export type SupportedLanguage = 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt';

/**
 * Get Clara's system prompt in the specified language
 * Falls back to Spanish if language not supported
 */
export function getClaraPrompt(language: string): string {
  const lang = language.toLowerCase() as SupportedLanguage;

  // Por ahora solo español está disponible
  // Los demás idiomas se traducirán automáticamente
  if (MULTILANG_PROMPTS[lang]) {
    return MULTILANG_PROMPTS[lang];
  }

  // Fallback a español
  return MULTILANG_PROMPTS.es;
}

/**
 * System prompts for Clara in different languages
 * Spanish is the source, others are AI-translated
 */
export const MULTILANG_PROMPTS: Record<SupportedLanguage, string> = {
  // Español (original)
  es: CLARA_INSTRUCTIONS,

  // Inglés - pendiente de traducción
  en: CLARA_INSTRUCTIONS, // TODO: Translate

  // Francés - pendiente de traducción
  fr: CLARA_INSTRUCTIONS, // TODO: Translate

  // Alemán - pendiente de traducción
  de: CLARA_INSTRUCTIONS, // TODO: Translate

  // Italiano - pendiente de traducción
  it: CLARA_INSTRUCTIONS, // TODO: Translate

  // Portugués - pendiente de traducción
  pt: CLARA_INSTRUCTIONS, // TODO: Translate
};
