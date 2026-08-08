"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppGate } from "@/components/app/app-gate";
import { StudySession } from "@/components/study/study-session";
import { resumeActiveSession } from "@/lib/active-session";
import { focusDomains } from "@/lib/adaptive";
import { weakAreaQuestionIds } from "@/lib/analytics";
import { newSeed, parseSeed } from "@/lib/presentation";
import { buildSitting, sittingFromSnapshot } from "@/lib/session";
import { useProgress } from "@/lib/store/progress-provider";
import type { StudyMode } from "@/lib/types";

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

  /*
    Resume first, build second.

    A stored sitting is authoritative: it holds the exact question ids and
    option order that were on screen. Rebuilding instead would re-run
    selection against an attempt history that answering has already changed,
    and deal a different set — the seed fixes the shuffle but cannot fix the
    selection. So the seed only decides *which* stored sitting we are looking
    for; the stored ids decide what it contains.

    Everything below is resolved once, in a state initialiser, and never
    recomputed — `progress` changes on every answer.
  */
  const [session] = useState(() => {
    const stored =
      resumeActiveSession({ mode: "practice", seed }) ??
      resumeActiveSession({ mode: "domain", seed });
    const restored = stored ? sittingFromSnapshot(stored) : null;
    if (stored && restored) {
      return {
        sitting: restored,
        resumed: stored,
        mode: stored.mode,
        label: stored.label,
      };
    }

    // A sub-domain drill resolves to an explicit question list. Empty means
    // nothing qualified, and we fall through to ordinary selection rather
    // than opening a drill over everything.
    const drillIds =
      focusParam === "subdomain"
        ? weakAreaQuestionIds(progress, progress.trackId, count)
        : [];

    // A focus session keeps drilling the domains it started on, even as
    // answering moves the accuracy that picked them.
    const selectedDomains: string | string[] | undefined = (() => {
      if (focusParam !== "weak") return domainParam ?? undefined;
      const weakest = focusDomains(progress, progress.trackId).map(
        (d) => d.domain,
      );
      return weakest.length ? weakest : undefined;
    })();

    const sitting = buildSitting(progress, {
      seed,
      count,
      trackId: progress.trackId,
      ...(drillIds.length
        ? { only: drillIds }
        : selectedDomains
          ? { domain: selectedDomains }
          : {}),
    });

    const label = drillIds.length
      ? "Focus · your weakest areas"
      : !selectedDomains
        ? "Mixed practice"
        : !Array.isArray(selectedDomains)
          ? selectedDomains
          : selectedDomains.length === 1
            ? `Focus · ${selectedDomains[0]}`
            : `Focus · ${selectedDomains.length} weakest domains`;

    return {
      sitting,
      resumed: null,
      mode: (selectedDomains || drillIds.length ? "domain" : "practice") as StudyMode,
      label,
    };
  });

  return (
    <StudySession
      sitting={session.sitting}
      resumed={session.resumed}
      mode={session.mode}
      label={session.label}
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
