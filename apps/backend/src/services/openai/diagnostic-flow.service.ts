import { openai, MODELS, ASSISTANT_INSTRUCTIONS } from '../../config/openai';
import { getDiagnosticQuestions, WELCOME_MESSAGES, GREETING_MESSAGES, DID_YOU_KNOW, DIAGNOSIS_READY_MESSAGE, OCCUPATION_PATTERNS, OCCUPATION_INSIGHTS, DIAGNOSIS_INTRO, type CollectedInfo } from '../../constants/questions';
import type { Language } from '../../types';
import { VisionService } from './vision.service';
import { EngagementTrackerService, type EngagementScore } from '../engagement-tracker.service';
import { AdaptiveQuestionManagerService, type DiagnosticMode } from '../adaptive-question-manager.service';
import { formatInitialInstructions } from '../../constants/diagnostic-messages';
// AGI Services
import { ContextManagerService } from '../agi/context-manager.service';
import { PatternDetectorService } from '../agi/pattern-detector.service';
import { InsightGeneratorService } from '../agi/insight-generator.service';
import { QuestionGeneratorService } from '../agi/question-generator.service';
import type { AGIInsight, DetectedPattern, AGIEnhancedFlowResponse, EmotionalTone, ExtractedInfo } from '../../types/agi.types';

export type FlowStep =
  | 'initial'
  | 'name_extracted'
  | 'greeting'
  | 'asking_questions'
  | 'diagnosis_ready' // Nuevo: cuando el diagnóstico está listo (muestra mensaje + 2 botones)
  | 'completed';

export interface DiagnosticFlowState {
  step: FlowStep;
  currentQuestionIndex: number;
  currentBlockId: number; // NEW: Track current block
  userName: string | null;
  language: Language;
  answers: Array<{ question: string; answer: string }>;
  collectedInfo: CollectedInfo; // NEW: Collected information from answers
  imageAnalysis: string | null;
  diagnosisContent: string | null;

  // Engagement tracking
  engagementScore: EngagementScore;
  diagnosticMode: DiagnosticMode;
  questionStartTime: number; // Timestamp when question was asked
  askedQuestionIds: number[]; // IDs of questions already asked
  previousEngagementScore: number; // To track if engagement is increasing/decreasing

  // Dynamic Question Flow
  questionOrder: string[]; // Order of question topics (dynamic)
  currentEmotionalTone: EmotionalTone; // Current emotional state

  // AGI Session
  agiSessionId: string; // Persistent session ID for AGI context
}export interface FlowResponse {
  message: string;
  newState: DiagnosticFlowState;
  requiresWelcomeAnimation?: boolean;
  etymology?: string;
  nextQuestion?: string;
  questionDetails?: string | undefined;
  type?: 'welcome' | 'greeting' | 'question' | 'comment' | 'validation_error' | 'diagnosis_ready' | 'completed';

  // AGI Enhancement fields
  agiInsights?: AGIInsight[];
  patternConnections?: DetectedPattern[];
  metaReasoning?: { thought: string; explanation: string; strategy: string };
  emotionalResponse?: string;
  progressiveSummary?: { completionPercentage: number; currentPhase: string; keyPointsLearned: string[]; nextFocus: string; suggestedCorrections?: string[] };
  thinkingTime?: number;
  clarificationRequest?: string;
}

export class DiagnosticFlowService {
  private visionService: VisionService;
  private engagementTracker: EngagementTrackerService;
  private questionManager: AdaptiveQuestionManagerService;
  // AGI Services
  private contextManager: ContextManagerService;
  private patternDetector: PatternDetectorService;
  private insightGenerator: InsightGeneratorService;
  private questionGenerator: QuestionGeneratorService;

  constructor() {
    this.visionService = new VisionService();
    this.engagementTracker = new EngagementTrackerService();
    this.questionManager = new AdaptiveQuestionManagerService();
    // Initialize AGI Services
    this.contextManager = new ContextManagerService();
    this.patternDetector = new PatternDetectorService();
    this.insightGenerator = new InsightGeneratorService();
    this.questionGenerator = new QuestionGeneratorService();
  }

  /**
   * Detects occupation type from occupation string
   */
  private detectOccupationType(occupation: string): string {
    for (const [type, pattern] of Object.entries(OCCUPATION_PATTERNS)) {
      if (pattern.test(occupation)) {
        return type;
      }
    }
    return 'default';
  }

  /**
   * Generates occupation-specific comment
   */
  private generateOccupationComment(
    age: number,
    occupation: string,
    language: Language
  ): string {
    const occupationType = this.detectOccupationType(occupation);
    const insight = OCCUPATION_INSIGHTS[occupationType as keyof typeof OCCUPATION_INSIGHTS] || OCCUPATION_INSIGHTS.default;

    // Select random insight
    const randomInsight = insight.insights[
      Math.floor(Math.random() * insight.insights.length)
    ];

    const ageText = language === 'es' ? `${age} años` : `${age} years old`;
    const workText = language === 'es' ? `trabajas como` : `you work as`;

    return `${ageText} y ${workText} ${occupation}. ${randomInsight} ${insight.tips}`;
  }

