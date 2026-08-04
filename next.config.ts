import type { NextConfig } from "next";

/**
 * Two build targets from one codebase.
 *
 *   npm run build         → server build for Vercel. Middleware runs, the image
 *                           optimizer runs. Unchanged from before this pass.
 *   npm run build:mobile  → static export into ./out for Capacitor.
 *
 * The mobile target sets `output: "export"`, which disables middleware and the
 * image optimizer. Neither is a functional loss on device:
 *
 *  - Middleware only refreshes the Supabase auth cookie for server rendering.
 *    In a WebView every page is client-rendered and supabase-js refreshes its
 *    own tokens, so there is nothing for it to do.
 *  - Images ship inside the app bundle, so on-demand optimization has no value;
 *    `unoptimized` serves them directly.
 *
 * Keeping this behind a flag means the web deployment is untouched by the
 * mobile work, and neither target can silently regress the other.
 */
const isMobileBuild = process.env.MOBILE_BUILD === "1";

const nextConfig: NextConfig = {
  ...(isMobileBuild
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        // Capacitor serves from the filesystem, so directory-style URLs need a
        // real index.html at each path rather than a server rewrite.
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
