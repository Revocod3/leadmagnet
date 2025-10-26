// apps/backend/src/types/agi.types.ts

export interface AGIContext {
  conversationId: string;
  userId: string;
  sessionStart: Date;
  shortTermMemory: MemoryItem[]; // Últimas 5 respuestas
  longTermMemory: ExtractedInfo;   // Todo lo aprendido
  emotionalState: EmotionalProfile;
  personalityProfile: PersonalityProfile;
}

export interface MemoryItem {
  questionId: number;
  question: string;
  answer: string;
  timestamp: Date;
  extractedInfo: Record<string, any>;
  emotionalTone: EmotionalTone;
}

export interface ExtractedInfo {
  demographics: {
    age?: number;
    occupation?: string;
    occupationType?: string;
  };
  health: {
    mainProblem?: string;
    duration?: string;
    medicalConditions?: string[];
    medications?: string[];
    badFoods?: string[]; // Alimentos problemáticos identificados
  };
  lifestyle: {
    diet?: string;
    exercise?: string;
    sleep?: string;
    stress?: string;
    waterIntake?: string;
  };
  goals: {
    primary?: string;
    motivation?: number; // 1-10
  };
  patterns: DetectedPattern[];
}

export interface DetectedPattern {
  type: 'consistency' | 'inconsistency' | 'correlation' | 'red_flag';
  description: string;
  relatedQuestions: number[];
  confidence: number; // 0-1
  insight: string;
}

export interface EmotionalProfile {
  currentTone: EmotionalTone;
  toneHistory: { tone: EmotionalTone; timestamp: Date }[];
  dominantEmotion: EmotionalTone;
}

export type EmotionalTone =
  | 'hopeful'
  | 'frustrated'
  | 'resigned'
  | 'enthusiastic'
  | 'anxious'
  | 'neutral'
  | 'overwhelmed';

export interface PersonalityProfile {
  formalityLevel: 'casual' | 'balanced' | 'professional';
  empathyLevel: 'high' | 'medium' | 'low';
  technicalLevel: 'simple' | 'moderate' | 'advanced';
  encouragementStyle: 'motivational' | 'realistic' | 'analytical';
}

export interface AGIInsight {
  type: InsightType;
  message: string;
  relatedTo?: number[]; // Question IDs
  priority: 'low' | 'medium' | 'high';
  shouldDisplay: boolean;
}

export type InsightType =
  | 'pattern_detected'
  | 'validation_positive'
  | 'suggestion'
  | 'connection'
  | 'encouragement'
  | 'clarification_needed'
  | 'meta_comment';

export interface MetaReasoning {
  thought: string; // Lo que "piensa" la AGI
  explanation: string; // Por qué hace lo que hace
  strategy: string; // Estrategia actual
}

export interface ProgressiveSummary {
  completionPercentage: number;
  currentPhase: string;
  keyPointsLearned: string[];
  nextFocus: string;
  suggestedCorrections?: string[];
}

// Extender FlowResponse para incluir campos AGI
export interface AGIEnhancedFlowResponse {
  message: string;
  newState: any; // DiagnosticFlowState

  // Campos existentes
  requiresWelcomeAnimation?: boolean;
  etymology?: string;
  nextQuestion?: string;
  questionDetails?: string | undefined;
  type?: string;

  // NUEVOS campos AGI
  agiInsights?: AGIInsight[];           // Insights para mostrar
  patternConnections?: DetectedPattern[]; // Patrones detectados
  metaReasoning?: MetaReasoning;        // Pensamiento visible
  emotionalResponse?: string;            // Respuesta emocional
  progressiveSummary?: ProgressiveSummary; // Resumen si aplica
  thinkingTime?: number;                 // Tiempo de "pensamiento" simulado
  clarificationRequest?: string;         // Si necesita clarificación
}