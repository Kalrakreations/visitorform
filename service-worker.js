const CACHE_NAME = 'visitor-form-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/form-style.css',
  '/form-script.js',
  '/icons/icon192.png',
  '/icons/icon512.png'
  // add any other assets like images/fonts
];

// Install SW and cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate SW
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch handler: serve from cache first
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if(cachedResponse) return cachedResponse;
        return fetch(event.request)
          .then(response => {
            // Only cache successful responses
            if(!response || response.status !== 200 || response.type !== 'basic') return response;
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache));
            return response;
          })
          .catch(() => {
            // Optional: fallback page/image if offline
            if(event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});
