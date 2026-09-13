"use client";

import Link from "next/link";
import { ResumeChip } from "@/components/app/resume-chip";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/store/progress-provider";

export function ContinueLink() {
  const { progress, ready } = useProgress();

  if (!ready) {
    return (
      <div className="min-h-11" aria-hidden />
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
      <ResumeChip />
      {answered > 0 ? (
        <span className="text-[0.875rem] text-muted-foreground">
          {answered} {answered === 1 ? "answer" : "answers"} saved on this device
        </span>
      ) : null}
    </div>
  );
}
