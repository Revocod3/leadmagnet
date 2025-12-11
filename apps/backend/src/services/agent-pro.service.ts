/**
 * Agent PRO Service - Clara Premium for subscribed users
 *
 * Uses OpenAI Responses API with Conversations (same as free flow).
 * Integrates with global context for persistent memory across conversations.
 * Supports the Clara Premium flow: onboarding → radiography → daily support.
 */

import { openai, MODELS } from '../config/openai';
import { prisma } from '../config/database';
import {
  CLARA_PREMIUM_INSTRUCTIONS,
  WELCOME_MESSAGE_TEMPLATE,
  buildDynamicInstructionsPro,
  buildGlobalContextSection,
  type ClaraPremiumContext
} from '../config/assistant-instructions-pro';
import {
  PRO_WELCOME_MESSAGE,
  TOTAL_ONBOARDING_QUESTIONS,
  buildOnboardingInstructions,
} from '../config/pro-onboarding-instructions';
import { globalContextService } from './global-context.service';
import { logger } from '../utils/logger';

// Extract context every N messages
const CONTEXT_EXTRACTION_INTERVAL = 8;

export class AgentProService {

  /**
   * Helper: extract plain text from Responses API response
   */
  private extractTextFromResponse(resp: any): string {
    try {
      // Aggregated convenience field (if present in newer SDKs)
      if (resp?.output_text) return resp.output_text as string;

      const outputs = resp?.output || [];
      for (const item of outputs) {
        if (item?.type === 'message') {
          const parts = item?.content || [];
          const texts: string[] = [];
          for (const p of parts) {
            if (p?.type === 'output_text' && typeof p?.text === 'string') {
              texts.push(p.text);
            }
          }
          if (texts.length) return texts.join('');
        }
      }
    } catch (e) {
      logger.error('Error extracting text from response', { error: e });
    }
    return '';
  }

