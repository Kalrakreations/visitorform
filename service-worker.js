importScripts('https://cdnjs.cloudflare.com/ajax/libs/idb/7.0.1/idb.min.js');

const CACHE_NAME = 'visitor-form-cache-v3';
const DB_NAME = 'visitorFormDB';
const STORE_NAME = 'formQueue';

const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/form-style.css',
  '/form-script.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install Service Worker and cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker and clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch handler: Cache-first with network fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// ----------------- Background Sync -----------------

// Listen for sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(submitForms());
  }
});

// Helper: open IndexedDB
async function getDb() {
  return idb.openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    }
  });
}

// Submit queued forms
async function submitForms() {
  const db = await getDb();
  const allForms = await db.getAllKeys(STORE_NAME);

  for (let key of allForms) {
    const formDataObj = await db.get(STORE_NAME, key);

    try {
      const fd = new FormData();
      for (let k in formDataObj) {
        fd.append(k, formDataObj[k]);
      }

      const res = await fetch("YOUR_GOOGLE_SCRIPT_URL", {
        method: "POST",
        body: fd
      });

      const msg = await res.text();

      if (msg.includes("SUCCESS")) {
        console.log("✅ Synced form:", key);
        await db.delete(STORE_NAME, key);
      }
    } catch (err) {
      console.error("❌ Sync failed for form:", key, err);
      // keep in DB for retry next time
    }
  }
}
