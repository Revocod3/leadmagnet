// apps/frontend/src/stores/sessionStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionData, Language } from '../types';

interface SessionStore {
  session: SessionData | null;
  language: Language;
  imagesUploaded: number;

  setSession: (session: SessionData) => void;
  clearSession: () => void;
  setLanguage: (language: Language) => void;
  updateSession: (updates: Partial<SessionData>) => void;
  incrementImagesUploaded: () => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      session: null,
      language: 'es',
      imagesUploaded: 0,

      setSession: (session) => set({ session }),

      clearSession: () => set({ session: null, imagesUploaded: 0 }),

      setLanguage: (language) => set({ language }),

      updateSession: (updates) =>
        set((state) => ({
          session: state.session ? { ...state.session, ...updates } : null,
        })),

      incrementImagesUploaded: () =>
        set((state) => ({ imagesUploaded: state.imagesUploaded + 1 })),
    }),
    {
      name: 'ovp-session-storage',
      partialize: (state) => ({
        session: state.session,
        language: state.language,
        imagesUploaded: state.imagesUploaded,
      }),
    }
  )
);