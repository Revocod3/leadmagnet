/**
 * usePremiumOnboarding Hook
 * 
 * Manages the 55-question premium onboarding flow.
 * Integrates with ProChat using React Query.
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import {
  PREMIUM_WELCOME,
  PREMIUM_COMPLETION,
  TOTAL_PREMIUM_QUESTIONS,
  getPremiumQuestionByStep,
} from '../config/premium-onboarding-flow';
import type { FlowMessage } from './useDiagnosticFlow';

export const usePremiumOnboarding = () => {
  const queryClient = useQueryClient();

  // Query: Get onboarding status
  const {
    data: onboardingStatus,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['premiumOnboarding'],
    queryFn: () => apiClient.getOnboardingStatus(),
    staleTime: 30000,
  });

  // Mutation: Save response
  const saveResponseMutation = useMutation({
    mutationFn: (data: { blockId: string; questionId: string; answer: string; step: number }) =>
      apiClient.saveOnboardingResponse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premiumOnboarding'] });
    },
  });

  // Mutation: Complete onboarding
  const completeMutation = useMutation({
    mutationFn: () => apiClient.completeOnboarding(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premiumOnboarding'] });
    },
  });

  // Derived state
  const isCompleted = onboardingStatus?.completed ?? false;
  const currentStep = onboardingStatus?.currentStep ?? 0;
  const responses = onboardingStatus?.responses ?? {};

  // Get current question data
  const currentQuestionData = useMemo(() => {
    if (isCompleted) return null;
    return getPremiumQuestionByStep(currentStep);
  }, [currentStep, isCompleted]);

  // Progress percentage
  const progressPercentage = useMemo(() => {
    return Math.round((currentStep / TOTAL_PREMIUM_QUESTIONS) * 100);
  }, [currentStep]);

  // Check if we're at a new block (show InfoWedge)
  const isNewBlock = useMemo(() => {
    if (currentStep === 0) return true;
    // Each block has 5 questions
    return currentStep % 5 === 0;
  }, [currentStep]);

  // Get saved answer for current question
  const savedAnswer = useMemo(() => {
    if (!currentQuestionData) return null;
    const { block, question } = currentQuestionData;
    return responses[block.id]?.[question.id] ?? null;
  }, [currentQuestionData, responses]);

  // Build messages for display in chat
  const buildOnboardingMessages = useCallback((userName: string): FlowMessage[] => {
    const messages: FlowMessage[] = [];

    // Welcome message (only if step 0 and no responses yet)
    if (currentStep === 0 && Object.keys(responses).length === 0) {
      messages.push({
        role: 'assistant',
        content: PREMIUM_WELCOME.replace('{userName}', userName),
        type: 'welcome',
        timestamp: new Date().toISOString(),
        isNew: true,
      });
      return messages;
    }

    // If completed, show completion message
    if (isCompleted) {
      messages.push({
        role: 'assistant',
        content: PREMIUM_COMPLETION,
        type: 'comment',
        timestamp: new Date().toISOString(),
        isNew: false,
      });
      return messages;
    }

    // Current question
    if (currentQuestionData) {
      const { block, question } = currentQuestionData;

      // InfoWedge content (shown as assistant message if new block)
      if (isNewBlock) {
        messages.push({
          role: 'assistant',
          content: `${block.emoji} **${block.name}**\n\n${block.infoWedge}`,
          type: 'comment',
          timestamp: new Date().toISOString(),
          isNew: false,
        });
      }

      // Current question as message
      messages.push({
        role: 'assistant',
        content: question.text,
        type: 'question',
        timestamp: new Date().toISOString(),
        isNew: true,
      });
    }

    return messages;
  }, [currentStep, responses, isCompleted, currentQuestionData, isNewBlock]);

  // Handle answer submission
  const submitAnswer = useCallback(async (answer: string) => {
    if (!currentQuestionData) return;

    const { block, question } = currentQuestionData;
    const nextStep = currentStep + 1;

    await saveResponseMutation.mutateAsync({
      blockId: block.id,
      questionId: question.id,
      answer,
      step: nextStep,
    });

    // If this was the last question, complete onboarding
    if (nextStep >= TOTAL_PREMIUM_QUESTIONS) {
      await completeMutation.mutateAsync();
    }
  }, [currentQuestionData, currentStep, saveResponseMutation, completeMutation]);

  // Start onboarding (just refetch status to trigger UI)
  const startOnboarding = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    // Status
    isLoading,
    isCompleted,
    needsOnboarding: !isLoading && !isCompleted,
    
    // Progress
    currentStep,
    totalQuestions: TOTAL_PREMIUM_QUESTIONS,
    progressPercentage,
    
    // Current question
    currentBlock: currentQuestionData?.block ?? null,
    currentQuestion: currentQuestionData?.question ?? null,
    currentOptions: currentQuestionData?.question.options ?? [],
    isNewBlock,
    savedAnswer,
    
    // Actions
    submitAnswer,
    startOnboarding,
    
    // For building messages
    buildOnboardingMessages,
    
    // Loading states
    isSaving: saveResponseMutation.isPending,
    isCompleting: completeMutation.isPending,
  };
};
