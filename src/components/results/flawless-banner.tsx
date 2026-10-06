"use client";

import { flawlessTally, isFlawless, type SittingScore } from "@/lib/results";
import { useCueOnce } from "@/lib/use-cue";

/**
 * Shown when every question in a sitting was answered and every one was right.
 *
 * It fires at any length — five questions, ten, a hundred — because it states
 * a fact about the sitting rather than a judgment about the learner. That is
 * the whole reason it can sit above the readiness verdict without contradicting
 * it: the verdict is about how much of the bank the sitting covered, and on a
 * perfect five it still reads "early signal only — too little practice to draw
 * a conclusion." Both are true, they answer different questions, and neither
 * is softened to accommodate the other.
 *
 * The wording is therefore a count and nothing else. No "you're ready", no
 * "exam-ready", no grade inflation — `readiness.ts` owns every claim of that
 * kind and this deliberately makes none.
 *
 * The cue plays once per mount. A results screen is reached by submitting,
 * which is the gesture browsers require before audio, and `play` is silent
 * unless the learner turned sound on in Settings.
 */
export function FlawlessBanner({ score }: { score: SittingScore }) {
  const flawless = isFlawless(score);
  // A results screen re-renders as its record settles; the cue is not a
  // notification, so `useCueOnce` holds it to one play per mount.
  useCueOnce("flawless", flawless);

  if (!flawless) return null;

  return (
    <section
      aria-label="Flawless sitting"
      className="mb-6 overflow-hidden rounded-xl border border-success bg-success-tint shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-success bg-success text-success-foreground"
        >
          {/*
            Drawn here rather than pulled from the icon set, so it matches the
            correctness glyph the learner saw on every question.
          */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M5 12.5 10 17.5 19 7" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="font-serif text-[1.25rem] leading-snug">Flawless sitting</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {flawlessTally(score)} correct, nothing left blank.
          </p>
        </div>
      </div>
    </section>
  );
}
