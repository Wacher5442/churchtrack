const CACHE = "churchtrack-v1";

// Assets statiques Next.js (content-hashed, safe to cache forever)
const STATIC_PATTERNS = [
  /^\/_next\/static\//,
  /^\/api\/icons\//,
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET et cross-origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Ignorer les API (toujours réseau)
  if (url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/icons/")) return;

  const isStatic = STATIC_PATTERNS.some((p) => p.test(url.pathname));

  if (isStatic) {
    // Cache-first pour les assets statiques
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Network-first pour les pages (navigation)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then(
          (cached) => cached || caches.match("/offline") || new Response("Hors ligne", { status: 503 })
        )
      )
    );
    return;
  }
});
