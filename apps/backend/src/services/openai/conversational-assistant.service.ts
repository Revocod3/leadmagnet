import { prisma } from '../../config/database';
import { AssistantAPIService } from './assistant-api.service';
import { KeyMomentDetectorService } from './key-moment-detector.service';
import { DecisionEngineService } from './decision-engine.service';
import { DiagnosisBuilderService } from './diagnosis-builder.service';
import { InstructionsBuilderService } from './instructions-builder.service';
import type {
  Language,
  ConversationalMemory,
  ConversationalResponse,
  EmotionalTone,
} from '../../types';

/**
 * ConversationalAssistantService
 * 
 * Main orchestrator for the conversational diagnostic system.
 * Coordinates all services to create a natural, human-like conversation.
 * 
 * Flow for each user message:
 * 1. Get/update conversational memory
 * 2. Extract information from user message
 * 3. Detect key moments
 * 4. Update diagnosis hypothesis
 * 5. DecisionEngine decides what to do next
 * 6. InstructionsBuilder creates dynamic instructions
 * 7. AssistantAPI generates response
 * 8. Update memory with new context
 * 9. Return response
 */
export class ConversationalAssistantService {
  private assistantAPI: AssistantAPIService;
  private keyMomentDetector: KeyMomentDetectorService;
  private decisionEngine: DecisionEngineService;
  private diagnosisBuilder: DiagnosisBuilderService;
  private instructionsBuilder: InstructionsBuilderService;

  constructor() {
    this.assistantAPI = new AssistantAPIService();
    this.keyMomentDetector = new KeyMomentDetectorService();
    this.decisionEngine = new DecisionEngineService();
    this.diagnosisBuilder = new DiagnosisBuilderService();
    this.instructionsBuilder = new InstructionsBuilderService();
  }

