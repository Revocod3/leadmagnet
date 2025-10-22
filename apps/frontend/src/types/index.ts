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