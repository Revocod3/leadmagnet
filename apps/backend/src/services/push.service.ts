/**
 * Push Notifications Service - Clara Premium
 * 
 * Web Push notifications for diary reminders, challenges, and check-ins.
 * Uses VAPID for authentication.
 */

import webpush from 'web-push';
import { prisma } from '../config/database';

// Types
export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface SubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// VAPID keys - these should be generated once and stored in env
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:soporte@tudominio.com';

// Configure web-push if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

/**
 * Get VAPID public key for client subscription
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

/**
 * Save a push subscription for a user
 */
export async function saveSubscription(
  userId: string,
  subscription: SubscriptionData,
  userAgent?: string
): Promise<void> {
  // Check if subscription already exists (by endpoint)
  const existing = await prisma.pushSubscription.findFirst({
    where: {
      userId,
      endpoint: subscription.endpoint
    }
  });

  if (existing) {
    // Update existing subscription
    await prisma.pushSubscription.update({
      where: { id: existing.id },
      data: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        ...(userAgent && { userAgent })
      }
    });
  } else {
    // Create new subscription
    await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        ...(userAgent && { userAgent })
      }
    });
  }
}

/**
 * Remove a push subscription
 */
export async function removeSubscription(
  userId: string,
  endpoint: string
): Promise<void> {
  await prisma.pushSubscription.deleteMany({
    where: {
      userId,
      endpoint
    }
  });
}

/**
 * Deactivate a subscription (when push fails)
 * Since we don't have an active field, just delete the subscription
 */
export async function deactivateSubscription(subscriptionId: string): Promise<void> {
  await prisma.pushSubscription.delete({
    where: { id: subscriptionId }
  });
}

/**
 * Get all subscriptions for a user
 */
export async function getUserSubscriptions(userId: string) {
  return prisma.pushSubscription.findMany({
    where: {
      userId
    }
  });
}

/**
 * Send push notification to a single subscription
 */
async function sendToSubscription(
  subscription: {
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: PushPayload
): Promise<boolean> {
  if (!isPushConfigured()) {
    console.warn('Push notifications not configured (missing VAPID keys)');
    return false;
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth
    }
  };

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );
    return true;
  } catch (error: any) {
    console.error(`Push notification failed for subscription ${subscription.id}:`, error.message);

    // If subscription is expired or invalid, deactivate it
    if (error.statusCode === 410 || error.statusCode === 404) {
      await deactivateSubscription(subscription.id);
    }

    return false;
  }
}

/**
 * Send push notification to all active subscriptions for a user
 */
export async function sendToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await getUserSubscriptions(userId);

  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    const success = await sendToSubscription(subscription, payload);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Send push notification to multiple users
 */
export async function sendToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendToUser(userId, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { sent: totalSent, failed: totalFailed };
}

/**
 * Send diary reminder notification
 */
export async function sendDiaryReminder(userId: string): Promise<void> {
  const payload: PushPayload = {
    title: '📝 ¡Hora de tu diario!',
    body: '¿Cómo te has sentido hoy? Cuéntaselo a Clara.',
    icon: '/assets/clara-icon.png',
    badge: '/assets/badge.png',
    tag: 'diary-reminder',
    data: {
      type: 'diary-reminder',
      url: '/pro?tab=diario'
    },
    actions: [
      {
        action: 'open-diary',
        title: 'Abrir diario',
        icon: '/assets/diary-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Más tarde'
      }
    ]
  };

  await sendToUser(userId, payload);
}

/**
 * Send micro-challenge notification
 */
export async function sendChallengeNotification(
  userId: string,
  challengeTitle: string
): Promise<void> {
  const payload: PushPayload = {
    title: '🌟 Nuevo micro-reto',
    body: challengeTitle,
    icon: '/assets/clara-icon.png',
    badge: '/assets/badge.png',
    tag: 'new-challenge',
    data: {
      type: 'new-challenge',
      url: '/pro?tab=chat'
    },
    actions: [
      {
        action: 'view-challenge',
        title: 'Ver reto',
        icon: '/assets/challenge-icon.png'
      }
    ]
  };

  await sendToUser(userId, payload);
}

/**
 * Send check-in reminder notification
 */
export async function sendCheckInReminder(userId: string): Promise<void> {
  const payload: PushPayload = {
    title: '☀️ ¡Buenos días!',
    body: 'Clara te espera para tu check-in matutino. ¿Cómo has dormido?',
    icon: '/assets/clara-icon.png',
    badge: '/assets/badge.png',
    tag: 'check-in-reminder',
    data: {
      type: 'check-in-reminder',
      url: '/pro'
    },
    actions: [
      {
        action: 'open-chat',
        title: 'Hablar con Clara'
      }
    ]
  };

  await sendToUser(userId, payload);
}

/**
 * Send progress celebration notification
 */
export async function sendProgressCelebration(
  userId: string,
  message: string
): Promise<void> {
  const payload: PushPayload = {
    title: '🎉 ¡Enhorabuena!',
    body: message,
    icon: '/assets/clara-icon.png',
    badge: '/assets/badge.png',
    tag: 'celebration',
    data: {
      type: 'celebration',
      url: '/pro?tab=progreso'
    }
  };

  await sendToUser(userId, payload);
}

/**
 * Send custom notification
 */
export async function sendCustomNotification(
  userId: string,
  title: string,
  body: string,
  url?: string
): Promise<void> {
  const payload: PushPayload = {
    title,
    body,
    icon: '/assets/clara-icon.png',
    badge: '/assets/badge.png',
    tag: 'custom',
    data: {
      type: 'custom',
      url: url || '/pro'
    }
  };

  await sendToUser(userId, payload);
}

// Export all functions
export const pushService = {
  getVapidPublicKey,
  isPushConfigured,
  saveSubscription,
  removeSubscription,
  deactivateSubscription,
  getUserSubscriptions,
  sendToUser,
  sendToUsers,
  sendDiaryReminder,
  sendChallengeNotification,
  sendCheckInReminder,
  sendProgressCelebration,
  sendCustomNotification
};

export default pushService;