  /**
   * Initialize a new conversational session
   */
  async initialize(sessionId: string, userName: string, language: Language): Promise<string> {
    // Initialize Assistant API
    await this.assistantAPI.initialize();

    // Create thread for this session
    const threadId = await this.assistantAPI.createThread();

    // Create initial conversational memory
    const initialMemory: ConversationalMemory = {
      sessionId,
      factualInfo: {
        demographics: {},
        health: {},
        lifestyle: {},
        goals: {},
      },
      emotionalMarkers: [],
      keyMoments: [],
      userStyle: {
        formality: 5, // Default middle ground
        verbosity: 5,
        emotionLevel: 5,
      },
      currentHypothesis: {
        primary: '',
        confidence: 0,
        evidence: [],
        needsConfirmation: [],
      },
      conversationPhase: 'introduction',
      topicsExplored: [],
      turnCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    await prisma.conversationalMemory.create({
      data: {
        sessionId,
        factualInfo: initialMemory.factualInfo as any,
        emotionalMarkers: initialMemory.emotionalMarkers as any,
        keyMoments: initialMemory.keyMoments as any,
        userStyle: initialMemory.userStyle as any,
        currentHypothesis: initialMemory.currentHypothesis as any,
        conversationPhase: initialMemory.conversationPhase,
        topicsExplored: initialMemory.topicsExplored as any,
        turnCount: 0,
      },
    });

    // Update session with threadId
    await prisma.session.update({
      where: { id: sessionId },
      data: { threadId },
    });

    // Generate welcome message
    const firstName = userName.split(' ')[0] || userName;
    const welcomeMessage =
      language === 'es'
        ? `Hola ${firstName}, soy Clara, especialista en salud digestiva del Método Objetivo Vientre Plano.

Antes de comenzar, quiero que sepas que esta no es una consulta médica formal, sino una evaluación personalizada para entender tu situación digestiva y ofrecerte las mejores recomendaciones adaptadas a ti.

Vamos a tener una conversación natural sobre tu salud digestiva. No te preocupes por dar respuestas "perfectas" - simplemente cuéntame cómo te sientes.

Para empezar, ¿qué edad tienes y a qué te dedicas?`
        : `Hi ${firstName}, I'm Clara, digestive health specialist from the Objetivo Vientre Plano Method.

Before we begin, I want you to know that this is not a formal medical consultation, but a personalized assessment to understand your digestive situation and offer you the best recommendations tailored to you.

We're going to have a natural conversation about your digestive health. Don't worry about giving "perfect" answers - just tell me how you feel.

To start, how old are you and what do you do for a living?`;

    return welcomeMessage;
  }

  /**
   * Process a user message and generate response
   */
  async processMessage(
    sessionId: string,
    userMessage: string,
    language: Language
  ): Promise<ConversationalResponse> {
    // 1. Load memory and thread
    const memory = await this.loadMemory(sessionId);
    const session = await prisma.session.findUnique({ where: { id: sessionId } });

    if (!session || !session.threadId) {
      throw new Error('Session or thread not found');
    }

    const threadId = session.threadId;

    // 2. Get recent messages from thread
    const recentMessages = await this.assistantAPI.getThreadMessages(threadId, 10);

    // 3. Extract information from user message
    const extractedInfo = await this.extractInformation(userMessage, memory);

    // 4. Update user style (formality, verbosity, emotion)
    const updatedStyle = this.updateUserStyle(userMessage, memory);

    // 5. Detect emotional tone
    const emotionalTone = await this.detectEmotionalTone(userMessage);

    // 6. Detect key moments
    const keyMoments = await this.keyMomentDetector.detectKeyMoments(
      userMessage,
      memory.turnCount + 1,
      memory,
      recentMessages
    );

    // 7. Update diagnosis hypothesis
    const updatedHypothesis = await this.diagnosisBuilder.updateHypothesis(
      userMessage,
      memory,
      memory.turnCount + 1
    );

    // 8. Update memory with new information
    const updatedMemory: ConversationalMemory = {
      ...memory,
      factualInfo: this.mergeFactualInfo(memory.factualInfo, extractedInfo),
      emotionalMarkers: [
        ...memory.emotionalMarkers,
        {
          turn: memory.turnCount + 1,
          emotion: emotionalTone,
          intensity: this.estimateEmotionalIntensity(userMessage),
          quote: userMessage.length > 50 ? userMessage.substring(0, 100) : userMessage,
        },
      ],
      keyMoments: [...memory.keyMoments, ...keyMoments],
      userStyle: updatedStyle,
      currentHypothesis: updatedHypothesis,
      conversationPhase: this.updatePhase(memory),
      topicsExplored: this.updateTopicsExplored(memory, extractedInfo),
      turnCount: memory.turnCount + 1,
      updatedAt: new Date(),
    };

    // 9. Decision Engine decides what to do next
    const decision = await this.decisionEngine.decide(
      userMessage,
      updatedMemory,
      recentMessages,
      keyMoments
    );

    // 10. Check if we should conclude
    const shouldConclude = decision.type === 'conclude';

    // 11. Build dynamic instructions
    const instructions = this.instructionsBuilder.buildInstructions(
      {
        memory: updatedMemory,
        lastUserMessage: userMessage,
        decision,
        recentMessages,
      },
      language
    );

    // 12. Get response from Assistant
    console.log('🤖 Sending message to Assistant with dynamic instructions...');
    const assistantResponse = await this.assistantAPI.sendMessage(
      threadId,
      userMessage,
      instructions
    );

    // 13. Save updated memory
    await this.saveMemory(sessionId, updatedMemory);

    // 14. Return response
    return {
      message: assistantResponse,
      updatedMemory,
      decision,
      keyMomentsDetected: keyMoments,
      shouldConclude,
    };
  }

  /**
   * Generate final diagnosis
   */
  async generateDiagnosis(
    sessionId: string,
    userName: string,
    language: Language
  ): Promise<string> {
    const memory = await this.loadMemory(sessionId);
    const session = await prisma.session.findUnique({ where: { id: sessionId } });

    if (!session || !session.threadId) {
      throw new Error('Session not found');
    }

    // Get full conversation history
    const allMessages = await this.assistantAPI.getThreadMessages(session.threadId, 100);

    // Generate diagnosis
    const diagnosis = await this.diagnosisBuilder.generateFinalDiagnosis(
      userName,
      memory,
      language,
      allMessages
    );

    return diagnosis;
  }

  /**
   * Load conversational memory from database
   */
  private async loadMemory(sessionId: string): Promise<ConversationalMemory> {
    const memoryData = await prisma.conversationalMemory.findUnique({
      where: { sessionId },
    });

    if (!memoryData) {
      throw new Error('Conversational memory not found');
    }

    return {
      sessionId: memoryData.sessionId,
      factualInfo: memoryData.factualInfo as any,
      emotionalMarkers: memoryData.emotionalMarkers as any,
      keyMoments: memoryData.keyMoments as any,
      userStyle: memoryData.userStyle as any,
      currentHypothesis: memoryData.currentHypothesis as any,
      conversationPhase: memoryData.conversationPhase as any,
      topicsExplored: memoryData.topicsExplored as any,
      turnCount: memoryData.turnCount,
      createdAt: memoryData.createdAt,
      updatedAt: memoryData.updatedAt,
    };
  }

  /**
   * Save conversational memory to database
   */
  private async saveMemory(sessionId: string, memory: ConversationalMemory): Promise<void> {
    await prisma.conversationalMemory.update({
      where: { sessionId },
      data: {
        factualInfo: memory.factualInfo as any,
        emotionalMarkers: memory.emotionalMarkers as any,
        keyMoments: memory.keyMoments as any,
        userStyle: memory.userStyle as any,
        currentHypothesis: memory.currentHypothesis as any,
        conversationPhase: memory.conversationPhase,
        topicsExplored: memory.topicsExplored as any,
        turnCount: memory.turnCount,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Extract factual information from user message
   */
  private async extractInformation(
    userMessage: string,
    currentMemory: ConversationalMemory
  ): Promise<Partial<ConversationalMemory['factualInfo']>> {
    // Simple extraction - can be enhanced with AI
    const extracted: Partial<ConversationalMemory['factualInfo']> = {};
    const lower = userMessage.toLowerCase();

    // Extract age
    const ageMatch = userMessage.match(/(\d+)\s*años?|años?\s*(\d+)/i);
    if (ageMatch) {
      const age = parseInt(ageMatch[1] || ageMatch[2] || '0');
      if (age > 0 && age < 120) {
        extracted.demographics = { ...extracted.demographics, age };
      }
    }

    // Extract symptoms
    const symptoms: string[] = [];
    if (lower.includes('hincha')) symptoms.push('hinchazón');
    if (lower.includes('dolor')) symptoms.push('dolor abdominal');
    if (lower.includes('gases')) symptoms.push('gases');
    if (lower.includes('estreñi')) symptoms.push('estreñimiento');
    if (lower.includes('diarrea')) symptoms.push('diarrea');

    if (symptoms.length > 0) {
      extracted.health = {
        ...extracted.health,
        symptoms: [...(currentMemory.factualInfo.health?.symptoms || []), ...symptoms],
      };
    }

    return extracted;
  }

  /**
   * Update user communication style
   */
  private updateUserStyle(
    userMessage: string,
    memory: ConversationalMemory
  ): ConversationalMemory['userStyle'] {
    const wordCount = userMessage.split(/\s+/).length;

    // Update verbosity (running average)
    const newVerbosity = wordCount < 10 ? 3 : wordCount < 30 ? 6 : 9;
    const avgVerbosity = Math.round((memory.userStyle.verbosity + newVerbosity) / 2);

    // Update formality (check for formal indicators)
    const formalIndicators = /usted|le agradezco|muy amable|disculpe/i;
    const casualIndicators = /tú|tio|colega|guay|mola/i;

    let newFormality = memory.userStyle.formality;
    if (formalIndicators.test(userMessage)) {
      newFormality = Math.min(newFormality + 1, 10);
    } else if (casualIndicators.test(userMessage)) {
      newFormality = Math.max(newFormality - 1, 1);
    }

    return {
      formality: newFormality,
      verbosity: avgVerbosity,
      emotionLevel: memory.userStyle.emotionLevel, // Updated separately with emotional markers
    };
  }

  /**
   * Detect emotional tone
   */
  private async detectEmotionalTone(userMessage: string): Promise<EmotionalTone> {
    // Simple heuristic - can be enhanced with AI call
    const lower = userMessage.toLowerCase();

    if (lower.includes('desesper') || lower.includes('no aguanto')) return 'overwhelmed';
    if (lower.includes('frustr') || lower.includes('harto')) return 'frustrated';
    if (lower.includes('esperanz') || lower.includes('mejor')) return 'hopeful';
    if (lower.includes('ansios') || lower.includes('preocup')) return 'anxious';
    if (lower.includes('resign') || lower.includes('ya ni')) return 'resigned';
    if (lower.includes('genial') || lower.includes('emocion')) return 'enthusiastic';

    return 'neutral';
  }

  /**
   * Estimate emotional intensity
   */
  private estimateEmotionalIntensity(userMessage: string): number {
    const intensifiers = ['muy', 'mucho', 'demasiado', 'extremadamente', 'totalmente'];
    const capsRatio = (userMessage.match(/[A-Z]/g) || []).length / userMessage.length;
    const hasExclamation = userMessage.includes('!');

    let intensity = 5; // Base

    intensifiers.forEach(word => {
      if (userMessage.toLowerCase().includes(word)) {
        intensity += 1;
      }
    });

    if (capsRatio > 0.3) intensity += 2;
    if (hasExclamation) intensity += 1;

    return Math.min(intensity, 10);
  }

  /**
   * Update conversation phase
   */
  private updatePhase(memory: ConversationalMemory): typeof memory.conversationPhase {
    const turnCount = memory.turnCount;

    if (turnCount <= 3) return 'introduction';
    if (turnCount <= 8) return 'exploration';
    if (turnCount <= 12) return 'deepening';
    return 'conclusion';
  }

  /**
   * Update topics explored
   */
  private updateTopicsExplored(
    memory: ConversationalMemory,
    extractedInfo: Partial<ConversationalMemory['factualInfo']>
  ): string[] {
    const topics = [...memory.topicsExplored];

    if (extractedInfo.health?.symptoms) topics.push('síntomas');
    if (extractedInfo.health?.triggers) topics.push('triggers');
    if (extractedInfo.lifestyle?.diet) topics.push('alimentación');
    if (extractedInfo.lifestyle?.stress) topics.push('estrés');
    if (extractedInfo.lifestyle?.sleep) topics.push('sueño');

    return [...new Set(topics)]; // Remove duplicates
  }

  /**
   * Merge factual info
   */
  private mergeFactualInfo(
    current: ConversationalMemory['factualInfo'],
    extracted: Partial<ConversationalMemory['factualInfo']>
  ): ConversationalMemory['factualInfo'] {
    return {
      demographics: { ...current.demographics, ...extracted.demographics },
      health: {
        ...current.health,
        ...extracted.health,
        symptoms: [
          ...(current.health?.symptoms || []),
          ...(extracted.health?.symptoms || []),
        ],
        triggers: [
          ...(current.health?.triggers || []),
          ...(extracted.health?.triggers || []),
        ],
      },
      lifestyle: { ...current.lifestyle, ...extracted.lifestyle },
      goals: { ...current.goals, ...extracted.goals },
    };
  }
}
