import { Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../config/database';
import { VisionService } from '../services/openai/vision.service';
import { ValidationService } from '../services/openai/validation.service';
import type { ApiResponse } from '../types';

const visionService = new VisionService();
const validationService = new ValidationService();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  },
});

export class ImageController {
  async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.body;

      // Validate session ID
      const sessionValidation = validationService.validateSessionId(sessionId);
      if (!sessionValidation.isValid) {
        res.status(400).json({
          success: false,
          error: sessionValidation.feedback,
        } as ApiResponse);
        return;
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No se encontró ningún archivo de imagen',
        } as ApiResponse);
        return;
      }

      // Get session
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Sesión no encontrada',
        } as ApiResponse);
        return;
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        res.status(410).json({
          success: false,
          error: 'Sesión expirada',
        } as ApiResponse);
        return;
      }

      const imageBuffer = req.file.buffer;

      // Validate image
      const validation = await visionService.validateImage(imageBuffer);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: validation.reason || 'Imagen inválida',
        } as ApiResponse);
        return;
      }

      // Analyze image
      const analysis = await visionService.analyzeImage(
        imageBuffer,
        session.language as any
      );

      // Save analysis to session
      await prisma.session.update({
        where: { id: sessionId },
        data: { imageAnalysisText: analysis },
      });

      res.json({
        success: true,
        data: { analysis },
      } as ApiResponse<{ analysis: string }>);
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      } as ApiResponse);
    }
  }

  async getImageAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const sessionValidation = validationService.validateSessionId(sessionId);
      if (!sessionValidation.isValid) {
        res.status(400).json({
          success: false,
          error: sessionValidation.feedback,
        } as ApiResponse);
        return;
      }

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { imageAnalysisText: true },
      });

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Sesión no encontrada',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: {
          analysis: session.imageAnalysisText || null,
        },
      } as ApiResponse<{ analysis: string | null }>);
    } catch (error) {
      console.error('Error getting image analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      } as ApiResponse);
    }
  }
}

// Export multer middleware
export const uploadMiddleware = upload.single('image');