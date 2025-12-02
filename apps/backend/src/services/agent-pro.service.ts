/**
 * Agent PRO Service - Clara Premium for subscribed users
 *
 * Integrates with global context for persistent memory across conversations.
 * Supports the Clara Premium flow: onboarding → radiography → daily support.
 */

import { Agent, run } from '@openai/agents';
import { prisma } from '../config/database';
import {
  CLARA_PREMIUM_INSTRUCTIONS,
  WELCOME_MESSAGE_TEMPLATE,
  buildDynamicInstructionsPro,
  buildGlobalContextSection,
  type ClaraPremiumContext
} from '../config/assistant-instructions-pro';
import { globalContextService } from './global-context.service';
import { logger } from '../utils/logger';
import OpenAI from 'openai';

const openai = new OpenAI();

// Extract context every N messages
const CONTEXT_EXTRACTION_INTERVAL = 8;

export class AgentProService {
  private claraPremiumAgent: Agent;

  constructor() {
    // Clara Premium Agent - Full 24/7 support
    this.claraPremiumAgent = new Agent({
      name: 'ClaraPremium',
      instructions: CLARA_PREMIUM_INSTRUCTIONS,
      model: 'gpt-4o-mini',
    });
  }

  /**
   * Start a new conversation for a PRO user
   */
  async startConversation(
    userId: string,
    userName: string
  ): Promise<{
    conversationId: string;
    welcomeMessage: string;
    isFirstConversation: boolean;
  }> {
    try {
      // Get or create global context
      const globalContext = await globalContextService.getOrCreateContext(userId);

      // Check if this is the first conversation
      const isFirstConversation = await globalContextService.isFirstConversation(userId);

      // Update phase based on progress
      await globalContextService.updatePhase(userId);

      // Get recent diary entries
      const recentDiaryEntries = await globalContextService.getRecentDiaryEntries(userId);

      // Get current challenge
      const currentChallenge = await globalContextService.getCurrentChallenge(userId);

      // Create new conversation in database
      const conversation = await prisma.proConversation.create({
        data: {
          userId,
          messageCount: 0,
        },
      });

      // Build context for Clara
      const contextData: ClaraPremiumContext = {
        userName,
        userId,
        digestiveProfile: globalContext.digestiveProfile as Record<string, unknown>,
        emotionalProfile: globalContext.emotionalProfile as Record<string, unknown>,
        culturalProfile: globalContext.culturalProfile as Record<string, unknown>,
        habitsProfile: globalContext.habitsProfile as Record<string, unknown>,
        medicalHistory: globalContext.medicalHistory as Record<string, unknown>,
        goals: globalContext.goals as string[],
        identifiedTriggers: globalContext.identifiedTriggers as string[],
        strengths: globalContext.strengths as string[],
        currentPhase: globalContext.currentPhase,
        weekNumber: globalContext.weekNumber,
        daysInProgram: globalContext.daysInProgram,
        radiographyCompleted: globalContext.radiographyCompleted,
        ...(globalContext.personalityType && { personalityType: globalContext.personalityType }),
        communicationStyle: globalContext.communicationStyle as Record<string, unknown>,
        consecutiveDays: globalContext.consecutiveDays,
        ...(currentChallenge && { currentChallenge }),
        recentDiaryEntries,
        isFirstConversation,
      };

      // Build instructions with global context
      const formattedGlobalContext = await globalContextService.getFormattedContext(userId);
      const dynamicInstructions = buildDynamicInstructionsPro(contextData);
      const globalContextSection = buildGlobalContextSection(
        isFirstConversation ? null : globalContext as unknown as Record<string, unknown>
      );

      // Create Clara Premium with full context
      const fullInstructions = CLARA_PREMIUM_INSTRUCTIONS
        .replace('{{GLOBAL_CONTEXT}}', globalContextSection)
        .replace('{{DYNAMIC_INSTRUCTIONS}}', dynamicInstructions);

      const claraWithContext = new Agent({
        name: 'ClaraPremium',
        instructions: fullInstructions,
        model: 'gpt-4o-mini',
      });

      // Generate welcome message based on whether it's first conversation
      let welcomeMessage: string;

      if (isFirstConversation && !globalContext.radiographyCompleted) {
        // First time user - use official welcome message
        welcomeMessage = WELCOME_MESSAGE_TEMPLATE.replace(/\{\{nombre\}\}/g, userName);
      } else {
        // Returning user - generate contextual greeting
        const result = await run(
          claraWithContext,
          `El usuario ${userName} vuelve al chat. Genera un saludo breve y cálido (máximo 3 líneas) que:
1. Le dé la bienvenida de vuelta
2. Mencione algo del contexto si es relevante (fase actual, último tema, reto activo)
3. Pregunte cómo está hoy

Contexto actual:
${formattedGlobalContext}

Recuerda: máximo 1 emoji, tono cálido pero profesional.`
        );
        welcomeMessage = result.finalOutput || `¡Hola ${userName}! 💖 ¿Cómo te encuentras hoy?`;
      }

      // Save welcome message
      await prisma.proMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: welcomeMessage,
        },
      });

      // Update conversation
      await prisma.proConversation.update({
        where: { id: conversation.id },
        data: {
          messageCount: 1,
          lastMessageAt: new Date(),
        },
      });

      logger.info(`Clara Premium conversation started for user ${userId}, conversation ${conversation.id}, firstConvo: ${isFirstConversation}`);

      return {
        conversationId: conversation.id,
        welcomeMessage,
        isFirstConversation,
      };
    } catch (error) {
      logger.error('Error starting Clara Premium conversation:', { error });
      throw error;
    }
  }

  /**
   * Continue an existing conversation
   */
  async continueConversation(
    conversationId: string,
    userId: string
  ): Promise<{
    messages: Array<{ role: string; content: string; createdAt: Date }>;
    conversation: {
      id: string;
      title: string | null;
      createdAt: Date;
    };
  }> {
    try {
      const conversation = await prisma.proConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.userId !== userId) {
        throw new Error('Unauthorized access to conversation');
      }

      return {
        messages: conversation.messages.map(m => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
        conversation: {
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt,
        },
      };
    } catch (error) {
      logger.error('Error continuing Clara Premium conversation:', { error });
      throw error;
    }
  }

  /**
   * Process a message in an existing conversation
   */
  async processMessage(
    conversationId: string,
    userId: string,
    userName: string,
    userMessage: string
  ): Promise<{
    message: string;
    shouldGenerateTitle: boolean;
    shouldExtractContext: boolean;
  }> {
    try {
      // Get conversation with messages
      const conversation = await prisma.proConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50, // Last 50 messages for context
          },
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.userId !== userId) {
        throw new Error('Unauthorized access to conversation');
      }

      // Save user message
      await prisma.proMessage.create({
        data: {
          conversationId,
          role: 'user',
          content: userMessage,
        },
      });

      // Get global context
      const globalContext = await globalContextService.getOrCreateContext(userId);

      // Get additional context
      const recentDiaryEntries = await globalContextService.getRecentDiaryEntries(userId);
      const currentChallenge = await globalContextService.getCurrentChallenge(userId);
      const isFirstConversation = await globalContextService.isFirstConversation(userId);

      // Build context for Clara
      const contextData: ClaraPremiumContext = {
        userName,
        userId,
        digestiveProfile: globalContext.digestiveProfile as Record<string, unknown>,
        emotionalProfile: globalContext.emotionalProfile as Record<string, unknown>,
        culturalProfile: globalContext.culturalProfile as Record<string, unknown>,
        habitsProfile: globalContext.habitsProfile as Record<string, unknown>,
        medicalHistory: globalContext.medicalHistory as Record<string, unknown>,
        goals: globalContext.goals as string[],
        identifiedTriggers: globalContext.identifiedTriggers as string[],
        strengths: globalContext.strengths as string[],
        currentPhase: globalContext.currentPhase,
        weekNumber: globalContext.weekNumber,
        daysInProgram: globalContext.daysInProgram,
        radiographyCompleted: globalContext.radiographyCompleted,
        ...(globalContext.personalityType && { personalityType: globalContext.personalityType }),
        communicationStyle: globalContext.communicationStyle as Record<string, unknown>,
        consecutiveDays: globalContext.consecutiveDays,
        ...(currentChallenge && { currentChallenge }),
        recentDiaryEntries,
        isFirstConversation,
      };

      // Build full instructions
      const dynamicInstructions = buildDynamicInstructionsPro(contextData);
      const globalContextSection = buildGlobalContextSection(
        globalContext as unknown as Record<string, unknown>
      );

      const fullInstructions = CLARA_PREMIUM_INSTRUCTIONS
        .replace('{{GLOBAL_CONTEXT}}', globalContextSection)
        .replace('{{DYNAMIC_INSTRUCTIONS}}', dynamicInstructions);

      // Create Clara with context
      const claraWithContext = new Agent({
        name: 'ClaraPremium',
        instructions: fullInstructions,
        model: 'gpt-4o-mini',
      });

      // Build conversation history
      const messageHistory = conversation.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Build conversation context as string
      const conversationContext = messageHistory
        .map(m => `${m.role === 'user' ? 'Usuario' : 'Clara'}: ${m.content}`)
        .join('\n\n');

      const fullInput = conversationContext
        ? `${conversationContext}\n\nUsuario: ${userMessage}`
        : userMessage;

      // Run agent
      const result = await run(claraWithContext, fullInput);

      const assistantMessage = result.finalOutput || 'Lo siento, hubo un error. ¿Puedes repetirme eso?';

      // Save assistant message
      await prisma.proMessage.create({
        data: {
          conversationId,
          role: 'assistant',
          content: assistantMessage,
        },
      });

      // Update conversation
      const newMessageCount = conversation.messageCount + 2;
      await prisma.proConversation.update({
        where: { id: conversationId },
        data: {
          messageCount: newMessageCount,
          lastMessageAt: new Date(),
        },
      });

      // Determine if we should extract context (every N messages)
      const shouldExtractContext = newMessageCount % CONTEXT_EXTRACTION_INTERVAL === 0;

      // If we should extract, do it asynchronously (don't block response)
      if (shouldExtractContext) {
        this.extractContextAsync(userId, [
          ...messageHistory,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: assistantMessage }
        ]);
      }

      // Check if this looks like a radiography response (long, structured message)
      if (this.isRadiographyMessage(assistantMessage)) {
        await globalContextService.completeRadiography(userId, assistantMessage);
      }

      // Determine if we should generate title
      const shouldGenerateTitle = !conversation.title && newMessageCount >= 2;

      logger.info(`Clara Premium message processed for conversation ${conversationId}`);

      return {
        message: assistantMessage,
        shouldGenerateTitle,
        shouldExtractContext,
      };
    } catch (error) {
      logger.error('Error processing Clara Premium message:', { error });
      throw error;
    }
  }

  /**
   * Extract context asynchronously (non-blocking)
   */
  private extractContextAsync(
    userId: string,
    messages: Array<{ role: string; content: string }>
  ): void {
    globalContextService.extractAndUpdateContext(userId, messages)
      .then(() => logger.info(`Context extracted for user ${userId}`))
      .catch(err => logger.error('Error extracting context:', { error: err, userId }));
  }

  /**
   * Check if a message looks like a radiography (long, structured diagnosis)
   */
  private isRadiographyMessage(message: string): boolean {
    const indicators = [
      'Gracias por confiar',
      'Radiografía',
      'perfil digestivo',
      'perfil emocional',
      'puntos fuertes',
      'fortalezas',
      'paso a paso'
    ];

    const matchCount = indicators.filter(ind =>
      message.toLowerCase().includes(ind.toLowerCase())
    ).length;

    // If message is long and contains multiple indicators
    return message.length > 500 && matchCount >= 3;
  }

  /**
   * Generate title for a conversation based on its content
   */
  async generateTitle(conversationId: string): Promise<string> {
    try {
      const conversation = await prisma.proConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 6,
          },
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const messagesForTitle = conversation.messages
        .map(m => `${m.role}: ${m.content.substring(0, 200)}`)
        .join('\n');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Genera un título corto (3-6 palabras) para esta conversación de salud digestiva. Solo responde con el título, sin comillas ni explicación.',
          },
          {
            role: 'user',
            content: messagesForTitle,
          },
        ],
        max_tokens: 30,
      });

      const title = completion.choices[0]?.message?.content?.trim() || 'Nueva conversación';

      await prisma.proConversation.update({
        where: { id: conversationId },
        data: { title },
      });

      logger.info(`Title generated for conversation ${conversationId}: ${title}`);

      return title;
    } catch (error) {
      logger.error('Error generating title:', { error });
      return 'Nueva conversación';
    }
  }

  /**
   * Generate/update summary for a conversation and extract context
   */
  async generateSummary(conversationId: string): Promise<string> {
    try {
      const conversation = await prisma.proConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const messagesForSummary = conversation.messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Genera un resumen conciso (2-3 oraciones) de esta conversación de salud digestiva. 
Incluye:
- Temas principales discutidos
- Síntomas o preocupaciones mencionadas
- Recomendaciones dadas
- Estado emocional del usuario si es relevante

El resumen será usado para dar contexto a futuras conversaciones. Solo responde con el resumen.`,
          },
          {
            role: 'user',
            content: messagesForSummary,
          },
        ],
        max_tokens: 200,
      });

      const summary = completion.choices[0]?.message?.content?.trim() || '';

      // Update conversation with summary
      await prisma.proConversation.update({
        where: { id: conversationId },
        data: { summary },
      });

      // Also extract and update global context from this conversation
      const messages = conversation.messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      await globalContextService.extractAndUpdateContext(conversation.userId, messages);

      logger.info(`Summary generated and context extracted for conversation ${conversationId}`);

      return summary;
    } catch (error) {
      logger.error('Error generating summary:', { error });
      return '';
    }
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<Array<{
    id: string;
    title: string | null;
    lastMessageAt: Date;
    messageCount: number;
    createdAt: Date;
  }>> {
    try {
      const conversations = await prisma.proConversation.findMany({
        where: { userId },
        orderBy: { lastMessageAt: 'desc' },
        select: {
          id: true,
          title: true,
          lastMessageAt: true,
          messageCount: true,
          createdAt: true,
        },
      });

      return conversations;
    } catch (error) {
      logger.error('Error getting user conversations:', { error });
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    try {
      const conversation = await prisma.proConversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.userId !== userId) {
        throw new Error('Unauthorized access to conversation');
      }

      await prisma.proConversation.delete({
        where: { id: conversationId },
      });

      logger.info(`Conversation ${conversationId} deleted by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting conversation:', { error });
      throw error;
    }
  }

  /**
   * Get user's global context summary (for frontend display)
   */
  async getUserContextSummary(userId: string): Promise<{
    currentPhase: string;
    weekNumber: number;
    daysInProgram: number;
    consecutiveDays: number;
    radiographyCompleted: boolean;
    goalsCount: number;
    triggersCount: number;
  }> {
    const context = await globalContextService.getOrCreateContext(userId);

    return {
      currentPhase: context.currentPhase,
      weekNumber: context.weekNumber,
      daysInProgram: context.daysInProgram,
      consecutiveDays: context.consecutiveDays,
      radiographyCompleted: context.radiographyCompleted,
      goalsCount: (context.goals as string[])?.length || 0,
      triggersCount: (context.identifiedTriggers as string[])?.length || 0,
    };
  }
}

// Export singleton instance
export const agentProService = new AgentProService();
