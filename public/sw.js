/**
 * public/sw.js
 *
 * Phase 5 — FlowRoute Service Worker
 *
 * Strategy:
 *  • Cache-first for static assets (JS, CSS, fonts, images)
 *  • Network-first with offline fallback for HTML pages
 *  • Stale-while-revalidate for API calls where possible
 *  • Offline page served when navigation fails
 *
 * This SW is registered manually (not via next-pwa) to keep full control.
 */

const CACHE_NAME = "flowroute-v5";
const OFFLINE_URL = "/offline";

// Shell assets to precache on install
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/planner",
  "/journey",
  "/explore",
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// ── Install: precache shell ───────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ─────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: tiered caching strategy ────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // API routes — network-first, skip cache on failure (stale data = bad for routes/weather)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: "offline", message: "No network connection" }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );
    return;
  }

  // Navigation requests (HTML pages) — network-first, offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful page loads
          if (response.ok) {
            const cloned = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(async () => {
          // Try cache first, then offline page
          const cached = await caches.match(request);
          if (cached) return cached;
          const offlinePage = await caches.match(OFFLINE_URL);
          return (
            offlinePage ||
            new Response("<h1>You are offline</h1>", {
              headers: { "Content-Type": "text/html" },
            })
          );
        })
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images) — cache-first
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|svg|png|jpg|webp|ico)$/) ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else — network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ── Message: handle SKIP_WAITING from PWAUpdateToast ─────────────────────────
// Called when the user clicks "Reload" in the update notification.
// Forces the waiting SW to become active immediately.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Push Notifications ─────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "FlowRoute", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "FlowRoute", {
      body: data.body || "",
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      vibrate: [100, 50, 100],
      tag: data.tag || "flowroute-notification",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((c) => c.url === targetUrl);
        if (existing) return existing.focus();
        return clients.openWindow(targetUrl);
      })
  );
});
