"use client";

import { motion } from "framer-motion";
import { ArrowRight, Flame, RotateCcw, Target } from "lucide-react";
import Link from "next/link";
import { AppGate } from "@/components/app/app-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getTrack } from "@/content/registry";
import {
  masteredQuestionIds,
  overallAccuracy,
  todaySummary,
  weakDomains,
} from "@/lib/adaptive";
import { availableQuestions } from "@/lib/entitlements";
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
  const { progress, entitlements } = useProgress();
  const track = getTrack(progress.trackId);

  const today = todaySummary(progress);
  const streak = effectiveStreak(progress);
  const accuracy = overallAccuracy(progress.attempts);
  const mastered = masteredQuestionIds(progress.attempts).size;
  const available = availableQuestions(progress.tier, progress.trackId).length;
  const answeredUnique = new Set(progress.attempts.map((a) => a.questionId)).size;
  const due = entitlements.reviewQueue ? dueCount(progress) : 0;
  const weak = weakDomains(progress, progress.trackId)[0];

  const isNew = progress.attempts.length === 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isNew ? "Welcome" : greeting()}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{track.name}</p>
      </header>

      {/* Daily goal */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Target className="h-4 w-4 text-primary" />
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
                    today.goal - today.answered === 1 ? "question" : "questions"
                  } to hit today's goal.`}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Primary actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild size="lg" className="h-auto justify-between py-4">
          <Link href="/study">
            <span className="text-left">
              <span className="block font-semibold">Continue studying</span>
              <span className="block text-xs font-normal opacity-80">
                {isNew ? "Start your first session" : "Pick up where you left off"}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        </Button>

        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-auto justify-between py-4"
        >
          <Link href="/review">
            <span className="text-left">
              <span className="block font-semibold">Review queue</span>
              <span className="block text-xs font-normal text-muted-foreground">
                {!entitlements.reviewQueue
                  ? "Available on Pro"
                  : due > 0
                    ? `${due} ${due === 1 ? "question" : "questions"} ready`
                    : "Nothing due right now"}
              </span>
            </span>
            <RotateCcw className="h-4 w-4 shrink-0" />
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your progress
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Answered today"
            value={String(today.answered)}
          />
          <Stat
            label="Total completed"
            value={`${answeredUnique}/${available}`}
          />
          <Stat
            label="Accuracy"
            value={progress.attempts.length ? `${accuracy}%` : "—"}
          />
          <Stat
            label="Streak"
            value={streak > 0 ? `${streak}d` : "—"}
            icon={streak > 0 ? <Flame className="h-3.5 w-3.5 text-warning" /> : null}
          />
        </div>
      </section>

      {/* Weak-domain nudge, once there is enough evidence to mean something. */}
      {weak ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Weakest domain right now</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {weak.domain} — {weak.accuracy}% across {weak.answered} answered
              </p>
            </div>
            <Button asChild variant="secondary" size="sm" className="shrink-0">
              <Link
                href={
                  entitlements.domainFiltering
                    ? `/study/session?domain=${encodeURIComponent(weak.domain)}`
                    : "/upgrade"
                }
              >
                {entitlements.domainFiltering ? "Practise it" : "Unlock with Pro"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {mastered > 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          {mastered} {mastered === 1 ? "question" : "questions"} mastered ·{" "}
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
    <div className="rounded-xl border border-border bg-card p-4">
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