  /**
   * Build full instructions for Clara Premium
   */
  private async buildFullInstructions(
    userId: string,
    userName: string
  ): Promise<string> {
    const globalContext = await globalContextService.getOrCreateContext(userId);
    const isFirstConversation = await globalContextService.isFirstConversation(userId);
    const recentDiaryEntries = await globalContextService.getRecentDiaryEntries(userId);
    const currentChallenge = await globalContextService.getCurrentChallenge(userId);

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

    const dynamicInstructions = buildDynamicInstructionsPro(contextData);
    const globalContextSection = buildGlobalContextSection(
      isFirstConversation ? null : globalContext as unknown as Record<string, unknown>
    );

    return CLARA_PREMIUM_INSTRUCTIONS
      .replace('{{GLOBAL_CONTEXT}}', globalContextSection)
      .replace('{{DYNAMIC_INSTRUCTIONS}}', dynamicInstructions);
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
    isOnboarding: boolean;
    onboardingTurn: number;
  }> {
    try {
      // Get or create global context
      const globalContext = await globalContextService.getOrCreateContext(userId);

      // Use only first name for all greetings
      const firstName = (userName || 'Usuario').trim().split(/\s+/)[0] || 'Usuario';

      // Check if onboarding is completed
      const isOnboardingCompleted = globalContext.onboardingCompleted;
      const currentOnboardingTurn = globalContext.onboardingTurn || 0;

      // Check if this is the first conversation
      const isFirstConversation = await globalContextService.isFirstConversation(userId);

      // Update phase based on progress
      await globalContextService.updatePhase(userId);

      // Create OpenAI conversation
      const openaiConv = await (openai as any).conversations.create();
      const openaiConversationId = openaiConv.id;

      // Create new conversation in database
      const conversation = await prisma.proConversation.create({
        data: {
          userId,
          openaiConversationId, // Store OpenAI conversation ID
          messageCount: 0,
        },
      });

      // Generate welcome message based on onboarding state
      let welcomeMessage: string;

      if (!isOnboardingCompleted) {
        // User hasn't completed onboarding - start or continue onboarding
        const newTurn = currentOnboardingTurn === 0 ? 1 : currentOnboardingTurn;

        // Update onboarding turn
        await prisma.userGlobalContext.update({
          where: { userId },
          data: { onboardingTurn: newTurn },
        });

        // Build onboarding instructions for this turn
        const onboardingInstructions = buildOnboardingInstructions(newTurn, firstName);

        // If turn 1, use the static welcome message
        if (newTurn === 1) {
          welcomeMessage = PRO_WELCOME_MESSAGE.replace('{nombre}', firstName);
        } else {
          // Continue from where they left off
          const response = await openai.responses.create({
            model: MODELS.TEXT,
            conversation: openaiConversationId,
            instructions: onboardingInstructions,
            input: [
              {
                type: 'message',
                role: 'user',
                content: [
                  {
                    type: 'input_text',
                    text: `[SISTEMA] El usuario ${firstName} vuelve al onboarding. Continúa desde donde lo dejó (turno ${newTurn}).`
                  },
                ],
              },
            ],
          } as any);

          welcomeMessage = this.extractTextFromResponse(response) ||
            `¡Hola ${firstName}! Continuemos con el onboarding donde lo dejamos.`;
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

        logger.info(`Clara Premium onboarding conversation started for user ${userId}, turn ${newTurn}`);

        return {
          conversationId: conversation.id,
          welcomeMessage,
          isFirstConversation,
          isOnboarding: true,
          onboardingTurn: newTurn,
        };
      }

      // Build full instructions for normal conversation
      const fullInstructions = await this.buildFullInstructions(userId, firstName);

      // Returning user with completed onboarding - generate contextual greeting
      const formattedGlobalContext = await globalContextService.getFormattedContext(userId);
      const currentChallenge = await globalContextService.getCurrentChallenge(userId);

      const pendingHighlights: string[] = [];
      if (currentChallenge) {
        pendingHighlights.push(`Reto activo: "${currentChallenge.title}" (estado: ${currentChallenge.status})`);
      }
      if (Array.isArray(globalContext.goals) && globalContext.goals.length > 0) {
        pendingHighlights.push(`Objetivo principal: ${globalContext.goals[0]}`);
      }

      const pendingText = pendingHighlights.length > 0
        ? `Pendientes clave: ${pendingHighlights.join(' | ')}`
        : 'No hay pendientes explícitos, pregunta en qué quiere avanzar hoy.';

      const response = await openai.responses.create({
        model: MODELS.TEXT,
        conversation: openaiConversationId,
        instructions: fullInstructions,
        input: [
          {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `[SISTEMA] El usuario ${firstName} vuelve al chat. Genera un saludo de retorno (no onboarding) de máximo 3 líneas.
Reglas:
- Usa solo el primer nombre: ${firstName}
- Arranca con un saludo del tipo "Qué tal ${firstName}," o similar (sin presentarte de nuevo).
- Usa el contexto para sonar al día y menciona 1 pendiente si existe (retos, objetivos, avances): ${pendingText}
- No repitas frases de bienvenida genéricas ni discursos largos.
Contexto resumido: ${formattedGlobalContext}`
              },
            ],
          },
        ],
      } as any);

      welcomeMessage = this.extractTextFromResponse(response) ||
        `¡Hola ${firstName}! 💖 ¿Cómo te encuentras hoy?`;

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
        isOnboarding: false,
        onboardingTurn: 0,
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
    userMessage: string,
    imageBuffer?: Buffer
  ): Promise<{
    message: string;
    shouldGenerateTitle: boolean;
    shouldExtractContext: boolean;
    isOnboarding: boolean;
    onboardingTurn: number;
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

      // Get global context to check onboarding state
      const globalContext = await globalContextService.getOrCreateContext(userId);
      const isOnboarding = !globalContext.onboardingCompleted;
      let currentTurn = globalContext.onboardingTurn || 0;

      // Use only first name
      const firstName = (userName || 'Usuario').trim().split(/\s+/)[0] || 'Usuario';

      // Save user message
      await prisma.proMessage.create({
        data: {
          conversationId,
          role: 'user',
          content: userMessage,
        },
      });

      // Build instructions based on onboarding state
      let instructions: string;

      if (isOnboarding) {
        // Increment turn for onboarding
        currentTurn = currentTurn + 1;

        // Check if onboarding is now complete (55 questions + welcome = 56 turns)
        const isNowComplete = currentTurn > TOTAL_ONBOARDING_QUESTIONS + 1;

        if (isNowComplete) {
          // Mark onboarding as completed
          await prisma.userGlobalContext.update({
            where: { userId },
            data: {
              onboardingCompleted: true,
              onboardingTurn: currentTurn,
            },
          });

          // Use normal instructions for post-onboarding
          instructions = await this.buildFullInstructions(userId, firstName);
        } else {
          // Update turn count
          await prisma.userGlobalContext.update({
            where: { userId },
            data: { onboardingTurn: currentTurn },
          });

          // Build onboarding instructions for this turn
          instructions = buildOnboardingInstructions(currentTurn, firstName);
        }
      } else {
        // Normal conversation - use full instructions
        instructions = await this.buildFullInstructions(userId, firstName);
      }

      // Get or create OpenAI conversation ID
      let openaiConversationId = conversation.openaiConversationId;

      if (!openaiConversationId) {
        // Create new OpenAI conversation if doesn't exist
        const openaiConv = await (openai as any).conversations.create();
        openaiConversationId = openaiConv.id;

        // Update DB with OpenAI conversation ID
        await prisma.proConversation.update({
          where: { id: conversationId },
          data: { openaiConversationId },
        });

        logger.info(`Created new OpenAI conversation ${openaiConversationId} for DB conversation ${conversationId}`);
      }

      // Build input content (text + optional image)
      const content: any[] = [{ type: 'input_text', text: userMessage }];
      if (imageBuffer) {
        const base64Image = imageBuffer.toString('base64');
        content.push({ type: 'input_image', image_url: `data:image/jpeg;base64,${base64Image}` });
      }

      const response = await openai.responses.create({
        model: MODELS.TEXT,
        conversation: openaiConversationId,
        instructions,
        input: [
          {
            type: 'message',
            role: 'user',
            content,
          },
        ],
      } as any);

      const assistantMessage = this.extractTextFromResponse(response) ||
        'Lo siento, hubo un error. ¿Puedes repetirme eso?';

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

      // Build message history for context extraction
      const messageHistory = conversation.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Always include current messages in history
      const fullMessageHistory = [
        ...messageHistory,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantMessage }
      ];

