import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export const formatDate = (date: Date | string, language: 'es' | 'en' = 'es'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const locale = language === 'es' ? es : enUS;

  return format(dateObj, 'PPP', { locale });
};

export const formatTime = (date: Date | string, language: 'es' | 'en' = 'es'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const locale = language === 'es' ? es : enUS;

  return format(dateObj, 'p', { locale });
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || defaultValue!;
};