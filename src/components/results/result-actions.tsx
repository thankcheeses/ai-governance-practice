"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { resultPdfBytes, resultPdfFilename } from "@/lib/results-pdf";
import type { CompletedResult } from "@/lib/results";

/**
 * What a learner can do with a finished result.
 *
 * One action, deliberately. The PDF is generated on the device from data
 * already on the screen, so it needs no server, no credential, no permission
 * and no network — which also means it cannot fail for anyone, cannot leak an
 * address, and works offline and in the packaged app identically.
 *
 * Emailing results used to sit beside it. It was removed rather than left
 * switched off: it required a verified sending domain and a deployed function,
 * and a button that explains why it cannot work is worse than no button. The
 * PDF carries the same summary, so nothing is lost by its absence.
 */
export function ResultActions({ result }: { result: CompletedResult }) {
  const [pdfError, setPdfError] = useState<string | null>(null);

  const download = useCallback(() => {
    setPdfError(null);
    try {
      const bytes = resultPdfBytes(result);
      const blob = new Blob([bytes as unknown as BlobPart], {
        type: "application/pdf",
      });
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

  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-5 shadow-card sm:p-6">
      <h2 className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        Keep this result
      </h2>
      <p className="measure mb-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
        This result is saved on this device and will still be here after a
        refresh. You can also take a copy with you.
      </p>

      <Button onClick={download} variant="outline">
        Download results as PDF
      </Button>

      {pdfError ? (
        <p role="alert" className="mt-3 text-[0.875rem] text-destructive">
          {pdfError}
        </p>
      ) : null}
    </section>
  );
}
