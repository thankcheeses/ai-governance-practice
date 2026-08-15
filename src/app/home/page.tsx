"use client";

import Link from "next/link";
import { AppGate } from "@/components/app/app-gate";
import { GateRail } from "@/components/civic/gpai/diagrams";
import {
  MonitoringThatActuallyWorks,
  OversightLevelComparison,
  ScenarioDecisionFrame,
  WhoIsAccountable,
} from "@/components/civic/gpai";
import {
  ConfidenceDial,
  FocusCard,
  InsightPanel,
  ProgressPath,
  SectionHeading,
  StatusSurface,
} from "@/components/civic/surfaces";
import { Button } from "@/components/ui/button";
import { getTrack, getTrackQuestions } from "@/content/registry";
import {
  focusDomains,
  masteredQuestionIds,
  overallAccuracy,
  todaySummary,
} from "@/lib/adaptive";
import { dueCount } from "@/lib/spaced-repetition";
import { effectiveStreak, useProgress } from "@/lib/store/progress-provider";

export default function HomePage() {
  return (
    <AppGate>
      <Home />
    </AppGate>
  );
}

/**
 * The Civic home surface.
 *
 * Three columns from `xl` up, matching the approved reference: the decision
 * you should make next in the centre, the reading of where you stand and why
 * it matters down the right, navigation in the rail. Below `xl` the right
 * column falls under the centre rather than beside it, so the dominant action
 * stays first on a phone.
 *
 * Every number here comes from the existing helpers (`todaySummary`,
 * `overallAccuracy`, `dueCount`, `focusDomains`, `effectiveStreak`). This
 * route computes nothing; it arranges.
 */
