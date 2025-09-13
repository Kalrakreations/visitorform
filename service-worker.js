const CACHE_NAME = "form-app-cache-v1";
const OFFLINE_URL = "/offline.html";

// List of files to cache
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/form-script.js",
  OFFLINE_URL
];

// Install event – cache files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event – clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch event – serve cache first, then network
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Update cache with fresh copy
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(res => res || caches.match(OFFLINE_URL))
      )
  );
});

// Background sync for queued submissions
self.addEventListener("sync", event => {
  if (event.tag === "sync-forms") {
    event.waitUntil(syncForms());
  }
});

// Dummy sync function (your form-script.js handles actual IndexedDB queue)
async function syncForms() {
  console.log("🔄 Background sync triggered!");
}
