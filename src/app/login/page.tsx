"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/app/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND } from "@/lib/brand";
import { useProgress } from "@/lib/store/progress-provider";
import { getBrowserSupabase } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

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
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
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
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>

      <div className="mb-7 flex items-center gap-2.5">
        <BrandMark />
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
            <h1 className="text-xl font-semibold tracking-tight">
              {mode === "signin" ? "Sign in" : "Create your account"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === "signin"
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

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
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

              {error ? (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive-tint p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}

              {notice ? (
                <p className="rounded-md border border-accent/40 bg-accent-tint p-3 text-sm text-primary">
                  {notice}
                </p>
              ) : null}

              <Button type="submit" size="lg" className="w-full" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
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
                : "Already have an account? Sign in"}
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
