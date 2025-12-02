/**
 * Push Notifications Controller - Clara Premium
 * 
 * Handles push subscription management and notification settings.
 */

import { Request, Response } from 'express';
import { 
  saveSubscription, 
  removeSubscription, 
  getVapidPublicKey,
  isPushConfigured,
  sendCustomNotification
} from '../services/push.service';
import { 
  getUserReminders, 
  setReminder, 
  enableDefaultReminders 
} from '../services/reminder.service';

/**
 * Get VAPID public key for client-side subscription
 */
export async function getPublicKey(req: Request, res: Response): Promise<void> {
  try {
    if (!isPushConfigured()) {
      res.status(503).json({
        error: 'Push notifications not configured'
      });
      return;
    }

    res.json({
      publicKey: getVapidPublicKey()
    });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({ error: 'Error getting public key' });
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      res.status(400).json({ error: 'Invalid subscription data' });
      return;
    }

    await saveSubscription(
      userId,
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      },
      req.headers['user-agent']
    );

    // Enable default reminders for new subscriptions
    await enableDefaultReminders(userId);

    res.json({ 
      success: true,
      message: 'Subscribed to push notifications'
    });
  } catch (error) {
    console.error('Error subscribing to push:', error);
    res.status(500).json({ error: 'Error subscribing to push notifications' });
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { endpoint } = req.body;
    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint required' });
      return;
    }

    await removeSubscription(userId, endpoint);

    res.json({ 
      success: true,
      message: 'Unsubscribed from push notifications'
    });
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    res.status(500).json({ error: 'Error unsubscribing from push notifications' });
  }
}

/**
 * Get user's reminder settings
 */
export async function getReminders(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const reminders = await getUserReminders(userId);

    res.json({ reminders });
  } catch (error) {
    console.error('Error getting reminders:', error);
    res.status(500).json({ error: 'Error getting reminders' });
  }
}

/**
 * Update a reminder setting
 */
export async function updateReminder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { type, enabled, time } = req.body;
    
    if (!type || !['DIARY', 'CHECK_IN', 'CHALLENGE'].includes(type)) {
      res.status(400).json({ error: 'Invalid reminder type' });
      return;
    }

    if (typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'Enabled must be a boolean' });
      return;
    }

    await setReminder(userId, type, enabled, time);

    res.json({ 
      success: true,
      message: 'Reminder updated'
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ error: 'Error updating reminder' });
  }
}

/**
 * Send a test notification (for development/testing)
 */
export async function sendTest(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({ error: 'Test notifications not allowed in production' });
      return;
    }

    await sendCustomNotification(
      userId,
      '🧪 Notificación de prueba',
      '¡Las notificaciones funcionan correctamente!',
      '/pro'
    );

    res.json({ 
      success: true,
      message: 'Test notification sent'
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Error sending test notification' });
  }
}
