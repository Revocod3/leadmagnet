import { prisma } from '../../config/database';
import { AssistantService } from './assistant.service';
import type { Language, DiagnosisResponse, QuizAnswer } from '../../types';

export class DiagnosisService {
  constructor(private assistantService: AssistantService) { }

  async generateDiagnosis(
    sessionId: string,
    userName?: string,
    language: Language = 'es'
  ): Promise<DiagnosisResponse> {
    // Get all quiz answers for this session
    const answers = await prisma.quizAnswer.findMany({
      where: { sessionId },
      orderBy: { questionId: 'asc' },
    });

    // Get image analysis if exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { imageAnalysisText: true },
    });

    const answersText = this.formatAnswersForDiagnosis(answers, language);
    const diagnosis = await this.assistantService.generateDiagnosis(
      userName,
      answersText,
      session?.imageAnalysisText || undefined,
      language
    );

    // Calculate score
    const totalScore = answers.reduce((sum, answer) => sum + answer.points, 0);
    const maxPossibleScore = answers.length * 5; // Assuming max 5 points per question
    const scorePercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    // Save diagnosis to database
    const savedDiagnosis = await prisma.diagnosis.create({
      data: {
        sessionId,
        content: diagnosis,
        totalScore,
        scorePercentage,
      },
    });

    return {
      id: savedDiagnosis.id,
      sessionId: savedDiagnosis.sessionId,
      content: savedDiagnosis.content,
      totalScore: savedDiagnosis.totalScore || undefined,
      scorePercentage: savedDiagnosis.scorePercentage || undefined,
      pdfGenerated: savedDiagnosis.pdfGenerated,
      createdAt: savedDiagnosis.createdAt,
    };
  }

  private formatAnswersForDiagnosis(answers: QuizAnswer[], language: Language): string {
    const questionLabels: Record<number, string> = {
      1: language === 'es' ? 'Dolor abdominal' : 'Abdominal pain',
      2: language === 'es' ? 'Digestión' : 'Digestion',
      3: language === 'es' ? 'Hábitos alimenticios' : 'Eating habits',
      4: language === 'es' ? 'Estrés' : 'Stress',
      5: language === 'es' ? 'Ejercicio' : 'Exercise',
      6: language === 'es' ? 'Sueño' : 'Sleep',
      7: language === 'es' ? 'Hinchazón' : 'Bloating',
      8: language === 'es' ? 'Estreñimiento' : 'Constipation',
      9: language === 'es' ? 'Diarrea' : 'Diarrhea',
      10: language === 'es' ? 'Náuseas' : 'Nausea',
      11: language === 'es' ? 'Apetito' : 'Appetite',
      12: language === 'es' ? 'Intolerancias' : 'Intolerances',
      13: language === 'es' ? 'Medicamentos' : 'Medications',
      14: language === 'es' ? 'Historial familiar' : 'Family history',
      15: language === 'es' ? 'Cambios de peso' : 'Weight changes',
      16: language === 'es' ? 'Hidratación' : 'Hydration',
      17: language === 'es' ? 'Hábitos diarios' : 'Daily habits',
    };

    return answers
      .map(answer => `${questionLabels[answer.questionId] || `Pregunta ${answer.questionId}`}: ${answer.answer}`)
      .join('\n');
  }

  async getDiagnosis(sessionId: string): Promise<DiagnosisResponse | null> {
    const diagnosis = await prisma.diagnosis.findUnique({
      where: { sessionId },
    });

    if (!diagnosis) {
      return null;
    }

    return {
      id: diagnosis.id,
      sessionId: diagnosis.sessionId,
      content: diagnosis.content,
      totalScore: diagnosis.totalScore || undefined,
      scorePercentage: diagnosis.scorePercentage || undefined,
      pdfGenerated: diagnosis.pdfGenerated,
      createdAt: diagnosis.createdAt,
    };
  }
}