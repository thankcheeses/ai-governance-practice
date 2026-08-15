"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/store/progress-provider";

/**
 * The returning-learner action, isolated to the smallest component that can
 * hold it.
 *
 * Reading progress requires `useProgress()`, which the demo deliberately never
 * touches. Confining it here keeps that guarantee intact: this component reads
 * `onboardingCompletedAt` and `attempts.length` and calls no mutator — not
 * `recordAnswer`, not `completeOnboarding`, not `setDailyGoal`. It renders
 * nothing until hydration settles, so a returning learner never sees the
 * first-time wording flash and then swap.
 *
 * The root route used to be a redirect, which meant removing it would strand
 * everyone who already had progress. This is the affordance that replaces it.
 */
export function ContinueLink() {
  const { progress, ready } = useProgress();

  if (!ready) return null;

  const returning = Boolean(progress.onboardingCompletedAt);
  const answered = progress.attempts.length;

  if (!returning) {
    return (
      <Button asChild size="lg">
        <Link href="/onboarding">Start practicing — no account needed</Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild size="lg">
        <Link href="/home">Continue where you left off</Link>
      </Button>
      {answered > 0 ? (
        <span className="text-[0.875rem] text-muted-foreground">
          {answered} {answered === 1 ? "answer" : "answers"} saved on this device
        </span>
      ) : null}
    </div>
  );
}
