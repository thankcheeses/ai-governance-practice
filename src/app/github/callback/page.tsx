"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { appUrl } from "@/lib/base-path";
import { consumeReturnTo, consumeState, exchangeCode, storeToken } from "@/lib/github/stars";

/**
 * Where GitHub returns after the consent screen.
 *
 * This page holds no UI worth looking at — it exchanges the code and sends the
 * user back where they were. It exists because the OAuth redirect has to land
 * somewhere, and the app has no server to land it on.
 *
 * `state` is checked before the code is spent. Without that check a third
 * party could hand this page a code of their choosing and bind the tab to an
 * account they control; the check fails closed, so a missing or mismatched
 * state is refused rather than ignored.
 */
export default function GitHubCallbackPage() {
  return (
    <Suspense fallback={<Status text="Finishing GitHub sign-in…" />}>
      <Callback />
    </Suspense>
  );
}

function Callback() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const returnedState = params.get("state");

    // The user declined on GitHub's screen. Not an error — go back quietly.
    if (params.get("error")) {
      router.replace(consumeReturnTo());
      return;
    }

    if (!consumeState(returnedState)) {
      setError(
        "That sign-in could not be verified, so it was stopped. Start again from the app.",
      );
      return;
    }
    if (!code) {
      setError("GitHub did not return an authorization code. Try again.");
      return;
    }

    // Must match the redirect_uri sent to the authorize step exactly, base path
    // included — GitHub compares the two and rejects a mismatch.
    const redirectUri = appUrl("/github/callback");
    if (!redirectUri) return;
    void exchangeCode(code, redirectUri).then((result) => {
      if (!result.ok) {
        setError(result.message);
        return;
      }
      storeToken(result.token);
      router.replace(consumeReturnTo());
    });
  }, [params, router]);

  if (error) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
        <h1 className="text-[1.5rem] leading-tight">GitHub sign-in stopped</h1>
        <p role="alert" className="measure mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
          {error}
        </p>
      </div>
    );
  }

  return <Status text="Finishing GitHub sign-in…" />;
}

function Status({ text }: { text: string }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <p className="text-[0.9375rem] text-muted-foreground">{text}</p>
    </div>
  );
}
