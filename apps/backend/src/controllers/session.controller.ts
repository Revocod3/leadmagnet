import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ValidationService } from '../services/openai/validation.service';
import type { CreateSessionRequest, ApiResponse, SessionData } from '../types';

const validationService = new ValidationService();

export class SessionController {
  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const { userName, userEmail, language, wordpressLeadId, userId }: CreateSessionRequest & { userId?: string } = req.body;

      // Si es usuario PRO (tiene userId), buscar sesión existente primero
      if (userId) {
        const existingSession = await prisma.session.findFirst({
          where: {
            userId,
            expiresAt: {
              gt: new Date(), // Solo sesiones no expiradas
            },
          },
          orderBy: {
            startTime: 'desc', // La más reciente primero
          },
        });

        if (existingSession) {

          const sessionData: SessionData = {
            id: existingSession.id,
            ...(existingSession.userId && { userId: existingSession.userId }),
            ...(existingSession.userName && { userName: existingSession.userName }),
            ...(existingSession.userEmail && { userEmail: existingSession.userEmail }),
            language: existingSession.language as any,
            step: existingSession.step as any,
            startTime: existingSession.startTime,
            ...(existingSession.completionTime && { completionTime: existingSession.completionTime }),
            expiresAt: existingSession.expiresAt,
          };

          res.json({
            success: true,
            data: sessionData,
          } as ApiResponse<SessionData>);
          return;
        }

      }

      // Validate input - Name is required, email is optional
      if (!userName) {
        res.status(400).json({
          success: false,
          error: 'El nombre es requerido',
        } as ApiResponse);
        return;
      }

      const nameValidation = validationService.validateName(userName);
      if (!nameValidation.isValid) {
        res.status(400).json({
          success: false,
          error: nameValidation.feedback,
        } as ApiResponse);
        return;
      }

      // Validate email only if provided
      if (userEmail) {
        const emailValidation = validationService.validateEmail(userEmail);
        if (!emailValidation.isValid) {
          res.status(400).json({
            success: false,
            error: emailValidation.feedback,
          } as ApiResponse);
          return;
        }
      }

      // Create session
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

      const session = await prisma.session.create({
        data: {
          userId: userId || null,
          userName: userName || null,
          userEmail: userEmail || null,
          language: language || 'es',
          wordpressLeadId: wordpressLeadId || null,
          expiresAt,
        },
      });

      const sessionData: SessionData = {
        id: session.id,
        ...(session.userId && { userId: session.userId }),
        ...(session.userName && { userName: session.userName }),
        ...(session.userEmail && { userEmail: session.userEmail }),
        language: session.language as any,
        step: session.step as any,
        startTime: session.startTime,
        ...(session.completionTime && { completionTime: session.completionTime }),
        expiresAt: session.expiresAt,
      };

      res.json({
        success: true,
        data: sessionData,
      } as ApiResponse<SessionData>);
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      } as ApiResponse);
    }
  }

  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID es requerido',
        } as ApiResponse);
        return;
      }

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
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
          quizAnswers: {
            orderBy: { questionId: 'asc' },
          },
        },
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

      const sessionData: SessionData = {
        id: session.id,
        ...(session.userId && { userId: session.userId }),
        ...(session.userName && { userName: session.userName }),
        ...(session.userEmail && { userEmail: session.userEmail }),
        language: session.language as any,
        ...(session.diagnosticType && { diagnosticType: session.diagnosticType as any }),
        step: session.step as any,
        ...(session.imageAnalysisText && { imageAnalysisText: session.imageAnalysisText }),
        ...(session.assistantId && { assistantId: session.assistantId }),
        ...(session.threadId && { threadId: session.threadId }),
        startTime: session.startTime,
        ...(session.completionTime && { completionTime: session.completionTime }),
        expiresAt: session.expiresAt,
      };

      res.json({
        success: true,
        data: sessionData,
      } as ApiResponse<SessionData>);
    } catch (error) {
      console.error('Error getting session:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      } as ApiResponse);
    }
  }

  async updateSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const updates = req.body;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID es requerido',
        } as ApiResponse);
        return;
      }

      const sessionValidation = validationService.validateSessionId(sessionId);
      if (!sessionValidation.isValid) {
        res.status(400).json({
          success: false,
          error: sessionValidation.feedback,
        } as ApiResponse);
        return;
      }

      const session = await prisma.session.update({
        where: { id: sessionId },
        data: updates,
      });

      res.json({
        success: true,
        data: session,
      } as ApiResponse);
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      } as ApiResponse);
    }
  }
}