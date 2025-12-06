import { Request, Response } from 'express';
import { statsService } from '../services/stats.service';
import { logger } from '../utils/logger';

export class StatsController {
  /**
   * Get user count
   * GET /api/stats/user-count
   */
  async getUserCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await statsService.getUserCount();

      res.json({
        success: true,
        count,
      });
    } catch (error) {
      logger.error('Error getting user count:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: 'Error al obtener el contador de usuarios',
      });
    }
  }

  /**
   * Increment user count
   * POST /api/stats/user-count/increment
   */
  async incrementUserCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await statsService.incrementUserCount();

      res.json({
        success: true,
        count,
      });
    } catch (error) {
      logger.error('Error incrementing user count:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: 'Error al incrementar el contador de usuarios',
      });
    }
  }
}

export const statsController = new StatsController();
