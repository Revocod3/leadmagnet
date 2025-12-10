/**
 * useProChat Hook
 * 
 * Manages PRO chat state and API interactions:
 * - Conversation list management
 * - Current conversation messages
 * - Message sending with image support (unlimited for PRO)
 * - Connection with PRO API endpoints
 * 
 * Uses React Query for automatic cache invalidation and sync across tabs
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { FlowMessage, DiagnosticState } from './useDiagnosticFlow';
import { useAuthStore } from '../stores/authStore';

export interface ProConversation {
  id: string;
  title: string | null;
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
}

export interface ProMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

interface UseProChatReturn {
  // Conversation management
  conversations: ProConversation[];
  selectedConversationId: string | null;
  conversationTitle: string | null;
  loadConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  createNewConversation: () => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;

  // Messages
  messages: FlowMessage[];

  // State flags
  isLoading: boolean;
  isSending: boolean;
  isCreatingConversation: boolean;
  error: string | null;

  // Actions
  sendMessage: (content: string, imageFile?: File) => Promise<void>;

  // For ChatMessage compatibility
  state: DiagnosticState;
}

export const useProChat = (onSubscriptionExpired?: () => void): UseProChatReturn => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Selected conversation state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);

  // Messages state - using FlowMessage for ChatMessage component compatibility
  const [messages, setMessages] = useState<FlowMessage[]>([]);

  // UI state
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Diagnostic state for ChatMessage component compatibility
  const state: DiagnosticState = {
    step: 'asking_questions',
    currentQuestionIndex: 0,
    userName: user?.name || 'Usuario',
    userEmail: user?.email || '',
    language: 'es',
    answers: [],
    imageAnalysis: null,
    diagnosisContent: null,
  };

  // React Query: Load all conversations
  const {
    data: conversations = [],
    isLoading,
    error: conversationsError,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['proConversations'],
    queryFn: () => apiClient.getProConversations(),
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true, // Refetch when tab gets focus (helps sync across tabs)
  });

  // Update error state when query fails
  useEffect(() => {
    if (conversationsError) {
      console.error('Error loading conversations:', conversationsError);
      let errorMessage = 'Error al cargar conversaciones';

      if (conversationsError instanceof Error) {
        // Translate common backend errors to Spanish
        if (conversationsError.message.includes('Error retrieving conversations')) {
          errorMessage = 'Error al cargar las conversaciones';
        } else {
          errorMessage = conversationsError.message;
        }
      }

      setError(errorMessage);
    }
  }, [conversationsError]);

  // Select and load a conversation
  const selectConversation = useCallback(async (conversationId: string) => {
    try {
      setError(null);

      // Check if conversation still exists in the list (prevents selecting deleted conversations)
      const conversationExists = conversations.find(c => c.id === conversationId);
      if (!conversationExists) {
        setError('Esta conversación ya no existe. Por favor selecciona otra conversación.');
        setSelectedConversationId(null);
        setMessages([]);
        setConversationTitle(null);
        return;
      }

      const data = await apiClient.getProConversation(conversationId);

      // Convert API messages to FlowMessage format
      // isNew: false because these are loaded from history, not new
      const flowMessages: FlowMessage[] = data.messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        type: msg.role === 'assistant' ? 'comment' : 'comment',
        timestamp: msg.createdAt,
        isNew: false, // Don't animate messages loaded from history
      }));

      setMessages(flowMessages);
      setConversationTitle(data.conversation.title);
      setSelectedConversationId(conversationId);
    } catch (err: any) {
      console.error('Error loading conversation:', err);

      // Handle 404 - conversation was deleted
      if (err.message?.includes('Conversation not found') || err.message?.includes('CONVERSATION_NOT_FOUND')) {
        setError('Esta conversación fue eliminada. Por favor selecciona otra conversación.');
        setSelectedConversationId(null);
        setMessages([]);
        setConversationTitle(null);
        // Refetch conversations to sync the list
        refetchConversations();
      } else if (err.message?.includes('Error retrieving conversation')) {
        setError('Error al cargar la conversación');
      } else {
        // Use specific error message from backend if available
        const errorMessage = err.message || 'Error al cargar la conversación';
        setError(errorMessage);
      }
    }
  }, [conversations, refetchConversations]);

  // Auto-select most recent conversation when available
  useEffect(() => {
    const firstConversation = conversations[0];
    if (!isLoading && !selectedConversationId && firstConversation) {
      // Call selectConversation directly without adding it to dependencies
      selectConversation(firstConversation.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, selectedConversationId, conversations.length]);

  // React Query Mutation: Create a new conversation
  const createConversationMutation = useMutation({
    mutationFn: () => apiClient.createProConversation(),
    onSuccess: (data) => {
      // Invalidate conversations query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['proConversations'] });

      setSelectedConversationId(data.conversationId);
      setMessages([{
        role: data.message.role as 'user' | 'assistant',
        content: data.message.content,
        type: 'welcome',
        timestamp: new Date().toISOString(),
        isNew: true, // Animate new welcome message
      }]);
      setError(null);
    },
    onError: (err: any) => {
      console.error('Error creating conversation:', err);

      // Check for rate limit error
      if (err.isRateLimit || err.code === 'RATE_LIMIT') {
        setError(err.message || 'Demasiadas solicitudes. Por favor espera un momento e intenta de nuevo.');
      }
      // Check for subscription required error (new user without PRO)
      else if (err.requiresSubscription) {
        onSubscriptionExpired?.();
        setError('Necesitas una suscripción Pro para acceder al chat');
      } else if (err.message === 'SUBSCRIPTION_EXPIRED' || err.message?.includes('subscription')) {
        onSubscriptionExpired?.();
        setError('Tu suscripción ha expirado');
      } else {
        // Use specific error message from backend if available
        const errorMessage = err.message || 'Error al crear conversación';
        setError(errorMessage);
      }
    },
  });

  // Wrapper for mutation
  const createNewConversation = useCallback(async () => {
    // Prevent multiple concurrent creations
    if (createConversationMutation.isPending) return;

    setMessages([]);
    setConversationTitle(null);
    createConversationMutation.mutate();
  }, [createConversationMutation]);

  // React Query Mutation: Delete a conversation
  const deleteConversationMutation = useMutation({
    mutationFn: (conversationId: string) => apiClient.deleteProConversation(conversationId),
    onSuccess: (_, conversationId) => {
      // Invalidate and refetch conversations list - this updates ALL tabs/components
      queryClient.invalidateQueries({ queryKey: ['proConversations'] });

      // Clear selection if deleted conversation was selected
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
        setMessages([]);
        setConversationTitle(null);
      }
      setError(null);
    },
    onError: (err) => {
      console.error('Error deleting conversation:', err);
      setError('Error al eliminar conversación');
    },
  });

  // Wrapper for mutation
  const deleteConversation = useCallback(async (conversationId: string) => {
    deleteConversationMutation.mutate(conversationId);
  }, [deleteConversationMutation]);

  // Send a message
  const sendMessage = useCallback(async (content: string, imageFile?: File) => {
    // Allow empty content if there's an image
    if (!content.trim() && !imageFile) return;
    if (!selectedConversationId || isSending) return;

    // CRITICAL: Check if conversation still exists before sending
    const conversationExists = conversations.find(c => c.id === selectedConversationId);
    if (!conversationExists) {
      setError('Esta conversación fue eliminada. Por favor selecciona otra conversación.');
      setSelectedConversationId(null);
      setMessages([]);
      setConversationTitle(null);
      return;
    }

    const userMessage = content.trim() || (imageFile ? 'Imagen adjunta' : '');
    setIsSending(true);
    setError(null);

    // Get image data URL for display in chat (if image provided)
    let imageDataUrl: string | undefined;
    if (imageFile) {
      const reader = new FileReader();
      imageDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
    }

    // Add user message immediately for optimistic UI (with optional image)
    const newUserMessage: FlowMessage = {
      role: 'user',
      content: userMessage,
      ...(imageDataUrl && { imageUrl: imageDataUrl }), // Include imageUrl for display in chat
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMessage]);

    try {
      // Send message with File (same as free flow - uses FormData)
      const response = await apiClient.sendProMessage(selectedConversationId, userMessage, imageFile);

      // Add assistant response
      const assistantMessage: FlowMessage = {
        role: 'assistant',
        content: response.content,
        type: 'comment',
        timestamp: new Date().toISOString(),
        isNew: true, // Animate new assistant response
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Invalidate conversations query to update last message time
      queryClient.invalidateQueries({ queryKey: ['proConversations'] });
    } catch (err: any) {
      console.error('Error sending message:', err);

      // Check if conversation was deleted (404 error)
      if (err.message?.includes('Conversation not found') || err.message?.includes('CONVERSATION_NOT_FOUND')) {
        setError('Esta conversación fue eliminada. Por favor selecciona otra conversación.');
        setSelectedConversationId(null);
        setMessages([]);
        setConversationTitle(null);
        // Refetch conversations to sync the list
        queryClient.invalidateQueries({ queryKey: ['proConversations'] });
      }
      // Check for subscription required error
      else if (err.requiresSubscription || err.message === 'SUBSCRIPTION_EXPIRED') {
        onSubscriptionExpired?.();
        // Add error message
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: '❌ Necesitas una suscripción Pro activa para seguir conversando con Clara.',
          type: 'comment',
          timestamp: new Date().toISOString(),
        }]);
      } else {
        // Add generic error message
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: 'Lo siento, hubo un error. Por favor, intenta de nuevo.',
          type: 'comment',
          timestamp: new Date().toISOString(),
        }]);
      }
    } finally {
      setIsSending(false);
    }
  }, [selectedConversationId, isSending, conversations, queryClient, onSubscriptionExpired]);

  // Wrapper for loadConversations to match interface
  const loadConversations = useCallback(async () => {
    await refetchConversations();
  }, [refetchConversations]);

  return {
    // Conversation management
    conversations,
    selectedConversationId,
    conversationTitle,
    loadConversations,
    selectConversation,
    createNewConversation,
    deleteConversation,

    // Messages
    messages,

    // State flags
    isLoading,
    isSending,
    isCreatingConversation: createConversationMutation.isPending,
    error,

    // Actions
    sendMessage,

    // For ChatMessage compatibility
    state,
  };
};
