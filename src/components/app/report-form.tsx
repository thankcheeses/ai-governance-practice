"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  KIND_LABELS,
  REPORT_KINDS,
  MAX_BODY,
  REPORTING_UNAVAILABLE_MESSAGE,
  SUBMIT_FAILED_MESSAGE,
  validateReport,
  type ReportKind,
} from "@/lib/reports";

/**
 * "Something is wrong here" — the form that did not exist.
 *
 * ## No sign-in, and no silent identification
 *
 * Studying needs no account, so reporting must not either: the people most
 * likely to find a broken question are the ones who never made one. The insert
 * goes in as `anon` and the row carries no `user_id` — not even when the
 * reporter happens to be signed in. A reply address is typed or not typed, and
 * nothing fills it in on the reporter's behalf.
 *
 * ## The validation here is courtesy, not protection
 *
 * `validateReport` saves a round trip and produces a message someone can act
 * on. The `check` constraints in `0008_reports_and_account_counts.sql` are what
 * actually hold, and `reports.test.ts` asserts the two sets of bounds still
 * agree. If they ever disagree, the server wins and the person sees a worse
 * error — which is why that test reads the SQL.
 */
export function ReportForm() {
  const [kind, setKind] = useState<ReportKind>("bug");
  const [body, setBody] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<
    { status: "idle" | "sending" | "sent" } | { status: "error"; message: string }
  >({ status: "idle" });

  if (state.status === "sent") {
    return (
      <div
        role="status"
        className="rounded-lg border border-border bg-card p-5 text-sm leading-relaxed"
      >
        <p className="font-medium">Thank you — that came through.</p>
        <p className="mt-1 text-muted-foreground">
          {contact.trim()
            ? "You gave an address, so you may get a reply. There is one person behind this, so it might not be quick."
            : "You did not leave an address, so there is no way to reply — but it has been recorded and will be read."}
        </p>
      </div>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const check = validateReport({
      kind,
      body,
      contact,
      // Recorded so a report about "this screen" can be located. Path only —
      // `safePage` drops the query string.
      page: typeof window === "undefined" ? undefined : window.location.pathname,
    });
    if (!check.ok) return setState({ status: "error", message: check.message });

    const supabase = getBrowserSupabase();
    if (!supabase) {
      return setState({ status: "error", message: REPORTING_UNAVAILABLE_MESSAGE });
    }

    setState({ status: "sending" });
    const { error } = await supabase.from("reports").insert({
      kind: check.value.kind,
      body: check.value.body,
      contact: check.value.contact,
      page: check.value.page,
    });

    if (error) {
      /*
        Surfaced, but not in the database's own words.

        Before `0008` is deployed this path is the live one, and interpolating
        `error.message` put "Could not find the table 'public.reports' in the
        schema cache" in front of a learner — unactionable, and it publishes
        internal schema names to anyone who presses Send. The raw error goes to
        the console, where whoever is diagnosing it will actually look.

        Still shown rather than swallowed: a report that fails silently is
        worse than no form at all, because the person leaves believing they
        told us.
      */
      console.error("[report] insert failed", error);
      return setState({ status: "error", message: SUBMIT_FAILED_MESSAGE });
    }
    setState({ status: "sent" });
  }

  const remaining = MAX_BODY - body.trim().length;

  /*
   * `noValidate` deliberately. Verified in a browser: with the address field
   * as `type="email"`, a malformed address made the browser block submission
   * and show its own bubble, so `submit` never ran and the message below
   * never appeared — the one that says the field can be left blank.
   *
   * Two reasons to own the whole path instead. The native bubble is transient
   * and tied to the field, where the message below lives in a `role="alert"`
   * region that assistive technology announces and that stays put. And a
   * single path means `validateReport` describes what someone actually sees,
   * so its tests are about the product rather than about a function nothing
   * reaches.
   *
   * `type="email"` stays for the mobile keyboard, and `required` stays for
   * the `aria-required` it implies; neither now gates submission.
   */
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <fieldset>
        <legend className="text-[0.8125rem] font-medium">What kind of problem?</legend>
        <div className="mt-2 space-y-1.5">
          {REPORT_KINDS.map((k) => (
            <label key={k} className="flex items-start gap-2.5 text-sm">
              <input
                type="radio"
                name="kind"
                value={k}
                checked={kind === k}
                onChange={() => setKind(k)}
                className="mt-1"
              />
              <span>{KIND_LABELS[k]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="report-body">What happened?</Label>
        <textarea
          id="report-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={MAX_BODY}
          required
          aria-describedby="report-body-hint"
          className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed"
          placeholder="If it is a specific question, quoting a few words from it helps me find it."
        />
        <p id="report-body-hint" className="mt-1 text-xs text-muted-foreground">
          {remaining < 200
            ? `${remaining.toLocaleString()} characters left.`
            : "The more specific, the more likely it gets fixed."}
        </p>
      </div>

      <div>
        <Label htmlFor="report-contact">Email, if you want a reply (optional)</Label>
        <Input
          id="report-contact"
          type="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          autoComplete="email"
          aria-describedby="report-contact-hint"
          className="mt-1.5"
          placeholder="you@example.com"
        />
        <p id="report-contact-hint" className="mt-1 text-xs text-muted-foreground">
          Leave this blank and the report stays anonymous. Nothing is attached to
          your account either way, even if you are signed in.
        </p>
      </div>

      {/*
        Always mounted rather than conditionally rendered, so a screen reader
        announces the error instead of a live region appearing mid-announcement
        and being missed. Same reasoning as the verdict region in a study
        session.
      */}
      <p role="alert" aria-live="polite" className="text-sm text-destructive">
        {state.status === "error" ? state.message : ""}
      </p>

      <Button type="submit" disabled={state.status === "sending"}>
        {state.status === "sending" ? "Sending…" : "Send report"}
      </Button>
    </form>
  );
}
