const CACHE_NAME = "visitor-form-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",   // your main form page
        "/form-style.css",
        "/form-script.js",
        OFFLINE_URL,
      ]);
    })
  );
  console.log("Service Worker installed ✅");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }))
    )
  );
  console.log("Service Worker activated ✅");
  return self.clients.claim();
});

// Intercept requests
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.open(CACHE_NAME).then((cache) => cache.match(OFFLINE_URL))
      )
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) =>
        response ||
        fetch(event.request).then((res) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, res.clone());
            return res;
          });
        }).catch(() => caches.match(OFFLINE_URL))
      )
    );
  }
});
