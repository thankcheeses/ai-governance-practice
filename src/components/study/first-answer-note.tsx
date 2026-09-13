"use client";

import { useEffect, useState } from "react";

const KEY = "agp.first-answer-note.v1";

/** Shown once after the first saved answer in a study sitting. */
export function FirstAnswerNote({
  attemptCount,
  revealed,
}: {
  attemptCount: number;
  revealed: boolean;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!revealed || attemptCount !== 1) return;
    try {
      if (window.localStorage.getItem(KEY) === "seen") return;
      setShow(true);
    } catch {
      setShow(true);
    }
  }, [attemptCount, revealed]);

  if (!show) return null;

  return (
    <aside className="mb-5 rounded-2xl border border-border bg-accent-tint px-4 py-3 text-[0.875rem] leading-relaxed text-foreground">
      Wrong items go to Review. Exam will not.
      <button
        type="button"
        className="ml-3 font-medium text-link underline decoration-link/40 underline-offset-4"
        onClick={() => {
          try {
            window.localStorage.setItem(KEY, "seen");
          } catch {
            /* ignore */
          }
          setShow(false);
        }}
      >
        Got it
      </button>
    </aside>
  );
}
