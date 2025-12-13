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
  PRO_ONBOARDING_INSTRUCTIONS,
  TOTAL_ONBOARDING_QUESTIONS,
  extractCurrentQuestion,
  isOnboardingCompleted as checkOnboardingCompleted,
  QUESTION_ID_TO_TURN,
} from '../config/pro-onboarding-instructions-complete';
import { globalContextService } from './global-context.service';
import { temporalContextService } from './temporal-context.service';
import { contentDetectionService } from './content-detection.service';
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

    // Build temporal context triggers based on last interaction
    const temporalTriggers = temporalContextService.buildTemporalTriggers(
      globalContext.lastCheckInDate,
      userName,
      globalContext.consecutiveDays
    );

    // Check for celebration milestones
    const celebration = temporalContextService.getCelebrationForStreak(globalContext.consecutiveDays);

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

    // Append celebration if exists
    let celebrationSection = '';
    if (celebration) {
      celebrationSection = `

═══════════════════════════════════════════════════════════════
🎉 CELEBRACIÓN DE MILESTONE
═══════════════════════════════════════════════════════════════

**IMPORTANTE:** El usuario ha alcanzado ${globalContext.consecutiveDays} días consecutivos.
En algún momento NATURAL de la conversación (no de inmediato), menciona:
"${celebration}"

No lo digas al principio. Espera el momento adecuado en la conversación.
═══════════════════════════════════════════════════════════════
`;
    }

    return CLARA_PREMIUM_INSTRUCTIONS
      .replace('{{GLOBAL_CONTEXT}}', globalContextSection)
      .replace('{{DYNAMIC_INSTRUCTIONS}}', dynamicInstructions + '\n' + temporalTriggers + celebrationSection);
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
      const currentQuestionId = globalContext.currentQuestionId || 'welcome';

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
      let onboardingTurn = 1;

      if (!isOnboardingCompleted) {
        // User hasn't completed onboarding - start or continue onboarding

        // If starting fresh, use the static welcome message
        if (currentQuestionId === 'welcome') {
          welcomeMessage = PRO_WELCOME_MESSAGE.replace('{nombre}', firstName);
          onboardingTurn = 1;

          // Update current question
          await prisma.userGlobalContext.update({
            where: { userId },
            data: { currentQuestionId: 'welcome' },
          });
        } else {
          // Continue from where they left off - use the model to generate contextual greeting
          onboardingTurn = QUESTION_ID_TO_TURN[currentQuestionId] || 1;

          const response = await openai.responses.create({
            model: MODELS.TEXT,
            conversation: openaiConversationId,
            instructions: PRO_ONBOARDING_INSTRUCTIONS.replace(/\{nombre\}/g, firstName),
            input: [
              {
                type: 'message',
                role: 'user',
                content: [
                  {
                    type: 'input_text',
                    text: `[SISTEMA] El usuario ${firstName} vuelve al onboarding. Continúa desde la pregunta [PREGUNTA_ACTUAL: ${currentQuestionId}]. Salúdalo brevemente y continúa el onboarding.`
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

        logger.info(`Clara Premium onboarding conversation started for user ${userId}, question ${currentQuestionId}, turn ${onboardingTurn}`);

        return {
          conversationId: conversation.id,
          welcomeMessage,
          isFirstConversation,
          isOnboarding: true,
          onboardingTurn,
        };
      }

      // Build full instructions for normal conversation
      const fullInstructions = await this.buildFullInstructions(userId, firstName);

      // Returning user with completed onboarding - generate contextual greeting
      const formattedGlobalContext = await globalContextService.getFormattedContext(userId);
      const currentChallenge = await globalContextService.getCurrentChallenge(userId);

      // Get temporal context for greeting
      const temporalTriggers = temporalContextService.buildTemporalTriggers(
        globalContext.lastCheckInDate,
        firstName,
        globalContext.consecutiveDays
      );

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

${temporalTriggers}

Reglas:
- Usa solo el primer nombre: ${firstName}
- SIGUE LAS INDICACIONES DEL CONTEXTO TEMPORAL arriba para el tipo de saludo
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
    isOnboarding: boolean;
    onboardingTurn: number;
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

      // Get global context to include onboarding state
      const globalContext = await globalContextService.getOrCreateContext(userId);
      const isOnboarding = !globalContext.onboardingCompleted;
      const currentQuestionId = globalContext.currentQuestionId || 'welcome';
      const onboardingTurn = QUESTION_ID_TO_TURN[currentQuestionId] || 1;

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
        isOnboarding,
        onboardingTurn,
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
    contentAnalysis?: {
      shouldOfferPDF: boolean;
      documentTitle?: string;
      isUrgent: boolean;
      urgencyReason?: string;
    };
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
      const currentQuestionId = globalContext.currentQuestionId || 'welcome';

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
        // Use complete onboarding instructions (like free flow)
        // The model manages the flow naturally and reports progress via [PREGUNTA_ACTUAL: xxx]
        instructions = PRO_ONBOARDING_INSTRUCTIONS.replace(/\{nombre\}/g, firstName);
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

      let assistantMessage = this.extractTextFromResponse(response) ||
        'Lo siento, hubo un error. ¿Puedes repetirme eso?';

      // Extract current question ID from Clara's response (metadata system)
      const newQuestionId = extractCurrentQuestion(assistantMessage);
      const onboardingStillActive = isOnboarding && newQuestionId !== 'completed';
      const onboardingJustCompleted = isOnboarding && newQuestionId === 'completed';

      // Update global context with new question ID if in onboarding
      if (isOnboarding && newQuestionId) {
        if (onboardingJustCompleted) {
          // Mark onboarding as completed
          await prisma.userGlobalContext.update({
            where: { userId },
            data: {
              onboardingCompleted: true,
              currentQuestionId: 'completed',
            },
          });
          logger.info(`✅ Onboarding completed for user ${userId}`);

          // Generate profile tags in background (non-blocking)
          this.generateTagsAsync(userId);
        } else {
          // Update current question ID
          await prisma.userGlobalContext.update({
            where: { userId },
            data: { currentQuestionId: newQuestionId },
          });
          logger.info(`Updated question ID for user ${userId}: ${currentQuestionId} → ${newQuestionId}`);
        }
      }

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
      const currentTurnForExtraction = newQuestionId ? (QUESTION_ID_TO_TURN[newQuestionId] || 1) : 1;
      const shouldExtractContext = isRadiography ||
        !hasContextData ||
        newMessageCount <= 6 ||
        newMessageCount % CONTEXT_EXTRACTION_INTERVAL === 0 ||
        (onboardingStillActive && currentTurnForExtraction % 5 === 0);

      if (shouldExtractContext) {
        logger.info(`Extracting context for user ${userId}: radiography=${isRadiography}, hasContext=${hasContextData}, msgCount=${newMessageCount}, onboarding=${onboardingStillActive}`);
        this.extractContextAsync(userId, fullMessageHistory);
      }

      // Mark radiography as completed if detected
      if (isRadiography) {
        await globalContextService.completeRadiography(userId, assistantMessage);
      }

      // Analyze content for valuable documents, challenges, and urgency
      // Only analyze non-onboarding responses to avoid false positives
      let contentAnalysisResult: {
        shouldOfferPDF: boolean;
        documentTitle?: string;
        isUrgent: boolean;
        urgencyReason?: string;
      } | undefined = undefined;

      if (!onboardingStillActive && assistantMessage.length > 200) {
        this.analyzeContentAsync(userId, conversationId, assistantMessage);

        // Quick sync analysis for urgency (to return immediately)
        const quickAnalysis = await contentDetectionService.analyzeResponse(
          userId,
          conversationId,
          assistantMessage
        );

        if (quickAnalysis.shouldOfferPDF || quickAnalysis.isUrgent) {
          contentAnalysisResult = {
            shouldOfferPDF: quickAnalysis.shouldOfferPDF,
            ...(quickAnalysis.documentTitle && { documentTitle: quickAnalysis.documentTitle }),
            isUrgent: quickAnalysis.isUrgent,
            ...(quickAnalysis.urgencyReason && { urgencyReason: quickAnalysis.urgencyReason })
          };
        }
      }

      // Determine if we should generate title
      const shouldGenerateTitle = !conversation.title && newMessageCount >= 2;

      // Calculate turn number for frontend compatibility
      const finalQuestionId = newQuestionId || currentQuestionId;
      const onboardingTurn = QUESTION_ID_TO_TURN[finalQuestionId] || 1;

      logger.info(`Clara Premium message processed for conversation ${conversationId}, onboarding=${onboardingStillActive}, question=${finalQuestionId}, turn=${onboardingTurn}`);

      return {
        message: assistantMessage,
        shouldGenerateTitle,
        shouldExtractContext,
        isOnboarding: onboardingStillActive,
        onboardingTurn,
        ...(contentAnalysisResult && { contentAnalysis: contentAnalysisResult }),
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
   * Generate profile tags asynchronously (non-blocking)
   */
  private generateTagsAsync(userId: string): void {
    logger.info(`Starting async profile tags generation for user ${userId}`);

    globalContextService.generateProfileTags(userId)
      .then((tags) => {
        logger.info(`✅ Profile tags generated successfully for user ${userId}:`, { tags });
      })
      .catch(err => {
        logger.error('❌ Error generating profile tags:', {
          error: err instanceof Error ? err.message : String(err),
          userId
        });
      });
  }

  /**
   * Analyze content and save documents/challenges asynchronously (non-blocking)
   */
  private analyzeContentAsync(
    userId: string,
    conversationId: string,
    assistantMessage: string
  ): void {
    logger.info(`Starting async content analysis for user ${userId}, conversation ${conversationId}`);

    contentDetectionService.analyzeResponse(userId, conversationId, assistantMessage)
      .then(async (analysis) => {
        // Save document if valuable
        if (analysis.isValuableDocument) {
          await contentDetectionService.saveDocument(
            userId,
            conversationId,
            analysis,
            assistantMessage
          );
        }

        // Create challenge if detected
        if (analysis.isChallenge) {
          await contentDetectionService.createChallenge(userId, analysis);
        }

        logger.info(`✅ Content analysis complete for user ${userId}:`, {
          isDocument: analysis.isValuableDocument,
          isChallenge: analysis.isChallenge
        });
      })
      .catch(err => {
        logger.error('❌ Error analyzing content:', {
          error: err instanceof Error ? err.message : String(err),
          userId,
          conversationId
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
