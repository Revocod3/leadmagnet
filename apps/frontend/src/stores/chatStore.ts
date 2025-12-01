// apps/frontend/src/stores/chatStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage } from '../types';

// Expiration time for FREE chat messages (24 hours in milliseconds)
const FREE_CHAT_EXPIRATION_MS = 24 * 60 * 60 * 1000;

interface FreeChatState {
  messages: ChatMessage[];
  lastUpdated: number | null;
  diagnosticCompleted: boolean;
  sessionId: string | null;
}

interface ChatStore {
  // Current chat state
  messages: ChatMessage[];
  isTyping: boolean;

  // FREE chat persistence state
  freeChatState: FreeChatState;

  // Actions
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setIsTyping: (isTyping: boolean) => void;
  clearMessages: () => void;

  // FREE chat persistence actions
  saveFreeChatState: (sessionId: string, diagnosticCompleted?: boolean) => void;
  restoreFreeChatState: (sessionId: string) => boolean;
  clearFreeChatState: () => void;
  isFreeChatExpired: () => boolean;
  setDiagnosticCompleted: (completed: boolean) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isTyping: false,
      freeChatState: {
        messages: [],
        lastUpdated: null,
        diagnosticCompleted: false,
        sessionId: null,
      },

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      setMessages: (messages) => set({ messages }),

      setIsTyping: (isTyping) => set({ isTyping }),

      clearMessages: () => set({ messages: [], isTyping: false }),

      // Save current messages to FREE chat state for persistence
      saveFreeChatState: (sessionId: string, diagnosticCompleted?: boolean) =>
        set((state) => ({
          freeChatState: {
            messages: state.messages,
            lastUpdated: Date.now(),
            diagnosticCompleted: diagnosticCompleted ?? state.freeChatState.diagnosticCompleted,
            sessionId,
          },
        })),

      // Restore messages from FREE chat state if not expired
      restoreFreeChatState: (sessionId: string) => {
        const state = get();
        const { freeChatState } = state;

        // Check if we have saved state for this session
        if (!freeChatState.sessionId || freeChatState.sessionId !== sessionId) {
          return false;
        }

        // Check if state has expired (only if diagnostic was completed)
        if (freeChatState.diagnosticCompleted && freeChatState.lastUpdated) {
          const elapsed = Date.now() - freeChatState.lastUpdated;
          if (elapsed > FREE_CHAT_EXPIRATION_MS) {
            // Expired - clear state
            get().clearFreeChatState();
            return false;
          }
        }

        // Restore messages if available
        if (freeChatState.messages.length > 0) {
          set({ messages: freeChatState.messages });
          return true;
        }

        return false;
      },

      // Clear FREE chat state
      clearFreeChatState: () =>
        set({
          messages: [],
          freeChatState: {
            messages: [],
            lastUpdated: null,
            diagnosticCompleted: false,
            sessionId: null,
          },
        }),

      // Check if FREE chat state is expired
      isFreeChatExpired: () => {
        const { freeChatState } = get();

        if (!freeChatState.lastUpdated || !freeChatState.diagnosticCompleted) {
          return false;
        }

        const elapsed = Date.now() - freeChatState.lastUpdated;
        return elapsed > FREE_CHAT_EXPIRATION_MS;
      },

      // Mark diagnostic as completed
      setDiagnosticCompleted: (completed: boolean) =>
        set((state) => ({
          freeChatState: {
            ...state.freeChatState,
            diagnosticCompleted: completed,
          },
        })),
    }),
    {
      name: 'ovp-free-chat-storage',
      partialize: (state) => ({
        freeChatState: state.freeChatState,
      }),
    }
  )
);