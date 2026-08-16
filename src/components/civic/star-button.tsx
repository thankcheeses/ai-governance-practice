"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  beginAuthorize,
  checkStarred,
  clearToken,
  isStarConfigured,
  readToken,
  setStarred,
  type StarState,
} from "@/lib/github/stars";

/**
 * Star the project's repository, as a control rather than a link.
 *
 * No repository URL is rendered and there is no "view on GitHub" affordance:
 * this is an action taken inside the app, not a way out of it.
 *
 * Four states, all reachable and all handled:
 *
 *  - **not configured** — renders nothing. The client id and the exchange
 *    endpoint are build-time values; without them the button could only ever
 *    fail, and a control that cannot work is worse than no control.
 *  - **not signed in to GitHub** — offers to connect, and says what that costs
 *    before the consent screen does, because `public_repo` is a broader grant
 *    than "star a repo" sounds and nobody should meet that wording first from
 *    GitHub.
 *  - **signed in, unstarred / starred** — a toggle, with the current state
 *    named in text as well as shown, and `aria-pressed` carrying it for
 *    assistive technology.
 *  - **error** — says so and stays usable, rather than pretending the last
 *    action succeeded.
 */
export function StarButton({ className }: { className?: string }) {
  const [state, setState] = useState<StarState | "loading">("loading");
  const [busy, setBusy] = useState(false);
  const configured = isStarConfigured();

  // Resolve the current state from whatever token this tab already holds.
  useEffect(() => {
    if (!configured) return;
    const token = readToken();
    if (!token) {
      setState("unauthenticated");
      return;
    }
    let cancelled = false;
    void checkStarred(token).then((next) => {
      if (cancelled) return;
      if (next === "unauthenticated") clearToken();
      setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [configured]);

  const connect = useCallback(() => {
    const redirectUri = `${window.location.origin}/github/callback`;
    const url = beginAuthorize(
      window.location.pathname + window.location.search,
      redirectUri,
    );
    if (url) window.location.assign(url);
  }, []);

  const toggle = useCallback(async () => {
    const token = readToken();
    if (!token) {
      setState("unauthenticated");
      return;
    }
    setBusy(true);
    const next = await setStarred(token, state !== "starred");
    if (next === "unauthenticated") clearToken();
    setState(next);
    setBusy(false);
  }, [state]);

  if (!configured || state === "loading") return null;

  if (state === "unauthenticated") {
    return (
      <div className={className}>
        <Button variant="outline" onClick={connect}>
          <StarGlyph filled={false} />
          Star this project on GitHub
        </Button>
        <p className="measure mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
          Connecting asks GitHub for the <code>public_repo</code> permission,
          which is the narrowest scope GitHub offers for starring — it also
          allows writing to your public repositories, so decline if you would
          rather not grant that. Nothing else in the app needs it, and your
          study progress is a separate account.
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className={className}>
        <Button variant="outline" onClick={() => void toggle()} disabled={busy}>
          <StarGlyph filled={false} />
          Try starring again
        </Button>
        <p role="alert" className="measure mt-2 text-[0.8125rem] leading-relaxed text-destructive">
          GitHub did not accept that. If you declined the{" "}
          <code>public_repo</code> permission, starring from here will not work
          until it is granted.
        </p>
      </div>
    );
  }

  const starred = state === "starred";
  return (
    <div className={className}>
      <Button
        variant={starred ? "secondary" : "outline"}
        onClick={() => void toggle()}
        disabled={busy}
        aria-pressed={starred}
      >
        <StarGlyph filled={starred} />
        {busy ? "Working…" : starred ? "Starred" : "Star this project"}
      </Button>
      {/* The state is named in text, not carried by the glyph's fill alone. */}
      <p className="mt-2 text-[0.8125rem] text-muted-foreground">
        {starred
          ? "You have starred this project. Select again to unstar."
          : "Not starred yet."}
      </p>
    </div>
  );
}

/**
 * Drawn inline rather than pulled from an icon set, matching the rest of the
 * app. `aria-hidden` — the button's own label and `aria-pressed` carry the
 * state.
 */
function StarGlyph({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.15 1 5.85L12 17l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9z" />
    </svg>
  );
}
