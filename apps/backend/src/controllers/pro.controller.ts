/**
 * PRO Controller - Handles PRO user chat functionality
 * 
 * Separate from FREE diagnostic flow.
 * Requires authentication and active subscription.
 */

import { Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../config/database';
import { agentProService } from '../services/agent-pro.service';
import { globalContextService } from '../services/global-context.service';
import type { ApiResponse } from '../types';
import { logger } from '../utils/logger';

// Summary generation threshold (every N messages)
const SUMMARY_GENERATION_THRESHOLD = 10;

// Configure multer for memory storage (same as free flow)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  },
});

// Export multer middleware
export const proUploadMiddleware: any = upload.single('image');

/**
 * Format habits profile into readable string
 */
function formatHabitsProfile(habits: Record<string, unknown>): string | null {
  const parts: string[] = [];

  if (habits.eatingSpeed) parts.push(`Come ${habits.eatingSpeed}`);
  if (habits.mealsLocation) parts.push(`Comidas: ${habits.mealsLocation}`);
  if (habits.hydration) parts.push(`Hidratación: ${habits.hydration}`);
  if (habits.caffeine) parts.push(`Cafeína: ${habits.caffeine}`);
  if (habits.alcohol) parts.push(`Alcohol: ${habits.alcohol}`);
  if (habits.processedFood) parts.push(`Procesados: ${habits.processedFood}`);
  if (habits.cookingAbility) parts.push(`Cocina: ${habits.cookingAbility}`);

  return parts.length > 0 ? parts.join(' • ') : null;
}

