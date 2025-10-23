// apps/frontend/src/hooks/useChat.ts

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { useChatStore } from '../stores/chatStore';
import { useSessionStore } from '../stores/sessionStore';
import type { SendMessageRequest } from '../types';

export const useChat = () => {
  const { messages, isTyping, addMessage, setMessages, setIsTyping, clearMessages } = useChatStore();
  const { session, language } = useSessionStore();

  // Load chat history
  const { refetch } = useQuery({
    queryKey: ['chatHistory', session?.id],
    queryFn: async () => {
      if (!session?.id) return [];
      const history = await apiClient.getChatHistory(session.id);
      setMessages(history);
      return history;
    },
    enabled: !!session?.id,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!session?.id) throw new Error('No active session');

      const request: SendMessageRequest = {
        sessionId: session.id,
        message: content,
        language,
      };

      return apiClient.sendMessage(request);
    },
    onMutate: async (content: string) => {
      // Optimistically add user message
      const userMessage = {
        role: 'user' as const,
        content,
        createdAt: new Date().toISOString(),
      };
      addMessage(userMessage);
      setIsTyping(true);
    },
    onSuccess: (response) => {
      // Add assistant response
      addMessage(response);
      setIsTyping(false);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      setIsTyping(false);
      // Optionally add error message to chat
      addMessage({
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        createdAt: new Date().toISOString(),
      });
    },
  });

  return {
    messages,
    isTyping,

    // Actions
    sendMessage: (content: string) => sendMessageMutation.mutate(content),
    isSending: sendMessageMutation.isPending,
    clearMessages,
    refetchHistory: refetch,
  };
};
