import OpenAI from 'openai';
import { env } from './env';

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const MODELS = {
  TEXT: 'gpt-4o-mini',
  VISION: 'gpt-4o',
} as const;