  /**
   * Extracts information from user answers
   */
  private extractInfoFromAnswer(
    questionId: number,
    answer: string,
    currentInfo: CollectedInfo
  ): Partial<CollectedInfo> {
    const info: Partial<CollectedInfo> = {};
    const lowerAnswer = answer.toLowerCase();

    // Question 1: Age and occupation
    if (questionId === 1) {
      // Extract age
      const ageMatch = answer.match(/(\d+)\s*años?|años?\s*(\d+)/i);
      if (ageMatch && (ageMatch[1] || ageMatch[2])) {
        const ageValue = ageMatch[1] || ageMatch[2];
        if (ageValue) {
          info.age = parseInt(ageValue);
        }
      }

      // Extract occupation (everything else)
      const occupationText = answer.replace(/(\d+)\s*años?|años?\s*(\d+)/gi, '').trim();
      if (occupationText) {
        info.occupation = occupationText;
        info.occupationType = this.detectOccupationType(occupationText);
      }
    }

    // Question 2: Main problem
    if (questionId === 2) {
      info.mainProblem = answer;

      // Extract problematic foods if mentioned here
      if (lowerAnswer.includes('lácteos') || lowerAnswer.includes('leche')) {
        info.badFoods = [...(info.badFoods || []), 'lácteos'];
      }
      if (lowerAnswer.includes('gluten') || lowerAnswer.includes('pan') || lowerAnswer.includes('pasta')) {
        info.badFoods = [...(info.badFoods || []), 'gluten'];
      }
    }

    // Question 3: Duration
    if (questionId === 3) {
      info.duration = answer;
    }

    // Question 4: Diet
    if (questionId === 4) {
      info.diet = answer;

      // Detect exercise mention here
      if (lowerAnswer.includes('no hago ejercicio') || lowerAnswer.includes('sedentario')) {
        info.exercise = 'sedentario';
      }
    }

    // Question 5: Bad foods
    if (questionId === 5) {
      const problematicFoods = [];
      if (lowerAnswer.includes('lácteos') || lowerAnswer.includes('leche')) {
        problematicFoods.push('lácteos');
      }
      if (lowerAnswer.includes('gluten') || lowerAnswer.includes('pan') || lowerAnswer.includes('pasta')) {
        problematicFoods.push('gluten');
      }
      if (lowerAnswer.includes('legumbres') || lowerAnswer.includes('frijoles')) {
        problematicFoods.push('legumbres');
      }
      if (problematicFoods.length > 0) {
        info.badFoods = [...(currentInfo.badFoods || []), ...problematicFoods];
      }
    }

    // Question 6: Water intake
    if (questionId === 6) {
      info.waterIntake = answer;
    }

    // Question 7: Exercise
    if (questionId === 7) {
      info.exercise = answer;
    }

    // Question 8: Sleep
    if (questionId === 8) {
      info.sleep = answer;
    }

    // Question 9: Stress
    if (questionId === 9) {
      info.stress = answer;

      // If sleep mentioned here too
      if (lowerAnswer.includes('duermo mal') || lowerAnswer.includes('insomnio')) {
        info.sleep = 'mal';
      }
    }

    // Question 10: Medical conditions
    if (questionId === 10) {
      const conditions = [];
      if (lowerAnswer.includes('hipotiroidismo')) conditions.push('hipotiroidismo');
      if (lowerAnswer.includes('sii') || lowerAnswer.includes('intestino irritable')) conditions.push('SII');
      if (lowerAnswer.includes('intolerancia')) conditions.push('intolerancias');

      if (conditions.length > 0) {
        info.medicalConditions = conditions;
      }

      // Extract medications
      if (lowerAnswer.includes('medicamento') || lowerAnswer.includes('tomo')) {
        info.medications = [answer];
      }
    }

    // Question 11: Goal
    if (questionId === 11) {
      info.goal = answer;
    }

    // Question 12: Motivation
    if (questionId === 12) {
      const motivationMatch = answer.match(/(\d+)/);
      if (motivationMatch && motivationMatch[1]) {
        info.motivation = parseInt(motivationMatch[1]);
      }
    }

    return info;
  }

  /**
   * Determines if a question should be asked based on collected info
   */
  private shouldAskQuestion(
    question: any,
    collectedInfo: CollectedInfo
  ): boolean {
    if (!question.isConditional) {
      return true; // Mandatory questions always asked
    }

    // If question has condition check, use it
    if (question.conditionCheck) {
      return question.conditionCheck(collectedInfo);
    }

    return true;
  }

  /**
   * Generates block transition messages
   */
  private generateBlockTransition(
    toBlockId: number,
    state: DiagnosticFlowState
  ): string {
    const userName = state.userName || 'amigo/a';

    switch (toBlockId) {
      case 2: // Problem
        return `Perfecto ${userName}, ahora cuéntame qué te trae aquí...`;

      case 3: // Lifestyle
        const problem = state.collectedInfo.mainProblem || 'tu molestia';
        return `Entiendo, ${problem} puede ser muy incómodo. Ahora hablemos un poco de tus hábitos diarios.`;

      case 4: // Health
        return `Gracias por compartir eso, ${userName}. Ahora, sobre tu salud en general...`;

      case 5: // Motivation
        return `${userName}, ya casi terminamos. Hablemos de tus objetivos y expectativas.`;

      default:
        return '';
    }
  }

