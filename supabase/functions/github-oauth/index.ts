// Supabase Edge Function — GitHub OAuth code exchange.
//
// The app has no server. There are no route handlers, and the mobile target
// builds with `output: "export"`, which would drop them anyway. GitHub's web
// OAuth flow requires exchanging the authorization code for a token using the
// client *secret*, and a secret cannot live in a browser bundle — every
// NEXT_PUBLIC_* value is inlined at build time. So the exchange runs here.
//
// This is deliberately independent of Supabase Auth. Using Supabase's own
// GitHub provider would have been less code, but `signInWithOAuth` replaces
// the current session: a learner signed in with email and password would be
// signed out of the account holding their progress and into a separate GitHub
// identity, potentially orphaning it. Starring a repository must not be able
// to cost someone their study history, so the two authentications stay
// completely separate and this function issues a token that is only ever used
// against api.github.com.
//
// Deploy:
//   supabase functions deploy github-oauth --no-verify-jwt
//   supabase secrets set GITHUB_CLIENT_ID=... GITHUB_CLIENT_SECRET=... \
//     ALLOWED_ORIGINS="https://your-domain,capacitor://localhost,https://localhost"
//
// `--no-verify-jwt` is correct here and is not the spam-relay hazard the mail
// endpoint would have been: this function takes a single-use GitHub
// authorization code, and a caller without a valid one gets nothing. Requiring
// a Supabase JWT would also mean nobody could star without first holding a
// progress account, which is the coupling the whole design avoids.

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const allow =
    origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : (ALLOWED_ORIGINS[0] ?? "");
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, cors);
  }

  const clientId = Deno.env.get("GITHUB_CLIENT_ID");
  const clientSecret = Deno.env.get("GITHUB_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    // Named explicitly so a missing secret is never mistaken for the user
    // having declined the consent screen.
    return json(
      { error: "GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is not set" },
      500,
      cors,
    );
  }

  let code: unknown;
  let redirectUri: unknown;
  try {
    ({ code, redirect_uri: redirectUri } = await req.json());
  } catch {
    return json({ error: "Body must be JSON" }, 400, cors);
  }
  if (typeof code !== "string" || !code) {
    return json({ error: "Missing authorization code" }, 400, cors);
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      ...(typeof redirectUri === "string" && redirectUri
        ? { redirect_uri: redirectUri }
        : {}),
    }),
  });

  const payload = await response.json().catch(() => null);

  // GitHub answers 200 with an `error` field when the code is bad, so the
  // status alone is not enough to tell success from failure.
  if (!response.ok || !payload || typeof payload.access_token !== "string") {
    return json(
      { error: "Could not complete GitHub sign-in. Try again." },
      400,
      cors,
    );
  }

  // The token is returned to the caller and never stored, and nothing about it
  // is logged — an access token in a log is a credential in a log.
  return json({ access_token: payload.access_token }, 200, cors);
});
