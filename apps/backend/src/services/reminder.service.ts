/**
 * Reminder Service - Clara Premium
 * 
 * Scheduled reminders using node-cron for:
 * - Daily diary reminders
 * - Morning check-in reminders
 * - Micro-challenge notifications (every 3-5 days)
 */

import * as cron from 'node-cron';
import { prisma } from '../config/database';
import {
  sendDiaryReminder,
  sendCheckInReminder,
  sendChallengeNotification
} from './push.service';

// Store active cron jobs
const activeJobs: Map<string, cron.ScheduledTask> = new Map();

/**
 * Initialize all scheduled reminders
 * Call this on server startup
 */
export function initializeReminders(): void {
  console.log('🔔 Initializing reminder system...');

  // Daily diary reminder - 8:00 PM (20:00)
  const diaryJob = cron.schedule('0 20 * * *', async () => {
    console.log('📝 Running daily diary reminder job...');
    await sendDailyDiaryReminders();
  }, {
    timezone: 'Europe/Madrid' // Spain timezone
  });
  activeJobs.set('diary-reminder', diaryJob);

  // Morning check-in reminder - 9:00 AM
  const checkInJob = cron.schedule('0 9 * * *', async () => {
    console.log('☀️ Running morning check-in reminder job...');
    await sendMorningCheckIns();
  }, {
    timezone: 'Europe/Madrid'
  });
  activeJobs.set('check-in-reminder', checkInJob);

  // Micro-challenge check - runs every day at 2:00 PM
  // Will only send if user hasn't had a challenge in 3-5 days
  const challengeJob = cron.schedule('0 14 * * *', async () => {
    console.log('🌟 Running micro-challenge job...');
    await checkAndSendChallenges();
  }, {
    timezone: 'Europe/Madrid'
  });
  activeJobs.set('challenge-check', challengeJob);

  console.log('✅ Reminder system initialized');
}

/**
 * Stop all scheduled reminders
 * Call this on server shutdown
 */
export function stopReminders(): void {
  console.log('🛑 Stopping reminder system...');
  for (const [name, job] of activeJobs) {
    job.stop();
    console.log(`  Stopped: ${name}`);
  }
  activeJobs.clear();
}

/**
 * Send diary reminders to all eligible PRO users
 */
async function sendDailyDiaryReminders(): Promise<void> {
  try {
    // Find all PRO users with push subscriptions who haven't logged today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usersWithReminders = await prisma.reminder.findMany({
      where: {
        type: 'diary',
        enabled: true
      }
    });

    let sent = 0;
    for (const reminder of usersWithReminders) {
      // Check if user has push subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: reminder.userId }
      });

      if (subscriptions.length === 0) continue;

      // Check if user already logged today
      const todayEntry = await prisma.diaryEntry.findFirst({
        where: {
          userId: reminder.userId,
          date: { gte: today }
        }
      });

      if (todayEntry) continue;

      await sendDiaryReminder(reminder.userId);
      sent++;
    }

    console.log(`📝 Sent ${sent} diary reminders`);
  } catch (error) {
    console.error('Error sending diary reminders:', error);
  }
}

/**
 * Send morning check-in reminders
 */
async function sendMorningCheckIns(): Promise<void> {
  try {
    const usersWithReminders = await prisma.reminder.findMany({
      where: {
        type: 'checkin',
        enabled: true
      }
    });

    let sent = 0;
    for (const reminder of usersWithReminders) {
      // Check if user has push subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: reminder.userId }
      });

      if (subscriptions.length === 0) continue;

      await sendCheckInReminder(reminder.userId);
      sent++;
    }

    console.log(`☀️ Sent ${sent} check-in reminders`);
  } catch (error) {
    console.error('Error sending check-in reminders:', error);
  }
}

/**
 * Check and send micro-challenges to eligible users
 * Users get a challenge every 3-5 days (random interval)
 */
