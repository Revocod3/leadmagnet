/**
 * Content Detection Service
 *
 * Analyzes Clara's responses to detect valuable content that should be:
 * - Saved as personalized documents
 * - Converted to challenges
 * - Offered as downloadable PDFs
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import OpenAI from 'openai';

const openai = new OpenAI();

export interface ContentAnalysis {
  // Document detection
  isValuableDocument: boolean;
  documentType?: 'nutrition_plan' | 'exercise_routine' | 'diagnostic' | 'guide' | 'challenge_detail';
  documentTitle?: string;

  // Challenge detection
  isChallenge: boolean;
  challengeTitle?: string;
  challengeDescription?: string;
  challengeDuration?: number; // days
  challengeCategory?: 'breathing' | 'eating' | 'hydration' | 'mindfulness' | 'movement';

  // PDF generation
  shouldOfferPDF: boolean;

  // Urgency detection
  isUrgent: boolean;
  urgencyReason?: string;
}

export class ContentDetectionService {

  /**
   * Analyze Clara's response to detect valuable content
   */
  async analyzeResponse(
    userId: string,
    conversationId: string,
    assistantMessage: string
  ): Promise<ContentAnalysis> {
    try {
      logger.info(`[CONTENT] Analyzing response for user ${userId}, length: ${assistantMessage.length}`);

      // Quick heuristic checks first
      const isLongResponse = assistantMessage.length > 500;
      const hasStructuredContent = this.hasStructuredMarkers(assistantMessage);

      if (!isLongResponse && !hasStructuredContent) {
        // Short, unstructured message - skip AI analysis
        return {
          isValuableDocument: false,
          isChallenge: false,
          shouldOfferPDF: false,
          isUrgent: false
        };
      }

      // Use AI to analyze content
      const analysisPrompt = `Analiza esta respuesta de Clara (asistente de salud digestiva) y determina:

1. ¿Es un DOCUMENTO VALIOSO que el usuario querría guardar? (planes de nutrición, rutinas, diagnósticos detallados, guías)
2. ¿Propone un RETO/CHALLENGE específico que el usuario debe completar?
3. ¿Debería ofrecerse como PDF descargable?
4. ¿Contiene SEÑALES DE URGENCIA MÉDICA que requieren atención profesional?

RESPUESTA DE CLARA:
"""
${assistantMessage}
"""

Responde SOLO con JSON válido:
{
  "isValuableDocument": boolean,
  "documentType": "nutrition_plan" | "exercise_routine" | "diagnostic" | "guide" | "challenge_detail" | null,
  "documentTitle": "Título descriptivo" o null,
  "isChallenge": boolean,
  "challengeTitle": "Título del reto" o null,
  "challengeDescription": "Descripción breve" o null,
  "challengeDuration": número de días o null,
  "challengeCategory": "breathing" | "eating" | "hydration" | "mindfulness" | "movement" | null,
  "shouldOfferPDF": boolean,
  "isUrgent": boolean,
  "urgencyReason": "Razón de urgencia" o null
}

CRITERIOS:

**Documento Valioso:**
- Plan de alimentación detallado (>3 comidas descritas)
- Rutina de ejercicios con instrucciones
- Diagnóstico/radiografía personalizada (>300 palabras)
- Guía paso a paso de un proceso

**Challenge:**
- Propone acción específica que el usuario debe hacer
- Tiene duración definida (1-7 días típicamente)
- Es medible/verificable
- Ejemplo: "Reto de 3 días: beber agua antes de comer"

**Ofrecer PDF:**
- TRUE si es documento valioso O challenge detallado
- FALSE para mensajes conversacionales normales

**Urgencia:**
- Menciona: sangre, dolor severo, fiebre alta, pérdida de peso abrupta
- Recomienda ir al médico urgentemente`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Eres un analizador de contenido médico. Responde solo con JSON válido.' },
          { role: 'user', content: analysisPrompt }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 600,
        temperature: 0.1
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        logger.warn('[CONTENT] No analysis result from AI');
        return this.getDefaultAnalysis();
      }

      const analysis = JSON.parse(result) as ContentAnalysis;

      logger.info(`[CONTENT] Analysis complete:`, {
        isValuableDocument: analysis.isValuableDocument,
        isChallenge: analysis.isChallenge,
        shouldOfferPDF: analysis.shouldOfferPDF,
        isUrgent: analysis.isUrgent
      });

      return analysis;

    } catch (error) {
      logger.error('[CONTENT] Error analyzing response:', { error, userId });
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Save valuable document to database
   */
  async saveDocument(
    userId: string,
    conversationId: string,
    analysis: ContentAnalysis,
    content: string
  ): Promise<void> {
    if (!analysis.isValuableDocument || !analysis.documentType || !analysis.documentTitle) {
      return;
    }

    try {
      await prisma.personalizedDocument.create({
        data: {
          userId,
          title: analysis.documentTitle,
          content,
          type: analysis.documentType,
          sourceConversationId: conversationId,
          isPDFAvailable: analysis.shouldOfferPDF
        }
      });

      logger.info(`[CONTENT] Saved document for user ${userId}: ${analysis.documentTitle}`);
    } catch (error) {
      logger.error('[CONTENT] Error saving document:', { error, userId });
    }
  }

  /**
   * Create user challenge from detected challenge in response
   */
  async createChallenge(
    userId: string,
    analysis: ContentAnalysis
  ): Promise<void> {
    if (!analysis.isChallenge || !analysis.challengeTitle || !analysis.challengeCategory) {
      return;
    }

    try {
      // MicroChallenge.title is unique in the schema, so treat title as the primary key.
      const existingChallenge = await prisma.microChallenge.findFirst({
        where: {
          title: analysis.challengeTitle,
        },
      });

      let challengeId: string;

      if (existingChallenge) {
        challengeId = existingChallenge.id;
      } else {
        try {
          const newChallenge = await prisma.microChallenge.create({
            data: {
              title: analysis.challengeTitle,
              description: analysis.challengeDescription || analysis.challengeTitle,
              category: analysis.challengeCategory,
              durationDays: analysis.challengeDuration || 1,
              difficulty: 'easy',
              points: 10,
              instructions: analysis.challengeDescription || analysis.challengeTitle,
              followUpQuestion: '¿Cómo te fue con este reto?'
            }
          });
          challengeId = newChallenge.id;
        } catch (createErr) {
          // In case of a race (unique title), re-fetch by title
          const refetched = await prisma.microChallenge.findFirst({
            where: { title: analysis.challengeTitle },
          });
          if (!refetched) throw createErr;
          challengeId = refetched.id;
        }
      }

      // Avoid assigning the same active challenge multiple times
      const existingUserChallenge = await prisma.userChallenge.findFirst({
        where: {
          userId,
          challengeId,
          status: { in: ['assigned', 'in_progress'] },
        },
      });

      if (existingUserChallenge) {
        logger.info(`[CONTENT] Challenge already active for user ${userId}: ${analysis.challengeTitle}`);
        return;
      }

      // Assign challenge to user
      await prisma.userChallenge.create({
        data: {
          userId,
          challengeId,
          status: 'assigned',
          assignedAt: new Date()
        }
      });

      logger.info(`[CONTENT] Created challenge for user ${userId}: ${analysis.challengeTitle}`);
    } catch (error) {
      logger.error('[CONTENT] Error creating challenge:', { error, userId });
    }
  }

  /**
   * Check for structured content markers (heuristic)
   */
  private hasStructuredMarkers(text: string): boolean {
    const markers = [
      /día \d+:/i,                    // "Día 1:", "Día 2:"
      /semana \d+:/i,                 // "Semana 1:"
      /desayuno:|almuerzo:|cena:/i,  // Meal structure
      /plan de \d+ días/i,            // "Plan de 7 días"
      /reto de \d+ días/i,            // "Reto de 3 días"
      /paso \d+:/i,                   // "Paso 1:", "Paso 2:"
      /ejercicio \d+:/i,              // "Ejercicio 1:"
    ];

    return markers.some(marker => marker.test(text));
  }

  /**
   * Get default analysis when AI fails or is skipped
   */
  private getDefaultAnalysis(): ContentAnalysis {
    return {
      isValuableDocument: false,
      isChallenge: false,
      shouldOfferPDF: false,
      isUrgent: false
    };
  }

  /**
   * Check for medical urgency keywords (pre-AI check)
   */
  detectUrgency(userMessage: string): { isUrgent: boolean; reason?: string } {
    const urgentKeywords = [
      { pattern: /sangre.*heces|heces.*sangre|sangrado.*rectal/i, reason: 'Sangrado rectal' },
      { pattern: /sangre.*vómito|vomit.*sangre|hematemesis/i, reason: 'Vómito con sangre' },
      { pattern: /dolor.*severo|dolor.*insoportable|dolor.*agudo.*abdomen/i, reason: 'Dolor abdominal severo' },
      { pattern: /pérdida.*peso.*(rápida|involuntaria|drástica)/i, reason: 'Pérdida de peso involuntaria' },
      { pattern: /fiebre.*(alta|persistente|más.*3.*días)/i, reason: 'Fiebre persistente' },
      { pattern: /ictericia|piel.*amarilla|ojos.*amarillos/i, reason: 'Ictericia' },
      { pattern: /dificultad.*tragar|disfagia/i, reason: 'Dificultad para tragar' },
      { pattern: /vómit.*(constante|persistente|no.*parar)/i, reason: 'Vómitos persistentes' },
    ];

    for (const { pattern, reason } of urgentKeywords) {
      if (pattern.test(userMessage)) {
        return { isUrgent: true, reason };
      }
    }

    return { isUrgent: false };
  }
}

// Export singleton instance
export const contentDetectionService = new ContentDetectionService();
