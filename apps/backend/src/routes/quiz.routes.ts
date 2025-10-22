import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller';
import { DiagnosisService } from '../services/openai/diagnosis.service';
import { AssistantService, getOrCreateAssistant } from '../services/openai/assistant.service';
import type { ApiResponse, DiagnosisResponse } from '../types';

const router = Router();
const quizController = new QuizController();

// POST /api/quiz - Submit quiz answer
router.post('/', quizController.submitAnswer.bind(quizController));

// GET /api/quiz/:sessionId - Get quiz answers
router.get('/:sessionId', quizController.getQuizAnswers.bind(quizController));

// POST /api/quiz/:sessionId/diagnosis - Generate diagnosis
router.post('/:sessionId/diagnosis', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const assistantId = await getOrCreateAssistant();
    const assistantService = new AssistantService(assistantId);
    const diagnosisService = new DiagnosisService(assistantService);

    const diagnosis = await diagnosisService.generateDiagnosis(sessionId);

    res.json({
      success: true,
      data: diagnosis,
    } as ApiResponse<DiagnosisResponse>);
  } catch (error) {
    console.error('Error generating diagnosis:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    } as ApiResponse);
  }
});

// GET /api/quiz/:sessionId/diagnosis - Get diagnosis
router.get('/:sessionId/diagnosis', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const assistantId = await getOrCreateAssistant();
    const assistantService = new AssistantService(assistantId);
    const diagnosisService = new DiagnosisService(assistantService);

    const diagnosis = await diagnosisService.getDiagnosis(sessionId);

    if (!diagnosis) {
      res.status(404).json({
        success: false,
        error: 'Diagnóstico no encontrado',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: diagnosis,
    } as ApiResponse<DiagnosisResponse>);
  } catch (error) {
    console.error('Error getting diagnosis:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    } as ApiResponse);
  }
});

export default router;