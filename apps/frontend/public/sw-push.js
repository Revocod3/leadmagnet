/**
 * Service Worker for Clara Premium Push Notifications
 * 
 * This file should be placed in the public folder.
 */

// Listen for push events
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  let data = {
    title: 'Clara Premium',
    body: 'Tienes un nuevo mensaje',
    icon: '/assets/clara-icon.png',
    badge: '/assets/badge.png',
    data: { url: '/pro' }
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon || '/assets/clara-icon.png',
    badge: data.badge || '/assets/badge.png',
    tag: data.tag || 'clara-notification',
    data: data.data || { url: '/pro' },
    actions: data.actions || [],
    vibrate: [100, 50, 100],
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received');

  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  let urlToOpen = data.url || '/pro';

  // Handle specific actions
  if (action === 'open-diary') {
    urlToOpen = '/pro?tab=diario';
  } else if (action === 'view-challenge') {
    urlToOpen = '/pro?tab=chat';
  } else if (action === 'open-chat') {
    urlToOpen = '/pro';
  } else if (action === 'dismiss') {
    return; // Just close notification
  }

  // Focus existing tab or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing tab with the app
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new tab if no existing tab found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed');
});

// Handle service worker install
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Handle service worker activate
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(clients.claim());
});
