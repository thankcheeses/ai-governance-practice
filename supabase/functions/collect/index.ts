/**
 * Telemetry ingest.
 *
 * The browser posts an event here; this function decides what is allowed to be
 * stored and writes it. The client is never trusted with geography, device
 * class or referrer category — it reports what it is doing, and everything
 * about *who and where* is derived here from request metadata and immediately
 * coarsened.
 *
 * The rule that matters: **the IP address never leaves this function.** It is
 * read from the request headers, mapped to a country and region, and dropped.
 * There is no column for it in telemetry.events, so there is nowhere for it to
 * be written even by mistake.
 *
 * Deployment:
 *   supabase functions deploy collect --no-verify-jwt
 *
 * `--no-verify-jwt` is required and is not a weakening: the whole point is that
 * signed-out visitors are counted, so there is no JWT to verify. Authorisation
 * for *writing* comes from the service-role key, which lives in this
 * function's own secrets and never reaches a browser.
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const EVENTS = new Set([
  "session_start",
  "page_view",
  "study_started",
  "study_completed",
  "question_answered",
  "review_started",
  "review_completed",
  "exam_started",
  "exam_completed",
  "exam_abandoned",
  "client_error",
  "api_error",
]);

const DEVICES = new Set(["mobile", "tablet", "desktop"]);
const REFERRERS = new Set(["direct", "search", "github", "linkedin", "x", "other"]);
const MODES = new Set(["practice", "domain", "review", "exam"]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DOMAIN = /^(I|II|III|IV)$/;
const SUBDOMAIN = /^(I|II|III|IV)\.[A-D]$/;

function corsHeaders(origin: string | null): HeadersInit {
  // Echo the origin only when it is one we published to. A wildcard would let
  // any site on the internet write rows into this table.
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

/**
 * Device class from the User-Agent.
 *
 * Three buckets, chosen because they are the three that change how the product
 * should be built. Anything finer is fingerprinting surface for no decision.
 */
function deviceOf(ua: string): string | null {
  if (!ua) return null;
  const s = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(s)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/.test(s)) return "mobile";
  return "desktop";
}

/** Family only — never a version. A version number is a fingerprinting bit. */
function browserOf(ua: string): string | null {
  if (!ua) return null;
  const s = ua.toLowerCase();
  if (s.includes("edg/")) return "edge";
  if (s.includes("opr/") || s.includes("opera")) return "opera";
  if (s.includes("firefox")) return "firefox";
  if (s.includes("chrome") || s.includes("crios")) return "chrome";
  if (s.includes("safari")) return "safari";
  return "other";
}

function osOf(ua: string): string | null {
  if (!ua) return null;
  const s = ua.toLowerCase();
  if (s.includes("windows")) return "windows";
  if (s.includes("android")) return "android";
  if (/iphone|ipad|ipod|ios/.test(s)) return "ios";
  if (s.includes("mac os")) return "macos";
  if (s.includes("linux")) return "linux";
  return "other";
}

/**
 * Referrer reduced to a category.
 *
 * The full URL is deliberately discarded rather than stored and trimmed later:
 * a referring URL can carry search terms, campaign parameters, and on some
 * sites a username in the path. None of that is needed to answer "where did
 * people come from", so none of it is kept.
 */
function referrerOf(referrer: string | null): string {
  if (!referrer) return "direct";
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "other";
  }
  if (/(^|\.)github\.com$/.test(host)) return "github";
  if (/(^|\.)linkedin\.com$/.test(host) || host === "lnkd.in") return "linkedin";
  if (/(^|\.)(x|twitter)\.com$/.test(host) || host === "t.co") return "x";
  if (/(^|\.)(google|bing|duckduckgo|ecosia|yahoo|brave)\./.test(host)) return "search";
  return "other";
}

/**
 * Geography from platform headers, coarsened.
 *
 * Supabase/Cloudflare put the resolved country on the request, so no IP lookup
 * is needed in the common case and the address is never even examined. Region
 * is kept only for the US, which is the only subdivision the dashboard reports.
 */
function geoOf(req: Request): { country: string | null; region: string | null } {
  const h = req.headers;
  const country =
    h.get("cf-ipcountry") ??
    h.get("x-vercel-ip-country") ??
    h.get("x-country-code") ??
    null;
  const region =
    h.get("cf-region-code") ?? h.get("x-vercel-ip-country-region") ?? null;

  const cc = country && /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : null;
  // "T1" is Cloudflare's code for Tor exit nodes and is not a country.
  if (!cc || cc === "XX" || cc === "T1") return { country: null, region: null };

  return {
    country: cc,
    region: cc === "US" && region && /^[A-Za-z]{2}$/.test(region)
      ? region.toUpperCase()
      : null,
  };
}

/** Accept only what the schema allows; drop anything else silently. */
function pick<T>(value: unknown, allowed: Set<string>): T | null {
  return typeof value === "string" && allowed.has(value) ? (value as T) : null;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405, headers: cors });
  }
  if (origin && ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response("origin not allowed", { status: 403, headers: cors });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("bad request", { status: 400, headers: cors });
  }

  const event = typeof body.event === "string" ? body.event : "";
  if (!EVENTS.has(event)) {
    return new Response("unknown event", { status: 400, headers: cors });
  }

  const visitorId = typeof body.visitorId === "string" ? body.visitorId : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  if (!UUID.test(visitorId) || !UUID.test(sessionId)) {
    return new Response("bad identifiers", { status: 400, headers: cors });
  }

  const ua = req.headers.get("user-agent") ?? "";
  const { country, region } = geoOf(req);

  const duration = Number(body.durationMs);
  const row = {
    visitor_id: visitorId,
    session_id: sessionId,
    event,
    mode: pick<string>(body.mode, MODES),
    domain: typeof body.domain === "string" && DOMAIN.test(body.domain) ? body.domain : null,
    subdomain:
      typeof body.subdomain === "string" && SUBDOMAIN.test(body.subdomain)
        ? body.subdomain
        : null,
    correct: typeof body.correct === "boolean" ? body.correct : null,
    duration_ms:
      Number.isFinite(duration) && duration >= 0 && duration <= 86_400_000
        ? Math.round(duration)
        : null,
    country,
    region,
    device: deviceOf(ua),
    os_family: osOf(ua),
    browser_family: browserOf(ua),
    // Derived here from the Referer header, not taken from the payload: a
    // client-supplied value could carry a full URL with query parameters.
    referrer_kind: pick<string>(body.referrerKind, REFERRERS) ??
      referrerOf(req.headers.get("referer")),
    app_version: typeof body.appVersion === "string" ? body.appVersion.slice(0, 40) : null,
  };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    // Service role, from this function's own secrets. It bypasses RLS, which
    // is what lets it write to a table no browser role can touch.
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { error } = await supabase.schema("telemetry").from("events").insert(row);
  if (error) {
    // Logged, not returned. The client ignores the response either way, and a
    // detailed database error is not something to hand to an anonymous caller.
    console.error("collect insert failed:", error.message);
    return new Response(null, { status: 204, headers: cors });
  }

  return new Response(null, { status: 204, headers: cors });
});
