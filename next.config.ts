import type { NextConfig } from "next";

/**
 * Three build targets from one codebase.
 *
 *   npm run build         → server build. Middleware would run and the image
 *                           optimizer would run. Kept for local preview only;
 *                           nothing is deployed from it any more.
 *   npm run build:mobile  → static export into ./out for Capacitor.
 *   npm run build:pages   → static export into ./out for GitHub Pages, served
 *                           under a repository sub-path.
 *
 * Both export targets set `output: "export"`, which disables middleware and the
 * image optimizer. Neither is a functional loss:
 *
 *  - Middleware only refreshed the Supabase auth cookie for server rendering.
 *    Every page here is client-rendered and supabase-js refreshes its own
 *    tokens in the browser, so there is nothing for it to do. The file has been
 *    removed rather than left to look load-bearing.
 *  - Images are served as files, so on-demand optimization has no value;
 *    `unoptimized` serves them directly.
 *
 * The one thing that separates the two export targets is the base path. A
 * GitHub Pages project site lives at `https://<user>.github.io/<repo>/`, while
 * Capacitor serves from the filesystem root — so the mobile bundle must never
 * carry a base path, and the check below is written to make that impossible
 * rather than merely unlikely.
 *
 * `basePath` and `NEXT_PUBLIC_BASE_PATH` are derived from the same expression.
 * Next prefixes `<Link href>`, `next/image` sources and everything under
 * `_next/` on its own, but not values we hand to browser APIs ourselves — the
 * service worker registration, the `manifest` metadata field, and any URL built
 * from `window.location.origin`. Those read the inlined copy via
 * `src/lib/base-path.ts`. Deriving both from one source is what stops the two
 * halves from disagreeing.
 */
const isMobileBuild = process.env.MOBILE_BUILD === "1";
const isPagesBuild = process.env.PAGES_BUILD === "1";
const isStaticExport = isMobileBuild || isPagesBuild;

/**
 * Normalised to a leading slash and no trailing slash, which is the shape Next
 * requires of `basePath` and the shape the helpers assume. An empty value means
 * "served from the root" and is always correct for the other two targets.
 *
 * The mobile build ignores the variable outright: a base path baked into a
 * Capacitor bundle points every asset at a directory that does not exist on the
 * device, and that failure is silent until the app is opened on a phone.
 */
const basePath =
  isPagesBuild && !isMobileBuild
    ? `/${(process.env.PAGES_BASE_PATH ?? "ai-governance-practice").replace(/^\/+|\/+$/g, "")}`
    : "";

const nextConfig: NextConfig = {
  env: {
    // Read by the service worker registration, which is web-only: Capacitor
    // already serves every asset locally, so a second cache layer there would
    // only risk serving stale assets after an app update.
    NEXT_PUBLIC_MOBILE_BUILD: isMobileBuild ? "1" : "0",
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(isStaticExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        // Both static hosts serve files rather than rewriting: directory-style
        // URLs need a real index.html at each path. This is also what makes
        // deep links work on GitHub Pages without an SPA fallback shim.
        trailingSlash: true,
      }
    : {}),
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
