"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { AppGate } from "@/components/app/app-gate";
import { StudySession } from "@/components/study/study-session";
import { focusDomains, selectQuestions } from "@/lib/adaptive";
import { weakAreaQuestionIds } from "@/lib/analytics";
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
  const { progress } = useProgress();

  const domainParam = params.get("domain");
  const focusParam = params.get("focus");
  const countParam = Number(params.get("count"));
  const count = Number.isFinite(countParam) && countParam > 0 ? countParam : 10;

  // Resolved once, at mount, alongside the question set — a focus session must
  // keep drilling the domains it started on even as answering moves the
  // accuracy that picked them.
  // A sub-domain drill is resolved once, at mount, to an explicit question
  // list. Empty means nothing qualified, and the caller falls through to the
  // ordinary selection rather than opening a drill over everything.
  const [drillIds] = useState<string[]>(() =>
    focusParam === "subdomain"
      ? weakAreaQuestionIds(progress, progress.trackId, count)
      : [],
  );

  const [selectedDomains] = useState<string | string[] | undefined>(() => {
    if (focusParam !== "weak") return domainParam ?? undefined;
    const weakest = focusDomains(progress, progress.trackId).map((d) => d.domain);
    // No evidence yet, or the learner has since improved past the threshold:
    // mixed practice is the honest fallback, not an empty drill.
    return weakest.length ? weakest : undefined;
  });

  // Fixed for the lifetime of the session so answering never reshuffles it.
  const [questions] = useState(() =>
    selectQuestions(progress, {
      count,
      trackId: progress.trackId,
      domain: drillIds.length ? undefined : selectedDomains,
      ...(drillIds.length ? { only: drillIds } : {}),
    }),
  );

  const label = useMemo(() => {
    if (drillIds.length) return "Focus · your weakest areas";
    if (!selectedDomains) return "Mixed practice";
    if (!Array.isArray(selectedDomains)) return selectedDomains;
    return selectedDomains.length === 1
      ? `Focus · ${selectedDomains[0]}`
      : `Focus · ${selectedDomains.length} weakest domains`;
  }, [selectedDomains, drillIds]);

  return (
    <StudySession
      questions={questions}
      mode={selectedDomains || drillIds.length ? "domain" : "practice"}
      label={label}
      exitHref="/study"
    />
  );
}

function SessionSkeleton() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <span className="skeleton h-2 w-40" role="status" aria-label="Loading session" />
    </div>
  );
}
