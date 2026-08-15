import {
  type CompletedResult,
  elapsedMs,
  formatDuration,
  scoreResult,
  timeRemainingAtFinish,
  weakestSubdomains,
} from "./results";
import { SUBDOMAINS } from "@/content/bok";
import { SUPABASE_ANON_KEY } from "@/lib/supabase/config";

/**
 * Sending a result to yourself.
 *
 * The shape of this module is decided by three constraints that already exist
 * in the project, not by preference:
 *
 *  1. **There is no server.** The repository has no route handlers, and the
 *     mobile target builds with `output: "export"`, which drops them. Anything
 *     that only worked on the Vercel build would be a feature that silently
 *     does not exist in the app.
 *  2. **No secret can live in the client.** Every `NEXT_PUBLIC_*` value is
 *     inlined into the bundle at build time, as `.env.example` says in as many
 *     words. So a provider API key cannot be added here, and no provider SDK
 *     is introduced.
 *  3. **The address is the user's.** It is typed deliberately, used once, and
 *     never stored, defaulted, pre-filled from an account, or logged.
 *
 * What is left is a single configured endpoint that the client posts to. The
 * endpoint holds the credentials and does the sending; this module knows only
 * its URL. When it is not configured the feature reports itself unavailable
 * rather than pretending to have sent anything — the PDF download needs no
 * backend and remains the route that always works.
 *
 * The reference implementation for the endpoint is a Supabase Edge Function,
 * documented in `.env.example`, because Supabase is already an optional
 * dependency of this project and adding a second vendor for one feature is
 * not warranted.
 */

/** Configured at build time; absent in a default install. */
export function emailEndpoint(): string | null {
  const url = process.env.NEXT_PUBLIC_RESULTS_EMAIL_ENDPOINT;
  return url && url.trim() ? url.trim() : null;
}

/**
 * The bearer the endpoint is called with.
 *
 * Supabase Edge Functions are deployed with `verify_jwt = true` by default, and
 * the gateway rejects an unauthenticated call with 401 **before the function
 * body runs** — so a missing header looks exactly like a broken function, and
 * the function's own secrets are never even read.
 *
 * The publishable/anon key is the right credential to send. It is already
 * public: it is inlined into this bundle at build time, and `.env.example`
 * describes it as the key intended to reach browsers. Sending it discloses
 * nothing that shipping the app does not already disclose, and it keeps the
 * gateway check switched on — an email endpoint with `verify_jwt` disabled is a
 * spam relay open to anyone who finds the URL.
 *
 * The provider's key stays where it belongs, in the function's own secrets, and
 * never appears in client code or in any NEXT_PUBLIC_ variable.
 */
function endpointKey(): string | null {
  return SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY : null;
}

/**
 * Both the endpoint URL and the key are needed. Reporting "configured" without
 * the key would produce a button that always fails with a 401 the user cannot
 * act on.
 */
export function isEmailConfigured(): boolean {
  return emailEndpoint() !== null && endpointKey() !== null;
}

/**
 * Deliberately permissive, and deliberately not RFC 5322.
 *
 * The only thing worth catching here is a typo the user can see and fix — a
 * missing @, a trailing comma, an unfinished domain. Real validity is decided
 * by whether the message arrives, and a stricter pattern would reject valid
 * addresses while catching nothing extra.
 */
export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (email.length < 6 || email.length > 254) return false;
  if (/\s/.test(email)) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(email);
}

/* ------------------------------------------------------------------ */
/* What gets sent                                                      */
/* ------------------------------------------------------------------ */

/**
 * The summary body.
 *
 * Scores and study pointers only. No answer key: it lists which questions were
 * missed and what to review, and never which option was correct — an emailed
 * answer key is a copy of the bank leaving the app in plain text, and it would
 * make the message worth intercepting.
 */
export function emailBody(result: CompletedResult): string {
  const score = scoreResult(result);
  const lines: string[] = [];
  const isExam = result.mode === "exam";

  lines.push(isExam ? "AIGP Practice Exam — results" : "AIGP Practice Session — results");
  lines.push("");
  lines.push(
    "A practice simulation over independently authored questions. Not a " +
      "certification exam and not affiliated with any certification body. " +
      "This score describes this sitting only.",
  );
  lines.push("");
  lines.push(`Sitting:      ${result.label}`);
  lines.push(`Reference:    ${result.sittingId}`);
  lines.push(`Completed:    ${new Date(result.completedAt).toISOString().slice(0, 16).replace("T", " ")} UTC`);
  if (result.reason === "expired") lines.push("Closed by:    the time limit expiring");
  lines.push("");
  lines.push(`Score:        ${score.correct} / ${score.total} (${score.percentage}%)`);
  lines.push(`Correct:      ${score.correct}`);
  lines.push(`Incorrect:    ${score.incorrect}`);
  lines.push(`Unanswered:   ${score.unanswered}`);
  if (isExam) lines.push(`Flagged:      ${score.flaggedCount}`);
  lines.push(`Time used:    ${formatDuration(elapsedMs(result))}`);
  const left = timeRemainingAtFinish(result);
  if (left !== null) lines.push(`Time left:    ${formatDuration(left)}`);

  if (score.byDomain.length) {
    lines.push("", "Domain performance");
    for (const d of score.byDomain) {
      lines.push(`  ${d.roman}  ${d.correct}/${d.total} (${d.accuracy}%)  ${d.label}`);
    }
  }

  if (score.bySubdomain.length) {
    lines.push("", "Sub-domain performance");
    for (const s of score.bySubdomain) {
      lines.push(`  ${s.key}  ${s.correct}/${s.total} (${s.accuracy}%)`);
    }
  }

  const weak = weakestSubdomains(score);
  if (weak.length) {
    lines.push("", "Where to study next");
    for (const s of weak) {
      const meta = SUBDOMAINS.find((x) => x.id === s.key);
      lines.push(`  ${s.key} — ${meta?.competency ?? s.key} (${s.correct}/${s.total})`);
      if (meta?.recommendation) lines.push(`    ${meta.recommendation}`);
    }
  }

  lines.push("", `${score.missedIds.length} question(s) to revisit. Open the app to review them with rationales.`);
  return lines.join("\n");
}

