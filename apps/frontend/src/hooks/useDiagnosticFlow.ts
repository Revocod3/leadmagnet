import { useState, useCallback, useEffect } from 'react';
import { diagnosticContent, type DiagnosticQuestion } from '../constants/diagnosticQuestions';
import { useSessionStore } from '../stores/sessionStore';
import { useChatStore } from '../stores/chatStore';
import { apiClient } from '../services/api';
import { DIAGNOSTIC_FLOW } from '../config/diagnostic-flow-config';

export type FlowStep =
  | 'initial'
  | 'greeting'
  | 'asking_questions'
  | 'generating_diagnosis'
  | 'diagnosis_ready'
  | 'completed';

export interface FlowMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string; // URL de imagen adjunta al mensaje
  type?:
  | 'welcome'
  | 'greeting'
  | 'question'
  | 'comment'
  | 'diagnosis_ready'
  | 'closing_cta'
  | 'validation_error'
  | 'completed'
  | 'limit_exceeded';
  question?: DiagnosticQuestion;
  timestamp?: string;
  isNew?: boolean; // True if message just arrived, should animate
}

export interface DiagnosticState {
  step: FlowStep;
  currentQuestionIndex: number;
  userName: string;
  userEmail: string;
  language: 'es' | 'en';
  answers: Array<{ question: string; answer: string }>;
  imageAnalysis: string | null;
  diagnosisContent: string | null;
}

