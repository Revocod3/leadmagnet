import { Request, Response } from 'express';
import { prisma } from '../config/database';

export class RatingController {
  async createRating(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, rating, comment, flowType } = req.body;

      // Validación
      if (!sessionId || !rating || !flowType) {
        res.status(400).json({
          success: false,
          error: 'sessionId, rating y flowType son requeridos',
        });
        return;
      }

      // Validar que rating esté entre 1 y 5
      if (rating < 1 || rating > 5) {
        res.status(400).json({
          success: false,
          error: 'rating debe estar entre 1 y 5',
        });
        return;
      }

      // Validar flowType
      if (!['free', 'paid'].includes(flowType)) {
        res.status(400).json({
          success: false,
          error: 'flowType debe ser "free" o "paid"',
        });
        return;
      }

      // Verificar que la sesión existe
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Sesión no encontrada',
        });
        return;
      }

      // Crear la valoración
      const chatRating = await prisma.chatRating.create({
        data: {
          sessionId,
          rating,
          comment: comment || null,
          flowType,
        },
      });

      console.log('⭐ Nueva valoración creada:', {
        id: chatRating.id,
        sessionId,
        rating,
        flowType,
        hasComment: !!comment,
      });

      res.status(201).json({
        success: true,
        data: chatRating,
      });
    } catch (error) {
      console.error('❌ Error al crear valoración:', error);
      res.status(500).json({
        success: false,
        error: 'Error al crear la valoración',
      });
    }
  }

  async getRatingsBySession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'sessionId es requerido',
        });
        return;
      }

      const ratings = await prisma.chatRating.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: ratings,
      });
    } catch (error) {
      console.error('❌ Error al obtener valoraciones:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener valoraciones',
      });
    }
  }
}
