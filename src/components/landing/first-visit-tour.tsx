"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "agp.how-to-operate.v1";

const STEPS = [
  {
    kicker: "What this is",
    title: "You are put in a decision",
    body: "Each item is a governance scenario. Read it. Choose what you would do. Progress is saved on this device. An account only adds sync across devices.",
  },
  {
    kicker: "How to read",
    title: "Four passes, in this order",
    body: "Facts, then Obligations, then Risks, then Action. Naming a framework before the facts is the common failure. The same four passes work on every question, and on real decisions outside the app.",
  },
  {
    kicker: "The loop",
    title: "Scenario → Decide → Feedback → Carry forward",
    body: "Read the facts without jumping to a framework. Choose the narrowest defensible next step. See why, including the near-miss distractors. The takeaway is the portable rule for the next item.",
  },
  {
    kicker: "Two modes",
    title: "Same bank. Different pressure.",
    body: "Study teaches the loop with immediate feedback and a review queue. Exam withholds feedback, runs a clock, and scores the sitting. Use Study to learn. Use Exam when you want to know if it holds.",
  },
  {
    kicker: "Start",
    title: "Try one on this page",
    body: "The sample question below is a real item. Nothing you do there is recorded. When you are ready, continue into Practice. Help stays in the header if you need this again.",
  },
] as const;

export function FirstVisitTour({
  forceOpen = false,
  onClose,
}: {
  forceOpen?: boolean;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setStep(0);
      setOpen(true);
      return;
    }
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== "seen") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [forceOpen]);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "seen");
    } catch {
      /* private mode */
    }
    setOpen(false);
    onClose?.();
  }

  if (!open) return null;

  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#1a2332]/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card-hover)] sm:p-8">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent-foreground">
          {current.kicker}
        </p>
        <h2 id="tour-title" className="mt-2 font-serif text-[1.5rem] leading-snug">
          {current.title}
        </h2>
        <p className="mt-3 text-[0.975rem] leading-relaxed text-muted-foreground">
          {current.body}
        </p>

        <div className="mt-6 flex items-center gap-1.5" aria-hidden>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full ${i === step ? "w-6 bg-accent" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>
        <p className="mt-2 text-[0.75rem] text-muted-foreground">
          {step + 1} of {STEPS.length}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={dismiss}>
              Skip
            </Button>
          )}
          <Button className="ml-auto" onClick={last ? dismiss : () => setStep((s) => s + 1)}>
            {last ? "Start looking around" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function HowToOperateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="text-[0.875rem] font-medium text-link underline decoration-link/40 underline-offset-4 hover:text-link-hover"
        onClick={() => setOpen(true)}
      >
        How this works
      </button>
      {open ? <FirstVisitTour forceOpen onClose={() => setOpen(false)} /> : null}
    </>
  );
}
