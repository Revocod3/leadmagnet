// packages/shared/src/types/index.ts

export type Language = 'es' | 'en';
export type DiagnosticType = 'chat' | 'quiz';
export type SessionStep =
  | 'initial'
  | 'name_question_sent'
  | 'asking_questions'
  | 'pdf_question_sent'
  | 'cta_sent';

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Session types
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

// Chat types
export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

// Quiz types
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

// Diagnosis types
export interface DiagnosisResponse {
  id: string;
  sessionId: string;
  content: string;
  totalScore?: number;
  scorePercentage?: number;
  pdfGenerated: boolean;
  createdAt: Date;
}

// API types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Request types
export interface CreateSessionRequest {
  userName?: string;
  userEmail?: string;
  language?: Language;
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

// Validation types
export interface ValidationResult {
  isValid: boolean;
  feedback?: string;
}