"use client";

import { ArrowRight, Flame, RotateCcw, Target, Timer } from "lucide-react";
import Link from "next/link";
import { AppGate } from "@/components/app/app-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getTrack, getTrackQuestions } from "@/content/registry";
import {
  focusDomains,
  masteredQuestionIds,
  overallAccuracy,
  todaySummary,
} from "@/lib/adaptive";
import { dueCount } from "@/lib/spaced-repetition";
import { effectiveStreak, useProgress } from "@/lib/store/progress-provider";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <AppGate>
      <Home />
    </AppGate>
  );
}

function Home() {
  const { progress } = useProgress();
  const track = getTrack(progress.trackId);

  const today = todaySummary(progress);
  const streak = effectiveStreak(progress);
  const accuracy = overallAccuracy(progress.attempts);
  const mastered = masteredQuestionIds(progress.attempts).size;
  const available = getTrackQuestions(progress.trackId).length;
  const answeredUnique = new Set(progress.attempts.map((a) => a.questionId))
    .size;
  const due = dueCount(progress);
  const focus = focusDomains(progress, progress.trackId);
  const weakest = focus[0];

  const isNew = progress.attempts.length === 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[2.25rem] font-bold leading-[1.15] tracking-tight">
          {isNew ? "Welcome" : greeting()}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{track.name}</p>
      </header>

      {/* Daily goal */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Target className="h-4 w-4 text-accent-strong" />
              <span className="text-sm font-medium">Daily goal</span>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">
              {today.answered} / {today.goal}
            </span>
          </div>

          <Progress
            value={today.progressPct}
            className="mt-3.5"
            indicatorClassName={cn(today.goalMet && "bg-success")}
          />

          <p className="mt-3 text-sm text-muted-foreground">
            {today.goalMet
              ? `Goal met — ${today.correct} of ${today.answered} correct today.`
              : `${today.goal - today.answered} more ${
                  today.goal - today.answered === 1 ? "scenario" : "scenarios"
                } to hit today's goal.`}
          </p>
        </CardContent>
      </Card>

      {/* Primary actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          asChild
          size="lg"
          className="h-auto justify-between whitespace-normal py-4"
        >
          <Link href="/study">
            <span className="text-left">
              <span className="block font-semibold">Continue studying</span>
              <span className="block text-xs font-normal opacity-80">
                {isNew
                  ? "Start your first session"
                  : "Pick up where you left off"}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        </Button>

        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-auto justify-between whitespace-normal py-4"
        >
          <Link href="/review">
            <span className="text-left">
              <span className="block font-semibold">Review queue</span>
              <span className="block text-xs font-normal text-muted-foreground">
                {due > 0
                  ? `${due} ${due === 1 ? "scenario" : "scenarios"} ready`
                  : "Nothing due right now"}
              </span>
            </span>
            <RotateCcw className="h-4 w-4 shrink-0" />
          </Link>
        </Button>
      </div>

      {/*
        Exam mode had a nav entry and nothing on this page, so the only route
        to it was noticing a sixth item in the rail. It is one of the three
        things someone comes here to do, and it belongs where the other two
        are — full width beneath them, because it is the occasional one.
      */}
      <Button
        asChild
        size="lg"
        variant="outline"
        className="h-auto w-full justify-between whitespace-normal py-4"
      >
        <Link href="/exam">
          {/* min-w-0 so the label can shrink; without it the subtitle sets the
              button's width and pushes the page into horizontal scroll at 375. */}
          <span className="min-w-0 text-left">
            <span className="block font-semibold">Take a practice exam</span>
            <span className="block text-wrap text-xs font-normal leading-snug text-muted-foreground">
              100 questions, 3 hours, no feedback until you submit
            </span>
          </span>
          <Timer className="h-4 w-4 shrink-0" />
        </Link>
      </Button>

      {/* Stats */}
      <section>
        <h2 className="mb-3 font-mono text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Your progress
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Answered today" value={String(today.answered)} />
          <Stat
            label="Scenarios completed"
            value={`${answeredUnique}/${available}`}
          />
          <Stat
            label="Accuracy"
            value={progress.attempts.length ? `${accuracy}%` : "—"}
          />
          <Stat
            label="Streak"
            value={streak > 0 ? `${streak}d` : "—"}
            icon={
              streak > 0 ? <Flame className="h-3.5 w-3.5 text-warning" /> : null
            }
          />
        </div>
      </section>

      {/* Weak-domain nudge, once there is enough evidence to mean something. */}
      {weakest ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Weakest domain right now</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {weakest.domain} — {weakest.accuracy}% across {weakest.answered}{" "}
                answered
                {focus.length > 1
                  ? ` · ${focus.length - 1} more below target`
                  : ""}
              </p>
            </div>
            <Button asChild variant="secondary" size="sm" className="shrink-0">
              <Link href="/study/session?focus=weak&count=10">Drill it</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {mastered > 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          {mastered} {mastered === 1 ? "scenario" : "scenarios"} mastered ·{" "}
          {progress.attempts.length} total answers recorded
        </p>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-1.5 text-xl font-semibold tabular-nums">
        {icon}
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
