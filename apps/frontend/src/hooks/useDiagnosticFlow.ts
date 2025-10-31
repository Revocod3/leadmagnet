import { useState, useCallback, useEffect } from 'react';
import { diagnosticContent, type DiagnosticQuestion } from '../constants/diagnosticQuestions';
import { useSessionStore } from '../stores/sessionStore';
import { apiClient } from '../services/api';

export type FlowStep =
  | 'initial'
  | 'name_extracted'
  | 'greeting'
  | 'asking_questions'
  | 'generating_diagnosis'
  | 'diagnosis_ready'
  | 'completed';

export interface FlowMessage {
  role: 'user' | 'assistant';
  content: string;
  type?:
  | 'welcome'
  | 'greeting'
  | 'question'
  | 'comment'
  | 'diagnosis_ready'
  | 'validation_error'
  | 'completed';
  question?: DiagnosticQuestion;
  timestamp?: string;
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

  // Poll for diagnosis when in generating state
  useEffect(() => {
    if (state.step !== 'generating_diagnosis') return;

    const sessionStore = useSessionStore.getState();
    const sessionId = sessionStore.session?.id;
    if (!sessionId) return;

    const pollInterval = setInterval(async () => {
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
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [state.step]);

  // Initialize chat: try to restore history; if empty, request welcome/init
  const initialize = useCallback(async () => {
    const sessionStore = useSessionStore.getState();
    const sessionId = sessionStore.session?.id;
    const userName = sessionStore.session?.userName;

    if (!sessionId) {
      console.error('No session ID available');
      return;
    }

    // Evitar múltiples inicializaciones
    if (isInitialized) {
      console.log('Already initialized, skipping');
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
      // 1) Try to restore chat history first
      try {
        const history = await apiClient.getChatHistory(sessionId);
        if (history && history.length > 0) {
          setMessages(
            history.map((m) => ({
              role: m.role === 'system' ? 'assistant' : (m.role as 'user' | 'assistant'),
              content: m.content,
              timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
            }))
          );
          return; // History restored; no need to call init
        }
      } catch (historyErr) {
        console.warn('Could not restore chat history, will call init:', historyErr);
      }

      // 2) No history: call backend to initialize diagnostic flow with user name
      const data = await apiClient.initializeChat(sessionId, sessionStore.language);

      if (data) {
        console.log('✅ Mensaje de bienvenida recibido del backend:', data.message.substring(0, 50));
        // Add welcome message from backend (already personalized with name)
        setMessages([
          {
            role: 'assistant',
            content: data.message,
            type: 'welcome',
            timestamp: new Date().toISOString(),
          },
        ]);

        // Update state with backend state
        if (data.state) {
          setState((prev) => ({
            ...prev,
            step: data.state.step,
            currentQuestionIndex: data.state.currentQuestionIndex,
            language: data.state.language,
          }));
        }
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
        },
      ]);
    }
  }, [isInitialized]);

  // Process user message based on current step
  const processMessage = useCallback(
    async (userMessage: string, imageFile?: File) => {
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
        // Add user message to UI immediately
        const userMsg: FlowMessage = {
          role: 'user',
          content: userMessage,
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
            console.log('✅ Diagnosis content saved to state');
          }

          return newState;
        });

        // Handle welcome animation
        if (metadata.requiresWelcomeAnimation && metadata.etymology) {
          setEtymology(metadata.etymology);
          setShowWelcome(true);
          // Don't add message yet, will be added after welcome animation
          return;
        }

        // Handle diagnosis generation - show special state
        if (isGeneratingDiagnosis) {
          // First show a quick acknowledgment
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: response.content,
                type: 'comment',
                timestamp: new Date().toISOString(),
              },
            ]);
          }, 500);

          // Then show generating state
          setTimeout(() => {
            setState((prev) => ({ ...prev, step: 'generating_diagnosis' }));
          }, 1200);

          // Finally, add the diagnosis after a realistic delay
          setTimeout(() => {
            if (metadata.diagnosisContent) {
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: metadata.diagnosisContent,
                  type: 'diagnosis_ready',
                  timestamp: new Date().toISOString(),
                },
              ]);
              setState((prev) => ({ ...prev, step: 'diagnosis_ready' }));
            }
            setIsProcessing(false);
          }, 8500); // Match the total duration of DiagnosisGeneratingIndicator

          return; // Don't execute the normal flow
        }

        // Add assistant message to UI with a small delay to simulate typing
        setTimeout(() => {
          console.log('➕ Agregando mensaje del asistente:', response.content.substring(0, 50));
          const assistantMsg: FlowMessage = {
            role: 'assistant',
            content: response.content,
            type: metadata.type,
            timestamp: new Date().toISOString(),
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
