"use client";

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

const CUE_FOR: Record<ReadinessState, "oof" | "womp" | "keepGoing" | "yay"> = {
  noEvidence: "keepGoing",
  earlySignal: "keepGoing",
  insufficient: "womp",
  developing: "keepGoing",
  mixed: "keepGoing",
  encouraging: "yay",
};

export function FlawlessBanner({ score }: { score: SittingScore }) {
  const readiness = assessReadiness(score);
  const cue = CUE_FOR[readiness.state];
  useCueOnce(cue, true);

  return (
    <section
      aria-live="polite"
      aria-label="Practice result encouragement"
      className="mb-6 overflow-hidden rounded-xl border border-accent/30 bg-accent-tint shadow-[var(--shadow-card)] transition-opacity duration-700 ease-out animate-in fade-in"
    >
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <p className="font-serif text-[1.5rem] leading-tight sm:text-[1.75rem]">
          {MESSAGES[readiness.state].title}
        </p>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {MESSAGES[readiness.state].body}
        </p>
      </div>
    </section>
  );
}
