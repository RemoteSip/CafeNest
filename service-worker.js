// Service Worker for WorkCafe PWA
const CACHE_NAME = 'workcafe-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/main.js',
  '/js/api.js',
  '/images/logo.png',
  '/images/placeholder.jpg',
  '/icons/favicon-32x32.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache error during install:', error);
      })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // Skip API requests to always use network for those
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the response from the cached version
        if (response) {
          return response;
        }
        
        // Not in cache - fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Return the network response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone the response because the response stream can only be read once
            var responseToCache = networkResponse.clone();
            
            // Cache the fetched response
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          })
          .catch(error => {
            console.error('Fetch error:', error);
            // You could return a custom offline page here
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // If this cache name isn't in our whitelist, delete it
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push event - handle push notifications
self.addEventListener('push', event => {
  console.log('Push event received');
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/favicon-32x32.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'WorkCafe Notification', options)
    );
  }
});

// Notification click event - handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked');
  event.notification.close();
  
  const url = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(windowClients => {
        // Check if there is already a window open
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

console.log('Service Worker registered successfully');