"use client";

import { Download, Mail } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  emailDisclosure,
  isEmailConfigured,
  isValidEmail,
  sendResultByEmail,
} from "@/lib/results-email";
import { resultPdfBytes, resultPdfFilename } from "@/lib/results-pdf";
import type { CompletedResult } from "@/lib/results";

/**
 * What a learner can do with a finished result.
 *
 * Two actions with deliberately different postures. The PDF is generated on the
 * device from data already in front of the user, so it needs no permission and
 * no confirmation — it is a download button. Email sends their performance data
 * somewhere else, so it is opt-in end to end: the field is empty, the address
 * is typed each time, what will be sent is stated in full before the button
 * appears, and nothing happens until they submit.
 */
export function ResultActions({ result }: { result: CompletedResult }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [pdfError, setPdfError] = useState<string | null>(null);
  const fieldId = useId();
  const configured = isEmailConfigured();

  const download = useCallback(() => {
    setPdfError(null);
    try {
      const bytes = resultPdfBytes(result);
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = resultPdfFilename(result);
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Revoked on the next tick: revoking synchronously races the download in
      // Safari, which has not finished reading the blob when click() returns.
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setPdfError("The PDF could not be generated on this device.");
    }
  }, [result]);

  const send = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (status.kind === "sending") return;
      setStatus({ kind: "sending" });
      const outcome = await sendResultByEmail(result, email);
      if (outcome.ok) {
        setStatus({ kind: "sent" });
        // Held no longer than the request needs it.
        setEmail("");
      } else {
        setStatus({ kind: "error", message: outcome.message });
      }
    },
    [result, email, status.kind],
  );

  return (
    <section className="mt-8 rounded-lg border border-border bg-card p-5">
      <h2 className="mb-1 font-mono text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Keep this result
      </h2>
      <p className="measure mb-4 text-[0.875rem] leading-relaxed text-muted-foreground">
        This result is saved on this device and will still be here after a
        refresh. You can also take a copy with you.
      </p>

      <div className="flex flex-wrap gap-2.5">
        <Button onClick={download} variant="outline">
          <Download className="h-4 w-4" />
          Download results as PDF
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setOpen((o) => !o);
            setStatus({ kind: "idle" });
          }}
          aria-expanded={open}
          aria-controls={`${fieldId}-panel`}
        >
          <Mail className="h-4 w-4" />
          Send results to email
        </Button>
      </div>

      {pdfError ? (
        <p role="alert" className="mt-3 text-[0.875rem] text-destructive">
          {pdfError}
        </p>
      ) : null}

      {open ? (
        <div id={`${fieldId}-panel`} className="mt-5 border-t border-border pt-5">
          {!configured ? (
            /*
              This used to name an environment variable and tell the reader to
              rebuild. Whoever reaches this screen finished a sitting and wants
              their results; they do not deploy this app and cannot act on any
              of that. Setup instructions live in `.env.example`, where the
              person who needs them is already looking.
            */
            <div>
              <p className="measure text-[0.9375rem] leading-relaxed">
                Emailing results is not available yet.
              </p>
              <p className="measure mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
                The PDF download above has the same summary and works right
                now — no account, no connection needed.
              </p>
            </div>
          ) : status.kind === "sent" ? (
            <p role="status" className="measure text-[0.9375rem] leading-relaxed">
              Sent. If it does not arrive within a few minutes, check your spam
              folder.
            </p>
          ) : (
            <form onSubmit={send} noValidate>
              <p className="measure mb-3 text-[0.875rem] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">What will be sent: </span>
                {emailDisclosure(result)}
              </p>
              <label
                htmlFor={fieldId}
                className="mb-1.5 block font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
              >
                Your email address
              </label>
              <div className="flex flex-wrap gap-2.5">
                <input
                  id={fieldId}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status.kind === "error") setStatus({ kind: "idle" });
                  }}
                  placeholder="you@example.com"
                  className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 font-mono text-[0.9375rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-describedby={status.kind === "error" ? `${fieldId}-error` : undefined}
                  aria-invalid={status.kind === "error"}
                />
                <Button
                  type="submit"
                  disabled={status.kind === "sending" || !isValidEmail(email)}
                >
                  {status.kind === "sending" ? "Sending…" : "Send my results"}
                </Button>
              </div>
              {status.kind === "error" ? (
                <p
                  id={`${fieldId}-error`}
                  role="alert"
                  className="measure mt-2 text-[0.875rem] text-destructive"
                >
                  {status.message}
                </p>
              ) : null}
            </form>
          )}
        </div>
      ) : null}
    </section>
  );
}