/** A one-line description of what leaves the device, shown before sending. */
export function emailDisclosure(result: CompletedResult): string {
  const score = scoreResult(result);
  return (
    `Your score (${score.correct}/${score.total}), the domain and sub-domain ` +
    `breakdown, the time you took, and how many questions to revisit. ` +
    `No answer key and no question text is included, and your address is used ` +
    `once to send this message and is not stored by the app.`
  );
}

/* ------------------------------------------------------------------ */
/* Sending                                                             */
/* ------------------------------------------------------------------ */

export type SendOutcome =
  | { ok: true }
  | { ok: false; reason: "unconfigured" | "invalid-email" | "failed"; message: string };

export interface SendDeps {
  fetch?: typeof fetch;
  endpoint?: string | null;
  /** Injectable so the authorization contract can be asserted in a test. */
  key?: string | null;
}

/**
 * Post the summary to the configured endpoint.
 *
 * Errors are reported as outcomes rather than thrown, and never carry the
 * address or the body — a rejected send must not put either into an error
 * string that something else might log.
 */
export async function sendResultByEmail(
  result: CompletedResult,
  email: string,
  deps: SendDeps = {},
): Promise<SendOutcome> {
  const endpoint = deps.endpoint === undefined ? emailEndpoint() : deps.endpoint;
  const key = deps.key === undefined ? endpointKey() : deps.key;
  if (!endpoint || !key) {
    return {
      ok: false,
      reason: "unconfigured",
      message:
        "Email delivery is not configured for this build. Download the PDF instead.",
    };
  }
  if (!isValidEmail(email)) {
    return {
      ok: false,
      reason: "invalid-email",
      message: "That does not look like an email address.",
    };
  }

  const doFetch = deps.fetch ?? (typeof fetch !== "undefined" ? fetch : null);
  if (!doFetch) {
    return { ok: false, reason: "failed", message: "Sending is unavailable here." };
  }

  const score = scoreResult(result);
  try {
    const response = await doFetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // The gateway accepts the legacy `eyJ…` JWT on Authorization and the
        // newer `sb_publishable_…` format on apikey. Sending both works for
        // either, and costs one header.
        authorization: `Bearer ${key}`,
        apikey: key,
      },
      body: JSON.stringify({
        to: email.trim(),
        subject: `Your AIGP ${result.mode === "exam" ? "practice exam" : "practice session"} results`,
        text: emailBody(result),
        // A compact, machine-readable copy so an endpoint can build its own
        // template without re-deriving anything. Still no answer key.
        summary: {
          mode: result.mode,
          sittingId: result.sittingId,
          completedAt: result.completedAt,
          total: score.total,
          correct: score.correct,
          incorrect: score.incorrect,
          unanswered: score.unanswered,
          percentage: score.percentage,
          elapsedMs: elapsedMs(result),
        },
      }),
    });
    if (!response.ok) {
      /*
        Two very different failures used to share one message here, and the
        message named the wrong one.

        A 401 is the Supabase gateway refusing the call before the function
        runs. A 403, however, is almost always the *mail provider* refusing —
        the function passes the provider's status through deliberately, so an
        unverified sending domain arrives as 403 and used to be reported as a
        gateway rejection. That sent the reader to check a credential that was
        never consulted, which is the exact confusion the pass-through exists
        to prevent.

        The function also returns the provider's own words in `detail`. Surface
        them: they name the real problem far better than anything guessed here.
      */
      const detail = await response
        .json()
        .then((b: unknown) =>
          b && typeof b === "object" && "detail" in b
            ? String((b as { detail: unknown }).detail).slice(0, 200)
            : "",
        )
        .catch(() => "");

      let message: string;
      if (response.status === 401) {
        message =
          "The endpoint rejected the request (401) before it reached the mail " +
          "function. Nothing was sent.";
      } else if (response.status === 403) {
        message =
          "The mail provider refused the message (403). This is usually a " +
          "sending domain that has not been verified yet. Nothing was sent.";
      } else {
        message = `Sending failed (${response.status}). Nothing was sent.`;
      }
      return {
        ok: false,
        reason: "failed",
        message: detail ? `${message} Provider said: ${detail}` : message,
      };
    }
    return { ok: true };
  } catch {
    // The thrown error may quote the request, address included. It is not
    // logged and not surfaced.
    return {
      ok: false,
      reason: "failed",
      message: "Sending failed. Check your connection and try again.",
    };
  }
}
