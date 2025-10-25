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
  REDIS_URL?: string;
  OPENAI_API_KEY: string;
  OPENAI_ASSISTANT_ID?: string;
  OPENAI_MODEL: string;
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