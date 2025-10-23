// apps/frontend/src/stores/quizStore.ts

import { create } from 'zustand';
import type { QuizAnswer } from '../types';

interface QuizStore {
  currentQuestion: number;
  answers: Record<string, QuizAnswer>;
  totalScore: number;
  isCompleted: boolean;

  setCurrentQuestion: (questionNumber: number) => void;
  addAnswer: (questionId: string, answer: QuizAnswer) => void;
  setAnswers: (answers: Record<string, QuizAnswer>) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  setTotalScore: (score: number) => void;
  setIsCompleted: (isCompleted: boolean) => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizStore>((set) => ({
  currentQuestion: 1,
  answers: {},
  totalScore: 0,
  isCompleted: false,

  setCurrentQuestion: (questionNumber) => set({ currentQuestion: questionNumber }),

  addAnswer: (questionId, answer) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: answer,
      },
    })),

  setAnswers: (answers) => set({ answers }),

  nextQuestion: () =>
    set((state) => ({
      currentQuestion: state.currentQuestion + 1,
    })),

  previousQuestion: () =>
    set((state) => ({
      currentQuestion: Math.max(1, state.currentQuestion - 1),
    })),

  setTotalScore: (score) => set({ totalScore: score }),

  setIsCompleted: (isCompleted) => set({ isCompleted }),

  resetQuiz: () =>
    set({
      currentQuestion: 1,
      answers: {},
      totalScore: 0,
      isCompleted: false,
    }),
}));