/**
 * Diary Controller
 * 
 * Handles HTTP requests for diary functionality.
 */

import { Response } from 'express';
import { diaryService } from '../services/diary.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

/**
 * Create a new diary entry
 * POST /api/diary
 */
export async function createDiaryEntry(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { content, mood, bloating, energy, stress, symptoms, meals, date, triggers, improvements } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required' });
    }

    const entry = await diaryService.createEntry({
      userId,
      content,
      ...(mood != null && { mood: parseInt(mood) }),
      ...(bloating != null && { bloating: parseInt(bloating) }),
      ...(energy != null && { energy: parseInt(energy) }),
      ...(stress != null && { stress: parseInt(stress) }),
      ...(Array.isArray(symptoms) && { symptoms }),
      ...(Array.isArray(meals) && { meals }),
      ...(Array.isArray(triggers) && { triggers }),
      ...(Array.isArray(improvements) && { improvements }),
      ...(date && { date })  // Pass as string, service will parse it correctly
    });

    return res.status(201).json({ entry });
  } catch (error) {
    logger.error('Error creating diary entry:', { error });
    return res.status(500).json({ error: 'Failed to create diary entry' });
  }
}

/**
 * Get diary entry by ID
 * GET /api/diary/:id
 */
export async function getDiaryEntry(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Entry ID is required' });
    }

    const entry = await diaryService.getEntry(id, userId);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    return res.json(entry);
  } catch (error) {
    logger.error('Error getting diary entry:', { error });
    return res.status(500).json({ error: 'Failed to get diary entry' });
  }
}

/**
 * Get diary entry by date
 * GET /api/diary/date/:date
 */
export async function getDiaryEntryByDate(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const date = req.params.date || req.query.date;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Pass the date string directly - the service will parse it correctly
    const entry = await diaryService.getEntryByDate(userId, date);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    return res.json({ entry });
  } catch (error) {
    logger.error('Error getting diary entry by date:', { error });
    return res.status(500).json({ error: 'Failed to get diary entry' });
  }
}

/**
 * Get all diary entries for user
 * GET /api/diary
 */
export async function getDiaryEntries(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit, offset, startDate, endDate } = req.query;

    const options: { limit?: number; offset?: number; startDate?: Date; endDate?: Date } = {};
    if (limit) options.limit = parseInt(limit as string);
    if (offset) options.offset = parseInt(offset as string);
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);

    const result = await diaryService.getEntries(userId, options);

    return res.json(result);
  } catch (error) {
    logger.error('Error getting diary entries:', { error });
    return res.status(500).json({ error: 'Failed to get diary entries' });
  }
}

/**
 * Get calendar data for a month
 * GET /api/diary/calendar/:year/:month
 */
export async function getCalendarData(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const year = req.params.year;
    const month = req.params.month;
    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }

    const data = await diaryService.getCalendarData(
      userId,
      parseInt(year),
      parseInt(month)
    );

    return res.json(data);
  } catch (error) {
    logger.error('Error getting calendar data:', { error });
    return res.status(500).json({ error: 'Failed to get calendar data' });
  }
}

/**
 * Update diary entry
 * PUT /api/diary/:id
 */
export async function updateDiaryEntry(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Entry ID is required' });
    }

    const { content, mood, bloating, energy, stress, symptoms, meals } = req.body;

    const updateData: { content?: string; mood?: number; bloating?: number; energy?: number; stress?: number; symptoms?: string[]; meals?: string[] } = {};
    if (content !== undefined) updateData.content = content;
    if (mood !== undefined) updateData.mood = parseInt(mood);
    if (bloating !== undefined) updateData.bloating = parseInt(bloating);
    if (energy !== undefined) updateData.energy = parseInt(energy);
    if (stress !== undefined) updateData.stress = parseInt(stress);
    if (Array.isArray(symptoms)) updateData.symptoms = symptoms;
    if (Array.isArray(meals)) updateData.meals = meals;

    const entry = await diaryService.updateEntry(id, userId, updateData);

    return res.json(entry);
  } catch (error) {
    if ((error as Error).message === 'Entry not found or unauthorized') {
      return res.status(404).json({ error: 'Entry not found' });
    }
    logger.error('Error updating diary entry:', { error });
    return res.status(500).json({ error: 'Failed to update diary entry' });
  }
}

/**
 * Delete diary entry
 * DELETE /api/diary/:id
 */
export async function deleteDiaryEntry(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Entry ID is required' });
    }

    await diaryService.deleteEntry(id, userId);

    return res.status(204).send();
  } catch (error) {
    if ((error as Error).message === 'Entry not found or unauthorized') {
      return res.status(404).json({ error: 'Entry not found' });
    }
    logger.error('Error deleting diary entry:', { error });
    return res.status(500).json({ error: 'Failed to delete diary entry' });
  }
}

/**
 * Get diary stats for progress tracking
 * GET /api/diary/stats
 */
export async function getDiaryStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await diaryService.getSummaryStats(userId);

    return res.json(stats);
  } catch (error) {
    logger.error('Error getting diary stats:', { error });
    return res.status(500).json({ error: 'Failed to get diary stats' });
  }
}
