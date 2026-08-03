// Supabase Edge Function — permanent account deletion.
//
// Apple App Store guideline 5.1.1(v) requires that any app offering account
// creation also offers in-app account deletion. Deleting an auth user needs the
// service role key, which must never reach the client, so the operation runs
// here instead.
//
// Deleting the auth.users row is sufficient to remove everything: profiles,
// attempts, and review_cards all declare
// `references auth.users (id) on delete cascade` in migration 0001, so the
// database clears the user's data in the same transaction.
//
// Deploy:
//   supabase functions deploy delete-account
//
// The function is invoked with the caller's own JWT and derives the user id
// from it. It never accepts a user id as input, so one user cannot delete
// another.

import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  // Capacitor serves from capacitor:// and https://localhost; browsers send the
  // deployment origin. Echo only origins on the allow list, falling back to the
  // first configured one so a misconfigured caller fails closed.
  const allow =
    origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : (ALLOWED_ORIGINS[0] ?? "");
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
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

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing bearer token" }, 401, cors);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "Function is not configured" }, 500, cors);
  }

  // Identify the caller from their own token. The user id is never taken from
  // the request body.
  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error: userError,
  } = await caller.auth.getUser();

  if (userError || !user) {
    return json({ error: "Invalid or expired session" }, 401, cors);
  }

  // Service role client performs the delete. Cascades clear the user's rows.
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("delete-account failed", {
      userId: user.id,
      message: deleteError.message,
    });
    return json({ error: "Could not delete account" }, 500, cors);
  }

  return json({ deleted: true }, 200, cors);
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
