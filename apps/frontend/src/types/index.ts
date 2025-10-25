// Basic types
export type Language = 'es' | 'en';
export type DiagnosticType = 'chat' | 'quiz';
export type SessionStep = 'intro' | 'choice' | 'questions' | 'diagnosis';

export interface User {
  name: string;
  email: string;
}

export interface SessionData {
  id: string;
  user?: User;
  userName?: string;
  userEmail?: string;
  language: Language;
  type?: DiagnosticType;
  step?: string;
  startTime?: string;
  completionTime?: string;
  createdAt?: string;
  expiresAt?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  createdAt?: string;
}

export interface QuestionData {
  id: string;
  question: string;
  type: 'text' | 'multipleChoice' | 'image';
  options?: string[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

export interface QuizOption {
  value: string;
  label: string;
  score: number;
}

export interface QuizAnswer {
  questionId: string;
  answer: string;
  score: number;
  points?: number;
}

export interface DiagnosisResponse {
  diagnosis: string;
  recommendations: string[];
  score?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateSessionRequest {
  language?: Language;
  user?: User;
  userName?: string;
  userEmail?: string;
  wordpressLeadId?: string;
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
  language?: Language;
}

export interface SubmitQuizAnswerRequest {
  sessionId: string;
  questionId: string;
  answer: string;
}

export interface UploadImageRequest {
  sessionId: string;
  image: File | string;
}

// Frontend-specific types
export interface UIState {
  isLoading: boolean;
  error: string | null;
  currentScreen: 'intro' | 'chat' | 'quiz' | 'diagnosis' | 'results';
}

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  sessionId: string | null;
}

export interface QuizState {
  currentQuestion: number;
  answers: Record<number, string>;
  totalScore: number;
  isCompleted: boolean;
}

export interface SessionState {
  session: SessionData | null;
  user: User | null;
  language: Language;
}

export interface AppState extends UIState, ChatState, QuizState, SessionState { }

// Component props types
export interface MessageBubbleProps {
  message: ChatMessage;
  isUser: boolean;
}

export interface QuestionCardProps {
  question: QuizQuestion;
  onAnswer: (answer: string) => void;
  selectedAnswer?: string;
}

export interface ProgressBarProps {
  current: number;
  total: number;
  showPercentage?: boolean;
}

// API client types
export interface ApiClient {
  createSession: (data: CreateSessionRequest) => Promise<ApiResponse<SessionData>>;
  sendMessage: (data: SendMessageRequest) => Promise<ApiResponse<ChatMessage>>;
  submitQuizAnswer: (data: SubmitQuizAnswerRequest) => Promise<ApiResponse<QuizAnswer>>;
  uploadImage: (data: UploadImageRequest) => Promise<ApiResponse<{ analysis: string }>>;
  getDiagnosis: (sessionId: string) => Promise<ApiResponse<DiagnosisResponse>>;
}