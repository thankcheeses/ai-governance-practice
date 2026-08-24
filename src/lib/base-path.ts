/**
 * The path the app is served under.
 *
 * Empty for the Vercel-style server build and for the Capacitor bundle, which
 * both serve from the root. On GitHub Pages a project site lives at
 * `https://<user>.github.io/<repo>/`, so every absolute path the app builds by
 * hand has to carry that prefix.
 *
 * Next rewrites a lot of this for us — `<Link href>`, `next/image` sources and
 * everything under `_next/` are prefixed automatically once `basePath` is set.
 * What it does *not* touch is anything we hand to a browser API ourselves:
 * `navigator.serviceWorker.register`, the `manifest` metadata field, and any
 * URL assembled from `window.location.origin`. Those are the reason this
 * module exists, and each of its callers is one of those cases.
 *
 * The value is inlined at build time from `next.config.ts`, which derives both
 * this and Next's own `basePath` from a single input so the two cannot drift.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * An app-absolute path, prefixed.
 *
 * `withBasePath("/sw.js")` → `/ai-governance-practice/sw.js` on Pages, and
 * `/sw.js` everywhere else.
 */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}

/**
 * A fully-qualified URL for a path in this app.
 *
 * Used for OAuth `redirect_uri` values and Supabase email-link returns, which
 * have to be absolute and have to match what is registered with the provider.
 * `window.location.origin` alone is wrong on a project site: it yields
 * `https://user.github.io`, dropping the repository segment entirely.
 *
 * Returns `undefined` when there is no window, so callers can fall back to a
 * build-time configured origin rather than assembling a bad URL.
 */
export function appUrl(path: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}${withBasePath(path)}`;
}

/**
 * The current location as the Next router sees it — base path removed.
 *
 * The inverse of `withBasePath`, and needed wherever a path read from the
 * browser is later handed back to `router.push` / `router.replace`. Those
 * prefix the base path themselves, so round-tripping a raw
 * `window.location.pathname` through them would apply it twice and produce
 * `/repo/repo/settings`.
 */
export function currentAppPath(): string {
  if (typeof window === "undefined") return "/";
  const { pathname, search } = window.location;
  const stripped =
    BASE_PATH && pathname.startsWith(BASE_PATH)
      ? pathname.slice(BASE_PATH.length)
      : pathname;
  return `${stripped || "/"}${search}`;
}
