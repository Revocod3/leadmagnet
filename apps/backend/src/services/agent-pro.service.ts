/**
 * Agent PRO Service - Clara PRO for subscribed users
 *
 * Separate agent with its own instructions, no diagnosis flow.
 * Supports multiple conversations per user with context summaries.
 */

import { Agent, run } from '@openai/agents';
import { prisma } from '../config/database';
import { CLARA_PRO_INSTRUCTIONS, buildDynamicInstructionsPro } from '../config/assistant-instructions-pro';
import { logger } from '../utils/logger';
import OpenAI from 'openai';

const openai = new OpenAI();

export class AgentProService {
  private claraProAgent: Agent;

  constructor() {
    // Clara PRO Agent - No diagnosis handoff, focused on ongoing support
    this.claraProAgent = new Agent({
      name: 'ClaraPRO',
      instructions: CLARA_PRO_INSTRUCTIONS,
      model: 'gpt-5-mini-2025-08-07',
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
  }> {
    try {
      // Get user's previous conversations for context
      const previousConversations = await prisma.proConversation.findMany({
        where: { userId },
        orderBy: { lastMessageAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          summary: true,
          lastMessageAt: true,
        },
      });

      // Build context from previous conversations
      let contextFromHistory = '';
      if (previousConversations.length > 0) {
        contextFromHistory = `
══════════════════════════════════════════════════════════════
📚 HISTORIAL DE CONVERSACIONES ANTERIORES
══════════════════════════════════════════════════════════════

${previousConversations
            .filter(c => c.summary)
            .map(c => `• "${c.title || 'Conversación'}": ${c.summary}`)
            .join('\n')}

IMPORTANTE: Usa este contexto para dar continuidad. El usuario no debería repetirte cosas que ya te contó.
`;
      }

      // Create new conversation in database
      const conversation = await prisma.proConversation.create({
        data: {
          userId,
          messageCount: 0,
        },
      });

      // Build dynamic instructions
      const dynamicInstructions = buildDynamicInstructionsPro({
        userName,
      });

      // Create Clara PRO with context
      const claraWithContext = new Agent({
        name: 'ClaraPRO',
        instructions: `${CLARA_PRO_INSTRUCTIONS}\n\n${dynamicInstructions}\n\n${contextFromHistory}`,
        model: 'gpt-5-mini-2025-08-07',
      });

      // Generate welcome message - simple and natural like a friend
      const result = await run(
        claraWithContext,
        `Saluda al usuario ${userName} de forma muy breve y natural, como un amigo. Solo di "Hola [nombre], ¿qué te trae por aquí hoy?" o algo igual de corto y cálido. NO des información, NO hagas listas, NO menciones el programa. Solo un saludo simple.`
      );

      const welcomeMessage = result.finalOutput ||
        `¡Hola ${userName}! ¿Qué te trae por aquí hoy? 💚`;

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

      logger.info(`PRO conversation started for user ${userId}, conversation ${conversation.id}`);

      return {
        conversationId: conversation.id,
        welcomeMessage,
      };
    } catch (error) {
      logger.error('Error starting PRO conversation:', { error });
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
      logger.error('Error continuing PRO conversation:', { error });
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
  }> {
    try {
      // Verify conversation ownership and get context
      const conversation = await prisma.proConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50, // Last 50 messages for context
          },
          user: {
            include: {
              conversations: {
                where: { id: { not: conversationId } },
                orderBy: { lastMessageAt: 'desc' },
                take: 3,
                select: { summary: true, title: true },
              },
            },
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

      // Build message history for OpenAI
      const messageHistory = conversation.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Add context from other conversations
      let otherConversationsContext = '';
      if (conversation.user?.conversations && conversation.user.conversations.length > 0) {
        const summaries = conversation.user.conversations
          .filter(c => c.summary)
          .map(c => `• ${c.title || 'Conversación anterior'}: ${c.summary}`);

        if (summaries.length > 0) {
          otherConversationsContext = `

══════════════════════════════════════════════════════════════
📚 CONTEXTO DE OTRAS CONVERSACIONES
══════════════════════════════════════════════════════════════

${summaries.join('\n')}
`;
        }
      }

      // Build dynamic instructions
      const dynamicInstructions = buildDynamicInstructionsPro({
        userName,
      });

      // Create Clara PRO with full context
      const claraWithContext = new Agent({
        name: 'ClaraPRO',
        instructions: `${CLARA_PRO_INSTRUCTIONS}\n\n${dynamicInstructions}${otherConversationsContext}`,
        model: 'gpt-5-mini-2025-08-07',
      });

      // Build conversation context as a string (SDK expects string input)
      const conversationContext = messageHistory
        .map(m => `${m.role === 'user' ? 'Usuario' : 'Clara'}: ${m.content}`)
        .join('\n\n');

      const fullInput = conversationContext
        ? `${conversationContext}\n\nUsuario: ${userMessage}`
        : userMessage;

      // Run agent with conversation history
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

      // Determine if we should generate title (after first user message exchange)
      const shouldGenerateTitle = !conversation.title && newMessageCount >= 2;

      logger.info(`PRO message processed for conversation ${conversationId}`);

      return {
        message: assistantMessage,
        shouldGenerateTitle,
      };
    } catch (error) {
      logger.error('Error processing PRO message:', { error });
      throw error;
    }
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
            take: 6, // First 6 messages for title generation
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

      // Update conversation with title
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
   * Generate/update summary for a conversation
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

      logger.info(`Summary generated for conversation ${conversationId}`);

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
}

// Export singleton instance
export const agentProService = new AgentProService();
