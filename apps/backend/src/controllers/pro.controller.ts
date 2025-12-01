/**
 * PRO Controller - Handles PRO user chat functionality
 * 
 * Separate from FREE diagnostic flow.
 * Requires authentication and active subscription.
 */

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { agentProService } from '../services/agent-pro.service';
import type { ApiResponse } from '../types';
import { logger } from '../utils/logger';

// Summary generation threshold (every N messages)
const SUMMARY_GENERATION_THRESHOLD = 10;

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

      const result = await agentProService.processMessage(
        conversationId,
        userId,
        userName,
        message
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
}

export const proController = new ProController();
