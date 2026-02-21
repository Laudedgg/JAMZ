// EMERGENCY UNREGISTER - This service worker will immediately unregister itself
// and clear all caches to fix the 503 error issue

console.log('[SW EMERGENCY] Starting emergency unregister process');

self.addEventListener('install', (event) => {
  console.log('[SW EMERGENCY] Install - skipping waiting');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW EMERGENCY] Activate - clearing ALL caches and unregistering');
  event.waitUntil(
    Promise.all([
      // Clear all caches
      caches.keys().then((cacheNames) => {
        console.log('[SW EMERGENCY] Found caches:', cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW EMERGENCY] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ]).then(() => {
      console.log('[SW EMERGENCY] All caches cleared, claiming clients');
      // Notify all clients to reload
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          console.log('[SW EMERGENCY] Notifying client to reload');
          client.postMessage({ type: 'SW_UNREGISTERED', message: 'Service worker unregistered, please reload' });
        });
      });
    }).then(() => {
      console.log('[SW EMERGENCY] Unregistering service worker');
      return self.registration.unregister();
    }).then(() => {
      console.log('[SW EMERGENCY] ✅ Successfully unregistered!');
    }).catch((err) => {
      console.error('[SW EMERGENCY] ❌ Error during unregister:', err);
    })
  );
});

// DO NOT INTERCEPT ANY FETCH REQUESTS
// Let everything pass through to the network
self.addEventListener('fetch', (event) => {
  // Do absolutely nothing - let all requests go directly to network
  console.log('[SW EMERGENCY] Fetch intercepted but passing through:', event.request.url);
  return;
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW EMERGENCY] Received SKIP_WAITING message');
    self.skipWaiting();
  }
});
