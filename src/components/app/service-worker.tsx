"use client";

import { useEffect } from "react";

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
      navigator.serviceWorker.register("/sw.js").catch(() => {
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
