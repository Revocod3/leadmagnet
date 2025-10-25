import { prisma } from '../config/database';

interface WordPressSyncData {
  leadId: string;
  // Datos básicos
  nombre: string;
  email: string;

  // Datos del diagnóstico
  diagnosticCompleted: boolean;
  diagnosticMode?: string;
  diagnosticType?: string; // 'chat' o 'quiz'

  // Resultados
  diagnosisContent?: string;
  totalScore?: number;
  scorePercentage?: number;

  // Engagement
  engagementScore?: number;
  questionsAsked?: number;
  avgResponseLength?: number;
  timeSpent?: number; // en segundos

  // Fechas
  startTime: string;
  completedAt?: string;

  // Respuestas del quiz (si aplica)
  quizAnswers?: Array<{
    questionId: number;
    answer: string;
    points: number;
  }>;

  // Mensajes del chat (si aplica)
  chatMessages?: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;

  // Metadata adicional
  metadata?: {
    imageAnalysisText?: string;
    discountCode?: string;
    convertedToChat?: boolean;
  };
}

export class WordPressSyncService {
  private readonly wordpressWebhookUrl: string;
  private readonly apiKey: string;
  private readonly enabled: boolean;

  constructor() {
    this.wordpressWebhookUrl = process.env.WORDPRESS_WEBHOOK_URL || '';
    this.apiKey = process.env.WORDPRESS_API_KEY || '';
    this.enabled = !!this.wordpressWebhookUrl;

    if (!this.enabled) {
      console.warn('[WordPress Sync] WORDPRESS_WEBHOOK_URL no configurado. Sincronización deshabilitada.');
    }
  }

  /**
   * Sincroniza los datos completos del diagnóstico a WordPress
   */
  async syncDiagnosisCompletion(sessionId: string): Promise<void> {
    if (!this.enabled) {
      console.log('[WordPress Sync] Sincronización deshabilitada');
      return;
    }

    try {
      // Obtener todos los datos de la sesión
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          diagnosis: true,
          quizAnswers: {
            orderBy: { questionId: 'asc' },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
          },
          discountCodes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!session) {
        console.error('[WordPress Sync] Sesión no encontrada:', sessionId);
        return;
      }

      if (!session.wordpressLeadId) {
        console.log('[WordPress Sync] Sesión sin wordpressLeadId, saltando sincronización');
        return;
      }

      // Preparar datos para WordPress
      const syncData: any = {
        leadId: session.wordpressLeadId,
        nombre: session.userName || 'Usuario',
        email: session.userEmail || '',

        diagnosticCompleted: session.completedDiagnosis || false,
        diagnosticType: session.diagnosticType,

        questionsAsked: session.questionsAsked,
        timeSpent: session.timeSpent ? Math.round(session.timeSpent / 1000) : undefined,

        startTime: session.startTime.toISOString(),
        completedAt: session.completionTime?.toISOString(),

        quizAnswers: session.quizAnswers.map(answer => ({
          questionId: answer.questionId,
          answer: answer.answer,
          points: answer.points,
        })),

        chatMessages: session.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.createdAt.toISOString(),
        })),
      };

      // Agregar campos opcionales solo si tienen valores
      if (session.diagnosticMode) syncData.diagnosticMode = session.diagnosticMode;
      if (session.diagnosis?.content) syncData.diagnosisContent = session.diagnosis.content;
      if (session.diagnosis?.totalScore) syncData.totalScore = session.diagnosis.totalScore;
      if (session.diagnosis?.scorePercentage) syncData.scorePercentage = session.diagnosis.scorePercentage;
      if (session.engagementScore) syncData.engagementScore = session.engagementScore;
      if (session.avgResponseLength) syncData.avgResponseLength = session.avgResponseLength;

      // Agregar metadata solo si tiene valores
      const metadata: any = {};
      if (session.imageAnalysisText) metadata.imageAnalysisText = session.imageAnalysisText;
      if (session.discountCodes[0]?.code) metadata.discountCode = session.discountCodes[0].code;
      if (session.convertedToChat) metadata.convertedToChat = session.convertedToChat;

      if (Object.keys(metadata).length > 0) {
        syncData.metadata = metadata;
      }

      // Enviar a WordPress
      await this.sendToWordPress(syncData);

      console.log('[WordPress Sync] Diagnóstico sincronizado exitosamente:', {
        leadId: session.wordpressLeadId,
        sessionId,
        completed: syncData.diagnosticCompleted,
      });
    } catch (error) {
      console.error('[WordPress Sync] Error sincronizando diagnóstico:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Envía datos a WordPress
   */
  private async sendToWordPress(data: WordPressSyncData): Promise<void> {
    try {
      const response = await fetch(this.wordpressWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'User-Agent': 'LeadMagnet-Diagnostic/1.0',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WordPress respondió con error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[WordPress Sync] Respuesta de WordPress:', result);
    } catch (error) {
      console.error('[WordPress Sync] Error enviando a WordPress:', error);
      throw error;
    }
  }

  /**
   * Actualiza el progreso en WordPress (llamada intermedia)
   */
  async syncProgress(sessionId: string): Promise<void> {
    if (!this.enabled) return;

    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session?.wordpressLeadId) return;

      await fetch(this.wordpressWebhookUrl.replace('/diagnosis-complete', '/progress'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          leadId: session.wordpressLeadId,
          questionsAsked: session.questionsAsked,
          engagementScore: session.engagementScore,
          currentStep: session.step,
        }),
      });
    } catch (error) {
      console.error('[WordPress Sync] Error sincronizando progreso:', error);
      // Ignorar errores en actualizaciones de progreso
    }
  }
}

// Singleton instance
export const wordPressSyncService = new WordPressSyncService();
