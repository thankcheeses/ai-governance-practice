"use client";

import { useEffect, useState } from "react";
import { assessReadiness, type ReadinessState } from "@/lib/readiness";
import { type SittingScore } from "@/lib/results";
import { useCueOnce } from "@/lib/use-cue";

const MESSAGES: Record<ReadinessState, { title: string; body: string }> = {
  noEvidence: { title: "Start where you are.", body: "Answer some questions and build your evidence." },
  earlySignal: { title: "Keep going.", body: "This is an early signal. A short sitting cannot tell you much yet." },
  insufficient: { title: "Don't get discouraged.", body: "The misses are useful. Practice your weak areas, then try again." },
  developing: { title: "You're building it.", body: "Good progress. Keep practicing the weak areas and widen your coverage." },
  mixed: { title: "Good job. Keep going.", body: "You've got a solid base. Clean up the weak areas before you call it done." },
  encouraging: { title: "Great job!", body: "This is a strong practice result with enough evidence to be encouraging. Keep reviewing your weak areas." },
};

/**
 * One cue per verdict, and the verdict is `assessReadiness`'s rather than a
 * percentage of its own.
 *
 * That is the whole reason this is keyed on `ReadinessState`: readiness is
 * already two-axis, so neither of the two strong cues can fire on a sitting too
 * thin to mean anything. A three-question wipeout is `earlySignal`, not
 * `insufficient`, and gets no "oof"; a lucky five-for-five is `earlySignal`,
 * not `encouraging`, and gets no "yay". A second threshold here would have
 * reintroduced exactly the cheap reactions the readiness model exists to avoid.
 *
 * `oof` covers the whole `insufficient` band rather than only a literal 0%.
 * Gating it on zero correct made it effectively unreachable — a learner has to
 * answer questions and miss every one of them — so the failure sound would
 * almost never have played. `insufficient` is the model's own "this sitting
 * failed", which is what the cue is for.
 */
const CUE_FOR: Record<ReadinessState, "oof" | "keepGoing" | "yay"> = {
  noEvidence: "keepGoing",
  earlySignal: "keepGoing",
  insufficient: "oof",
  developing: "keepGoing",
  mixed: "keepGoing",
  encouraging: "yay",
};

export function FlawlessBanner({ score }: { score: SittingScore }) {
  const readiness = assessReadiness(score);
  const [visible, setVisible] = useState(true);
  const [dismissing, setDismissing] = useState(false);
  useCueOnce(CUE_FOR[readiness.state], true);
  useEffect(() => {
    const dismiss = () => setDismissing(true);
    window.addEventListener("aigp:result-action", dismiss);
    return () => window.removeEventListener("aigp:result-action", dismiss);
  }, []);
  if (!visible) return null;

  return (
    <section
      aria-live="polite"
      aria-label="Practice result encouragement"
      onTransitionEnd={() => { if (dismissing) setVisible(false); }}
      className={`mb-6 overflow-hidden rounded-xl border border-accent/30 bg-accent-tint shadow-[var(--shadow-card)] transition-opacity duration-700 ease-out ${dismissing ? "opacity-0" : "animate-in fade-in opacity-100"}`}
    >
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <p className="font-serif text-[1.5rem] leading-tight sm:text-[1.75rem]">
          {MESSAGES[readiness.state].title}
        </p>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {MESSAGES[readiness.state].body}
        </p>
        <button
          type="button"
          onClick={() => setDismissing(true)}
          className="mt-4 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-75"
        >
          Continue
        </button>
      </div>
    </section>
  );
}
