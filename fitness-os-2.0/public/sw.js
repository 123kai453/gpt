/* FITNESS OS: only public app-shell assets belong in this cache. */
const VERSION = "phase1-1-v1";
const CACHE_PREFIX = "fitness-os-public-";
const CACHE_NAME = CACHE_PREFIX + VERSION;
const PUBLIC_ASSETS = [
  "/offline.html",
  "/manifest.json",
  "/icons/mark.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
];
const PRIVATE_PATH = /^\/(api|auth|account|private|storage|supabase)(\/|$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_ASSETS)),
  );
  // Updates wait for the user's confirmation; never skipWaiting on install.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

function isPublicStatic(request, url) {
  if (PUBLIC_ASSETS.includes(url.pathname)) return true;
  return url.pathname.startsWith("/_next/static/") &&
    /\.(?:js|css|woff2?|ttf|otf|png|svg|webp|avif)$/.test(url.pathname) &&
    ["script", "style", "font", "image"].includes(request.destination);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (PRIVATE_PATH.test(url.pathname)) return;

  if (request.mode === "navigate") {
    // Never cache a page response, even for a currently public route.
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return await cache.match("/offline.html") || new Response(
          "暂时离线，请恢复网络后重试。", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          },
        );
      }),
    );
    return;
  }

  if (!isPublicStatic(request, url)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      const policy = response.headers.get("Cache-Control") || "";
      if (response.ok && response.type === "basic" &&
          !/\b(?:private|no-store)\b/i.test(policy) && !url.search) {
        await cache.put(request, response.clone());
      }
      return response;
    })(),
  );
});
