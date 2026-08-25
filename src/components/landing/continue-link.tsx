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
 * `recordAnswer`, not `completeOnboarding`, not `setDailyGoal`. It holds the
 * CTA slot height until hydration settles, so a returning learner never sees
 * the first-time wording flash and then swap, and the page does not jump when
 * the real control arrives.
 *
 * The root route used to be a redirect, which meant removing it would strand
 * everyone who already had progress. This is the affordance that replaces it.
 */
export function ContinueLink() {
  const { progress, ready } = useProgress();

  /*
    Reserve the primary CTA height while progress hydrates. Returning null
    collapsed the slot and shifted the sample question when the button appeared.
    An empty, non-interactive shell keeps layout stable without flashing copy.
  */
  if (!ready) {
    return (
      <div
        className="min-h-11"
        aria-hidden
      />
    );
  }

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
