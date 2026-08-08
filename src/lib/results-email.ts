import {
  type CompletedResult,
  elapsedMs,
  formatDuration,
  scoreResult,
  timeRemainingAtFinish,
  weakestSubdomains,
} from "./results";
import { SUBDOMAINS } from "@/content/bok";

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

export function isEmailConfigured(): boolean {
  return emailEndpoint() !== null;
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
  if (!endpoint) {
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
      headers: { "content-type": "application/json" },
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
      return {
        ok: false,
        reason: "failed",
        message: `Sending failed (${response.status}). Nothing was sent.`,
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
