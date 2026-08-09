// Supabase Edge Function — send a results summary by email.
//
// The mail provider's API key must never reach the browser, so the send happens
// here. The client posts a summary it has already assembled; this function adds
// the credential and forwards it.
//
// Deploy:
//   supabase functions deploy resend-email
//
// Required secrets (Project Settings -> Edge Functions -> Secrets):
//   RESEND_API_KEY   the provider key. Never returned, never logged.
//   RESEND_FROM      a verified sender, e.g. "AIGP Practice <results@your.domain>"
//   ALLOWED_ORIGINS  comma-separated browser origins permitted to call this
//
// ---------------------------------------------------------------------------
// On authorization, because this is where a 401 comes from
//
// Functions deploy with `verify_jwt = true` by default. The platform gateway
// checks for a bearer token and rejects the request with 401 **before this
// module is entered** — so an unauthenticated call never reads a secret, never
// contacts the provider, and produces a 401 that looks exactly like a provider
// authentication failure while having nothing to do with one.
//
// The client therefore sends the publishable/anon key, which is public by
// design and already inlined into its bundle. Leave `verify_jwt` on: an
// email-sending endpoint that anyone can call without a credential is a spam
// relay, and the gateway check is the only thing standing in front of it.

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  // Echo only origins on the allow list, falling back to the first configured
  // one so a misconfigured caller fails closed rather than open.
  const allow =
    origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : (ALLOWED_ORIGINS[0] ?? "");
  return {
    "Access-Control-Allow-Origin": allow,
    // `apikey` is required here: the browser preflights it, and without it
    // listed the send fails at the preflight with an opaque CORS error.
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(
  body: unknown,
  status: number,
  cors: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

interface Payload {
  to?: unknown;
  subject?: unknown;
  text?: unknown;
}

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, cors);
  }

  /*
    Configuration is checked before anything else and named explicitly in the
    response. A missing secret previously surfaced as a generic failure, which
    is how it gets mistaken for an authentication problem — the one thing worth
    spending a branch on is making the two impossible to confuse.
  */
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return json(
      { error: "RESEND_API_KEY is not set on this function" },
      500,
      cors,
    );
  }
  const from = Deno.env.get("RESEND_FROM");
  if (!from) {
    return json({ error: "RESEND_FROM is not set on this function" }, 500, cors);
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return json({ error: "Body must be JSON" }, 400, cors);
  }

  const { to, subject, text } = payload;
  if (!isNonEmptyString(to) || !isNonEmptyString(subject) || !isNonEmptyString(text)) {
    return json(
      { error: "to, subject and text are all required" },
      400,
      cors,
    );
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
  } catch {
    // The thrown error can quote the request, recipient included.
    return json({ error: "Could not reach the mail provider" }, 502, cors);
  }

  if (!response.ok) {
    /*
      Pass the provider's own status and message through. A provider-side
      failure — an unverified sender, a revoked key, a rate limit — should
      arrive as itself rather than as a generic 500, so it is fixed where it
      actually is.
    */
    const detail = await response.text().catch(() => "");
    return json(
      { error: "The mail provider rejected the message", detail: detail.slice(0, 500) },
      response.status,
      cors,
    );
  }

  // Deliberately nothing about the recipient or the body is logged or returned.
  return json({ ok: true }, 200, cors);
});
