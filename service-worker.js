const CACHE_NAME = 'studentassist-v7';

const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './css/themes.css',
  './js/utils.js',
  './js/state.js',
  './js/storage.js',
  './js/router.js',
  './js/gamification.js',
  './js/leaderboard.js',
  './js/ai.js',
  './js/learn-engine.js',
  './js/quiz-engine.js',
  './js/assessment-engine.js',
  './js/mixed-engine.js',
  './js/practice-engine.js',
  './js/exam-engine.js',
  './js/renderer.js',
  './js/app.js',
  './data/modules.json',
  './data/mkt202/config.json',
  './manifest.webmanifest'
];

// Install event: cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('Some assets failed to cache:', err);
          return Promise.resolve();
        });
      })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: cache-first strategy
self.addEventListener('fetch', event => {
  const { request } = event;

  // Only cache GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(response => {
        // Return from cache if found
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              })
              .catch(err => {
                console.warn('Cache put error:', err);
              });

            return response;
          })
          .catch(err => {
            // Return offline page or error response
            console.warn('Fetch error:', err);
            return new Response('Offline - content not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
