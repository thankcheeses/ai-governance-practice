/*
 * Offline support for the web deployment.
 *
 * Network-first with a cache fallback. Two properties have to hold at once:
 * an online user must always get the newest deployment, and an offline user
 * must still be able to study. Cache-first would break the first; no cache at
 * all breaks the second. Network-first gets both — the cache is only consulted
 * when the network fails.
 *
 * Deliberately hand-written. Workbox would pull a build-step dependency and a
 * generated manifest for roughly sixty lines of logic.
 *
 * Scope of what is cached:
 *   - navigations (the app shell for each route)
 *   - same-origin static assets: /_next/static, icons, the manifest, diagrams
 *
 * Never cached, and never intercepted at all:
 *   - anything cross-origin, which is every Supabase auth and sync call
 *   - any method other than GET
 *
 * Progress is untouched. It lives in localStorage and never passes through here.
 */

// Bump to invalidate every cached asset. Old caches are deleted on activate.
const CACHE = "aigp-practice-v1";

/**
 * Fetched on install so a first-time visitor who goes offline immediately still
 * has somewhere to land. Everything else is cached as it is actually used —
 * Next emits content-hashed chunk names, so a hardcoded asset list would be
 * stale the moment anything is rebuilt.
 */
const SHELL = ["/", "/home", "/study", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Individually, so one 404 cannot fail the whole install.
      .then((cache) =>
        Promise.all(SHELL.map((url) => cache.add(url).catch(() => undefined))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Same-origin assets worth keeping for an offline session. */
function isCacheableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/visual-aids/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webmanifest")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin is left entirely alone. Supabase auth and sync must reach the
  // network or fail on their own terms — a cached auth response would be both
  // wrong and a security problem.
  if (url.origin !== self.location.origin) return;

  const isNavigation = request.mode === "navigate";
  if (!isNavigation && !isCacheableAsset(url)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only store a response we could actually replay. Opaque and error
        // responses are passed through without polluting the cache.
        if (response && response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        // An uncached route while offline still gets the shell rather than the
        // browser's error page; the client router takes it from there.
        if (isNavigation) {
          const shell =
            (await caches.match("/home")) ?? (await caches.match("/"));
          if (shell) return shell;
        }

        return Response.error();
      }),
  );
});