  /**
   * Inicializa una nueva sesión de diagnóstico con el nombre del usuario
   */
  initializeFlow(language: Language = 'es', userName?: string): { message: string; state: DiagnosticFlowState } {
    // Initialize engagement tracking
    const engagementScore = this.engagementTracker.initialize();

    // Generate dynamic question order
    const questionOrder = this.questionGenerator.generateDynamicQuestionOrder(
      'standard', // Start with standard mode
      {} // No collected info yet
    );

    // Generate persistent AGI session ID
    const agiSessionId = `agi_${userName || 'guest'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const state: DiagnosticFlowState = {
      step: 'initial',
      currentQuestionIndex: 0, // Start from first question (index 0)
      currentBlockId: 1, // Start with block 1
      userName: userName || null,
      language,
      answers: [],
      collectedInfo: {}, // Initialize empty collected info
      imageAnalysis: null,
      diagnosisContent: null,

      // Engagement tracking
      engagementScore,
      diagnosticMode: 'standard', // Start with standard mode
      questionStartTime: Date.now(),
      askedQuestionIds: [],
      previousEngagementScore: 50, // Start at medium

      // Dynamic question flow
      questionOrder,
      currentEmotionalTone: 'neutral',

      // AGI Session
      agiSessionId,
    };    // Use new initial instructions that explain value and discount
    const firstName = userName ? userName.trim().split(' ')[0] || 'amigo/a' : 'amigo/a';
    const welcomeMessage = formatInitialInstructions(language, firstName);

    return {
      message: welcomeMessage,
      state,
    };
  }

  /**
   * Procesa el mensaje del usuario y retorna la respuesta apropiada según el flujo
   */
  async processMessage(
    userMessage: string,
    currentState: DiagnosticFlowState,
    imageData?: { base64: string; mimeType: string }
  ): Promise<FlowResponse> {
    switch (currentState.step) {
      case 'initial':
        return this.handleInitialMessage(userMessage, currentState);

      case 'greeting':
        return this.handleGreetingAcknowledgment(currentState);

      case 'asking_questions':
        return this.handleQuestionResponse(userMessage, currentState, imageData);

      case 'diagnosis_ready':
      case 'completed':
        return this.handleCompletedFlow(currentState);

      default:
        return {
          message: 'Estado no válido',
          newState: currentState,
          type: 'validation_error',
        };
    }
  }

  /**
   * Helper para extraer solo el primer nombre
   */
  private getFirstName(fullName: string | null): string {
    if (!fullName) return '';
    const firstName = fullName.trim().split(/\s+/)[0];
    return firstName || '';
  }

  /**
   * Obtiene la siguiente pregunta dinámica según el contexto
   */
  private async getNextDynamicQuestion(
    currentState: DiagnosticFlowState
  ): Promise<{ id: number; blockId: number; question: string; questionDetails?: string } | null> {
    // Obtener el siguiente topic del order
    const currentIndex = currentState.questionOrder.findIndex(topic => {
      const metadata = this.questionGenerator['getQuestionMetadata'](topic);
      return !currentState.askedQuestionIds.includes(metadata.id);
    });

    if (currentIndex === -1) {
      return null; // No more questions
    }

    const nextTopic = currentState.questionOrder[currentIndex];
    if (!nextTopic) {
      return null;
    }

    // Generar pregunta dinámica
    const dynamicQuestion = await this.questionGenerator.generateDynamicQuestion(
      nextTopic,
      {
        collectedInfo: currentState.collectedInfo,
        emotionalTone: currentState.currentEmotionalTone,
        previousQuestions: currentState.askedQuestionIds,
        language: currentState.language
      }
    );

    return {
      id: dynamicQuestion.id,
      blockId: dynamicQuestion.blockId,
      question: dynamicQuestion.question,
      ...(dynamicQuestion.questionDetails && { questionDetails: dynamicQuestion.questionDetails })
    };
  }

  /**
   * Maneja el primer mensaje del usuario (cuando ya tiene nombre, solo responde "sí" al welcome)
   */
  private async handleInitialMessage(
    userMessage: string,
    currentState: DiagnosticFlowState
  ): Promise<FlowResponse> {
    // Get first question dynamically
    const firstTopic = currentState.questionOrder[0];
    if (!firstTopic) {
      throw new Error('No question topics available');
    }

    const dynamicQuestion = await this.questionGenerator.generateDynamicQuestion(
      firstTopic,
      {
        collectedInfo: currentState.collectedInfo,
        emotionalTone: currentState.currentEmotionalTone,
        previousQuestions: currentState.askedQuestionIds,
        language: currentState.language
      }
    );

    // Extraer solo el primer nombre
    const firstName = this.getFirstName(currentState.userName);

    // Crear una transición cálida y profesional
    const transition = currentState.language === 'es'
      ? `Perfecto, ${firstName || 'vamos a comenzar'}.\n\nAntes de empezar, quiero que sepas que este no es un diagnóstico médico, sino una evaluación personalizada para entender tu situación digestiva y ofrecerte las mejores recomendaciones.\n`
      : `Perfect, ${firstName || 'let\'s begin'}.\n\nBefore we start, I want you to know that this is not a medical diagnosis, but a personalized assessment to understand your digestive situation and offer you the best recommendations.\n\nLet's start with the basics:`;

    // Preparar estado actualizado - vamos directo a hacer preguntas
    const newState: DiagnosticFlowState = {
      ...currentState,
      step: 'asking_questions',
      currentQuestionIndex: 0,
      currentBlockId: dynamicQuestion.blockId,
      questionStartTime: Date.now(), // Start timer for first question
      askedQuestionIds: [dynamicQuestion.id], // Mark first question as asked
    };

    // Combinar la transición con la primera pregunta
    return {
      message: `${transition}\n\n${dynamicQuestion.question}`,
      newState,
      questionDetails: dynamicQuestion.questionDetails,
      type: 'question',
    };
  }

