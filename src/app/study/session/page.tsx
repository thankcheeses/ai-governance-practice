"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AppGate } from "@/components/app/app-gate";
import { StudySession } from "@/components/study/study-session";
import { focusDomains } from "@/lib/adaptive";
import { weakAreaQuestionIds } from "@/lib/analytics";
import { newSeed, parseSeed } from "@/lib/presentation";
import { buildSessionQuestions } from "@/lib/session";
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
  const router = useRouter();
  const { progress } = useProgress();

  /*
   * The session seed drives both the question order and every option shuffle.
   * It is written into the URL so a refresh reproduces the same sitting rather
   * than dealing a new one — the same reason it is fixed for the session's
   * lifetime instead of regenerated on render.
   */
  const [seed] = useState(() => parseSeed(params.get("seed")) ?? newSeed());
  useEffect(() => {
    if (params.get("seed")) return;
    const next = new URLSearchParams(params.toString());
    next.set("seed", String(seed));
    router.replace(`?${next.toString()}`, { scroll: false });
  }, [params, router, seed]);

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
  // Held in state rather than derived, because `progress` changes on every
  // answer and re-deriving would reshuffle the sitting underneath the learner.
  const [questions] = useState(() =>
    buildSessionQuestions(progress, {
      seed,
      count,
      trackId: progress.trackId,
      ...(drillIds.length
        ? { only: drillIds }
        : selectedDomains
          ? { domain: selectedDomains }
          : {}),
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
      seed={seed}
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
