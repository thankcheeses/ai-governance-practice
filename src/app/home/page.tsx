"use client";

import Link from "next/link";
import { AppGate } from "@/components/app/app-gate";
import { DimensionalMark } from "@/components/civic/dimensional-mark";
import { PreLaunchGate, WhoIsAccountable } from "@/components/civic/gpai";
import {
  ConfidenceDial,
  FocusCard,
  InsightPanel,
  ProgressPath,
  SectionHeading,
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
 * Hierarchy, in the order the eye should take it: current focus, then the one
 * dominant action, then the reading of where the learner stands, then context,
 * then the toolkit. Everything below the fold is reference material — nothing
 * there is required to start practising, which is the only thing this page is
 * really asking for.
 *
 * Every number on this page comes from the same helpers as before
 * (`todaySummary`, `overallAccuracy`, `dueCount`, `focusDomains`,
 * `effectiveStreak`). This route computes nothing itself; it arranges.
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
    <div className="space-y-8">
      <header>
        <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {track.name}
        </p>
        <h1 className="text-[2rem] leading-[1.15] sm:text-[2.375rem]">
          {isNew ? "Welcome" : greeting()}
        </h1>
      </header>

      {/* ------------------------------------------------ Current focus --- */}
      {/*
        The dominant surface. `Continue practising` is the one unmistakable
        action on the page: it is the only filled button above the fold, it is
        the widest control, and it sits inside the only focus-emphasis card.
      */}
      <FocusCard emphasis="focus">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-accent-strong">
              Current focus
            </p>
            <h2 className="text-[1.5rem] leading-tight sm:text-[1.75rem]">
              {isNew
                ? "Start with a scenario"
                : weakest
                  ? weakest.domain
                  : "Keep your coverage even"}
            </h2>
            <p className="measure mt-2.5 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {isNew
                ? "Each question puts you in a governance decision and asks what you would do. Feedback explains why the near-misses are near-misses."
                : weakest
                  ? `${weakest.accuracy}% across ${weakest.answered} answered${
                      focus.length > 1
                        ? ` — ${focus.length - 1} other ${focus.length === 2 ? "domain is" : "domains are"} also below target.`
                        : "."
                    }`
                  : "No domain is trailing. Practice is picking questions across the full body of knowledge."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={weakest ? "/study/session?focus=weak&count=10" : "/study"}>
                  Continue practising
                </Link>
              </Button>
              {due > 0 ? (
                <Button asChild variant="outline" size="lg">
                  <Link href="/review">
                    Review {due} due
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          {/*
            The dial reads confidence, not score — it is overall accuracy, and
            the caption says so, because a bare percentage on a home screen
            invites being read as a pass mark. With no attempts there is
            nothing to read, so the goal path takes its place rather than
            showing a confident-looking zero.
          */}
          <div className="shrink-0 lg:pl-6">
            {isNew ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <DimensionalMark name="study" size="xl" />
                <p className="max-w-[16rem] text-[0.875rem] leading-relaxed text-muted-foreground">
                  Your reading appears here once you have answered a few
                  questions.
                </p>
              </div>
            ) : (
              <ConfidenceDial
                value={accuracy}
                label="Overall accuracy"
                caption={`${progress.attempts.length} answers recorded`}
              />
            )}
          </div>
        </div>
      </FocusCard>

      {/* -------------------------------------------------- Session focus --- */}
      <section>
        <SectionHeading level={2} title="Session focus" className="mb-4" />

        <div className="grid gap-4 lg:grid-cols-3">
          <FocusCard>
            <ProgressPath
              completed={today.answered}
              total={today.goal}
              label="Today's goal"
            />
            <p className="mt-3.5 text-[0.875rem] leading-relaxed text-muted-foreground">
              {today.goalMet
                ? `Goal met — ${today.correct} of ${today.answered} correct today.`
                : `${today.goal - today.answered} more ${
                    today.goal - today.answered === 1 ? "question" : "questions"
                  } to reach today's goal.`}
            </p>
          </FocusCard>

          <FocusCard>
            <ProgressPath
              completed={answeredUnique}
              total={available}
              label="Bank covered"
            />
            <p className="mt-3.5 text-[0.875rem] leading-relaxed text-muted-foreground">
              {answeredUnique === 0
                ? `${available} questions available in this track.`
                : `${mastered} answered correctly on the most recent attempt.`}
            </p>
          </FocusCard>

          <FocusCard>
            {/*
              The streak is a plain count. It carries no flame, no badge and no
              celebration: the design system rules out streak gamification, and
              a number is the honest version of this signal anyway.
            */}
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[0.875rem] font-medium">Consecutive days</span>
              <span className="text-[1.5rem] font-semibold tabular-nums">
                {streak > 0 ? streak : "—"}
              </span>
            </div>
            <p className="mt-3.5 text-[0.875rem] leading-relaxed text-muted-foreground">
              {streak > 1
                ? "Spacing practice across days is what moves it into recall."
                : "Short sessions on more days beat one long session."}
            </p>
          </FocusCard>
        </div>
      </section>

      {/*
        The practice exam keeps a route from this page. It had a nav entry and
        nothing here once, which meant the only way to find it was noticing a
        sixth item in the rail. It stays quiet rather than prominent — it is
        the occasional action, not the daily one.
      */}
      <FocusCard emphasis="quiet" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <DimensionalMark name="exam" size="md" />
          <div className="min-w-0">
            <h3 className="text-[1rem]">Take a practice exam</h3>
            <p className="mt-0.5 text-[0.875rem] leading-relaxed text-muted-foreground">
              100 questions, 3 hours, no feedback until you submit.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link href="/exam">Open practice exam</Link>
        </Button>
      </FocusCard>

      {/* -------------------------------------------------- Why it matters --- */}
      <InsightPanel title="Why this matters">
        Governance questions rarely have a single defensible answer that is
        obvious from the wording. What separates a strong answer from a
        plausible one is usually the order of reasoning — establishing the facts
        and the roles before reaching for a rule. The toolkit below sets out the
        sequences worth having in mind before you start.
      </InsightPanel>

      {/* ---------------------------------------------- Governance toolkit --- */}
      <section>
        <SectionHeading
          level={2}
          title="Governance toolkit"
          lede="Reference frames you can apply to any scenario in this app, and to real decisions outside it."
          className="mb-4"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <PreLaunchGate />
          <WhoIsAccountable />
        </div>
      </section>
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
