"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND } from "@/lib/brand";
import { useProgress } from "@/lib/store/progress-provider";
import { getBrowserSupabase } from "@/lib/supabase/client";

/**
 * Where a password-reset link lands.
 *
 * Supabase puts a recovery token in the URL fragment and the browser client
 * exchanges it for a short-lived session on load, which is what authorises the
 * password change. So this page has to wait for that exchange before it can
 * say whether the link is usable — rendering the form immediately would offer
 * a control that cannot work yet.
 *
 * Deliberately outside `AppGate`, like `/login`: someone resetting a password
 * has not necessarily completed onboarding, and bouncing them into it would
 * strand them with a live token they cannot spend.
 */
export default function ResetPage() {
  const router = useRouter();
  const { authEnabled } = useProgress();

  const [ready, setReady] = useState(false);
  const [linkValid, setLinkValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setReady(true);
      return;
    }
    let cancelled = false;

    /*
      Two ways the session can arrive: it is already established by the time
      this runs, or the client is still parsing the fragment and announces it
      through PASSWORD_RECOVERY / SIGNED_IN. Watch for both, because which one
      happens is a race with the client's own initialisation.
    */
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled || !session) return;
      setLinkValid(true);
      setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) setLinkValid(true);
      setReady(true);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    if (password !== confirm) {
      setError("Those two passwords do not match.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
      setDone(true);
      // The recovery session is a real session, so they are already signed in.
      setTimeout(() => router.replace("/home"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-7">
        <span className="font-serif text-[1.0625rem] font-medium italic tracking-[-0.01em]">
          {BRAND.name}
        </span>
      </div>

      <Card>
        <CardContent className="p-5">
          {!authEnabled ? (
            <>
              <h1 className="font-semibold">Accounts are not configured</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                This deployment has no Supabase credentials, so there is no
                password to reset. Your progress is saved in this browser.
              </p>
              <Button asChild className="mt-5 w-full">
                <Link href="/home">Continue</Link>
              </Button>
            </>
          ) : !ready ? (
            <div className="flex items-center gap-2.5 py-4 text-sm text-muted-foreground">
              Checking your link…
            </div>
          ) : done ? (
            <>
              <h1 className="text-[2rem] leading-[1.15] sm:text-[2.25rem]">
                Password changed
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                You are signed in. Taking you to your practice now.
              </p>
            </>
          ) : !linkValid ? (
            <>
              <h1 className="text-[2rem] leading-[1.15] sm:text-[2.25rem]">
                This link has expired
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Reset links are single-use and last about an hour. Ask for a
                fresh one and it will work.
              </p>
              <Button asChild className="mt-5 w-full">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-[2rem] leading-[1.15] sm:text-[2.25rem]">
                Choose a new password
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Once you save it you will be signed in.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Type it again"
                  />
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="border border-l-4 border-destructive bg-destructive-tint p-3 text-sm text-destructive"
                  >
                    {error}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={pending}
                >
                  Save new password
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