export const useDiagnosticFlow = () => {
  const [state, setState] = useState<DiagnosticState>({
    step: 'initial',
    currentQuestionIndex: 0,
    userName: '',
    userEmail: '',
    language: 'es',
    answers: [],
    imageAnalysis: null,
    diagnosisContent: null,
  });

  const [messages, setMessages] = useState<FlowMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [etymology, setEtymology] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Auto-save messages to localStorage (para poder restaurar si el usuario elige "Continuar")
  useEffect(() => {
    if (messages.length === 0) return;

    const sessionStore = useSessionStore.getState();
    const chatStore = useChatStore.getState();
    const sessionId = sessionStore.session?.id;

    if (!sessionId) return;

    // Save current messages to localStorage
    chatStore.setMessages(messages);
    chatStore.saveFreeChatState(sessionId, state.step === 'diagnosis_ready');

    // Mark diagnostic as completed if we reached that step
    if (state.step === 'diagnosis_ready') {
      chatStore.setDiagnosticCompleted(true);
    }
  }, [messages, state.step]);

  // NO persistir conversación - Ulises quiere que siempre empiece desde cero
  // El flujo diagnóstico gratuito NO se guarda en localStorage
  // Si el usuario cierra la pestaña y vuelve, empieza de nuevo

  // Poll for diagnosis when in generating state
  useEffect(() => {
    if (state.step !== 'generating_diagnosis') return;

    const sessionStore = useSessionStore.getState();
    const sessionId = sessionStore.session?.id;
    if (!sessionId) return;

    let pollCount = 0;
    const maxPolls = 30; // 30 polls * 2 seconds = 60 seconds max

    const pollInterval = setInterval(async () => {
      pollCount++;

      // Timeout after maxPolls - diagnosis generation failed or was interrupted
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        setState((prev) => ({ ...prev, step: 'asking_questions' }));
        setIsProcessing(false);
        return;
      }

      try {
        const diagnosisData = await apiClient.getConversationalDiagnosis(sessionId);

        if (diagnosisData.ready && diagnosisData.content) {
          // Diagnosis is ready! Add it to messages
          clearInterval(pollInterval);

          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: diagnosisData.content!,
              type: 'diagnosis_ready',
              timestamp: new Date().toISOString(),
              isNew: true,
            },
            {
              role: 'assistant',
              content: DIAGNOSTIC_FLOW.closingCTA.message,
              type: 'closing_cta',
              timestamp: new Date().toISOString(),
              isNew: true,
            },
          ]);

          setState((prev) => ({
            ...prev,
            step: 'diagnosis_ready',
            diagnosisContent: diagnosisData.content,
          }));

          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Error polling for diagnosis:', error);
        // If we get an error (e.g. 404), the diagnosis was never started
        // Reset to normal state
        clearInterval(pollInterval);
        setState((prev) => ({ ...prev, step: 'asking_questions' }));
        setIsProcessing(false);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [state.step]);

  // Initialize chat: try to restore history; if empty, request welcome/init
  const initialize = useCallback(async () => {
    const sessionStore = useSessionStore.getState();
    const chatStore = useChatStore.getState();
    const sessionId = sessionStore.session?.id;
    const userName = sessionStore.session?.userName;

    if (!sessionId) {
      console.error('No session ID available');
      return;
    }

    // Evitar múltiples inicializaciones
    if (isInitialized) {
      return;
    }

    setIsInitialized(true);

    // Update state with session info
    setState((prev) => ({
      ...prev,
      userName: userName || '',
      language: sessionStore.language,
    }));

    try {
      // 1) Try to restore from localStorage first (fastest)
      const restoredFromLocal = chatStore.restoreFreeChatState(sessionId);
      if (restoredFromLocal && chatStore.freeChatState.messages.length > 0) {
        // Mark all restored messages as not new (don't animate typewriter)
        const restoredMessages = (chatStore.freeChatState.messages as FlowMessage[]).map(m => ({
          ...m,
          isNew: false,
        }));
        setMessages(restoredMessages);

        // Check if diagnostic was already completed
        if (chatStore.freeChatState.diagnosticCompleted) {
          setState((prev) => ({ ...prev, step: 'diagnosis_ready' }));
        }
        return;
      }

      // 2) No localStorage: inicializar conversación desde el backend
      const welcomeMsg = await apiClient.initializeChat(sessionId, sessionStore.language);

      if (welcomeMsg && welcomeMsg.content) {
        // Add welcome message from backend (Clara V2)
        const welcomeMessages: FlowMessage[] = [
          {
            role: (welcomeMsg.role === 'system' ? 'assistant' : welcomeMsg.role) || 'assistant',
            content: welcomeMsg.content,
            type: 'welcome',
            timestamp: welcomeMsg.timestamp || new Date().toISOString(),
            isNew: true, // Animate new welcome message
          },
        ];
        setMessages(welcomeMessages);

        // Save to localStorage
        chatStore.setMessages(welcomeMessages);
        chatStore.saveFreeChatState(sessionId);
      }
    } catch (error) {
      console.error('Error initializing diagnostic:', error);
      // Fallback to local message
      const content = diagnosticContent[sessionStore.language];
      setMessages([
        {
          role: 'assistant',
          content: content.welcomeMessage,
          type: 'welcome',
          timestamp: new Date().toISOString(),
          isNew: true, // Animate fallback welcome message
        },
      ]);
    }
  }, [isInitialized]);

  // Process user message based on current step
  const processMessage = useCallback(
    async (userMessage: string, imageFile?: File, imageUrl?: string) => {
      if (isProcessing) return;
      setIsProcessing(true);

      const sessionStore = useSessionStore.getState();
      const sessionId = sessionStore.session?.id;

      if (!sessionId) {
        console.error('No session ID available');
        setIsProcessing(false);
        return;
      }

      try {
        // Add user message to UI immediately (with optional image)
        const userMsg: FlowMessage = {
          role: 'user',
          content: userMessage,
          ...(imageUrl && { imageUrl }), // Only include imageUrl if provided
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);

        // Send message to backend (with optional image file)
        const response: any = await apiClient.sendMessage(
          {
            sessionId,
            message: userMessage,
            language: state.language,
          },
          imageFile
        );

        // Extract metadata from response
        const metadata = response.metadata || {};

        // Check if we're about to generate diagnosis
        const isGeneratingDiagnosis = metadata.step === 'generating_diagnosis' ||
          metadata.type === 'generating_diagnosis';

        // Update state based on backend response
        setState((prev) => {
          const newState: DiagnosticState = {
            ...prev,
            step: metadata.step || prev.step,
            currentQuestionIndex: metadata.currentQuestionIndex ?? prev.currentQuestionIndex,
            userName: metadata.userName || prev.userName,
          };

          // CRÍTICO: Guardar diagnosisContent cuando el backend lo envía en metadata
          if (metadata.diagnosisContent) {
            newState.diagnosisContent = metadata.diagnosisContent;
          }

          return newState;
        });

        // Note: Welcome animation is now handled in App.tsx during initial flow
        // No longer needed here as it happens before chat initialization

        // Handle diagnosis generation - show special state
        if (isGeneratingDiagnosis) {
          // First show a quick acknowledgment message
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: response.content,
                type: 'comment',
                timestamp: new Date().toISOString(),
                isNew: true, // Animate new message with typewriter
              },
            ]);
          }, 400);

          // Change to generating state after message is added
          // The DiagnosisGeneratingIndicator will wait for typewriter to complete
          // due to isTypewriterComplete check in ChatContainer
          setTimeout(() => {
            setState((prev) => ({ ...prev, step: 'generating_diagnosis' }));
            setIsProcessing(false);
          }, 600);

          // El diagnóstico será agregado por el polling, no aquí
          // Esto evita duplicación

          return; // Don't execute the normal flow
        }

        // Add assistant message to UI with a small delay to simulate typing
        setTimeout(() => {
          const assistantMsg: FlowMessage = {
            role: 'assistant',
            content: response.content,
            type: metadata.type,
            timestamp: new Date().toISOString(),
            isNew: true, // Animate new assistant message
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setIsProcessing(false);
        }, 800);

        // If there's a next question, add it after a delay
        if (metadata.nextQuestion) {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: metadata.nextQuestion,
                type: 'question',
                timestamp: new Date().toISOString(),
                isNew: true, // Animate next question
              },
            ]);
          }, 1500);
        }

      } catch (error) {
        console.error('Error processing message:', error);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              state.language === 'es'
                ? 'Lo siento, hubo un error. Por favor, intenta de nuevo.'
                : 'Sorry, there was an error. Please try again.',
            timestamp: new Date().toISOString(),
            isNew: true, // Animate error message
          },
        ]);
        setIsProcessing(false);
      }
      // No finally block - setIsProcessing(false) is now called in the setTimeout
    },
    [state, isProcessing]
  );

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false);

    // Show greeting message and first question
    const content = diagnosticContent[state.language];
    const greeting = content.greeting.replace('{userName}', state.userName);
    const greetingWithEtymology = etymology ? `${greeting} ${etymology}` : greeting;

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: greetingWithEtymology,
        type: 'greeting',
        timestamp: new Date().toISOString(),
      },
    ]);

    // Send next question after a short delay
    const nextQuestion = content.diagnosticQuestions[1];
    if (nextQuestion) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: nextQuestion.question,
            type: 'question',
            question: nextQuestion,
            timestamp: new Date().toISOString(),
          },
        ]);
      }, 1000);
    }

    // Update state to asking_questions
    setState((prev) => ({
      ...prev,
      step: 'asking_questions',
      currentQuestionIndex: 1,
    }));
  }, [state.language, state.userName, etymology]);

  const reset = useCallback(() => {
    setState({
      step: 'initial',
      currentQuestionIndex: 0,
      userName: '',
      userEmail: '',
      language: 'es',
      answers: [],
      imageAnalysis: null,
      diagnosisContent: null,
    });
    setMessages([]);
    setShowWelcome(false);
    setEtymology('');
    initialize();
  }, [initialize]);

  return {
    messages,
    state,
    isProcessing,
    showWelcome,
    etymology,
    initialize,
    processMessage,
    handleWelcomeComplete,
    reset,
  };
};
