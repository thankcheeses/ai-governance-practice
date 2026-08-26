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
const CACHE = "ai-governance-practice-v1";

/**
 * Where this app is served from — "/" at a domain root, "/<repo>/" on a GitHub
 * Pages project site.
 *
 * Derived rather than configured. This file is copied verbatim out of
 * `public/`, so no build step substitutes anything into it and it cannot read
 * `next.config.ts`. But it always sits next to the app it serves, so its own
 * location is the answer: resolving "./" against it yields the base directory
 * for every target — root for Capacitor and the server build, the repository
 * sub-path on Pages. One expression, no configuration to keep in sync.
 */
const BASE = new URL("./", self.location).pathname;

/** An app-absolute path under whatever base this worker was served from. */
const at = (path) => `${BASE}${path}`;

/**
 * Fetched on install so a first-time visitor who goes offline immediately still
 * has somewhere to land. Everything else is cached as it is actually used —
 * Next emits content-hashed chunk names, so a hardcoded asset list would be
 * stale the moment anything is rebuilt.
 *
 * Trailing slashes match what the export actually emits (`trailingSlash: true`
 * writes `home/index.html`). Requesting the unslashed form would take a
 * redirect, and `cache.add` will not store a redirected response.
 */
const SHELL = [at(""), at("home/"), at("study/"), at("manifest.webmanifest")];

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

/**
 * Same-origin assets worth keeping for an offline session.
 *
 * Every prefix is resolved against BASE. On a Pages user site the origin is
 * shared with every other project of the same account, so an unanchored
 * `/icons/` would match a neighbour's assets and cache them into this app's
 * bucket.
 */
function isCacheableAsset(url) {
  return (
    url.pathname.startsWith(at("_next/static/")) ||
    url.pathname.startsWith(at("icons/")) ||
    url.pathname.startsWith(at("visual-aids/")) ||
    // Brand imagery: the splash mark. Without it an offline launch paints the
    // one route guaranteed to be hit before anything has warmed the cache, with
    // a missing image in it.
    url.pathname.startsWith(at("brand/")) ||
    /*
      Images that went through the optimizer. On a server build `next/image`
      rewrites every src to `/_next/image?url=…`, so the three asset prefixes
      above only ever match on a static export, where the optimizer is off.
      Both deployed targets are exports now, but the rule costs nothing and
      keeps `next start` behaving like production for anyone testing offline.
    */
    url.pathname === at("_next/image") ||
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

        /*
          An uncached route while offline gets the shell rather than the
          browser's error page; the client router takes it from there.

          Gated on being genuinely offline, which it did not used to be. Every
          route here is prerendered to its own HTML, so returning the landing
          page's document for /settings/ is a whole-document mismatch. Serving
          that while the network is working is simply wrong, whatever it costs:
          a transient fetch failure during worker activation is not the same
          thing as a flight-mode laptop, and the old code could not tell them
          apart.

          This gate was first written as a fix for an intermittent React
          hydration error, on the theory that the worker was serving one
          route's document for another. It was not that: capturing both
          documents on a failing load showed them byte-identical, and the
          error survived the gate. The cause was an inline <script> in <head>
          taking part in React's head reconciliation, and it is fixed in
          src/app/layout.tsx. The gate is kept because it is correct on its
          own terms — see docs/known-issues.md for the measurements.

          Offline the trade is still worth making: a mismatched shell that
          client-renders into the right route beats the browser's error page.
        */
        if (isNavigation && self.navigator && self.navigator.onLine === false) {
          const shell =
            (await caches.match(at("home/"))) ?? (await caches.match(at("")));
          if (shell) return shell;
        }

        return Response.error();
      }),
  );
});
