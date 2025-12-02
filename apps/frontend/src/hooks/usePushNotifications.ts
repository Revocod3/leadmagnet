/**
 * Push Notifications Hook - Clara Premium
 * 
 * Hook for managing push notification subscriptions.
 */

import { useState, useEffect, useCallback } from 'react';
import { pushService } from '../services/premium.service';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  error: string | null;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check support and current subscription status
  useEffect(() => {
    async function checkStatus() {
      setIsLoading(true);

      // Check browser support
      const supported = pushService.isSupported();
      setIsSupported(supported);

      if (!supported) {
        setIsLoading(false);
        return;
      }

      // Check permission
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }

      // Register service worker if not already registered
      try {
        const registration = await navigator.serviceWorker.register('/sw-push.js');
        console.log('Service Worker registered:', registration.scope);
      } catch (err) {
        console.error('Service Worker registration failed:', err);
      }

      // Check current subscription
      try {
        const subscription = await pushService.getCurrentSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('Error checking subscription:', err);
      }

      setIsLoading(false);
    }

    checkStatus();
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const subscription = await pushService.subscribeToPush();

      if (subscription) {
        setIsSubscribed(true);
        setPermission('granted');
        return true;
      } else {
        // Permission was denied
        setPermission(Notification.permission);
        if (Notification.permission === 'denied') {
          setError('Has denegado los permisos de notificación. Puedes cambiarlos en la configuración del navegador.');
        }
        return false;
      }
    } catch (err: any) {
      console.error('Error subscribing to push:', err);
      setError(err.message || 'Error al activar las notificaciones');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const subscription = await pushService.getCurrentSubscription();

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Remove from server
        await pushService.unsubscribe(subscription.endpoint);

        setIsSubscribed(false);
        return true;
      }

      return true;
    } catch (err: any) {
      console.error('Error unsubscribing from push:', err);
      setError(err.message || 'Error al desactivar las notificaciones');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    error
  };
}
