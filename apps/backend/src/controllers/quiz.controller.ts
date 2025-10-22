import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AssistantService, getOrCreateAssistant } from '../services/openai/assistant.service';
import { ValidationService } from '../services/openai/validation.service';
import type { SubmitQuizAnswerRequest, ApiResponse, QuizAnswer } from '../types';

const validationService = new ValidationService();
let assistantService: AssistantService | null = null;

async function getAssistantService(): Promise<AssistantService> {
  if (!assistantService) {
    const assistantId = await getOrCreateAssistant();
    assistantService = new AssistantService(assistantId);
  }
  return assistantService;
}

export class QuizController {
  async submitAnswer(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, questionId, answer }: SubmitQuizAnswerRequest = req.body;

      // Validate input
      const sessionValidation = validationService.validateSessionId(sessionId);
      if (!sessionValidation.isValid) {
        res.status(400).json({
          success: false,
          error: sessionValidation.feedback,
        } as ApiResponse);
        return;
      }

      const answerValidation = validationService.validateQuizAnswer(questionId, answer);
      if (!answerValidation.isValid) {
        res.status(400).json({
          success: false,
          error: answerValidation.feedback,
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

      // Calculate points based on answer (simplified logic)
      const points = this.calculatePoints(questionId, answer);

      // Save answer
      const quizAnswer = await prisma.quizAnswer.create({
        data: {
          sessionId,
          questionId,
          answer,
          points,
        },
      });

      // Generate empathic comment using AI
      const assistant = await getAssistantService();
      const questionText = this.getQuestionText(questionId, session.language);
      const empathicComment = await assistant.generateEmpathicComment(
        questionText,
        answer,
        session.language as any
      );

      const response: QuizAnswer & { empathicComment?: string } = {
        id: quizAnswer.id,
        sessionId: quizAnswer.sessionId,
        questionId: quizAnswer.questionId,
        answer: quizAnswer.answer,
        points: quizAnswer.points,
        createdAt: quizAnswer.createdAt,
        empathicComment,
      };

      res.json({
        success: true,
        data: response,
      } as ApiResponse<QuizAnswer & { empathicComment?: string }>);
    } catch (error) {
      console.error('Error submitting quiz answer:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      } as ApiResponse);
    }
  }

  async getQuizAnswers(req: Request, res: Response): Promise<void> {
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

      const answers = await prisma.quizAnswer.findMany({
        where: { sessionId },
        orderBy: { questionId: 'asc' },
      });

      const quizAnswers: QuizAnswer[] = answers.map(answer => ({
        id: answer.id,
        sessionId: answer.sessionId,
        questionId: answer.questionId,
        answer: answer.answer,
        points: answer.points,
        createdAt: answer.createdAt,
      }));

      res.json({
        success: true,
        data: quizAnswers,
      } as ApiResponse<QuizAnswer[]>);
    } catch (error) {
      console.error('Error getting quiz answers:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      } as ApiResponse);
    }
  }

  private calculatePoints(questionId: number, answer: string): number {
    // Simplified scoring logic - in a real app, this would be more sophisticated
    // For now, assign points based on positive/negative connotations
    const positiveAnswers = ['Nunca', 'Rara vez', 'A veces', 'Excelente', 'Muy buena', 'Buena'];
    const negativeAnswers = ['Siempre', 'Muy mala', 'Mala', 'Regular'];

    if (positiveAnswers.some(pos => answer.includes(pos))) return 1;
    if (negativeAnswers.some(neg => answer.includes(neg))) return 3;
    return 2; // Neutral
  }

  private getQuestionText(questionId: number, language: string): string {
    // This would typically come from a questions configuration file
    const questions: Record<string, Record<number, string>> = {
      es: {
        1: '¿Con qué frecuencia sientes dolor abdominal?',
        2: '¿Cómo calificarías tu digestión?',
        3: '¿Cómo son tus hábitos alimenticios?',
        // Add more questions...
      },
      en: {
        1: 'How often do you feel abdominal pain?',
        2: 'How would you rate your digestion?',
        3: 'How are your eating habits?',
        // Add more questions...
      },
    };

    return questions[language]?.[questionId] || `Question ${questionId}`;
  }
}