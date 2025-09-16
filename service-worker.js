/* ===================================================
   Service Worker for Offline Support
   Caches HTML, CSS, JS, and fallback content
   =================================================== */

const CACHE_NAME = 'visitor-form-cache-v1';
const OFFLINE_URL = '/offline.html'; // fallback page if user is offline

// Files to cache
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/favicon.ico',
  '/manifest.json',
  OFFLINE_URL,
  '/images/logo.png', // add your images/icons here
];

// Install Event: caching files
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Pre-caching offline page and assets');
        return cache.addAll(FILES_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Activate Event: cleanup old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if(key !== CACHE_NAME){
          console.log('[ServiceWorker] Removing old cache:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// Fetch Event: serve cached content when offline
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone response and store in cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => {
        // Try cache if network fails
        return caches.match(event.request)
          .then(cachedResponse => cachedResponse || caches.match(OFFLINE_URL));
      })
  );
});

/* ---------- Background Sync for Form Submission ---------- */
// Optional: retry failed s
