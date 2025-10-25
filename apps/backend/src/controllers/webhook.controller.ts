import { Request, Response } from 'express';
import { prisma } from '../config/database';
import type { ApiResponse } from '../types';

interface WordPressLeadUpdate {
  leadId: string;
  name?: string;
  email?: string;
  status?: string;
  metadata?: Record<string, any>;
}

export class WebhookController {
  /**
   * Webhook para recibir actualizaciones de WordPress
   * POST /api/webhooks/wordpress/lead-update
   */
  async handleWordPressLeadUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { leadId, name, email, status, metadata }: WordPressLeadUpdate = req.body;

      // Validar que se envió el leadId
      if (!leadId) {
        res.status(400).json({
          success: false,
          error: 'leadId es requerido',
        } as ApiResponse);
        return;
      }

      // Buscar sesiones con este wordpressLeadId
      const sessions = await prisma.session.findMany({
        where: {
          wordpressLeadId: leadId,
        },
      });

      if (sessions.length === 0) {
        // No hay sesiones con este leadId, pero no es un error
        res.json({
          success: true,
          data: {
            message: 'No se encontraron sesiones con este leadId',
            leadId,
          },
        } as ApiResponse);
        return;
      }

      // Actualizar todas las sesiones encontradas
      const updateData: any = {};
      if (name) updateData.userName = name;
      if (email) updateData.userEmail = email;

      // Si hay datos para actualizar
      if (Object.keys(updateData).length > 0) {
        await prisma.session.updateMany({
          where: {
            wordpressLeadId: leadId,
          },
          data: updateData,
        });
      }

      // Log de la actualización
      console.log(`[Webhook] WordPress lead ${leadId} actualizado para ${sessions.length} sesiones`, {
        leadId,
        sessionsUpdated: sessions.length,
        updates: updateData,
        status,
        metadata,
      });

      res.json({
        success: true,
        data: {
          message: 'Sesiones actualizadas correctamente',
          leadId,
          sessionsUpdated: sessions.length,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('[Webhook] Error procesando actualización de WordPress:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      } as ApiResponse);
    }
  }

  /**
   * Webhook para notificar a WordPress sobre el progreso del diagnóstico
   * Este endpoint sería llamado por nuestra app cuando el usuario complete el diagnóstico
   */
  async notifyWordPressCompletion(sessionId: string): Promise<void> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          diagnosis: true,
        },
      });

      if (!session || !session.wordpressLeadId) {
        console.log('[Webhook] Sesión no tiene wordpressLeadId, saltando notificación');
        return;
      }

      // Aquí se haría la llamada HTTP a WordPress
      // Ejemplo (comentado porque depende de tu configuración):
      /*
      const wordpressWebhookUrl = process.env.WORDPRESS_WEBHOOK_URL;
      
      if (wordpressWebhookUrl) {
        await fetch(wordpressWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.WORDPRESS_API_KEY || '',
          },
          body: JSON.stringify({
            leadId: session.wordpressLeadId,
            diagnosticCompleted: session.completedDiagnosis,
            diagnosticMode: session.diagnosticMode,
            engagementScore: session.engagementScore,
            diagnosisId: session.diagnosis?.id,
            completedAt: session.completionTime,
          }),
        });
      }
      */

      console.log('[Webhook] Notificación a WordPress preparada para leadId:', session.wordpressLeadId);
    } catch (error) {
      console.error('[Webhook] Error notificando a WordPress:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Endpoint de verificación para WordPress
   * GET /api/webhooks/wordpress/verify
   */
  async verifyWebhook(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        message: 'Webhook endpoint activo',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
}