function Home() {
  const { progress } = useProgress();
  const track = getTrack(progress.trackId);

  const today = todaySummary(progress);
  const streak = effectiveStreak(progress);
  const accuracy = overallAccuracy(progress.attempts);
  const mastered = masteredQuestionIds(progress.attempts).size;
  const available = getTrackQuestions(progress.trackId).length;
  const answeredUnique = new Set(progress.attempts.map((a) => a.questionId)).size;
  const due = dueCount(progress);
  const focus = focusDomains(progress, progress.trackId);
  const weakest = focus[0];

  const isNew = progress.attempts.length === 0;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-10">
      {/* =============================================== centre column === */}
      <div className="min-w-0 space-y-8">
        <header>
          <p className="mb-3 text-[0.8125rem] text-muted-foreground">
            <Link href="/home">Home</Link>
            <span aria-hidden className="mx-2 text-border-strong">
              /
            </span>
            <span>Today</span>
          </p>
          <h1 className="text-balance text-[2.125rem] leading-[1.1] sm:text-[2.625rem]">
            Your governance practice, made practical.
          </h1>
          <p className="mt-3 text-[1.0625rem] text-muted-foreground">
            Focus on the decision that matters most next.
          </p>
        </header>

        {/* ---------------------------------------------- current focus --- */}
        <FocusCard emphasis="focus">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
            <div className="min-w-0">
              <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-accent-strong">
                Current focus
              </p>
              <h2 className="text-[1.5rem] leading-tight sm:text-[1.875rem]">
                {isNew
                  ? "Pre-launch controls"
                  : weakest
                    ? weakest.domain
                    : "Keep your coverage even"}
              </h2>
              <p className="measure mt-2.5 text-[0.9375rem] leading-relaxed text-muted-foreground">
                {isNew
                  ? "Turn a promising AI use case into a defensible go-live decision."
                  : weakest
                    ? `${weakest.accuracy}% across ${weakest.answered} answered${
                        focus.length > 1
                          ? ` — ${focus.length - 1} other ${focus.length === 2 ? "domain is" : "domains are"} also below target.`
                          : "."
                      }`
                    : "No domain is trailing. Practice is drawing from the full body of knowledge."}
              </p>

              <p className="mt-4 text-[0.875rem] text-muted-foreground">
                {track.name}
                <span aria-hidden className="mx-2 text-border-strong">
                  ·
                </span>
                {isNew ? "About 12 minutes" : `${today.goal} questions today`}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Button asChild size="lg">
                  <Link
                    href={weakest ? "/study/session?focus=weak&count=10" : "/study"}
                  >
                    Continue practicing
                  </Link>
                </Button>
                <Link href="/study" className="text-[0.9375rem]">
                  Choose another focus
                </Link>
              </div>
            </div>

            {/*
              The gate sits inside the focus card rather than in the toolkit
              below, because on this screen it is not reference material — it
              is the shape of the thing the learner is about to practice.
            */}
            <div className="rounded-lg border border-border bg-background/60 p-5">
              <p className="mb-4 text-center font-serif text-[1.0625rem]">
                Pre-launch gate
              </p>
              <GateRail
                labels={["Purpose", "Risk", "Accountability", "Controls", "Go-live"]}
              />
            </div>
          </div>
        </FocusCard>

        {/* ------------------------------------------ governance toolkit --- */}
        <section>
          <SectionHeading level={2} title="Governance toolkit" className="mb-4" />
          <div className="grid gap-4 sm:grid-cols-2">
            <OversightLevelComparison />
            <WhoIsAccountable />
            <MonitoringThatActuallyWorks />
            <ScenarioDecisionFrame />
          </div>
        </section>

        {/* --------------------------------------------- practice exam --- */}
        <FocusCard
          emphasis="quiet"
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <h3 className="text-[1rem]">Take a practice exam</h3>
            <p className="mt-0.5 text-[0.875rem] leading-relaxed text-muted-foreground">
              100 questions, 3 hours, no feedback until you submit.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/exam">Open practice exam</Link>
          </Button>
        </FocusCard>
      </div>

      {/* ================================================ right column === */}
      <aside className="min-w-0 space-y-5">
        {/*
          The dial reads confidence, not a score — the caption says so, because
          a bare percentage on a home screen invites being read as a pass mark.
          With no attempts there is nothing to read, so it is replaced rather
          than shown as a confident-looking zero.
        */}
        <FocusCard className="flex justify-center">
          {isNew ? (
            <div className="py-2 text-center">
              <p className="font-serif text-[1.125rem]">No reading yet</p>
              <p className="mx-auto mt-2 max-w-[15rem] text-[0.875rem] leading-relaxed text-muted-foreground">
                Your confidence appears here once you have answered a few
                questions.
              </p>
            </div>
          ) : (
            <ConfidenceDial
              value={accuracy}
              label="Current confidence"
              caption={`${progress.attempts.length} answers recorded`}
            />
          )}
        </FocusCard>

        <InsightPanel title="Why this matters">
          Good governance starts before launch. Clear ownership and controls are
          what make later monitoring mean anything.
        </InsightPanel>

        <FocusCard>
          <h2 className="mb-4 font-serif text-[1.25rem]">Session focus</h2>
          <div className="space-y-3">
            <ProgressPath
              completed={today.answered}
              total={today.goal}
              label="Today's goal"
            />
            <ProgressPath
              completed={answeredUnique}
              total={available}
              label="Bank covered"
            />
            <div className="flex items-baseline justify-between gap-3 pt-1">
              {/*
                A plain count. No flame, no badge, no celebration: the design
                system rules out streak gamification, and a number is the
                honest version of this signal anyway.
              */}
              <span className="text-[0.875rem] font-medium">Consecutive days</span>
              <span className="text-[1.25rem] font-semibold tabular-nums">
                {streak > 0 ? streak : "—"}
              </span>
            </div>
          </div>

          {mastered > 0 || due > 0 ? (
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {due > 0 ? (
                <StatusSurface
                  tone="accent"
                  mark="review"
                  label={`${due} due for review`}
                  detail="Returning to a missed decision is where the learning is."
                />
              ) : null}
              {mastered > 0 ? (
                <StatusSurface
                  tone="support"
                  mark="progress"
                  label={`${mastered} answered correctly`}
                  detail="On the most recent attempt."
                />
              ) : null}
            </div>
          ) : null}
        </FocusCard>
      </aside>
    </div>
  );
}
