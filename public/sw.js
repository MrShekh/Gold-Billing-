/* Gold Billing service worker
 *
 * Deliberately minimal and security-conscious:
 *  - It NEVER caches API responses, HTML pages, customer or billing data.
 *  - It only stores a single static offline fallback page (/offline.html).
 *  - Only top-level page navigations are handled; everything else (JS, CSS,
 *    /api/*, POST requests, fonts...) goes straight to the network, so a new
 *    deployment is always picked up immediately - no stale app code.
 *
 * Bump SW_VERSION whenever offline.html changes.
 */
const SW_VERSION = "v1";
const OFFLINE_CACHE = `gold-billing-offline-${SW_VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("gold-billing-") && key !== OFFLINE_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle top-level page navigations (GET). Never touch API calls.
  if (request.mode !== "navigate" || request.method !== "GET") return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(OFFLINE_CACHE);
      const offline = await cache.match(OFFLINE_URL);
      return (
        offline ||
        new Response("You are offline. Please check your internet connection.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
    })
  );
});
