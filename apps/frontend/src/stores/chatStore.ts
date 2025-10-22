// apps/frontend/src/stores/chatStore.ts

import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface ChatStore {
  messages: ChatMessage[];
  isTyping: boolean;
  
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setIsTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isTyping: false,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages) => set({ messages }),

  setIsTyping: (isTyping) => set({ isTyping }),

  clearMessages: () => set({ messages: [], isTyping: false }),
}));