"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DimensionalMark } from "@/components/civic/dimensional-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND } from "@/lib/brand";
import { useProgress } from "@/lib/store/progress-provider";
import { getBrowserSupabase } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "reset";

/** Where an emailed auth link should return the user. */
function authRedirectUrl(path: "/login" | "/reset"): string | undefined {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return `${configured.replace(/\/$/, "")}${path}`;
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return undefined;
}

export default function LoginPage() {
  const router = useRouter();
  const { authEnabled } = useProgress();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    setPending(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === "reset") {
        /*
          The response is deliberately identical whether or not the address has
          an account. Supabase does not distinguish them either, and it must
          not: a reset form that says "no such user" is an account-enumeration
          oracle anyone can query.
        */
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          { redirectTo: authRedirectUrl("/reset") },
        );
        if (resetError) throw resetError;
        setNotice(
          "If that address has an account, a reset link is on its way. The link expires in an hour.",
        );
        return;
      }
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          // Without this, confirmation links go to the project's default Site
          // URL, which is wrong inside a native WebView. NEXT_PUBLIC_SITE_URL
          // is baked in at build time so the mobile bundle can point at a
          // reachable https origin rather than the app scheme.
          options: { emailRedirectTo: authRedirectUrl("/login") },
        });
        if (signUpError) throw signUpError;
        // With email confirmation on, there is no session until confirmed.
        if (!data.session) {
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
      router.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6 self-start">
        <Link href="/home">
          Back
        </Link>
      </Button>

      <div className="mb-7 flex items-center gap-2.5">
        <DimensionalMark name="brand" size="md" />
        <span className="text-[0.9375rem] font-semibold tracking-tight">
          {BRAND.name}
        </span>
      </div>

      {!authEnabled ? (
        <Card>
          <CardContent className="p-5">
            <h1 className="font-semibold">Accounts are not configured</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This deployment has no Supabase credentials, so sign-in is
              unavailable. Your progress is saved in this browser and everything
              else works normally. See the README for setup instructions.
            </p>
            <Button asChild className="mt-5 w-full">
              <Link href="/home">Continue without an account</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5">
            <h1 className="text-[2rem] leading-[1.15] sm:text-[2.25rem]">
              {mode === "reset"
                ? "Reset your password"
                : mode === "signin"
                  ? "Sign in"
                  : "Create your account"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === "reset"
                ? "We will email you a link to choose a new one."
                : mode === "signin"
                  ? "Sync your progress across devices."
                  : "Progress from this browser carries over to your new account."}
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              {/* No password on the reset form — the address is the whole ask. */}
              {mode !== "reset" ? (
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <Label htmlFor="password">Password</Label>
                    {mode === "signin" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("reset");
                          setError(null);
                          setNotice(null);
                        }}
                        className="text-xs font-medium text-link underline decoration-link/40 underline-offset-4 transition-colors hover:text-link-hover hover:decoration-link-hover"
                      >
                        Forgot password?
                      </button>
                    ) : null}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={
                      mode === "signin" ? "current-password" : "new-password"
                    }
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
              ) : null}

              {error ? (
                <p
                  role="alert"
                  className="border border-l-4 border-destructive bg-destructive-tint p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}

              {notice ? (
                <p className="border border-l-4 border-success bg-success-tint p-3 text-sm text-success">
                  {notice}
                </p>
              ) : null}

              <Button type="submit" size="lg" className="w-full" disabled={pending}>
                {mode === "reset"
                  ? "Send reset link"
                  : mode === "signin"
                    ? "Sign in"
                    : "Create account"}
              </Button>

              {/* Shown on sign-up, where the agreement is actually formed. */}
              {mode === "signup" ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  By creating an account you agree to our{" "}
                  <Link
                    href="/terms"
                    className="font-medium text-link underline decoration-link/40 underline-offset-4 transition-colors hover:text-link-hover hover:decoration-link-hover"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-medium text-link underline decoration-link/40 underline-offset-4 transition-colors hover:text-link-hover hover:decoration-link-hover"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              ) : null}
            </form>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setNotice(null);
              }}
              className="mt-4 w-full text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {mode === "signin"
                ? "No account? Create one"
                : mode === "signup"
                  ? "Already have an account? Sign in"
                  : "Back to sign in"}
            </button>
          </CardContent>
        </Card>
      )}

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        Independent educational product. Not affiliated with any certification
        body.
      </p>
    </div>
  );
}
