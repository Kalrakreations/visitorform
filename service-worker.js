const CACHE_NAME = 'visitor-form-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/form-style.css',
  '/form-script.js'
  // add any other assets like icons, images, fonts
];

// Install Service Worker and cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch handler: serve from cache first, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => cachedResponse || fetch(event.request))
      .catch(() => {
        // fallback content if offline and resource not cached
        if(event.request.destination === 'document') return caches.match('/index.html');
      })
  );
});
