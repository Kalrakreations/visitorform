const CACHE_NAME = 'visitor-form-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/form-style.css',
  '/form-script.js',
  // Add any other assets like images/icons you want offline
  '/icons/icon192.png',
  '/icons/icon512.png'
];

// Install event: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch event: serve from cache first
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResp => {
      if (cachedResp) return cachedResp;
      return fetch(event.request).catch(() => {
        // Optional: fallback page if offline and resource not cached
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
