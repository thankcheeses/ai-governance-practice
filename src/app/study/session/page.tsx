"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { AppGate } from "@/components/app/app-gate";
import { StudySession } from "@/components/study/study-session";
import { selectQuestions } from "@/lib/adaptive";
import { useProgress } from "@/lib/store/progress-provider";

export default function StudySessionPage() {
  return (
    <AppGate>
      <Suspense fallback={<SessionSkeleton />}>
        <Session />
      </Suspense>
    </AppGate>
  );
}

function Session() {
  const params = useSearchParams();
  const { progress, entitlements } = useProgress();

  const domainParam = params.get("domain");
  const countParam = Number(params.get("count"));
  const count = Number.isFinite(countParam) && countParam > 0 ? countParam : 10;

  // Domain filtering is a Pro feature; fall back to mixed practice rather than
  // failing, so a stale link never dead-ends.
  const domain =
    domainParam && entitlements.domainFiltering ? domainParam : undefined;

  // Fixed for the lifetime of the session so answering never reshuffles it.
  const [questions] = useState(() =>
    selectQuestions(progress, {
      count,
      tier: progress.tier,
      trackId: progress.trackId,
      domain,
    }),
  );

  const label = useMemo(
    () => (domain ? domain : "Mixed practice"),
    [domain],
  );

  return (
    <StudySession
      questions={questions}
      mode={domain ? "domain" : "practice"}
      label={label}
      exitHref="/study"
    />
  );
}

function SessionSkeleton() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}