  /**
   * Después del saludo, envía la primera pregunta
   */
  private async handleGreetingAcknowledgment(
    currentState: DiagnosticFlowState
  ): Promise<FlowResponse> {
    const questions = getDiagnosticQuestions(currentState.language);
    const firstQuestion = questions[0]; // First question (index 0)

    if (!firstQuestion) {
      throw new Error('First question not found');
    }

    const newState: DiagnosticFlowState = {
      ...currentState,
      step: 'asking_questions',
      currentQuestionIndex: 0,
      currentBlockId: firstQuestion.blockId,
    };

    return {
      message: firstQuestion.question,
      newState,
      nextQuestion: firstQuestion.question,
      questionDetails: firstQuestion.questionDetails,
      type: 'question',
    };
  }

  /**
   * Maneja la respuesta del usuario a una pregunta diagnóstica
   */
  private async handleQuestionResponse(
    userAnswer: string,
    currentState: DiagnosticFlowState,
    imageData?: { base64: string; mimeType: string }
  ): Promise<FlowResponse> {
    // Find current question by ID from askedQuestionIds
    const currentQuestionId = currentState.askedQuestionIds[currentState.askedQuestionIds.length - 1];
    const questions = getDiagnosticQuestions(currentState.language);
    const currentQuestion = questions.find(q => q.id === currentQuestionId);

    if (!currentQuestion) {
      return {
        message: 'Error: pregunta no encontrada',
        newState: currentState,
        type: 'validation_error',
      };
    }

    // 1. ENGAGEMENT TRACKING: Calculate time taken to respond
    const timeTaken = Date.now() - currentState.questionStartTime;

    // 2. ENGAGEMENT TRACKING: Analyze response and update engagement score
    const newEngagementScore = this.engagementTracker.analyzeResponse(
      userAnswer,
      timeTaken,
      currentState.engagementScore,
      currentState.language
    );

    // 3. ENGAGEMENT TRACKING: Check if mode should change
    const modeChange = this.questionManager.suggestModeChange(
      currentState.diagnosticMode,
      newEngagementScore.total
    );

    const newMode = modeChange || currentState.diagnosticMode;

    // Log engagement changes
    if (modeChange) {
      console.log(`📊 Mode upgraded: ${currentState.diagnosticMode} → ${newMode}`);
    }
    console.log(`📊 Engagement score: ${newEngagementScore.total} (${newMode} mode)`);

    // Validar respuesta
    const validation = await this.validateAnswer(
      currentQuestion.question,
      userAnswer,
      currentState.language
    );

    if (!validation.isValid) {
      return {
        message: validation.feedback || 'Por favor, proporciona una respuesta más detallada.',
        newState: currentState,
        type: 'validation_error',
      };
    }

    // Extraer información de la respuesta
    const extractedInfo = this.extractInfoFromAnswer(
      currentQuestion.id,
      userAnswer,
      currentState.collectedInfo
    );

    // Actualizar información recopilada
    const updatedInfo = {
      ...currentState.collectedInfo,
      ...extractedInfo,
    };

    // Guardar respuesta
    const newAnswers = [
      ...currentState.answers,
      {
        question: currentQuestion.question,
        answer: userAnswer,
      },
    ];

    // CASO ESPECIAL: Pregunta 1 (edad y ocupación) - usa el mismo flujo adaptativo
    if (currentQuestion.id === 1 && extractedInfo.age && extractedInfo.occupation) {
      const occupationComment = this.generateOccupationComment(
        extractedInfo.age!,
        extractedInfo.occupation!,
        currentState.language
      );

      // Get next question dynamically
      const nextQuestion = await this.getNextDynamicQuestion({
        ...currentState,
        collectedInfo: updatedInfo,
        diagnosticMode: newMode,
        currentEmotionalTone: 'neutral' // Will be detected in next response
      });

      if (!nextQuestion) {
        throw new Error('Next question not found');
      }

      const newState: DiagnosticFlowState = {
        ...currentState,
        currentQuestionIndex: currentState.currentQuestionIndex + 1,
        currentBlockId: nextQuestion.blockId,
        answers: newAnswers,
        collectedInfo: updatedInfo,

        // Update engagement tracking
        engagementScore: newEngagementScore,
        diagnosticMode: newMode,
        questionStartTime: Date.now(),
        askedQuestionIds: [...currentState.askedQuestionIds, nextQuestion.id],
        previousEngagementScore: currentState.engagementScore.total,
      };

      // Combinar comentario de ocupación + transición de bloque + siguiente pregunta
      const blockTransition = this.generateBlockTransition(nextQuestion.blockId, newState);
      const fullMessage = `${occupationComment}\n\n${blockTransition}\n\n${nextQuestion.question}`;

      return {
        message: fullMessage,
        newState,
        questionDetails: nextQuestion.questionDetails,
        type: 'comment',
        agiInsights: [],
        patternConnections: [],
        metaReasoning: { thought: '', explanation: '', strategy: '' },
      };
    }

    // Analizar imagen si es la pregunta 13
    let imageAnalysis = currentState.imageAnalysis;
    if (currentQuestion.id === 13 && imageData) {
      try {
        const imageBuffer = Buffer.from(imageData.base64, 'base64');
        imageAnalysis = await this.visionService.analyzeImage(
          imageBuffer,
          currentState.language
        );
        updatedInfo.imageAnalysis = imageAnalysis;
      } catch (error) {
        console.error('Error analyzing image:', error);
        imageAnalysis = null;
      }
    }

    // ========== AGI ENHANCEMENT ==========
    // 6. AGI: Update context with new information
    // Use persistent AGI session ID
    const agiContext = await this.contextManager.getOrCreateContext(
      currentState.agiSessionId,
      currentState.userName || undefined
    );

    // Detect emotional tone from answer
    const emotionalTone = await this.detectEmotionalTone(userAnswer);

    // Convert CollectedInfo to ExtractedInfo format
    const extractedInfoForAGI: Partial<ExtractedInfo> = {
      demographics: {
        ...(updatedInfo.age && { age: updatedInfo.age }),
        ...(updatedInfo.occupation && { occupation: updatedInfo.occupation }),
        ...(updatedInfo.occupationType && { occupationType: updatedInfo.occupationType }),
      },
      health: {
        ...(updatedInfo.mainProblem && { mainProblem: updatedInfo.mainProblem }),
        ...(updatedInfo.duration && { duration: updatedInfo.duration }),
        ...(updatedInfo.medicalConditions && { medicalConditions: updatedInfo.medicalConditions }),
        ...(updatedInfo.medications && { medications: updatedInfo.medications }),
        ...(updatedInfo.badFoods && { badFoods: updatedInfo.badFoods }),
      },
      lifestyle: {
        ...(updatedInfo.diet && { diet: updatedInfo.diet }),
        ...(updatedInfo.exercise && { exercise: updatedInfo.exercise }),
        ...(updatedInfo.sleep && { sleep: updatedInfo.sleep }),
        ...(updatedInfo.stress && { stress: updatedInfo.stress }),
        ...(updatedInfo.waterIntake && { waterIntake: updatedInfo.waterIntake }),
      },
      goals: {
        ...(updatedInfo.goal && { primary: updatedInfo.goal }),
        ...(updatedInfo.motivation && { motivation: updatedInfo.motivation }),
      },
      patterns: [],
    };

    await this.contextManager.updateContext(currentState.agiSessionId, {
      newAnswer: {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        answer: userAnswer
      },
      extractedInfo: extractedInfoForAGI,
      emotionalTone
    });

    // 7. AGI: Detect patterns
    const recentAnswers = this.contextManager.getRecentAnswers(agiContext);
    const detectedPatterns = await this.patternDetector.detectPatterns(
      recentAnswers,
      agiContext.longTermMemory,
      emotionalTone
    );

    // 8. AGI: Generate insights
    const agiInsights = await this.insightGenerator.generateInsightsForAnswer(
      currentQuestion.id,
      currentQuestion.question,
      userAnswer,
      {
        extractedInfo: agiContext.longTermMemory,
        recentAnswers,
        emotionalTone,
        detectedPatterns
      }
    );

    // 9. AGI: Generate thinking insight for UI
    const thinkingInsight = this.insightGenerator.generateThinkingInsight(currentQuestion.id);

    // Generar comentario empático
    const comment = await this.generateEmpathicComment(
      currentQuestion.question,
      userAnswer,
      currentState.language
    );

    // 4. DYNAMIC QUESTION: Get next question dynamically based on context
    const nextQuestion = await this.getNextDynamicQuestion({
      ...currentState,
      collectedInfo: updatedInfo,
      diagnosticMode: newMode,
      currentEmotionalTone: emotionalTone
    });

    // 5. Check if we should continue based on engagement and question count
    const shouldContinue = this.questionManager.shouldContinue(
      newMode,
      currentState.askedQuestionIds.length,
      newEngagementScore.total
    );

    // Get progress message if any
    const progressMessage = this.questionManager.getProgressMessage(
      newMode,
      currentState.askedQuestionIds.length,
      currentState.language
    );

    if (nextQuestion && shouldContinue) {
      // Continue with more questions
      const newState: DiagnosticFlowState = {
        ...currentState,
        currentQuestionIndex: currentState.currentQuestionIndex + 1,
        currentBlockId: nextQuestion.blockId,
        answers: newAnswers,
        collectedInfo: updatedInfo,
        imageAnalysis,

        // Update engagement tracking
        engagementScore: newEngagementScore,
        diagnosticMode: newMode,
        questionStartTime: Date.now(), // Start timer for next question
        askedQuestionIds: [...currentState.askedQuestionIds, nextQuestion.id],
        previousEngagementScore: currentState.engagementScore.total,

        // Update emotional tone
        currentEmotionalTone: emotionalTone,
      };

      // Build message: comment + progress + transition + next question
      let fullMessage = comment;

      // Add progress message if any
      if (progressMessage) {
        fullMessage += `\n\n${progressMessage}`;
      }

      // Add block transition if changed
      if (nextQuestion.blockId !== currentQuestion.blockId) {
        const blockTransition = this.generateBlockTransition(nextQuestion.blockId, newState);
        fullMessage += `\n\n${blockTransition}`;
      }

      fullMessage += `\n\n${nextQuestion.question}`;

      return {
        message: fullMessage,
        newState,
        questionDetails: nextQuestion.questionDetails,
        type: 'comment',
        agiInsights,
        patternConnections: detectedPatterns,
        metaReasoning: { thought: thinkingInsight, explanation: '', strategy: '' },
      };
    } else {
      // Diagnosis complete - generate final diagnosis
      const userName = currentState.userName || 'amigo/a';

      console.log(`✅ Diagnosis complete! Asked ${currentState.askedQuestionIds.length} questions in ${newMode} mode`);
      console.log(`📊 Final engagement score: ${newEngagementScore.total}`);

      // Generar el diagnóstico
      const diagnosis = await this.generateDiagnosis(
        currentState.userName!,
        newAnswers,
        imageAnalysis,
        currentState.language,
        updatedInfo
      );

      const newState: DiagnosticFlowState = {
        ...currentState,
        step: 'diagnosis_ready',
        answers: newAnswers,
        collectedInfo: updatedInfo,
        imageAnalysis,
        diagnosisContent: diagnosis,

        // Final engagement tracking
        engagementScore: newEngagementScore,
        diagnosticMode: newMode,
        questionStartTime: Date.now(),
        askedQuestionIds: currentState.askedQuestionIds,
        previousEngagementScore: currentState.engagementScore.total,
      };

      // Mostrar mensaje de venta con los beneficios (NO el diagnóstico completo)
      const readyMessage = DIAGNOSIS_READY_MESSAGE[currentState.language as 'es' | 'en'].replace('{userName}', userName);
      const fullMessage = `${comment}\n\n${readyMessage}`;

      return {
        message: fullMessage,
        newState,
        type: 'diagnosis_ready',
        agiInsights,
        patternConnections: detectedPatterns,
        metaReasoning: { thought: thinkingInsight, explanation: '', strategy: '' },
      };
    }
  }

