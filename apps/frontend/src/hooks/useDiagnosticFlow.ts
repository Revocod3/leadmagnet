import { useState, useCallback } from 'react';
import { diagnosticContent, type DiagnosticQuestion } from '../constants/diagnosticQuestions';
import { apiClient } from '../services/api';
import { useSessionStore } from '../stores/sessionStore';

export type FlowStep =
  | 'initial'
  | 'greeting'
  | 'asking_questions'
  | 'diagnosis'
  | 'pdf_question'
  | 'cta'
  | 'completed';

export interface FlowMessage {
  role: 'user' | 'assistant';
  content: string;
  type?:
  | 'welcome'
  | 'greeting'
  | 'question'
  | 'comment'
  | 'diagnosis'
  | 'validation_error'
  | 'cta';
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

  // Initialize chat with welcome message
  const initialize = useCallback(() => {
    const content = diagnosticContent[state.language];
    setMessages([
      {
        role: 'assistant',
        content: content.welcomeMessage,
        type: 'welcome',
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [state.language]);

  // Process user message based on current step
  const processMessage = useCallback(
    async (userMessage: string, imageData?: { base64: string; mimeType: string }) => {
      if (isProcessing) return;
      setIsProcessing(true);

      const content = diagnosticContent[state.language];

      try {
        // Add user message to chat
        const userMsg: FlowMessage = {
          role: 'user',
          content: userMessage,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);

        let assistantMessage: FlowMessage | null = null;
        let newState = { ...state };

        switch (state.step) {
          case 'initial': {
            // First message - extract name and language
            const detectedLang = await openaiService.detectLanguage(userMessage);
            newState.language = (detectedLang === 'en' ? 'en' : 'es') as 'es' | 'en';

            const extractedName = await openaiService.extractUserName(userMessage);
            newState.userName =
              extractedName.charAt(0).toUpperCase() + extractedName.slice(1).toLowerCase();

            // Extract email if present
            const emailMatch = userMessage.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
            if (emailMatch) {
              newState.userEmail = emailMatch[0];
            }

            // Generate greeting with etymology
            const etymologyRaw = await openaiService.generateNameEtymology(
              newState.userName,
              newState.language
            );
            const localContent = diagnosticContent[newState.language];
            let greeting = localContent.greeting.replace('{userName}', newState.userName);

            let etymologyText = '';
            if (etymologyRaw) {
              const etymologyClean = etymologyRaw.replace(/[.!?]$/, '').trim();
              etymologyText = `${localContent.didYouKnow}${etymologyClean}?`;
              greeting += ` ${etymologyText}`;
            }

            // Show welcome animation
            setEtymology(etymologyText);
            setShowWelcome(true);

            // Update state but don't show greeting message yet
            // The greeting will be shown after welcome animation completes
            newState.step = 'greeting';

            // Save first answer (name/age/occupation)
            const firstQuestion = content.diagnosticQuestions[0];
            if (firstQuestion) {
              newState.answers.push({
                question: firstQuestion.question,
                answer: userMessage,
              });
            }

            // Don't add assistant message here - it will be added after welcome animation
            // The welcome animation will show and then handleWelcomeComplete will show greeting + question

            break;
          }

          case 'asking_questions': {
            const currentQuestion =
              content.diagnosticQuestions[state.currentQuestionIndex];

            if (!currentQuestion) {
              console.error('No question found at index:', state.currentQuestionIndex);
              break;
            }

            // Validate response
            const validation = await openaiService.validateResponse(
              currentQuestion.question,
              userMessage,
              state.language
            );

            if (!validation.isValid) {
              // Invalid response - ask again with feedback
              assistantMessage = {
                role: 'assistant',
                content: validation.feedback,
                type: 'validation_error',
                timestamp: new Date().toISOString(),
              };

              // Re-send the same question
              setTimeout(() => {
                setMessages((prev) => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: currentQuestion.question,
                    type: 'question',
                    question: currentQuestion,
                    timestamp: new Date().toISOString(),
                  },
                ]);
              }, 1000);
            } else {
              // Valid response - save and continue
              newState.answers.push({
                question: currentQuestion.question,
                answer: userMessage,
              });

              // Handle image if on question 17
              if (state.currentQuestionIndex === 16 && imageData) {
                // Question 17 is the image question (index 16)
                // Image analysis would go here
                newState.imageAnalysis = 'Análisis de imagen pendiente de implementar';
              }

              // Generate contextual comment
              const comment = await openaiService.generateContextualComment(
                currentQuestion.question,
                userMessage,
                state.language
              );

              assistantMessage = {
                role: 'assistant',
                content: comment,
                type: 'comment',
                timestamp: new Date().toISOString(),
              };

              // Check if there are more questions
              const nextIndex = state.currentQuestionIndex + 1;
              if (nextIndex < content.diagnosticQuestions.length) {
                // More questions to ask
                newState.currentQuestionIndex = nextIndex;
                const nextQuestion = content.diagnosticQuestions[nextIndex];

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
                  }, 1500);
                }
              } else {
                // All questions answered - generate diagnosis
                newState.step = 'diagnosis';

                // Generate diagnosis
                const diagnosis = await openaiService.generateDiagnosis(
                  newState.userName,
                  newState.answers,
                  newState.imageAnalysis,
                  newState.language
                );
                newState.diagnosisContent = diagnosis;

                setTimeout(() => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: 'assistant',
                      content: diagnosis,
                      type: 'diagnosis',
                      timestamp: new Date().toISOString(),
                    },
                    {
                      role: 'assistant',
                      content: content.pdfQuestion,
                      type: 'question',
                      timestamp: new Date().toISOString(),
                    },
                  ]);
                }, 2000);

                newState.step = 'pdf_question';
              }
            }
            break;
          }

          case 'pdf_question': {
            // User responded to PDF question
            newState.step = 'cta';
            assistantMessage = {
              role: 'assistant',
              content: content.finalCta.mainText,
              type: 'cta',
              timestamp: new Date().toISOString(),
            };
            break;
          }

          case 'cta':
          case 'completed':
          default: {
            // After CTA, show default reply
            assistantMessage = {
              role: 'assistant',
              content: content.defaultReply.text,
              type: 'cta',
              timestamp: new Date().toISOString(),
            };
            newState.step = 'completed';
            break;
          }
        }

        // Update state
        setState(newState);

        // Add assistant message if there is one
        if (assistantMessage) {
          setMessages((prev) => [...prev, assistantMessage!]);
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
      } finally {
        setIsProcessing(false);
      }
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