      // Re-fetch global context to check updated state
      const updatedGlobalContext = await globalContextService.getOrCreateContext(userId);
      const hasContextData = updatedGlobalContext.digestiveProfile &&
        Object.keys(updatedGlobalContext.digestiveProfile as object).length > 0;

      // Check if this looks like a radiography response (long, structured message)
      const isRadiography = this.isRadiographyMessage(assistantMessage);

      // Extract context:
      // - Always if radiography is detected (most important!)
      // - Always if context is empty
      // - First 6 messages of conversation
      // - Every N messages after that
      // - Every 5 questions during onboarding to capture responses
      const shouldExtractContext = isRadiography ||
        !hasContextData ||
        newMessageCount <= 6 ||
        newMessageCount % CONTEXT_EXTRACTION_INTERVAL === 0 ||
        (isOnboarding && currentTurn % 5 === 0);

      if (shouldExtractContext) {
        logger.info(`Extracting context for user ${userId}: radiography=${isRadiography}, hasContext=${hasContextData}, msgCount=${newMessageCount}, onboarding=${isOnboarding}`);
        this.extractContextAsync(userId, fullMessageHistory);
      }

      // Mark radiography as completed if detected
      if (isRadiography) {
        await globalContextService.completeRadiography(userId, assistantMessage);
      }

      // Determine if we should generate title
      const shouldGenerateTitle = !conversation.title && newMessageCount >= 2;

      logger.info(`Clara Premium message processed for conversation ${conversationId}, onboarding=${isOnboarding}, turn=${currentTurn}`);

      return {
        message: assistantMessage,
        shouldGenerateTitle,
        shouldExtractContext,
        isOnboarding: isOnboarding && currentTurn <= TOTAL_ONBOARDING_QUESTIONS + 1,
        onboardingTurn: currentTurn,
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
    logger.info(`Starting async context extraction for user ${userId}, messages: ${messages.length}`);

    globalContextService.extractAndUpdateContext(userId, messages)
      .then(() => {
        logger.info(`✅ Context extracted successfully for user ${userId}`);
      })
      .catch(err => {
        logger.error('❌ Error extracting context:', {
          error: err instanceof Error ? err.message : String(err),
          userId,
          messageCount: messages.length
        });
      });
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

      // Use Responses API for title generation
      const response = await openai.responses.create({
        model: MODELS.TEXT,
        instructions: 'Genera un título corto (3-6 palabras) para esta conversación de salud digestiva. Solo responde con el título, sin comillas ni explicación.',
        input: messagesForTitle,
      } as any);

      const title = this.extractTextFromResponse(response)?.trim() || 'Nueva conversación';

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

      // Use Responses API for summary generation
      const response = await openai.responses.create({
        model: MODELS.TEXT,
        instructions: `Genera un resumen conciso (2-3 oraciones) de esta conversación de salud digestiva. 
Incluye:
- Temas principales discutidos
- Síntomas o preocupaciones mencionadas
- Recomendaciones dadas
- Estado emocional del usuario si es relevante

El resumen será usado para dar contexto a futuras conversaciones. Solo responde con el resumen.`,
        input: messagesForSummary,
      } as any);

      const summary = this.extractTextFromResponse(response)?.trim() || '';

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
