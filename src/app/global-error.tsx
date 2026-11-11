"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary, for a failure in the root layout itself.
 *
 * This replaces the whole document, so it has to supply its own `<html>` and
 * `<body>`. It also cannot assume the app's stylesheet or theme variables
 * loaded — the root layout is what wires those up, and the root layout is what
 * just failed — so every style here is inline and self-contained, and the two
 * themes are handled by a `prefers-color-scheme` block rather than by the
 * `data-theme` attribute the app normally sets.
 *
 * If this file ever needs an import from `src/lib` or `src/components`, that is
 * a sign it has stopped being a last resort.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  /*
    The colours below are literal copies of the default palette's `background`
    and `foreground`, in both modes. They cannot read the tokens: this component
    renders when the app failed to start, which includes the case where the
    stylesheet never loaded. src/lib/palette.test.ts holds them to
    src/lib/palette.ts, so a palette change cannot leave this screen on the old
    scheme without failing the suite.
  */
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.5rem",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#f7f5ff",
          color: "#1b1733",
        }}
      >
        <style>{`
          @media (prefers-color-scheme: dark) {
            body { background: #121026 !important; color: #ece9f7 !important; }
            a, button { border-color: #2e2756 !important; color: inherit !important; }
          }
        `}</style>
        <main style={{ maxWidth: "34rem" }}>
          <h1 style={{ fontSize: "1.5rem", lineHeight: 1.2, margin: "0 0 0.75rem" }}>
            The app failed to start
          </h1>
          <p style={{ margin: "0 0 1.5rem", lineHeight: 1.6, opacity: 0.85 }}>
            Your saved progress lives on this device and has not been touched.
            Reloading usually clears this.
          </p>
          {error.digest ? (
            <p
              style={{
                margin: "0 0 1.5rem",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                opacity: 0.7,
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              font: "inherit",
              fontSize: "0.875rem",
              padding: "0.625rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid currentColor",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
