// apps/frontend/src/hooks/useQuiz.ts

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { useQuizStore } from '../stores/quizStore';
import { useSessionStore } from '../stores/sessionStore';
import type { SubmitQuizAnswerRequest } from '../types';

const TOTAL_QUESTIONS = 17;

export const useQuiz = () => {
  const {
    currentQuestion,
    answers,
    totalScore,
    isCompleted,
    setCurrentQuestion,
    addAnswer,
    setAnswers,
    nextQuestion,
    previousQuestion,
    setTotalScore,
    setIsCompleted,
    resetQuiz,
  } = useQuizStore();

  const { session } = useSessionStore();

  // Load quiz answers
  const { refetch } = useQuery({
    queryKey: ['quizAnswers', session?.id],
    queryFn: async () => {
      if (!session?.id) return [];
      const quizAnswers = await apiClient.getQuizAnswers(session.id);

      const answersMap = quizAnswers.reduce((acc, answer) => {
        acc[answer.questionId] = answer;
        return acc;
      }, {} as Record<number, typeof quizAnswers[0]>);

      setAnswers(answersMap);

      const score = quizAnswers.reduce((sum, answer) => sum + answer.points, 0);
      setTotalScore(score);

      return quizAnswers;
    },
    enabled: !!session?.id,
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number; answer: string }) => {
      if (!session?.id) throw new Error('No active session');

      const request: SubmitQuizAnswerRequest = {
        sessionId: session.id,
        questionId,
        answer,
      };

      return apiClient.submitQuizAnswer(request);
    },
    onSuccess: (response, variables) => {
      addAnswer(variables.questionId, response);
      setTotalScore(totalScore + response.points);

      // Auto-advance to next question
      if (currentQuestion < TOTAL_QUESTIONS) {
        nextQuestion();
      } else {
        setIsCompleted(true);
      }
    },
    onError: (error) => {
      console.error('Error submitting answer:', error);
    },
  });

  // Generate diagnosis mutation
  const generateDiagnosisMutation = useMutation({
    mutationFn: async () => {
      if (!session?.id) throw new Error('No active session');
      return apiClient.generateDiagnosis(session.id);
    },
  });

  return {
    currentQuestion,
    totalQuestions: TOTAL_QUESTIONS,
    answers,
    totalScore,
    isCompleted,
    progress: (currentQuestion / TOTAL_QUESTIONS) * 100,

    // Actions
    submitAnswer: submitAnswerMutation.mutate,
    isSubmitting: submitAnswerMutation.isPending,
    nextQuestion,
    previousQuestion,
    setCurrentQuestion,
    resetQuiz,
    refetchAnswers: refetch,

    // Diagnosis
    generateDiagnosis: generateDiagnosisMutation.mutate,
    isGenerating: generateDiagnosisMutation.isPending,
    diagnosis: generateDiagnosisMutation.data,
  };
};