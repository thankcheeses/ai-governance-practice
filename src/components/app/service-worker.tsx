"use client";

import { useEffect } from "react";
import { withBasePath } from "@/lib/base-path";

/**
 * Registers the offline service worker on the web deployment.
 *
 * Skipped in the mobile build. Capacitor already serves every asset from the
 * device, so a second caching layer would add nothing and could serve stale
 * assets after an app update — the one failure mode worth designing out.
 *
 * Registration failures are swallowed on purpose: no service worker means the
 * app still works exactly as it did before, just without offline support.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MOBILE_BUILD === "1") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      /*
        Both the script URL and the scope carry the base path. `register` is a
        browser API, so Next rewrites neither — under a repository sub-path an
        unprefixed "/sw.js" simply 404s and offline support disappears without
        an error anyone would notice.

        The explicit scope keeps the worker confined to this app's sub-path. A
        GitHub Pages user site puts every project on one origin, so a worker
        scoped to "/" would be claiming its neighbours' pages too.
      */
      navigator.serviceWorker
        .register(withBasePath("/sw.js"), { scope: withBasePath("/") })
        .catch(() => {
          // Unsupported, blocked by policy, or running without HTTPS.
        });
    };

    // Wait for load so registration never competes with first paint.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
