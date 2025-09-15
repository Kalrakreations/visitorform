// Import idb for IndexedDB wrapper
importScripts('https://cdnjs.cloudflare.com/ajax/libs/idb/7.0.1/idb.min.js');

const CACHE_NAME = 'visitor-form-cache-v5';
const DB_NAME = 'visitorFormDB';
const STORE_NAME = 'formQueue';

const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/form-style.css',
  '/form-script.js',
  '/manifest.json',
  '/icons/favicon-16x16.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon.ico',
  '/icons/apple-touch-icon.png',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png'
];

// ---------------- Install SW ----------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// ---------------- Activate SW ----------------
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

// ---------------- Fetch handler ----------------
self.addEventListener('fetch', (event) => {
  // Handle navigation (offline.html fallback)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => 
        cachedResponse || fetch(event.request).catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        })
      )
  );
});

// ---------------- Background Sync ----------------
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(submitForms());
  }
});

// ---------------- IndexedDB helper ----------------
async function getDb() {
  return idb.openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    }
  });
}

// ---------------- Submit queued forms ----------------
async function submitForms() {
  const db = await getDb();
  const allKeys = await db.getAllKeys(STORE_NAME);

  for (const key of allKeys) {
    const formDataObj = await db.get(STORE_NAME, key);

    try {
      const fd = new FormData();
      for (let k in formDataObj) {
        fd.append(k, formDataObj[k]);
      }

      const res = await fetch("YOUR_GOOGLE_SCRIPT_URL", { method: "POST", body: fd });
      const msg = await res.text();

      if (msg.includes("SUCCESS")) {
        console.log("✅ Synced form:", key);
        await db.delete(STORE_NAME, key);
      }
    } catch (err) {
      console.error("❌ Sync failed for form:", key, err);
      // Keep it in DB for retry
    }
  }
}

// ---------------- Force SW update ----------------
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
