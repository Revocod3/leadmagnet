import { prisma } from '../config/database';

export class StatsService {
  /**
   * Get or create a counter by key
   */
  async getCounter(key: string): Promise<number> {
    const counter = await prisma.globalCounter.findUnique({
      where: { key },
    });

    if (!counter) {
      // Create counter if it doesn't exist
      const newCounter = await prisma.globalCounter.create({
        data: {
          key,
          value: 18452, // Initial value
        },
      });
      return newCounter.value;
    }

    return counter.value;
  }

  /**
   * Increment a counter by key
   */
  async incrementCounter(key: string, amount = 1): Promise<number> {
    const counter = await prisma.globalCounter.upsert({
      where: { key },
      create: {
        key,
        value: 18452 + amount, // Initial value + increment
      },
      update: {
        value: {
          increment: amount,
        },
      },
    });

    return counter.value;
  }

  /**
   * Get user count (specific counter for user validation)
   */
  async getUserCount(): Promise<number> {
    return this.getCounter('user_count');
  }

  /**
   * Increment user count
   */
  async incrementUserCount(): Promise<number> {
    return this.incrementCounter('user_count');
  }
}

export const statsService = new StatsService();
