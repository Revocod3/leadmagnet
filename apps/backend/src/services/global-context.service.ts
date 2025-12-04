/**
 * Global Context Service
 * 
 * Manages the persistent global context for Clara Premium users.
 * Extracts and accumulates information across all conversations.
 * Provides formatted context for injection into Clara's instructions.
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import OpenAI from 'openai';

const openai = new OpenAI();

// Maximum tokens for context (to avoid overwhelming the LLM)
const MAX_CONTEXT_TOKENS = 2000;

interface ExtractedContext {
  digestiveProfile?: {
    symptoms?: string[];
    patterns?: string[];
    triggers?: string[];
    intolerances?: string[];
    bloatingFrequency?: string;
    bowelMovements?: string;
  };
  emotionalProfile?: {
    stressLevel?: string;
    emotionalPatterns?: string[];
    gutBrainConnection?: string;
    moodTriggers?: string[];
  };
  culturalProfile?: {
    country?: string;
    timezone?: string;
    foodCulture?: string;
    mealSchedule?: string;
    dietaryRestrictions?: string[];
  };
  habitsProfile?: {
    eatingSpeed?: string;
    cookingAbility?: string;
    hydration?: string;
    exercise?: string;
    sleep?: string;
    workStyle?: string;
  };
  medicalHistory?: {
    diagnoses?: string[];
    medications?: string[];
    surgeries?: string[];
    allergies?: string[];
  };
  goals?: string[];
  identifiedTriggers?: string[];
  strengths?: string[];
  personalityType?: string;
  communicationStyle?: {
    formality?: string;
    verbosity?: string;
    emotionLevel?: string;
    preferredTone?: string;
  };
}

interface GlobalContextData {
  id: string;
  userId: string;
  digestiveProfile: Record<string, unknown>;
  emotionalProfile: Record<string, unknown>;
  culturalProfile: Record<string, unknown>;
  habitsProfile: Record<string, unknown>;
  medicalHistory: Record<string, unknown>;
  goals: string[];
  identifiedTriggers: string[];
  strengths: string[];
  currentPhase: string;
  weekNumber: number;
  daysInProgram: number;
  programStartDate: Date | null;
  radiographyCompleted: boolean;
  radiographyContent: string | null;
  personalityType: string | null;
  communicationStyle: Record<string, unknown>;
  lastCheckInDate: Date | null;
  consecutiveDays: number;
}

export class GlobalContextService {

  /**
   * Get or create global context for a user
   */
  async getOrCreateContext(userId: string): Promise<GlobalContextData> {
    let context = await prisma.userGlobalContext.findUnique({
      where: { userId }
    });

    if (!context) {
      context = await prisma.userGlobalContext.create({
        data: {
          userId,
          digestiveProfile: {},
          emotionalProfile: {},
          culturalProfile: {},
          habitsProfile: {},
          medicalHistory: {},
          goals: [],
          identifiedTriggers: [],
          strengths: [],
          communicationStyle: {},
          currentPhase: 'onboarding',
          weekNumber: 0,
          daysInProgram: 0,
        }
      });
      logger.info(`Created new global context for user ${userId}`);
    }

    return context as unknown as GlobalContextData;
  }

  /**
   * Extract information from conversation messages and update global context
   * Called incrementally during conversations (every ~8 messages) and at conversation end
   */
  async extractAndUpdateContext(
    userId: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<void> {
    try {
      logger.info(`[CONTEXT] Starting extraction for user ${userId} with ${messages.length} messages`);

      // Get current context
      const currentContext = await this.getOrCreateContext(userId);

      // Format messages for extraction
      const conversationText = messages
        .map(m => `${m.role === 'user' ? 'Usuario' : 'Clara'}: ${m.content}`)
        .join('\n\n');

      logger.info(`[CONTEXT] Conversation text length: ${conversationText.length} chars`);

      // Use GPT to extract structured information
      const extractionPrompt = `Analiza esta conversación entre Clara (asistente de salud digestiva) y un usuario.
Extrae SOLO información nueva que no esté ya en el contexto existente.

CONTEXTO EXISTENTE:
${JSON.stringify(currentContext, null, 2)}

CONVERSACIÓN:
${conversationText}

Extrae y devuelve un JSON con SOLO los campos que tienen información NUEVA o ACTUALIZADA:

{
  "digestiveProfile": {
    "symptoms": ["lista de síntomas mencionados"],
    "patterns": ["patrones detectados como 'hinchazón después de comer', 'peor por las noches'"],
    "triggers": ["alimentos o situaciones que causan síntomas"],
    "intolerances": ["intolerancias mencionadas"],
    "bloatingFrequency": "frecuencia de hinchazón",
    "bowelMovements": "patrón intestinal"
  },
  "emotionalProfile": {
    "stressLevel": "bajo/medio/alto",
    "emotionalPatterns": ["patrones emocionales detectados"],
    "gutBrainConnection": "conexión observada entre emociones y digestión",
    "moodTriggers": ["situaciones que afectan el ánimo"]
  },
  "culturalProfile": {
    "country": "país",
    "timezone": "zona horaria inferida",
    "foodCulture": "tipo de alimentación cultural",
    "mealSchedule": "horarios de comida",
    "dietaryRestrictions": ["restricciones alimentarias"]
  },
  "habitsProfile": {
    "eatingSpeed": "rápido/normal/lento",
    "cookingAbility": "cocina mucho/poco/nada",
    "hydration": "nivel de hidratación",
    "exercise": "nivel de ejercicio",
    "sleep": "calidad de sueño",
    "workStyle": "tipo de trabajo"
  },
  "medicalHistory": {
    "diagnoses": ["diagnósticos mencionados"],
    "medications": ["medicaciones"],
    "surgeries": ["cirugías"],
    "allergies": ["alergias"]
  },
  "goals": ["objetivos del usuario"],
  "identifiedTriggers": ["triggers confirmados"],
  "strengths": ["fortalezas del usuario"],
  "personalityType": "tipo de personalidad detectado (timido/extrovertido/emocional/racional/esceptico)",
  "communicationStyle": {
    "formality": "formal/informal",
    "verbosity": "conciso/detallado",
    "emotionLevel": "bajo/medio/alto",
    "preferredTone": "tono preferido"
  }
}

REGLAS:
1. Solo incluye campos donde hay información NUEVA o ACTUALIZADA
2. No repitas información que ya está en el contexto existente
3. Combina arrays en lugar de reemplazarlos
4. Si no hay información nueva para un campo, NO lo incluyas
5. Responde SOLO con el JSON, sin explicaciones`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Eres un extractor de información estructurada. Responde solo con JSON válido.' },
          { role: 'user', content: extractionPrompt }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1500,
        temperature: 0.3
      });

      const extractedText = completion.choices[0]?.message?.content;
      if (!extractedText) {
        logger.warn('[CONTEXT] No content extracted from conversation');
        return;
      }

      logger.info(`[CONTEXT] Extracted text length: ${extractedText.length} chars`);

      let extracted: ExtractedContext;
      try {
        extracted = JSON.parse(extractedText);
        logger.info(`[CONTEXT] Parsed extracted data: ${JSON.stringify(Object.keys(extracted))}`);
      } catch {
        logger.error('[CONTEXT] Failed to parse extracted context JSON:', { preview: extractedText.substring(0, 200) });
        return;
      }

      // Merge extracted data with existing context
      const updatedData = this.mergeContextData(currentContext, extracted);
      logger.info(`[CONTEXT] Merged data keys: ${JSON.stringify(Object.keys(updatedData))}`);

      // Update in database - only pass known update fields
      const updatePayload: Record<string, unknown> = {
        updatedAt: new Date()
      };

      if (updatedData.digestiveProfile) updatePayload.digestiveProfile = updatedData.digestiveProfile;
      if (updatedData.emotionalProfile) updatePayload.emotionalProfile = updatedData.emotionalProfile;
      if (updatedData.culturalProfile) updatePayload.culturalProfile = updatedData.culturalProfile;
      if (updatedData.habitsProfile) updatePayload.habitsProfile = updatedData.habitsProfile;
      if (updatedData.medicalHistory) updatePayload.medicalHistory = updatedData.medicalHistory;
      if (updatedData.goals) updatePayload.goals = updatedData.goals;
      if (updatedData.identifiedTriggers) updatePayload.identifiedTriggers = updatedData.identifiedTriggers;
      if (updatedData.strengths) updatePayload.strengths = updatedData.strengths;
      if (updatedData.communicationStyle) updatePayload.communicationStyle = updatedData.communicationStyle;
      if (updatedData.personalityType) updatePayload.personalityType = updatedData.personalityType;

      logger.info(`[CONTEXT] Update payload keys: ${JSON.stringify(Object.keys(updatePayload))}`);

      await prisma.userGlobalContext.update({
        where: { userId },
        data: updatePayload
      });

      logger.info(`[CONTEXT] ✅ Successfully updated global context for user ${userId}`);

    } catch (error) {
      logger.error('Error extracting and updating context:', { error, userId });
    }
  }

  /**
   * Merge new extracted data with existing context
   */
  private mergeContextData(
    existing: GlobalContextData,
    extracted: ExtractedContext
  ): Partial<GlobalContextData> {
    const result: Partial<GlobalContextData> = {};

    // Merge object fields (profiles)
    if (extracted.digestiveProfile) {
      result.digestiveProfile = this.mergeObjects(
        existing.digestiveProfile as Record<string, unknown>,
        extracted.digestiveProfile as Record<string, unknown>
      );
    }

    if (extracted.emotionalProfile) {
      result.emotionalProfile = this.mergeObjects(
        existing.emotionalProfile as Record<string, unknown>,
        extracted.emotionalProfile as Record<string, unknown>
      );
    }

    if (extracted.culturalProfile) {
      result.culturalProfile = this.mergeObjects(
        existing.culturalProfile as Record<string, unknown>,
        extracted.culturalProfile as Record<string, unknown>
      );
    }

    if (extracted.habitsProfile) {
      result.habitsProfile = this.mergeObjects(
        existing.habitsProfile as Record<string, unknown>,
        extracted.habitsProfile as Record<string, unknown>
      );
    }

    if (extracted.medicalHistory) {
      result.medicalHistory = this.mergeObjects(
        existing.medicalHistory as Record<string, unknown>,
        extracted.medicalHistory as Record<string, unknown>
      );
    }

    if (extracted.communicationStyle) {
      result.communicationStyle = this.mergeObjects(
        existing.communicationStyle as Record<string, unknown>,
        extracted.communicationStyle as Record<string, unknown>
      );
    }

    // Merge array fields (unique values only)
    if (extracted.goals) {
      result.goals = this.mergeArrays(existing.goals || [], extracted.goals);
    }

    if (extracted.identifiedTriggers) {
      result.identifiedTriggers = this.mergeArrays(
        existing.identifiedTriggers || [],
        extracted.identifiedTriggers
      );
    }

    if (extracted.strengths) {
      result.strengths = this.mergeArrays(existing.strengths || [], extracted.strengths);
    }

    // Simple fields (override if new value)
    if (extracted.personalityType) {
      result.personalityType = extracted.personalityType;
    }

    return result;
  }

  /**
   * Merge two objects, combining arrays and preferring new values
   */
  private mergeObjects(
    existing: Record<string, unknown>,
    newData: Record<string, unknown>
  ): Record<string, unknown> {
    const result = { ...existing };

    for (const [key, value] of Object.entries(newData)) {
      if (value === null || value === undefined) continue;

      if (Array.isArray(value)) {
        const existingArray = Array.isArray(result[key]) ? result[key] as unknown[] : [];
        result[key] = this.mergeArrays(existingArray as string[], value as string[]);
      } else if (typeof value === 'object') {
        result[key] = this.mergeObjects(
          (result[key] as Record<string, unknown>) || {},
          value as Record<string, unknown>
        );
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Merge two arrays, keeping only unique values
   */
  private mergeArrays(existing: string[], newItems: string[]): string[] {
    const set = new Set([...existing, ...newItems]);
    return Array.from(set);
  }

  /**
   * Get formatted context for injection into Clara's instructions
   * Prioritizes most important information and respects token limit
   */
  async getFormattedContext(userId: string): Promise<string> {
    const context = await this.getOrCreateContext(userId);

    // Build formatted sections
    const sections: string[] = [];

    // User info and progress
    sections.push(`**Estado del programa:**
- Fase: ${context.currentPhase}
- Semana: ${context.weekNumber}
- Días en programa: ${context.daysInProgram}
- Días consecutivos: ${context.consecutiveDays}
- Radiografía completada: ${context.radiographyCompleted ? 'Sí' : 'No'}`);

    // Goals (high priority)
    if (context.goals && context.goals.length > 0) {
      sections.push(`**Objetivos:**
${context.goals.map(g => `• ${g}`).join('\n')}`);
    }

    // Digestive profile (high priority)
    if (context.digestiveProfile && Object.keys(context.digestiveProfile).length > 0) {
      const dp = context.digestiveProfile as Record<string, unknown>;
      let digestiveText = '**Perfil digestivo:**\n';
      if (dp.symptoms) digestiveText += `• Síntomas: ${(dp.symptoms as string[]).join(', ')}\n`;
      if (dp.patterns) digestiveText += `• Patrones: ${(dp.patterns as string[]).join(', ')}\n`;
      if (dp.bloatingFrequency) digestiveText += `• Hinchazón: ${dp.bloatingFrequency}\n`;
      if (dp.bowelMovements) digestiveText += `• Tránsito: ${dp.bowelMovements}\n`;
      sections.push(digestiveText.trim());
    }

    // Identified triggers (high priority)
    if (context.identifiedTriggers && context.identifiedTriggers.length > 0) {
      sections.push(`**Triggers identificados:**
${context.identifiedTriggers.map(t => `⚠️ ${t}`).join('\n')}`);
    }

    // Emotional profile
    if (context.emotionalProfile && Object.keys(context.emotionalProfile).length > 0) {
      const ep = context.emotionalProfile as Record<string, unknown>;
      let emotionalText = '**Perfil emocional:**\n';
      if (ep.stressLevel) emotionalText += `• Nivel de estrés: ${ep.stressLevel}\n`;
      if (ep.gutBrainConnection) emotionalText += `• Conexión mente-intestino: ${ep.gutBrainConnection}\n`;
      if (ep.emotionalPatterns) emotionalText += `• Patrones: ${(ep.emotionalPatterns as string[]).join(', ')}\n`;
      sections.push(emotionalText.trim());
    }

    // Cultural profile
    if (context.culturalProfile && Object.keys(context.culturalProfile).length > 0) {
      const cp = context.culturalProfile as Record<string, unknown>;
      let culturalText = '**Contexto cultural:**\n';
      if (cp.country) culturalText += `• País: ${cp.country}\n`;
      if (cp.foodCulture) culturalText += `• Alimentación: ${cp.foodCulture}\n`;
      if (cp.mealSchedule) culturalText += `• Horarios: ${cp.mealSchedule}\n`;
      if (cp.dietaryRestrictions) culturalText += `• Restricciones: ${(cp.dietaryRestrictions as string[]).join(', ')}\n`;
      sections.push(culturalText.trim());
    }

    // Habits profile
    if (context.habitsProfile && Object.keys(context.habitsProfile).length > 0) {
      const hp = context.habitsProfile as Record<string, unknown>;
      let habitsText = '**Hábitos:**\n';
      if (hp.eatingSpeed) habitsText += `• Velocidad al comer: ${hp.eatingSpeed}\n`;
      if (hp.hydration) habitsText += `• Hidratación: ${hp.hydration}\n`;
      if (hp.sleep) habitsText += `• Sueño: ${hp.sleep}\n`;
      if (hp.workStyle) habitsText += `• Trabajo: ${hp.workStyle}\n`;
      sections.push(habitsText.trim());
    }

    // Medical history (if any)
    if (context.medicalHistory && Object.keys(context.medicalHistory).length > 0) {
      const mh = context.medicalHistory as Record<string, unknown>;
      let medicalText = '**Historial médico:**\n';
      if (mh.diagnoses) medicalText += `• Diagnósticos: ${(mh.diagnoses as string[]).join(', ')}\n`;
      if (mh.medications) medicalText += `• Medicación: ${(mh.medications as string[]).join(', ')}\n`;
      if (mh.allergies) medicalText += `• Alergias: ${(mh.allergies as string[]).join(', ')}\n`;
      sections.push(medicalText.trim());
    }

    // Strengths
    if (context.strengths && context.strengths.length > 0) {
      sections.push(`**Fortalezas:**
${context.strengths.map(s => `💪 ${s}`).join('\n')}`);
    }

    // Personality and communication
    if (context.personalityType) {
      sections.push(`**Personalidad:** ${context.personalityType}`);
    }

    // Join all sections
    let formattedContext = sections.join('\n\n');

    // Simple token approximation (1 token ≈ 4 chars for Spanish)
    const estimatedTokens = formattedContext.length / 4;
    if (estimatedTokens > MAX_CONTEXT_TOKENS) {
      // Truncate less important sections
      formattedContext = this.truncateContext(sections, MAX_CONTEXT_TOKENS);
    }

    return formattedContext;
  }

  /**
   * Truncate context to fit within token limit, prioritizing important sections
   */
  private truncateContext(sections: string[], maxTokens: number): string {
    // Priority order: goals, digestive, triggers, emotional, cultural, habits, medical, strengths, personality
    const priorityOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8];

    let result = '';
    let currentTokens = 0;

    for (const idx of priorityOrder) {
      if (idx >= sections.length) continue;

      const section = sections[idx];
      if (!section) continue;

      const sectionTokens = section.length / 4;

      if (currentTokens + sectionTokens <= maxTokens) {
        result += (result ? '\n\n' : '') + section;
        currentTokens += sectionTokens;
      }
    }

    return result;
  }

  /**
   * Update the user's program phase based on their progress
   */
  async updatePhase(userId: string): Promise<void> {
    const context = await this.getOrCreateContext(userId);

    // Calculate days in program
    let daysInProgram = 0;
    if (context.programStartDate) {
      const now = new Date();
      const start = new Date(context.programStartDate);
      daysInProgram = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Determine phase and week
    let currentPhase = 'onboarding';
    let weekNumber = 0;

    if (context.radiographyCompleted) {
      weekNumber = Math.floor(daysInProgram / 7) + 1;

      if (weekNumber === 1) currentPhase = 'week1';
      else if (weekNumber === 2) currentPhase = 'week2';
      else if (weekNumber === 3) currentPhase = 'week3';
      else if (weekNumber === 4) currentPhase = 'week4';
      else currentPhase = 'maintenance';
    }

    // Update consecutive days
    let consecutiveDays = context.consecutiveDays;
    if (context.lastCheckInDate) {
      const lastCheckIn = new Date(context.lastCheckInDate);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        consecutiveDays++;
      } else if (daysDiff > 1) {
        consecutiveDays = 1;
      }
    } else {
      consecutiveDays = 1;
    }

    // Update in database
    await prisma.userGlobalContext.update({
      where: { userId },
      data: {
        daysInProgram,
        weekNumber,
        currentPhase,
        consecutiveDays,
        lastCheckInDate: new Date()
      }
    });

    logger.info(`Updated phase for user ${userId}: ${currentPhase}, week ${weekNumber}, ${daysInProgram} days`);
  }

  /**
   * Mark the radiography as completed and start the program
   */
  async completeRadiography(userId: string, radiographyContent: string): Promise<void> {
    await prisma.userGlobalContext.update({
      where: { userId },
      data: {
        radiographyCompleted: true,
        radiographyContent,
        radiographyDate: new Date(),
        programStartDate: new Date(),
        currentPhase: 'week1',
        weekNumber: 1,
        daysInProgram: 0
      }
    });

    logger.info(`Radiography completed for user ${userId}, program started`);
  }

  /**
   * Get recent diary entries for context
   */
  async getRecentDiaryEntries(userId: string, days: number = 7): Promise<Array<{
    date: string;
    content: string;
    mood?: number;
    bloating?: number;
  }>> {
    const entries = await prisma.diaryEntry.findMany({
      where: {
        userId,
        date: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { date: 'desc' },
      take: 5
    });

    return entries.map(e => {
      const result: {
        date: string;
        content: string;
        mood?: number;
        bloating?: number;
      } = {
        date: e.date.toISOString().split('T')[0] || '',
        content: e.content
      };
      if (e.mood !== null) result.mood = e.mood;
      if (e.bloating !== null) result.bloating = e.bloating;
      return result;
    });
  }

  /**
   * Get current active challenge for user
   */
  async getCurrentChallenge(userId: string): Promise<{
    title: string;
    description: string;
    status: string;
  } | null> {
    const userChallenge = await prisma.userChallenge.findFirst({
      where: {
        userId,
        status: { in: ['assigned', 'in_progress'] }
      },
      include: {
        challenge: true
      },
      orderBy: { assignedAt: 'desc' }
    });

    if (!userChallenge) return null;

    return {
      title: userChallenge.challenge.title,
      description: userChallenge.challenge.description,
      status: userChallenge.status
    };
  }

  /**
   * Check if this is the user's first conversation
   */
  async isFirstConversation(userId: string): Promise<boolean> {
    const conversationCount = await prisma.proConversation.count({
      where: { userId }
    });
    return conversationCount <= 1;
  }
}

// Export singleton instance
export const globalContextService = new GlobalContextService();
