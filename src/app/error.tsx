"use client";

import { useEffect } from "react";

/**
 * Route-level error boundary.
 *
 * Until this existed, a render error on the static export left a blank page:
 * no message, no way back, and no signal that anything had gone wrong. On a
 * study tool that keeps progress in the browser, a blank page also reads as
 * "my history is gone", which is the wrong thing to make someone believe — so
 * the copy says plainly that it is not.
 *
 * Deliberately dependency-light. It imports no provider, no app shell and no
 * content: the boundary catches failures in exactly those things, and a
 * fallback that needs the thing that just broke is not a fallback. Styling is
 * theme tokens only, which are plain CSS variables set on `<html>` before
 * first paint and so survive any React failure.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Console only. There is no telemetry in the product yet, and adding a
    // network call here would mean the error path depends on the network.
    console.error("Route error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        Something broke
      </p>
      <h1 className="text-[1.875rem] leading-[1.15]">This screen failed to load</h1>
      <p className="measure mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
        Your progress is stored on this device and has not been affected. Try
        again, and if it keeps happening, go back to the home screen.
      </p>

      {error.digest ? (
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Try again
        </button>
        {/*
          A plain anchor, not next/link. Client-side navigation runs through the
          router that may itself be the thing that failed; a full document load
          is the one navigation guaranteed to work from here.
        */}
        <a
          href="./"
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground no-underline transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Back to start
        </a>
      </div>
    </main>
  );
}