  /**
   * Maneja mensajes después de completar el flujo
   */
  private async handleCompletedFlow(
    currentState: DiagnosticFlowState
  ): Promise<FlowResponse> {
    const newState: DiagnosticFlowState = {
      ...currentState,
      step: 'completed',
    };

    const defaultReply =
      currentState.language === 'es'
        ? 'Para seguir profundizando en tu caso y obtener un plan personalizado, necesitas dar el siguiente paso. ¡Estoy aquí para ayudarte a empezar!'
        : "To continue delving into your case and get a personalized plan, you need to take the next step. I'm here to help you get started!";

    return {
      message: defaultReply,
      newState,
      type: 'completed',
    };
  }

  /**
   * Detecta el tono emocional de una respuesta
   */
  private async detectEmotionalTone(text: string): Promise<EmotionalTone> {
    try {
      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [
          {
            role: 'system',
            content: 'Detecta el tono emocional de este texto y responde SOLO con una palabra: hopeful, frustrated, resigned, enthusiastic, anxious, neutral, overwhelmed.'
          },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 10,
      });

      const tone = response.choices[0]?.message?.content?.trim().toLowerCase() as EmotionalTone;
      return ['hopeful', 'frustrated', 'resigned', 'enthusiastic', 'anxious', 'neutral', 'overwhelmed'].includes(tone)
        ? tone
        : 'neutral';
    } catch (error) {
      console.error('Error detecting emotional tone:', error);
      return 'neutral';
    }
  }

  /**
   * Detecta el idioma del texto
   */
  private async detectLanguage(text: string): Promise<Language> {
    try {
      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [
          {
            role: 'system',
            content: 'Detecta el idioma del texto y responde SOLO con el código: "es" para español o "en" para inglés.',
          },
          { role: 'user', content: text },
        ],
        temperature: 0,
        max_tokens: 5,
      });

      const langCode = response.choices[0]?.message?.content?.trim().toLowerCase();
      return langCode === 'en' ? 'en' : 'es';
    } catch (error) {
      console.error('Error detecting language:', error);
      return 'es';
    }
  }

  /**
   * Extrae el nombre del usuario
   */
  private async extractName(text: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [
          {
            role: 'system',
            content:
              'Extrae SOLO el nombre de la persona del texto. Responde ÚNICAMENTE con el nombre, sin explicaciones.',
          },
          { role: 'user', content: text },
        ],
        temperature: 0,
        max_tokens: 20,
      });

      const name = response.choices[0]?.message?.content?.trim();
      if (!name || name.length === 0) {
        return 'Usuario';
      }
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    } catch (error) {
      console.error('Error extracting name:', error);
      return 'Usuario';
    }
  }

  /**
   * Genera la etimología del nombre
   */
  private async generateNameEtymology(name: string, language: Language): Promise<string> {
    if (!name || name.toLowerCase() === 'usuario' || name.toLowerCase() === 'user') {
      return '';
    }

    try {
      const prompt =
        language === 'es'
          ? `Genera un comentario breve (máximo 15 palabras) sobre el significado o etimología del nombre "${name}". Sé breve y positivo.`
          : `Generate a brief comment (maximum 15 words) about the meaning or etymology of the name "${name}". Be brief and positive.`;

      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 50,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('Error generating name etymology:', error);
      return '';
    }
  }

  /**
   * Valida la respuesta del usuario
   */
  private async validateAnswer(
    question: string,
    answer: string,
    language: Language
  ): Promise<{ isValid: boolean; feedback: string }> {
    // Validación básica: rechazar solo respuestas obviamente inválidas
    const trimmedAnswer = answer.trim();

    // Aceptar cualquier respuesta con al menos 1 carácter
    if (trimmedAnswer.length === 0) {
      return {
        isValid: false,
        feedback: language === 'es'
          ? 'Por favor, escribe una respuesta.'
          : 'Please write an answer.',
      };
    }

    // Rechazar solo respuestas sin sentido o spam
    if (trimmedAnswer.length < 2 && !/[a-zA-Z0-9]/.test(trimmedAnswer)) {
      return {
        isValid: false,
        feedback: language === 'es'
          ? 'Por favor, proporciona una respuesta válida.'
          : 'Please provide a valid answer.',
      };
    }

    // Todas las demás respuestas son válidas (incluyendo "Bien", "Mal", "Sí", "No", etc.)
    return { isValid: true, feedback: '' };
  }

  /**
   * Genera un comentario empático basado en la respuesta
   */
  private async generateEmpathicComment(
    question: string,
    answer: string,
    language: Language
  ): Promise<string> {
    try {
      const prompt =
        language === 'es'
          ? `Genera un comentario corto y empático basado en esta respuesta del cuestionario.

Pregunta: "${question}"
Respuesta: "${answer}"

REQUISITOS:
- Máximo 1-2 frases
- NO usar emojis
- NO hacer preguntas adicionales
- Ser empático y alentador
- Tono profesional pero cálido`
          : `Generate a short empathetic comment based on this questionnaire response.

Question: "${question}"
Answer: "${answer}"

REQUIREMENTS:
- Maximum 1-2 sentences
- DO NOT use emojis
- DO NOT ask additional questions
- Be empathetic and encouraging
- Professional but warm tone`;

      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 80,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('Error generating empathic comment:', error);
      return language === 'es'
        ? 'Gracias por tu respuesta. Sigamos adelante.'
        : "Thank you for your answer. Let's continue.";
    }
  }

  /**
   * Genera el diagnóstico final
   */
  private async generateDiagnosis(
    userName: string,
    answers: Array<{ question: string; answer: string }>,
    imageAnalysis: string | null,
    language: Language,
    collectedInfo?: CollectedInfo
  ): Promise<string> {
    try {
      // Formatear respuestas
      const answersText = answers
        .map(
          (qa, index) =>
            `${index + 1}. ${qa.question.replace(/^[👋🤔🎯⏰💊🍽️😣💧🏃😴😰🩺💊🚻🌟🔥💬]\s*\d+\.\s*/, '')}\n   Respuesta: ${qa.answer}`
        )
        .join('\n\n');

      const imageSection = imageAnalysis ? `\n\n📸 Análisis de imagen:\n${imageAnalysis}` : '';

      // Add collected info context
      const contextSection = collectedInfo ? `

**INFORMACIÓN RECOPILADA:**
- Edad: ${collectedInfo.age || 'No especificada'}
- Ocupación: ${collectedInfo.occupation || 'No especificada'} (${collectedInfo.occupationType || 'default'})
- Problema principal: ${collectedInfo.mainProblem || 'No especificado'}
- Duración: ${collectedInfo.duration || 'No especificada'}
- Alimentación: ${collectedInfo.diet || 'No especificada'}
- Alimentos problemáticos: ${collectedInfo.badFoods?.join(', ') || 'Ninguno mencionado'}
- Agua: ${collectedInfo.waterIntake || 'No especificada'}
- Ejercicio: ${collectedInfo.exercise || 'No especificado'}
- Sueño: ${collectedInfo.sleep || 'No especificado'}
- Estrés: ${collectedInfo.stress || 'No especificado'}
- Condiciones médicas: ${collectedInfo.medicalConditions?.join(', ') || 'Ninguna'}
- Medicamentos: ${collectedInfo.medications?.join(', ') || 'Ninguno'}
- Objetivo: ${collectedInfo.goal || 'No especificado'}
- Motivación: ${collectedInfo.motivation ? `${collectedInfo.motivation}/10` : 'No especificada'}` : '';

      const prompt =
        language === 'es'
          ? `Genera un diagnóstico de SALUD DIGESTIVA personalizado para ${userName} basado en sus respuestas al cuestionario.

**IMPORTANTE:** Este es un diagnóstico de PROBLEMAS DIGESTIVOS/INTESTINALES. Enfócate SOLO en:
- Hinchazón abdominal y distensión
- SIBO (sobrecrecimiento bacteriano intestinal)
- Disbiosis y microbiota intestinal
- Intolerancias alimentarias (gluten, lácteos, FODMAPs)
- Problemas de gases, digestiones lentas
- Estreñimiento o diarrea
- Conexión intestino-cerebro

RESPUESTAS DEL CUESTIONARIO:
${answersText}${imageSection}${contextSection}

INSTRUCCIONES:
1. Saludo personalizado con el nombre
2. 3-4 puntos clave TODOS relacionados con SALUD DIGESTIVA/INTESTINAL
   - Cada punto debe tener emoji + título en negrita
   - Conecta los síntomas con problemas digestivos específicos (SIBO, intolerancias, disbiosis)
   - Si mencionó alimentos específicos, relaciónalo con posibles intolerancias o SIBO
3. Conclusión conectando todos los puntos digestivos
4. Párrafo sobre por qué necesita un enfoque integral de salud digestiva
5. Cierre motivador enfocado en recuperar su salud intestinal

REQUISITOS:
- Análisis holístico de SÍNTOMAS DIGESTIVOS
- Lenguaje empático y alentador
- Evitar jerga médica compleja
- 300-450 palabras
- NO dar planes de acción detallados
- NO mencionar medicamentos específicos
- CRÍTICO: TODO debe estar relacionado con el sistema digestivo

EJEMPLOS DE TÍTULOS DE PUNTOS CLAVE:
- 🦠 Posible Sobrecrecimiento Bacteriano (SIBO)
- 🌾 Sensibilidad al Gluten Sin Diagnosticar
- 💨 Fermentación Intestinal Excesiva
- 🔥 Inflamación Intestinal Crónica
- 🧠 Eje Intestino-Cerebro Desbalanceado
- 🥛 Intolerancia a Lácteos
- ⏰ Tránsito Intestinal Lento`
          : `Generate a personalized DIGESTIVE HEALTH diagnosis for ${userName} based on their questionnaire responses.

**IMPORTANT:** This is a DIGESTIVE/INTESTINAL PROBLEMS diagnosis. Focus ONLY on:
- Abdominal bloating and distension
- SIBO (Small Intestinal Bacterial Overgrowth)
- Dysbiosis and gut microbiota
- Food intolerances (gluten, dairy, FODMAPs)
- Gas problems, slow digestion
- Constipation or diarrhea
- Gut-brain connection

QUESTIONNAIRE RESPONSES:
${answersText}${imageSection}${contextSection}

INSTRUCTIONS:
1. Personalized greeting with name
2. 3-4 key points ALL related to DIGESTIVE/INTESTINAL HEALTH
   - Each point must have emoji + bold title
   - Connect symptoms with specific digestive issues (SIBO, intolerances, dysbiosis)
   - If specific foods mentioned, relate to possible intolerances or SIBO
3. Conclusion connecting all digestive points
4. Paragraph about why they need a comprehensive digestive health approach
5. Motivational closing focused on recovering intestinal health

REQUIREMENTS:
- Holistic analysis of DIGESTIVE SYMPTOMS
- Empathetic and encouraging language
- Avoid complex medical jargon
- 300-450 words
- DO NOT give detailed action plans
- DO NOT mention specific medications
- CRITICAL: EVERYTHING must be related to the digestive system

EXAMPLES OF KEY POINT TITLES:
- 🦠 Possible Bacterial Overgrowth (SIBO)
- 🌾 Undiagnosed Gluten Sensitivity
- 💨 Excessive Intestinal Fermentation
- 🔥 Chronic Intestinal Inflammation
- 🧠 Gut-Brain Axis Imbalance
- 🥛 Dairy Intolerance
- ⏰ Slow Intestinal Transit`;

      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [
          { role: 'system', content: ASSISTANT_INSTRUCTIONS },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('Error generating diagnosis:', error);
      return language === 'es'
        ? 'Lo siento, hubo un error al generar tu diagnóstico. Por favor, intenta nuevamente.'
        : 'Sorry, there was an error generating your diagnosis. Please try again.';
    }
  }
}
