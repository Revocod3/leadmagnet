// Re-export shared types
export type {
  Language,
  DiagnosticType,
  SessionStep,
  User,
  SessionData,
  ChatMessage,
  QuestionData,
  QuizQuestion,
  QuizOption,
  QuizAnswer,
  DiagnosisResponse,
  ApiResponse,
  CreateSessionRequest,
  SendMessageRequest,
  SubmitQuizAnswerRequest,
  UploadImageRequest,
} from '@ovp/shared';

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