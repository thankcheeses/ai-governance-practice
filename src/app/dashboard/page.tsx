"use client";

import Link from "next/link";
import { AppGate } from "@/components/app/app-gate";
import { BrandMark } from "@/components/app/brand-mark";
import {
  DomainAccuracyChart,
  ReviewForecast,
} from "@/components/app/domain-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTrack, getTrackQuestions } from "@/content/registry";
import {
  domainStats,
  focusDomains,
  masteredQuestionIds,
  overallAccuracy,
  strongDomains,
  targetDifficulty,
  weakDomains,
} from "@/lib/adaptive";
import { dueCount, upcomingReviews } from "@/lib/spaced-repetition";
import { useProgress } from "@/lib/store/progress-provider";

export default function DashboardPage() {
  return (
    <AppGate>
      <Dashboard />
    </AppGate>
  );
}

function Dashboard() {
  const { progress } = useProgress();
  const track = getTrack(progress.trackId);

  const attempts = progress.attempts;
  const accuracy = overallAccuracy(attempts);
  const mastered = masteredQuestionIds(attempts);
  const available = getTrackQuestions(progress.trackId);
  const stats = domainStats(progress, progress.trackId);
  const due = dueCount(progress);
  const forecast = upcomingReviews(progress, 7);
  const weak = weakDomains(progress, progress.trackId);
  const focus = focusDomains(progress, progress.trackId);
  const strong = strongDomains(progress, progress.trackId);
  const level = targetDifficulty(attempts);

  if (attempts.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-[2.25rem] font-bold leading-[1.15] tracking-tight">Progress</h1>
        </header>
        <Card>
          <CardContent className="flex flex-col items-center p-8 text-center">
            <BrandMark variant="glass" />
            <h2 className="mt-5 font-semibold">No data yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Work through a few scenarios and this page will show accuracy by
              domain, what you have mastered, and what is due for review.
            </p>
            <Button asChild className="mt-5">
              <Link href="/study">Start studying</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-[2.25rem] font-bold leading-[1.15] tracking-tight">Progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">{track.name}</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Scenarios answered" value={String(attempts.length)} />
        <Stat
          label="Correct answers"
          value={String(attempts.filter((a) => a.correct).length)}
        />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Mastered" value={`${mastered.size}/${available.length}`} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[0.875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Domain performance
          </h2>
          <Badge variant="outline" className="capitalize">
            Current level: {level}
          </Badge>
        </div>
        <Card>
          <CardContent className="p-5">
            <DomainAccuracyChart stats={stats} />
          </CardContent>
        </Card>
      </section>

      {weak.length > 0 || strong.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
          {strong.length > 0 ? (
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold">Strengths</h2>
                <ul className="mt-3 space-y-2">
                  {strong.map((d) => (
                    <li
                      key={d.domain}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="truncate text-muted-foreground">
                        {d.domain}
                      </span>
                      <span className="shrink-0 tabular-nums text-success">
                        {d.accuracy}%
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {weak.length > 0 ? (
            <Card>
              <CardContent className="flex h-full flex-col p-5">
                <h2 className="text-sm font-semibold">Needs work</h2>
                <ul className="mt-3 space-y-2">
                  {weak.map((d) => (
                    <li
                      key={d.domain}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="truncate text-muted-foreground">
                        {d.domain}
                      </span>
                      <span className="shrink-0 tabular-nums text-warning">
                        {d.accuracy}%
                      </span>
                    </li>
                  ))}
                </ul>
                {/* A readout the learner cannot act on is just a scold. */}
                {/* whitespace-nowrap on the button base would force this
                    column wider than a 320px viewport; the label wraps. */}
                <Button
                  asChild
                  variant="secondary"
                  className="mt-4 h-auto w-full whitespace-normal py-2.5 text-center"
                >
                  <Link href="/study/session?focus=weak&count=10">
                    {focus.length === 1
                      ? "Drill the weakest domain"
                      : `Drill the ${focus.length} weakest domains`}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-[0.875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Review schedule
        </h2>
        <Card>
          <CardContent className="p-5">
            <div className="mb-5 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">{due}</span>
              <span className="text-sm text-muted-foreground">due now</span>
            </div>
            <ReviewForecast data={forecast} />
            <p className="mt-4 text-xs text-muted-foreground">
              Next 7 days of scheduled reviews
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
