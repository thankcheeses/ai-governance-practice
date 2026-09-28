"use client";

import { useEffect } from "react";
import { startSession, track } from "@/lib/telemetry";

/**
 * Starts a telemetry session, once, after the app has mounted.
 *
 * In the root layout rather than in a page, so a visit is counted wherever
 * someone lands. It renders nothing and blocks nothing: the effect runs after
 * paint, so a slow or unreachable collector cannot delay first render, and
 * every call inside it already swallows its own failures.
 *
 * The empty dependency array is load-bearing. `startSession` is idempotent
 * within a session, but re-running it on every navigation would still mean a
 * request per route change to discover that — and the whole design is that
 * telemetry costs the learner nothing.
 */
export function TelemetryBoot() {
  useEffect(() => {
    startSession();
    track("page_view");
  }, []);

  return null;
}
