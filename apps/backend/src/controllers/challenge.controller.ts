/**
 * Challenge Controller - Clara Premium
 * 
 * HTTP handlers for micro-challenge endpoints.
 */

import { Request, Response } from 'express';
import {
  getCurrentChallenge,
  getUserChallenges,
  getChallengeStats,
  completeChallenge,
  skipChallenge,
  assignChallenge,
  getAllChallenges,
  getRecommendedChallenge
} from '../services/challenge.service';

/**
 * Get current active challenge
 */
export async function getCurrent(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const challenge = await getCurrentChallenge(userId);

    res.json({ challenge });
  } catch (error) {
    console.error('Error getting current challenge:', error);
    res.status(500).json({ error: 'Error getting challenge' });
  }
}

/**
 * Get all user challenges (history)
 */
export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const challenges = await getUserChallenges(userId);

    res.json({ challenges });
  } catch (error) {
    console.error('Error getting challenge history:', error);
    res.status(500).json({ error: 'Error getting challenges' });
  }
}

/**
 * Get challenge statistics
 */
export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const stats = await getChallengeStats(userId);

    res.json(stats);
  } catch (error) {
    console.error('Error getting challenge stats:', error);
    res.status(500).json({ error: 'Error getting stats' });
  }
}

/**
 * Complete current challenge
 */
export async function complete(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { challengeId, notes } = req.body;
    if (!challengeId) {
      res.status(400).json({ error: 'Challenge ID required' });
      return;
    }

    const result = await completeChallenge(userId, challengeId, notes);

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error completing challenge:', error);
    res.status(500).json({ error: 'Error completing challenge' });
  }
}

/**
 * Skip current challenge
 */
export async function skip(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { challengeId, reason } = req.body;
    if (!challengeId) {
      res.status(400).json({ error: 'Challenge ID required' });
      return;
    }

    const result = await skipChallenge(userId, challengeId, reason);

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error skipping challenge:', error);
    res.status(500).json({ error: 'Error skipping challenge' });
  }
}

/**
 * Assign a new challenge to user
 */
export async function assign(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { challengeId } = req.body;
    if (!challengeId) {
      res.status(400).json({ error: 'Challenge ID required' });
      return;
    }

    const result = await assignChallenge(userId, challengeId);

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error assigning challenge:', error);
    res.status(500).json({ error: 'Error assigning challenge' });
  }
}

/**
 * Get recommended challenge for user
 */
export async function getRecommended(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const challenge = await getRecommendedChallenge(userId);

    res.json({ challenge });
  } catch (error) {
    console.error('Error getting recommended challenge:', error);
    res.status(500).json({ error: 'Error getting recommendation' });
  }
}

/**
 * Get all available challenges (admin/debug)
 */
export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const challenges = await getAllChallenges();
    res.json({ challenges });
  } catch (error) {
    console.error('Error getting all challenges:', error);
    res.status(500).json({ error: 'Error getting challenges' });
  }
}