export class ProController {
  /**
   * Check if user has active subscription
   */
  private async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        currentPeriodEnd: { gte: new Date() },
      },
    });
    return !!subscription;
  }

  /**
   * GET /api/pro/conversations - List all conversations for user
   */
  async listConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const conversations = await agentProService.getUserConversations(userId);

      res.json({
        success: true,
        data: conversations,
      } as ApiResponse);
    } catch (error) {
      logger.error('Error listing conversations:', { error });
      res.status(500).json({
        success: false,
        error: 'Error retrieving conversations',
      } as ApiResponse);
    }
  }

  /**
   * POST /api/pro/conversations - Create new conversation
   */
  async createConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        } as ApiResponse);
        return;
      }

      // Check subscription for write operations
      const hasSubscription = await this.hasActiveSubscription(userId);
      if (!hasSubscription) {
        res.status(403).json({
          success: false,
          error: 'Active subscription required to create conversations',
          code: 'SUBSCRIPTION_REQUIRED',
        } as ApiResponse);
        return;
      }

      // Get user name
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const userName = user?.name || 'Usuario';

      const { conversationId, welcomeMessage } = await agentProService.startConversation(
        userId,
        userName
      );

      res.json({
        success: true,
        data: {
          conversationId,
          message: {
            role: 'assistant',
            content: welcomeMessage,
          },
        },
      } as ApiResponse);
    } catch (error) {
      logger.error('Error creating conversation:', { error });
      res.status(500).json({
        success: false,
        error: 'Error creating conversation',
      } as ApiResponse);
    }
  }

  /**
   * GET /api/pro/conversations/:id - Get conversation with messages
   */
  async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const conversationId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        } as ApiResponse);
        return;
      }

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: 'Conversation ID required',
        } as ApiResponse);
        return;
      }

      const result = await agentProService.continueConversation(conversationId, userId);

      res.json({
        success: true,
        data: result,
      } as ApiResponse);
    } catch (error) {
      logger.error('Error getting conversation:', { error });

      if (error instanceof Error && error.message === 'Unauthorized access to conversation') {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        } as ApiResponse);
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Error retrieving conversation',
      } as ApiResponse);
    }
  }

  /**
   * POST /api/pro/conversations/:id/message - Send message in conversation
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const conversationId = req.params.id;
      const { message } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        } as ApiResponse);
        return;
      }

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: 'Conversation ID required',
        } as ApiResponse);
        return;
      }

      if (!message || typeof message !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Message is required',
        } as ApiResponse);
        return;
      }

      // Check subscription for write operations
      const hasSubscription = await this.hasActiveSubscription(userId);
      if (!hasSubscription) {
        res.status(403).json({
          success: false,
          error: 'Tu suscripción ha expirado. Renueva para seguir conversando con Clara.',
          code: 'SUBSCRIPTION_EXPIRED',
        } as ApiResponse);
        return;
      }

      // Get user name
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const userName = user?.name || 'Usuario';

      // Get image buffer from multer (same as free flow)
      const imageBuffer = (req as any).file?.buffer;

      // Pre-validate conversation exists and user has access
      const existingConversation = await prisma.proConversation.findUnique({
        where: { id: conversationId },
        select: { userId: true },
      });

      if (!existingConversation) {
        res.status(404).json({
          success: false,
          error: 'Conversation not found',
          code: 'CONVERSATION_NOT_FOUND',
        } as ApiResponse);
        return;
      }

      if (existingConversation.userId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        } as ApiResponse);
        return;
      }

      const result = await agentProService.processMessage(
        conversationId,
        userId,
        userName,
        message,
        imageBuffer
      );

      // Generate title if needed (async, don't wait)
      if (result.shouldGenerateTitle) {
        agentProService.generateTitle(conversationId).catch(err => {
          logger.error('Error generating title:', { err });
        });
      }

      // Get conversation to check if summary should be generated
      const conversation = await prisma.proConversation.findUnique({
        where: { id: conversationId },
        select: { messageCount: true },
      });

      // Generate summary every N messages (async, don't wait)
      if (conversation && conversation.messageCount % SUMMARY_GENERATION_THRESHOLD === 0) {
        agentProService.generateSummary(conversationId).catch(err => {
          logger.error('Error generating summary:', { err });
        });
      }

      res.json({
        success: true,
        data: {
          role: 'assistant',
          content: result.message,
        },
      } as ApiResponse);
    } catch (error) {
      logger.error('Error sending message:', { error });

      if (error instanceof Error && error.message === 'Unauthorized access to conversation') {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        } as ApiResponse);
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Error processing message',
      } as ApiResponse);
    }
  }

  /**
   * DELETE /api/pro/conversations/:id - Delete a conversation
   */
  async deleteConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const conversationId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        } as ApiResponse);
        return;
      }

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: 'Conversation ID required',
        } as ApiResponse);
        return;
      }

      await agentProService.deleteConversation(conversationId, userId);

      res.json({
        success: true,
        message: 'Conversation deleted',
      } as ApiResponse);
    } catch (error) {
      logger.error('Error deleting conversation:', { error });

      if (error instanceof Error && error.message === 'Unauthorized access to conversation') {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        } as ApiResponse);
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Error deleting conversation',
      } as ApiResponse);
    }
  }

  /**
   * GET /api/pro/status - Get user's PRO status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          role: true,
        },
      });

      const subscription = await prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          status: true,
          plan: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
        },
      });

      const conversationCount = await prisma.proConversation.count({
        where: { userId },
      });

      res.json({
        success: true,
        data: {
          user: {
            name: user?.name,
            email: user?.email,
            role: user?.role,
          },
          subscription: subscription ? {
            status: subscription.status,
            plan: subscription.plan,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            isActive: subscription.status === 'active' && subscription.currentPeriodEnd > new Date(),
          } : null,
          stats: {
            conversationCount,
          },
        },
      } as ApiResponse);
    } catch (error) {
      logger.error('Error getting PRO status:', { error });
      res.status(500).json({
        success: false,
        error: 'Error retrieving status',
      } as ApiResponse);
    }
  }

  /**
   * GET /api/pro/progress - Get user's Clara Premium progress
   */
  async getProgress(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        } as ApiResponse);
        return;
      }

      // Get global context
      const context = await prisma.userGlobalContext.findUnique({
        where: { userId }
      });

      // Get counts
      const [conversationCount, messageCount, diaryCount, challengesCompleted] = await Promise.all([
        prisma.proConversation.count({ where: { userId } }),
        prisma.proMessage.count({
          where: {
            conversation: { userId }
          }
        }),
        prisma.diaryEntry.count({ where: { userId } }),
        prisma.userChallenge.count({
          where: { userId, status: 'COMPLETED' }
        })
      ]);

      // Calculate days active
      const firstActivity = await prisma.proConversation.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
      });

      const daysActive = firstActivity
        ? Math.ceil((Date.now() - firstActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      res.json({
        success: true,
        data: {
          phase: context?.currentPhase || 'onboarding',
          phaseStartDate: context?.programStartDate || null,
          radiographyComplete: context?.radiographyCompleted || false,
          stats: {
            conversationCount,
            messageCount,
            diaryEntries: diaryCount,
            challengesCompleted,
            daysActive
          },
          context: context ? (() => {
            const dp = context.digestiveProfile as Record<string, unknown> | null;
            const ep = context.emotionalProfile as Record<string, unknown> | null;
            const hp = context.habitsProfile as Record<string, unknown> | null;

            // Extract symptoms - can be array or string
            let mainSymptoms: string | null = null;
            if (dp?.symptoms) {
              mainSymptoms = Array.isArray(dp.symptoms)
                ? (dp.symptoms as string[]).join(', ')
                : String(dp.symptoms);
            }
            // Also check patterns and triggers from digestiveProfile
            if (!mainSymptoms && dp?.patterns) {
              mainSymptoms = Array.isArray(dp.patterns)
                ? (dp.patterns as string[]).join(', ')
                : String(dp.patterns);
            }

            // Extract dietary profile
            const dietaryProfile = hp && Object.keys(hp).length > 0
              ? formatHabitsProfile(hp)
              : null;

            // Extract stress level
            const stressLevel = ep?.stressLevel ? String(ep.stressLevel) : null;

            // Extract goals
            const digestiveGoals = Array.isArray(context.goals) && context.goals.length > 0
              ? context.goals
              : null;

            // Extract triggers - from digestiveProfile or identifiedTriggers
            let knownTriggers: string[] = [];
            if (Array.isArray(context.identifiedTriggers) && context.identifiedTriggers.length > 0) {
              knownTriggers = context.identifiedTriggers as string[];
            } else if (dp?.triggers && Array.isArray(dp.triggers)) {
              knownTriggers = dp.triggers as string[];
            }

            // Extract improvements/strengths
            const improvements = Array.isArray(context.strengths) && context.strengths.length > 0
              ? context.strengths as string[]
              : [];

            // Return null only if ALL fields are empty
            if (!mainSymptoms && !dietaryProfile && !stressLevel && !digestiveGoals &&
              knownTriggers.length === 0 && improvements.length === 0) {
              return null;
            }

            return { mainSymptoms, dietaryProfile, stressLevel, digestiveGoals, knownTriggers, improvements };
          })() : null
        }
      } as ApiResponse);
    } catch (error) {
      logger.error('Error getting progress:', { error });
      res.status(500).json({
        success: false,
        error: 'Error retrieving progress',
      } as ApiResponse);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PREMIUM ONBOARDING ENDPOINTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET /api/pro/onboarding/status - Get onboarding status
   */
  async getOnboardingStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const context = await prisma.userGlobalContext.findUnique({
        where: { userId },
        select: {
          premiumOnboardingCompleted: true,
          premiumOnboardingStep: true,
          premiumOnboardingResponses: true,
        },
      });

      res.json({
        success: true,
        data: {
          completed: context?.premiumOnboardingCompleted ?? false,
          currentStep: context?.premiumOnboardingStep ?? 0,
          responses: context?.premiumOnboardingResponses ?? {},
        },
      });
    } catch (error) {
      logger.error('Error getting onboarding status:', { error });
      res.status(500).json({ success: false, error: 'Error retrieving onboarding status' });
    }
  }

  /**
   * POST /api/pro/onboarding/response - Save single response
   */
  async saveOnboardingResponse(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { blockId, questionId, answer, step } = req.body;
      if (!blockId || !questionId || answer === undefined) {
        res.status(400).json({ success: false, error: 'Missing required fields' });
        return;
      }

      // Upsert context with new response
      const existing = await prisma.userGlobalContext.findUnique({
        where: { userId },
        select: { premiumOnboardingResponses: true },
      });

      const responses = (existing?.premiumOnboardingResponses as Record<string, Record<string, string>>) ?? {};
      if (!responses[blockId]) responses[blockId] = {};
      responses[blockId][questionId] = answer;

      await prisma.userGlobalContext.upsert({
        where: { userId },
        create: {
          userId,
          premiumOnboardingResponses: responses,
          premiumOnboardingStep: step ?? 0,
        },
        update: {
          premiumOnboardingResponses: responses,
          premiumOnboardingStep: step ?? 0,
        },
      });

      res.json({ success: true, data: { saved: true } });
    } catch (error) {
      logger.error('Error saving onboarding response:', { error });
      res.status(500).json({ success: false, error: 'Error saving response' });
    }
  }

  /**
   * POST /api/pro/onboarding/complete - Complete onboarding
   */
  async completeOnboarding(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      // Mark as completed and generate profile tags from responses
      const context = await prisma.userGlobalContext.findUnique({
        where: { userId },
        select: { premiumOnboardingResponses: true },
      });

      const responses = context?.premiumOnboardingResponses as Record<string, Record<string, string>> ?? {};

      // Generate simple profile tags from responses (can be enhanced with AI later)
      const profileTags = {
        digestiveType: responses.digestivo?.dig_1 || 'unknown',
        emotionalState: responses.emocional?.emo_1 || 'unknown',
        energyLevel: responses.fisico?.fis_1 || 'unknown',
        eatingStyle: responses.alimentacion?.ali_1 || 'unknown',
        socialInfluence: responses.social?.soc_3 || 'unknown',
        workStress: responses.laboral?.lab_2 || 'unknown',
        mainGoal: responses.objetivos?.obj_1 || 'unknown',
        constancy: responses.habitos?.hab_1 || 'unknown',
        lifeStage: responses.identidad?.ide_1 || 'unknown',
        medicalHistory: responses.medico?.med_1 || 'unknown',
      };

      await prisma.userGlobalContext.update({
        where: { userId },
        data: {
          premiumOnboardingCompleted: true,
          premiumOnboardingStep: 55,
          profileTags,
          currentPhase: 'week1',
          programStartDate: new Date(),
        },
      });

      res.json({ success: true, data: { completed: true, profileTags } });
    } catch (error) {
      logger.error('Error completing onboarding:', { error });
      res.status(500).json({ success: false, error: 'Error completing onboarding' });
    }
  }
}

export const proController = new ProController();
