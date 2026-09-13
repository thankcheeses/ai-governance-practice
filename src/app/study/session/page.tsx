"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppGate } from "@/components/app/app-gate";
import { StudySession } from "@/components/study/study-session";
import { resumeActiveSession } from "@/lib/active-session";
import { focusDomains, selectQuestions } from "@/lib/adaptive";
import { planDrill, shortfallNote } from "@/lib/blueprint-drill";
import {
  detectPattern,
  questionIdsForFamily,
} from "@/lib/reasoning-patterns";
import { weakAreaQuestionIds } from "@/lib/analytics";
import { newSeed, parseSeed } from "@/lib/presentation";
import type { CompletedResult } from "@/lib/results";
import { readResult } from "@/lib/results-storage";
import {
  buildSitting,
  sittingFromComposition,
  sittingFromSnapshot,
} from "@/lib/session";
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
    /*
      A finished sitting outranks everything below.

      Completion clears the in-flight sitting, so without this a refresh on the
      summary screen found nothing to resume and dealt a fresh sitting —
      destroying the result the learner was looking at. The stored result is
      matched by seed, which is what the URL carries, so it restores the
      summary for *this* sitting and not for some earlier one.
    */
    const completed = readResult("practice");
    if (completed && completed.seed === seed) {
      const restored = sittingFromResult(completed);
      if (restored) {
        return {
          sitting: restored,
          resumed: null,
          completed,
          mode: "practice" as StudyMode,
          label: completed.label,
        };
      }
    }

    const stored =
      resumeActiveSession({ mode: "practice", seed }) ??
      resumeActiveSession({ mode: "domain", seed });
    const restored = stored ? sittingFromSnapshot(stored) : null;
    if (stored && restored) {
      return {
        sitting: restored,
        resumed: stored,
        completed: null,
        mode: stored.mode,
        label: stored.label,
      };
    }

    // A sub-domain drill resolves to an explicit question list. Empty means
    // nothing qualified, and we fall through to ordinary selection rather
    // than opening a drill over everything.
    /*
     * A reasoning drill resolves to the labelled questions that exercise the
     * error family the learner keeps hitting. detectPattern returns null far
     * more often than not, and an empty list falls through to ordinary
     * selection below — the same way a sub-domain drill does when nothing
     * qualifies — so a stale link never opens an empty sitting.
     */
    const patternIds = (() => {
      if (focusParam !== "pattern") return [];
      const found = detectPattern(progress, progress.trackId);
      return found ? questionIdsForFamily(found.family, progress.trackId) : [];
    })();

    /*
     * A blueprint drill apportions the sitting across the four Body of
     * Knowledge domains in the proportions the published exam blueprint
     * describes, then fills each share through the ordinary selector so that
     * unseen-first and difficulty targeting still apply within a domain.
     *
     * Selection happens per domain rather than over one pooled list because
     * the shape is the point: a single pooled call would rank by its own
     * signals and hand back whatever mix those produced.
     */
    const weightedPlan =
      focusParam === "weighted" ? planDrill(count, progress.trackId) : null;

    const weightedIds = weightedPlan
      ? weightedPlan.allocations.flatMap((a) =>
          a.allocated > 0
            ? selectQuestions(progress, {
                count: a.allocated,
                trackId: progress.trackId,
                only: weightedPlan.idsByDomain[a.roman],
                seed,
              }).map((q) => q.id)
            : [],
        )
      : [];

    const drillIds =
      focusParam === "subdomain"
        ? weakAreaQuestionIds(progress, progress.trackId, count)
        : focusParam === "weighted"
          ? weightedIds
          : patternIds;

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

    /*
     * The blueprint label states a shortfall when there is one. The header
     * truncates, so the note is terse by design: a learner who asked for 25 and
     * received 22 is told which domains the bank ran out in, rather than being
     * handed a quietly shorter drill or the same questions twice.
     */
    const label = weightedIds.length
      ? weightedPlan && shortfallNote(weightedPlan)
        ? `Blueprint · ${shortfallNote(weightedPlan)}`
        : "Blueprint · sampled to the published domain ranges"
      : patternIds.length
      ? "Focus · a pattern in your misses"
      : drillIds.length
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
      completed: null,
      mode: (selectedDomains || drillIds.length ? "domain" : "practice") as StudyMode,
      label,
    };
  });

  return (
    <StudySession
      sitting={session.sitting}
      resumed={session.resumed}
      completedResult={session.completed}
      mode={session.mode}
      label={session.label}
      exitHref="/study"
    />
  );
}

/**
 * Rebuild the sitting a result refers to, so the summary can show the same
 * questions with the same options in the same order. A lookup over stored ids,
 * exactly as resuming an in-flight sitting is — never a re-selection.
 */
function sittingFromResult(result: CompletedResult) {
  return sittingFromComposition(result.questionIds, result.optionIds, result.seed);
}

function SessionSkeleton() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <span className="skeleton h-2 w-40" role="status" aria-label="Loading session" />
    </div>
  );
}
