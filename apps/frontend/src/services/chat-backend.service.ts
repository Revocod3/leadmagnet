import { useState, useCallback } from 'react';
import type { ChatMessage, Language } from '../types';

// Configurar la base URL del API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Cliente API simple
const api = {
  async post<T>(endpoint: string, data: any): Promise<{ data: T }> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return { data: await response.json() };
  },

  async get<T>(endpoint: string): Promise<{ data: T }> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return { data: await response.json() };
  },
};

interface FlowMetadata {
  type: 'welcome' | 'greeting' | 'question' | 'comment' | 'validation_error' | 'diagnosis' | 'cta' | 'completed';
  step: string;
  currentQuestionIndex: number;
  nextQuestion?: string;
  questionDetails?: string;
  etymology?: string;
  requiresWelcomeAnimation?: boolean;
  userName?: string;
}

interface ChatResponse {
  success: boolean;
  data: ChatMessage & {
    metadata?: FlowMetadata;
  };
}

/**
 * Nuevo servicio de chat simplificado que solo se comunica con el backend
 * Ya no necesita la lógica de OpenAI ni el manejo del flujo diagnóstico
 */
export const chatService = {
  /**
   * Inicializa el flujo diagnóstico en el servidor
   */
  async initializeDiagnostic(sessionId: string, language: Language = 'es'): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/chat/init', {
      sessionId,
      language,
    });
    return response.data;
  },

  /**
   * Envía un mensaje del usuario al servidor
   */
  async sendMessage(
    sessionId: string,
    message: string,
    options?: {
      language?: Language;
      imageData?: { base64: string; mimeType: string };
    }
  ): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/chat', {
      sessionId,
      message,
      language: options?.language,
      imageData: options?.imageData,
    });
    return response.data;
  },

  /**
   * Obtiene el historial de mensajes de una sesión
   */
  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const response = await api.get<{ success: boolean; data: ChatMessage[] }>(
      `/chat/${sessionId}`
    );
    return response.data.data;
  },
};

/**
 * Hook simplificado para manejar el chat diagnóstico
 * Ya no necesita manejar el flujo ni llamar a OpenAI directamente
 */
export const useDiagnosticChat = () => {
  const [messages, setMessages] = useState<(ChatMessage & { metadata?: FlowMetadata })[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('initial');
  const [userName, setUserName] = useState<string>('');

  /**
   * Inicializar el chat
   */
  const initialize = useCallback(async (sessionId: string, language: Language = 'es') => {
    try {
      setIsProcessing(true);
      const response = await chatService.initializeDiagnostic(sessionId, language);

      if (response.success) {
        const msg: ChatMessage & { metadata?: FlowMetadata } = {
          role: 'assistant',
          content: response.data.content,
        };
        if (response.data.metadata) {
          msg.metadata = response.data.metadata;
        }
        setMessages([msg]);

        if (response.data.metadata) {
          setCurrentStep(response.data.metadata.step);
        }
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      // Manejar error
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Enviar mensaje del usuario
   */
  const sendMessage = useCallback(
    async (
      sessionId: string,
      message: string,
      imageData?: { base64: string; mimeType: string }
    ) => {
      if (isProcessing) return;

      try {
        setIsProcessing(true);

        // Agregar mensaje del usuario a la UI inmediatamente
        const userMessage: ChatMessage = {
          role: 'user',
          content: message,
        };
        setMessages((prev: (ChatMessage & { metadata?: FlowMetadata })[]) => [...prev, userMessage]);

        // Enviar al servidor
        const options: { imageData?: { base64: string; mimeType: string } } = {};
        if (imageData) {
          options.imageData = imageData;
        }

        const response = await chatService.sendMessage(sessionId, message, options);

        if (response.success && response.data) {
          const assistantMessage = response.data;
          const metadata = assistantMessage.metadata;

          // Manejar animación de bienvenida si es necesario
          if (metadata?.requiresWelcomeAnimation && metadata.userName) {
            setUserName(metadata.userName);
            setShowWelcomeAnimation(true);
            // La pregunta siguiente se agregará después de la animación
            return;
          }

          // Agregar respuesta del asistente
          setMessages((prev: (ChatMessage & { metadata?: FlowMetadata })[]) => [...prev, assistantMessage]);

          // Actualizar estado
          if (metadata) {
            setCurrentStep(metadata.step);
            if (metadata.userName) {
              setUserName(metadata.userName);
            }

            // Si hay siguiente pregunta, agregarla después de un delay
            if (metadata.nextQuestion) {
              setTimeout(() => {
                setMessages((prev: (ChatMessage & { metadata?: FlowMetadata })[]) => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: metadata.nextQuestion!,
                    metadata,
                  },
                ]);
              }, 1500);
            }
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages((prev: (ChatMessage & { metadata?: FlowMetadata })[]) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Lo siento, hubo un error. Por favor, intenta de nuevo.',
          },
        ]);
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing]
  );

  /**
   * Manejar completación de animación de bienvenida
   */
  const handleWelcomeComplete = useCallback(() => {
    setShowWelcomeAnimation(false);

    // El backend ya envió la siguiente pregunta en el metadata
    // Solo necesitamos continuar el flujo enviando un mensaje vacío
    // o simplemente esperar a que el usuario responda la siguiente pregunta
    // que ya debería estar en los mensajes
  }, []);

  /**
   * Cargar historial de chat
   */
  const loadHistory = useCallback(async (sessionId: string) => {
    try {
      setIsProcessing(true);
      const history = await chatService.getChatHistory(sessionId);
      setMessages(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    messages,
    isProcessing,
    showWelcomeAnimation,
    currentStep,
    userName,
    initialize,
    sendMessage,
    handleWelcomeComplete,
    loadHistory,
  };
};
