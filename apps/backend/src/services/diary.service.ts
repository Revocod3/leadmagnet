/**
 * Diary Service
 * 
 * Handles CRUD operations for user diary entries.
 * Integrates with Clara for AI-generated notes on entries.
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import OpenAI from 'openai';

const openai = new OpenAI();

export interface CreateDiaryEntryInput {
  userId: string;
  content: string;
  mood?: number;
  bloating?: number;
  energy?: number;
  stress?: number;
  symptoms?: string[];
  meals?: string[];
  date?: Date;
}

export interface UpdateDiaryEntryInput {
  content?: string;
  mood?: number;
  bloating?: number;
  energy?: number;
  stress?: number;
  symptoms?: string[];
  meals?: string[];
}

export interface DiaryEntryResponse {
  id: string;
  userId: string;
  content: string;
  mood: number | null;
  bloating: number | null;
  energy: number | null;
  stress: number | null;
  symptoms: string[];
  meals: string[];
  claraNotes: string | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class DiaryService {

  /**
   * Create a new diary entry
   */
  async createEntry(input: CreateDiaryEntryInput): Promise<DiaryEntryResponse> {
    const { userId, content, mood, bloating, energy, stress, symptoms, meals, date } = input;

    // Use provided date or today
    const entryDate = date || new Date();
    // Normalize to start of day
    entryDate.setHours(0, 0, 0, 0);

    // Check if entry already exists for this date
    const existingEntry = await prisma.diaryEntry.findUnique({
      where: {
        userId_date: {
          userId,
          date: entryDate
        }
      }
    });

    if (existingEntry) {
      // Update existing entry instead of creating new one
      const updateData: UpdateDiaryEntryInput = { content };
      if (mood !== undefined) updateData.mood = mood;
      if (bloating !== undefined) updateData.bloating = bloating;
      if (energy !== undefined) updateData.energy = energy;
      if (stress !== undefined) updateData.stress = stress;
      if (symptoms !== undefined) updateData.symptoms = symptoms;
      if (meals !== undefined) updateData.meals = meals;

      return this.updateEntry(existingEntry.id, userId, updateData);
    }

    // Create new entry
    const entry = await prisma.diaryEntry.create({
      data: {
        userId,
        content,
        ...(mood !== undefined && { mood }),
        ...(bloating !== undefined && { bloating }),
        ...(energy !== undefined && { energy }),
        ...(stress !== undefined && { stress }),
        symptoms: symptoms || [],
        meals: meals || [],
        date: entryDate
      }
    });

    // Generate Clara's notes asynchronously
    const notesContext: { mood?: number; bloating?: number; energy?: number; stress?: number; symptoms?: string[] } = {};
    if (mood !== undefined) notesContext.mood = mood;
    if (bloating !== undefined) notesContext.bloating = bloating;
    if (energy !== undefined) notesContext.energy = energy;
    if (stress !== undefined) notesContext.stress = stress;
    if (symptoms !== undefined) notesContext.symptoms = symptoms;

    this.generateClaraNotesAsync(entry.id, content, notesContext);

    logger.info(`Diary entry created for user ${userId}, date ${entryDate.toISOString()}`);

    return this.formatEntry(entry);
  }

  /**
   * Get a single diary entry by ID
   */
  async getEntry(entryId: string, userId: string): Promise<DiaryEntryResponse | null> {
    const entry = await prisma.diaryEntry.findUnique({
      where: { id: entryId }
    });

    if (!entry || entry.userId !== userId) {
      return null;
    }

    return this.formatEntry(entry);
  }

  /**
   * Get diary entry for a specific date
   */
  async getEntryByDate(userId: string, date: Date): Promise<DiaryEntryResponse | null> {
    // Normalize to start of day
    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);

    const entry = await prisma.diaryEntry.findUnique({
      where: {
        userId_date: {
          userId,
          date: entryDate
        }
      }
    });

    if (!entry) {
      return null;
    }

    return this.formatEntry(entry);
  }

  /**
   * Get all diary entries for a user with pagination
   */
  async getEntries(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{
    entries: DiaryEntryResponse[];
    total: number;
  }> {
    const { limit = 30, offset = 0, startDate, endDate } = options;

    const where: {
      userId: string;
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [entries, total] = await Promise.all([
      prisma.diaryEntry.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.diaryEntry.count({ where })
    ]);

    return {
      entries: entries.map(e => this.formatEntry(e)),
      total
    };
  }

  /**
   * Get entries for calendar view (just dates with entries)
   */
  async getCalendarData(
    userId: string,
    year: number,
    month: number
  ): Promise<Array<{
    date: string;
    hasMood: boolean;
    mood?: number;
    hasBloating: boolean;
    bloating?: number;
  }>> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    const entries = await prisma.diaryEntry.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        date: true,
        mood: true,
        bloating: true
      }
    });

    return entries.map(e => {
      const dateStr = e.date.toISOString().split('T')[0] || '';
      const result: {
        date: string;
        hasMood: boolean;
        mood?: number;
        hasBloating: boolean;
        bloating?: number;
      } = {
        date: dateStr,
        hasMood: e.mood !== null,
        hasBloating: e.bloating !== null,
      };
      if (e.mood !== null) result.mood = e.mood;
      if (e.bloating !== null) result.bloating = e.bloating;
      return result;
    });
  }

  /**
   * Update a diary entry
   */
  async updateEntry(
    entryId: string,
    userId: string,
    input: UpdateDiaryEntryInput
  ): Promise<DiaryEntryResponse> {
    // Verify ownership
    const existing = await prisma.diaryEntry.findUnique({
      where: { id: entryId }
    });

    if (!existing || existing.userId !== userId) {
      throw new Error('Entry not found or unauthorized');
    }

    const updated = await prisma.diaryEntry.update({
      where: { id: entryId },
      data: {
        ...(input.content !== undefined && { content: input.content }),
        ...(input.mood !== undefined && { mood: input.mood }),
        ...(input.bloating !== undefined && { bloating: input.bloating }),
        ...(input.energy !== undefined && { energy: input.energy }),
        ...(input.stress !== undefined && { stress: input.stress }),
        symptoms: (input.symptoms ?? existing.symptoms) as string[],
        meals: (input.meals ?? existing.meals) as string[],
        updatedAt: new Date()
      }
    });

    // Regenerate Clara's notes if content changed significantly
    if (input.content && input.content !== existing.content) {
      const notesContext: { mood?: number; bloating?: number; energy?: number; stress?: number; symptoms?: string[] } = {};
      if (input.mood !== undefined) notesContext.mood = input.mood;
      else if (existing.mood !== null) notesContext.mood = existing.mood;
      if (input.bloating !== undefined) notesContext.bloating = input.bloating;
      else if (existing.bloating !== null) notesContext.bloating = existing.bloating;
      if (input.energy !== undefined) notesContext.energy = input.energy;
      else if (existing.energy !== null) notesContext.energy = existing.energy;
      if (input.stress !== undefined) notesContext.stress = input.stress;
      else if (existing.stress !== null) notesContext.stress = existing.stress;
      notesContext.symptoms = input.symptoms ?? (existing.symptoms as string[]);

      this.generateClaraNotesAsync(entryId, input.content, notesContext);
    }

    logger.info(`Diary entry ${entryId} updated for user ${userId}`);

    return this.formatEntry(updated);
  }

  /**
   * Delete a diary entry
   */
  async deleteEntry(entryId: string, userId: string): Promise<void> {
    const existing = await prisma.diaryEntry.findUnique({
      where: { id: entryId }
    });

    if (!existing || existing.userId !== userId) {
      throw new Error('Entry not found or unauthorized');
    }

    await prisma.diaryEntry.delete({
      where: { id: entryId }
    });

    logger.info(`Diary entry ${entryId} deleted for user ${userId}`);
  }

  /**
   * Get recent entries for context (used by Clara)
   */
  async getRecentForContext(
    userId: string,
    days: number = 7
  ): Promise<Array<{
    date: string;
    content: string;
    mood?: number;
    bloating?: number;
    energy?: number;
    symptoms?: string[];
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await prisma.diaryEntry.findMany({
      where: {
        userId,
        date: { gte: startDate }
      },
      orderBy: { date: 'desc' },
      take: 5
    });

    return entries.map(e => {
      const dateStr = e.date.toISOString().split('T')[0] || '';
      const result: {
        date: string;
        content: string;
        mood?: number;
        bloating?: number;
        energy?: number;
        symptoms?: string[];
      } = {
        date: dateStr,
        content: e.content
      };
      if (e.mood !== null) result.mood = e.mood;
      if (e.bloating !== null) result.bloating = e.bloating;
      if (e.energy !== null) result.energy = e.energy;
      if (Array.isArray(e.symptoms) && e.symptoms.length > 0) result.symptoms = e.symptoms as string[];
      return result;
    });
  }

  /**
   * Get aggregated stats for progress tracking
   */
  async getStats(
    userId: string,
    days: number = 14
  ): Promise<{
    entries: Array<{
      date: string;
      mood: number | null;
      bloating: number | null;
      energy: number | null;
      stress: number | null;
    }>;
    averages: {
      mood: number | null;
      bloating: number | null;
      energy: number | null;
      stress: number | null;
    };
    trend: {
      mood: 'improving' | 'stable' | 'declining' | 'insufficient';
      bloating: 'improving' | 'stable' | 'declining' | 'insufficient';
      energy: 'improving' | 'stable' | 'declining' | 'insufficient';
    };
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await prisma.diaryEntry.findMany({
      where: {
        userId,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        mood: true,
        bloating: true,
        energy: true,
        stress: true
      }
    });

    // Calculate averages
    const validMoods = entries.filter(e => e.mood !== null).map(e => e.mood!);
    const validBloating = entries.filter(e => e.bloating !== null).map(e => e.bloating!);
    const validEnergy = entries.filter(e => e.energy !== null).map(e => e.energy!);
    const validStress = entries.filter(e => e.stress !== null).map(e => e.stress!);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    // Calculate trends (compare first half vs second half)
    const calcTrend = (values: number[]): 'improving' | 'stable' | 'declining' | 'insufficient' => {
      if (values.length < 4) return 'insufficient';
      const mid = Math.floor(values.length / 2);
      const firstHalf = values.slice(0, mid);
      const secondHalf = values.slice(mid);
      const firstAvg = avg(firstHalf)!;
      const secondAvg = avg(secondHalf)!;
      const diff = secondAvg - firstAvg;
      if (Math.abs(diff) < 0.5) return 'stable';
      return diff > 0 ? 'improving' : 'declining';
    };

    // For bloating, lower is better, so reverse the trend
    const calcBloatingTrend = (values: number[]): 'improving' | 'stable' | 'declining' | 'insufficient' => {
      const trend = calcTrend(values);
      if (trend === 'improving') return 'declining';
      if (trend === 'declining') return 'improving';
      return trend;
    };

    return {
      entries: entries.map(e => ({
        date: e.date.toISOString().split('T')[0] || '',
        mood: e.mood,
        bloating: e.bloating,
        energy: e.energy,
        stress: e.stress
      })),
      averages: {
        mood: avg(validMoods),
        bloating: avg(validBloating),
        energy: avg(validEnergy),
        stress: avg(validStress)
      },
      trend: {
        mood: calcTrend(validMoods),
        bloating: calcBloatingTrend(validBloating),
        energy: calcTrend(validEnergy)
      }
    };
  }

  /**
   * Generate Clara's notes on a diary entry (async, non-blocking)
   */
  private async generateClaraNotesAsync(
    entryId: string,
    content: string,
    metrics: {
      mood?: number;
      bloating?: number;
      energy?: number;
      stress?: number;
      symptoms?: string[];
    }
  ): Promise<void> {
    try {
      const prompt = `Como Clara, la asistente de Objetivo Vientre Plano, analiza esta entrada del diario del usuario y genera una respuesta breve, cálida y profesional (máximo 2-3 frases).

Entrada del diario:
"${content}"

Métricas:
- Ánimo: ${metrics.mood ?? 'no registrado'}/10
- Hinchazón: ${metrics.bloating ?? 'no registrado'}/10
- Energía: ${metrics.energy ?? 'no registrado'}/10
- Estrés: ${metrics.stress ?? 'no registrado'}/10
${metrics.symptoms?.length ? `- Síntomas: ${metrics.symptoms.join(', ')}` : ''}

Genera un comentario que:
1. Valide lo que el usuario comparte
2. Conecte patrones si los hay (emoción-digestión)
3. Ofrezca una perspectiva positiva o un pequeño consejo

Máximo 1 emoji. Tono cálido pero profesional.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Eres Clara, asistente de salud digestiva. Responde de forma breve y cálida.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      const claraNotes = completion.choices[0]?.message?.content?.trim();

      if (claraNotes) {
        await prisma.diaryEntry.update({
          where: { id: entryId },
          data: { claraNotes }
        });
        logger.info(`Clara notes generated for diary entry ${entryId}`);
      }
    } catch (error) {
      logger.error('Error generating Clara notes:', { error, entryId });
    }
  }

  /**
   * Format entry for response
   */
  private formatEntry(entry: {
    id: string;
    userId: string;
    content: string;
    mood: number | null;
    bloating: number | null;
    energy: number | null;
    stress: number | null;
    symptoms: unknown;
    meals: unknown;
    claraNotes: string | null;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
  }): DiaryEntryResponse {
    return {
      id: entry.id,
      userId: entry.userId,
      content: entry.content,
      mood: entry.mood,
      bloating: entry.bloating,
      energy: entry.energy,
      stress: entry.stress,
      symptoms: (entry.symptoms as string[]) || [],
      meals: (entry.meals as string[]) || [],
      claraNotes: entry.claraNotes,
      date: entry.date,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    };
  }
}

// Export singleton instance
export const diaryService = new DiaryService();
