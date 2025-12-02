/**
 * useProChat Hook
 * 
 * Manages PRO chat state and API interactions:
 * - Conversation list management
 * - Current conversation messages
 * - Message sending with image support (unlimited for PRO)
 * - Connection with PRO API endpoints
 */

import { useState, useCallback, useEffect } from 'react';
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
  error: string | null;

  // Actions
  sendMessage: (content: string, imageFile?: File) => Promise<void>;

  // For ChatMessage compatibility
  state: DiagnosticState;
}

export const useProChat = (onSubscriptionExpired?: () => void): UseProChatReturn => {
  const { user } = useAuthStore();

  // Conversations state
  const [conversations, setConversations] = useState<ProConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);

  // Messages state - using FlowMessage for ChatMessage component compatibility
  const [messages, setMessages] = useState<FlowMessage[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
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

  // Load all conversations
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getProConversations();
      setConversations(data);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Error al cargar conversaciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Select and load a conversation
  const selectConversation = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      setError(null);

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
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Error al cargar la conversación');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new conversation
  const createNewConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setMessages([]);
      setConversationTitle(null);

      const data = await apiClient.createProConversation();

      setSelectedConversationId(data.conversationId);
      setMessages([{
        role: data.message.role as 'user' | 'assistant',
        content: data.message.content,
        type: 'welcome',
        timestamp: new Date().toISOString(),
        isNew: true, // Animate new welcome message
      }]);

      // Refresh conversation list
      await loadConversations();
    } catch (err: any) {
      console.error('Error creating conversation:', err);

      // Check for subscription required error (new user without PRO)
      if (err.requiresSubscription) {
        onSubscriptionExpired?.();
        setError('Necesitas una suscripción Pro para acceder al chat');
      } else if (err.message === 'SUBSCRIPTION_EXPIRED' || err.message?.includes('subscription')) {
        onSubscriptionExpired?.();
        setError('Tu suscripción ha expirado');
      } else {
        setError('Error al crear conversación');
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadConversations, onSubscriptionExpired]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await apiClient.deleteProConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));

      // Clear selection if deleted conversation was selected
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
        setMessages([]);
        setConversationTitle(null);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Error al eliminar conversación');
    }
  }, [selectedConversationId]);

  // Send a message
  const sendMessage = useCallback(async (content: string, _imageFile?: File) => {
    if (!content.trim() || !selectedConversationId || isSending) return;

    const userMessage = content.trim();
    setIsSending(true);
    setError(null);

    // Add user message immediately for optimistic UI
    const newUserMessage: FlowMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMessage]);

    try {
      // TODO: Handle image upload for PRO (unlimited images)
      // if (imageFile) {
      //   const imageUrl = await apiClient.uploadImage(imageFile);
      //   userMessage = `${userMessage}\n[Imagen adjunta: ${imageUrl}]`;
      // }

      const response = await apiClient.sendProMessage(selectedConversationId, userMessage);

      // Add assistant response
      const assistantMessage: FlowMessage = {
        role: 'assistant',
        content: response.content,
        type: 'comment',
        timestamp: new Date().toISOString(),
        isNew: true, // Animate new assistant response
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh conversation list to update last message time
      await loadConversations();
    } catch (err: any) {
      console.error('Error sending message:', err);

      // Check for subscription required error
      if (err.requiresSubscription || err.message === 'SUBSCRIPTION_EXPIRED') {
        onSubscriptionExpired?.();
        // Add error message
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: '❌ Necesitas una suscripción Pro activa para seguir conversando con Clara.',
          type: 'comment',
          timestamp: new Date().toISOString(),
        }]);
      } else {
        // Add error message
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
  }, [selectedConversationId, isSending, loadConversations, onSubscriptionExpired]);

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
    error,

    // Actions
    sendMessage,

    // For ChatMessage compatibility
    state,
  };
};