async function checkAndSendChallenges(): Promise<void> {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // Find PRO users who:
    // 1. Have completed radiography (are in phase SEGUIMIENTO or later)
    // 2. Don't have an active challenge
    // 3. Haven't received a challenge in the last 3 days
    const eligibleContexts = await prisma.userGlobalContext.findMany({
      where: {
        currentPhase: {
          in: ['week2', 'week3', 'week4', 'maintenance']
        },
        radiographyCompleted: true
      }
    });

    let sent = 0;
    for (const context of eligibleContexts) {
      // Check if user has push subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: context.userId }
      });

      if (subscriptions.length === 0) continue;

      // Check if user has active challenge
      const activeChallenge = await prisma.userChallenge.findFirst({
        where: {
          userId: context.userId,
          status: 'IN_PROGRESS'
        }
      });

      if (activeChallenge) continue;

      // Get last challenge
      const lastChallenge = await prisma.userChallenge.findFirst({
        where: { userId: context.userId },
        orderBy: { startedAt: 'desc' }
      });

      // If user has had a challenge before
      if (lastChallenge?.startedAt) {
        const lastChallengeDate = lastChallenge.startedAt;

        // Skip if less than 3 days since last challenge
        if (lastChallengeDate > threeDaysAgo) {
          continue;
        }

        // Between 3-5 days, add some randomness
        if (lastChallengeDate > fiveDaysAgo) {
          // 30% chance to send today
          if (Math.random() > 0.3) {
            continue;
          }
        }
        // After 5 days, always send
      }

      // Pick a random challenge appropriate for the user
      const challenge = await pickChallengeForUser(context.userId);
      if (challenge) {
        // Create user challenge assignment
        await prisma.userChallenge.create({
          data: {
            userId: context.userId,
            challengeId: challenge.id,
            status: 'IN_PROGRESS',
            startedAt: new Date()
          }
        });

        await sendChallengeNotification(context.userId, challenge.title);
        sent++;
      }
    }

    console.log(`🌟 Sent ${sent} micro-challenges`);
  } catch (error) {
    console.error('Error sending challenges:', error);
  }
}

/**
 * Pick an appropriate challenge for a user
 * Considers their symptoms, preferences, and history
 */
async function pickChallengeForUser(userId: string): Promise<{
  id: string;
  title: string;
} | null> {
  try {
    // Get user's context to determine relevant challenge categories
    const context = await prisma.userGlobalContext.findUnique({
      where: { userId }
    });

    // Get challenges user has already done
    const doneChallengIds = await prisma.userChallenge.findMany({
      where: { userId },
      select: { challengeId: true }
    });
    const doneIds = doneChallengIds.map(c => c.challengeId);

    // Determine relevant categories based on user context
    const relevantCategories: string[] = [];

    const digestiveProfile = context?.digestiveProfile as Record<string, unknown> | null;
    if (digestiveProfile?.symptoms) {
      const symptoms = String(digestiveProfile.symptoms).toLowerCase();
      if (symptoms.includes('estrés') || symptoms.includes('ansiedad')) {
        relevantCategories.push('MINDFULNESS', 'BREATHING');
      }
      if (symptoms.includes('hinchazón') || symptoms.includes('gases')) {
        relevantCategories.push('MOVEMENT', 'EATING');
      }
      if (symptoms.includes('estreñimiento')) {
        relevantCategories.push('HYDRATION', 'MOVEMENT');
      }
    }

    // Default categories if no specific symptoms
    if (relevantCategories.length === 0) {
      relevantCategories.push('MINDFULNESS', 'HYDRATION', 'MOVEMENT');
    }

    // Find an available challenge
    const challenge = await prisma.microChallenge.findFirst({
      where: {
        isActive: true,
        id: { notIn: doneIds },
        category: { in: relevantCategories }
      },
      orderBy: {
        createdAt: 'asc' // Start with older challenges
      },
      select: {
        id: true,
        title: true
      }
    });

    // If no category-specific challenge found, try any active challenge
    if (!challenge) {
      return prisma.microChallenge.findFirst({
        where: {
          isActive: true,
          id: { notIn: doneIds }
        },
        select: {
          id: true,
          title: true
        }
      });
    }

    return challenge;
  } catch (error) {
    console.error('Error picking challenge:', error);
    return null;
  }
}

/**
 * Create or update a reminder for a user
 */
export async function setReminder(
  userId: string,
  type: 'diary' | 'checkin' | 'challenge',
  enabled: boolean,
  preferredTime?: string
): Promise<void> {
  await prisma.reminder.upsert({
    where: {
      userId_type: {
        userId,
        type
      }
    },
    update: {
      enabled,
      ...(preferredTime && { preferredTime })
    },
    create: {
      userId,
      type,
      enabled,
      preferredTime: preferredTime || '20:00'
    }
  });
}

/**
 * Get all reminders for a user
 */
export async function getUserReminders(userId: string) {
  return prisma.reminder.findMany({
    where: { userId }
  });
}

/**
 * Enable default reminders for a new PRO user
 */
export async function enableDefaultReminders(userId: string): Promise<void> {
  await prisma.reminder.createMany({
    data: [
      { userId, type: 'diary', enabled: true, preferredTime: '20:00' },
      { userId, type: 'checkin', enabled: true, preferredTime: '09:00' },
      { userId, type: 'challenge', enabled: true, preferredTime: '14:00' }
    ],
    skipDuplicates: true
  });
}

// Export service
export const reminderService = {
  initializeReminders,
  stopReminders,
  setReminder,
  getUserReminders,
  enableDefaultReminders
};

export default reminderService;
