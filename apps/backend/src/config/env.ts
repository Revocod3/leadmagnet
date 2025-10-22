import { z } from 'zod';
import { EnvConfig } from '../types';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_URL: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  OPENAI_API_KEY: z.string(),
  OPENAI_ASSISTANT_ID: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SESSION_SECRET: z.string(),
  UPLOAD_MAX_SIZE: z.string().default('50MB'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
});

let env: EnvConfig;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Invalid environment variables:', error);
  process.exit(1);
}

export { env };