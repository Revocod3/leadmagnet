import Redis from 'ioredis';
import { env } from './env';

let redis: Redis | null = null;

if (env.REDIS_URL) {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redis.on('error', (error) => {
    console.error('Redis connection error:', error);
  });

  redis.on('connect', () => {
    console.log('✅ Connected to Redis');
  });
}

export { redis };