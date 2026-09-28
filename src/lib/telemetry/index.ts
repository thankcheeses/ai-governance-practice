/**
 * Product telemetry — how many people use this, and roughly where from.
 *
 * Named `telemetry`, not `analytics`, because `src/lib/analytics.ts` already
 * exists and means something else entirely: a learner's own performance by
 * domain, computed on their device and shown to them. The two share no code
 * and no data, and conflating them in a filename is how they would end up
 * sharing both.
 *
 * ## What this must never do
 *
 * Studying must work identically whether this succeeds, fails, is blocked, or
 * was never deployed. That is not a nice-to-have on a tool people use offline
 * on a phone. Three things enforce it:
 *
 *  - every call is wrapped and swallows its own errors;
 *  - nothing is ever awaited by a caller, and no render path reads a result;
 *  - when telemetry is not configured, `send` returns before constructing a
 *    request at all.
 *
 * ## What it does not collect
 *
 * No user id, ever — not even for a signed-in learner. No answers, no scores,
 * no streak, no question text. A `question_answered` event carries the domain,
 * the sub-domain and whether it was right; it does not carry which question or
 * which option, because "accuracy by sub-domain across everyone" is the
 * question being asked and the item identity is not needed to answer it.
 *
 * Geography, device and referrer are deliberately *absent* from the payload.
 * They are derived at the edge from request metadata, so the browser never
 * reports where it is and the raw IP is discarded inside the function.
 */

import { getFlag, setFlag } from "./storage";

export const VISITOR_KEY = "agp:telemetry:visitor";
export const SESSION_KEY = "agp:telemetry:session";
export const OPT_OUT_KEY = "agp:telemetry:opt-out";

/**
 * How long a visitor id survives.
 *
 * Long enough for "returning visitor" to mean something, short enough that it
 * is not a durable handle on a person. The cost is that a learner who returns
 * after 91 days counts as new, and the dashboard says so rather than implying
 * a precision it does not have.
 */
export const VISITOR_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/** A session ends after this much inactivity. */
export const SESSION_IDLE_MS = 30 * 60 * 1000;

export type TelemetryEvent =
  | "session_start"
  | "page_view"
  | "study_started"
  | "study_completed"
  | "question_answered"
  | "review_started"
  | "review_completed"
  | "exam_started"
  | "exam_completed"
  | "exam_abandoned"
  | "client_error"
  | "api_error";

export interface EventPayload {
  mode?: "practice" | "domain" | "review" | "exam";
  /** Roman domain, e.g. "III". Never a question id. */
  domain?: string;
  /** Sub-domain, e.g. "III.B". Never a question id. */
  subdomain?: string;
  correct?: boolean;
  durationMs?: number;
}

/**
 * Where the collector lives. Absent means telemetry is off, everywhere.
 *
 * Read per call rather than captured at module load. Next inlines every
 * NEXT_PUBLIC_* value at build time whichever way it is read, so this costs
 * nothing in production — and it removes a real footgun, where importing this
 * module before the environment was ready would freeze telemetry off for the
 * life of the process.
 */
function endpoint(): string {
  return process.env.NEXT_PUBLIC_TELEMETRY_URL ?? "";
}

/**
 * Whether the learner has opted out.
 *
 * Read on every send rather than cached, so switching it off in Settings takes
 * effect on the next event rather than on the next reload.
 */
export function hasOptedOut(): boolean {
  return getFlag(OPT_OUT_KEY) === "1";
}

export function setOptedOut(value: boolean): void {
  setFlag(OPT_OUT_KEY, value ? "1" : null);
}

/** True when telemetry could send something — configured and not opted out. */
export function isEnabled(): boolean {
  return Boolean(endpoint()) && !hasOptedOut();
}

function uuid(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  // Only reached on a browser without randomUUID. Good enough for a counting
  // identifier; it is not a security token.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface Stamped {
  id: string;
  at: number;
}

function readStamped(key: string, maxAgeMs: number): Stamped | null {
  const raw = getFlag(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Stamped;
    if (typeof parsed?.id !== "string" || typeof parsed?.at !== "number") return null;
    if (Date.now() - parsed.at > maxAgeMs) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** The rotating visitor id, minted or rotated as needed. */
export function visitorId(): string {
  const existing = readStamped(VISITOR_KEY, VISITOR_TTL_MS);
  if (existing) return existing.id;
  const fresh: Stamped = { id: uuid(), at: Date.now() };
  setFlag(VISITOR_KEY, JSON.stringify(fresh));
  return fresh.id;
}

/**
 * The current session id, refreshed on activity.
 *
 * Returns `{ id, isNew }` so the caller can emit `session_start` exactly once
 * per session without a second source of truth about when one began.
 */
export function sessionId(): { id: string; isNew: boolean } {
  const existing = readStamped(SESSION_KEY, SESSION_IDLE_MS);
  if (existing) {
    // Touch it, so a long study session does not expire mid-way.
    setFlag(SESSION_KEY, JSON.stringify({ id: existing.id, at: Date.now() }));
    return { id: existing.id, isNew: false };
  }
  const fresh: Stamped = { id: uuid(), at: Date.now() };
  setFlag(SESSION_KEY, JSON.stringify(fresh));
  return { id: fresh.id, isNew: true };
}

/**
 * Send one event. Never throws, never returns anything worth waiting for.
 *
 * `keepalive` lets the request outlive the page, which matters for the
 * completion events that fire as someone navigates away — without it the most
 * interesting events are the ones most likely to be lost.
 */
export function track(event: TelemetryEvent, payload: EventPayload = {}): void {
  try {
    if (!isEnabled()) return;
    if (typeof fetch !== "function") return;

    const { id: session } = sessionId();

    void fetch(endpoint(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event,
        visitorId: visitorId(),
        sessionId: session,
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? null,
        ...payload,
      }),
      keepalive: true,
      // Never send cookies. There are none to send, and this makes that a
      // property of the request rather than of the current cookie jar.
      credentials: "omit",
      mode: "cors",
    }).catch(() => {
      /* Telemetry failure is not a product failure. */
    });
  } catch {
    /* Nor is a storage failure, a blocked API, or a hostile extension. */
  }
}

/**
 * Emit `session_start` once per session.
 *
 * Separate from `track` because it is the one event whose timing is decided by
 * the session model rather than by something the learner did.
 */
export function startSession(): void {
  try {
    if (!isEnabled()) return;
    const { isNew } = sessionId();
    if (isNew) track("session_start");
  } catch {
    /* as above */
  }
}
