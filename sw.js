// ============================================================
// SERVICE WORKER (sw.js) - PWA Offline Support
// ============================================================

const CACHE_NAME = 'namoz-tracker-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('aladhan.com') || e.request.url.includes('/api/')) {
    // Network-first for API calls
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  
  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Push notification handler
self.addEventListener('push', (e) => {
  const data = e.data?.json() || {};
  
  e.waitUntil(
    self.registration.showNotification(data.title || 'Namoz Vaqti', {
      body: data.body || 'Allohni ko\'p eslaydigan bo\'ling',
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/badge-72.png',
      tag: data.tag || 'prayer',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        { action: 'mark_done', title: '✅ O\'qidim' },
        { action: 'dismiss',   title: '✕ Yopish' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  
  if (e.action === 'mark_done') {
    // Quick mark as done from notification
    const prayer = e.notification.data?.prayer;
    if (prayer) {
      self.clients.matchAll().then(clients => {
        if (clients.length > 0) {
          clients[0].postMessage({ type: 'QUICK_MARK', prayer, status: 'completed_ontime' });
        }
      });
    }
  }
  
  e.waitUntil(
    self.clients.openWindow('/')
  );
});
