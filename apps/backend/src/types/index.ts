// Basic types
export type Language = 'es' | 'en';
export type DiagnosticType = 'chat' | 'quiz';
export type SessionStep = 'intro' | 'choice' | 'questions' | 'diagnosis';

// Shared types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionData {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  language: Language;
  diagnosticType?: DiagnosticType;
  step: SessionStep;
  imageAnalysisText?: string;
  assistantId?: string;
  threadId?: string;
  startTime: Date;
  completionTime?: Date;
  expiresAt: Date;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

export interface QuestionData {
  id: number;
  question: string;
  emoji?: string;
  questionDetails?: string;
  options: string[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  emoji: string;
  type: 'single' | 'multiple';
  options: QuizOption[];
}

export interface QuizOption {
  value: string;
  label: string;
  points: number;
}

export interface QuizAnswer {
  id: string;
  sessionId: string;
  questionId: number;
  answer: string;
  points: number;
  createdAt: Date;
  empathicComment?: string;
}

export interface DiagnosisResponse {
  id: string;
  sessionId: string;
  content: string;
  totalScore?: number;
  scorePercentage?: number;
  pdfGenerated: boolean;
  createdAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateSessionRequest {
  userName?: string;
  userEmail?: string;
  language?: Language;
  wordpressLeadId?: string;
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
  language: Language;
}

export interface SubmitQuizAnswerRequest {
  sessionId: string;
  questionId: number;
  answer: string;
}

export interface UploadImageRequest {
  sessionId: string;
  image: File | Uint8Array;
}

// Backend-specific types
export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  API_URL: string;
  DATABASE_URL: string;
  REDIS_URL?: string | undefined;
  OPENAI_API_KEY: string;
  OPENAI_ASSISTANT_ID?: string | undefined;
  OPENAI_MODEL: string;
  USE_NEW_CONVERSATIONAL_SYSTEM: boolean;
  CORS_ORIGIN: string;
  SESSION_SECRET: string;
  UPLOAD_MAX_SIZE: string;
  ALLOWED_ORIGINS: string;
}

export interface AssistantConfig {
  id?: string;
  model: string;
  instructions: string;
  tools?: Array<{ type: string }>;
}

export interface ValidationResult {
  isValid: boolean;
  feedback?: string;
}

export interface DiagnosisPrompt {
  userName?: string;
  answers: string;
  imageAnalysis?: string;
  language: Language;
}

// ============================================================
// NEW: Conversational Assistant System Types
// ============================================================

// Decision types for the DecisionEngine
export type DecisionType = 'follow-up' | 'pivot' | 'clarify' | 'callback' | 'continue' | 'conclude';

// Conversation phases
export type ConversationPhase = 'introduction' | 'exploration' | 'deepening' | 'conclusion';

// Emotional tone
export type EmotionalTone = 'hopeful' | 'frustrated' | 'resigned' | 'enthusiastic' | 'anxious' | 'neutral' | 'overwhelmed';

// Key moment types
export type KeyMomentType =
  | 'repetition'        // User repeats same concern multiple times
  | 'contradiction'     // User contradicts previous statement
  | 'breakthrough'      // User reveals critical information
  | 'vulnerability'     // User shows emotional vulnerability
  | 'resistance'        // User resists or deflects
  | 'insight';          // User has self-realization

// ConversationalMemory structure
export interface ConversationalMemory {
  sessionId: string;

  // Factual information
  factualInfo: {
    demographics?: {
      age?: number;
      occupation?: string;
      occupationType?: string;
    };
    health?: {
      mainProblem?: string;
      duration?: string;
      symptoms?: string[];
      triggers?: string[];
      medicalConditions?: string[];
      medications?: string[];
    };
    lifestyle?: {
      diet?: string;
      exercise?: string;
      sleep?: string;
      stress?: string;
      waterIntake?: string;
    };
    goals?: {
      primary?: string;
      motivation?: number;
    };
  };

  // Emotional markers
  emotionalMarkers: Array<{
    turn: number;
    emotion: EmotionalTone;
    intensity: number; // 1-10
    trigger?: string;
    quote?: string;
  }>;

  // Key moments
  keyMoments: Array<KeyMoment>;

  // User communication style
  userStyle: {
    formality: number; // 1-10 (1=very casual, 10=very formal)
    verbosity: number; // 1-10 (1=short answers, 10=long detailed answers)
    emotionLevel: number; // 1-10
  };

  // Current hypothesis
  currentHypothesis: DiagnosisHypothesis;

  // Conversation metadata
  conversationPhase: ConversationPhase;
  topicsExplored: string[];
  turnCount: number;

  createdAt: Date;
  updatedAt: Date;
}

// Key moment in conversation
export interface KeyMoment {
  turn: number;
  type: KeyMomentType;
  content: string;
  significance: string; // Why this moment is important
  emotionalContext?: EmotionalTone;
  followUpAction?: string; // What we should do about it
}

// Diagnosis hypothesis (built progressively)
export interface DiagnosisHypothesis {
  primary: string; // Main hypothesis (e.g., "SIBO + stress-related IBS")
  confidence: number; // 0-100
  evidence: string[]; // Evidence supporting this hypothesis
  needsConfirmation: string[]; // What still needs to be confirmed
  alternativeHypotheses?: Array<{
    hypothesis: string;
    confidence: number;
    reason: string;
  }>;
}

// Decision from DecisionEngine
export interface ConversationalDecision {
  type: DecisionType;
  reasoning: string;
  suggestedQuestion?: string;
  topicToExplore?: string;
  keyMomentToAddress?: number; // Turn number of key moment
}

// Context for generating dynamic instructions
export interface InstructionContext {
  memory: ConversationalMemory;
  lastUserMessage: string;
  decision: ConversationalDecision;
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// Response from ConversationalAssistant
export interface ConversationalResponse {
  message: string;
  updatedMemory: ConversationalMemory;
  decision: ConversationalDecision;
  keyMomentsDetected?: KeyMoment[];
  shouldConclude: boolean; // Whether we have enough info for diagnosis
}

// Configuration for the conversational system
export interface ConversationalConfig {
  useNewSystem: boolean; // Feature flag
  model: string; // GPT-4o or GPT-5
  minTurnsBeforeConclusion: number;
  maxTurnsBeforeConclusion: number;
  keyMomentDetectionEnabled: boolean;
  progressiveDiagnosisEnabled: boolean;
}