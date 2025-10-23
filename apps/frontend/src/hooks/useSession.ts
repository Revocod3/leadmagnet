// apps/frontend/src/hooks/useSession.ts

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { useSessionStore } from '../stores/sessionStore';
import type { CreateSessionRequest, SessionData } from '../types';

export const useSession = () => {
  const { session, language, setSession, clearSession, setLanguage, } = useSessionStore();

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data?: CreateSessionRequest) => {
      const request: CreateSessionRequest = {
        language,
        ...data,
      };
      return apiClient.createSession(request);
    },
    onSuccess: (newSession) => {
      setSession(newSession);
    },
  });

  // Get session query
  const { refetch: refetchSession } = useQuery({
    queryKey: ['session', session?.id],
    queryFn: async () => {
      if (!session?.id) return null;
      const fetchedSession = await apiClient.getSession(session.id);
      setSession(fetchedSession);
      return fetchedSession;
    },
    enabled: !!session?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (updates: Partial<SessionData>) => {
      if (!session?.id) throw new Error('No active session');
      return apiClient.updateSession(session.id, updates);
    },
    onSuccess: (updatedSession) => {
      setSession(updatedSession);
    },
  });

  // Check if session is expired
  const isExpired = session && session.expiresAt ? new Date() > new Date(session.expiresAt) : false;

  return {
    session,
    language,
    isExpired,

    // Actions
    createSession: createSessionMutation.mutate,
    isCreatingSession: createSessionMutation.isPending,
    clearSession,
    setLanguage,
    updateSession: updateSessionMutation.mutate,
    isUpdatingSession: updateSessionMutation.isPending,
    refetchSession,
  };
};