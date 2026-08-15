"use client";

import Link from "next/link";
import { AppGate } from "@/components/app/app-gate";
import { DimensionalMark } from "@/components/civic/dimensional-mark";
import { OversightLevelComparison } from "@/components/civic/gpai";
import { ReviewForecast } from "@/components/app/domain-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTrack } from "@/content/registry";
import {
  bokDomainSlices,
  focusAreas,
  overallStats,
  strongestArea,
  subdomainSlices,
  weakestArea,
} from "@/lib/analytics";
import { AnalyticsView } from "@/components/app/analytics-view";
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
  const due = dueCount(progress);
  const forecast = upcomingReviews(progress, 7);

  // Study analytics — a read-only layer over the same attempts.
  const overall = overallStats(progress, progress.trackId);
  const bokDomains = bokDomainSlices(progress, progress.trackId);
  const subdomains = subdomainSlices(progress, progress.trackId);
  const focus = focusAreas(progress, progress.trackId);
  const strongest = strongestArea(progress, progress.trackId);
  const weakest = weakestArea(progress, progress.trackId);

  if (attempts.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-[2rem] leading-[1.15] sm:text-[2.25rem]">Progress</h1>
        </header>
        <Card>
          <CardContent className="flex flex-col items-center p-8 text-center">
            <DimensionalMark name="brand" size="xl" />
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
        <h1 className="text-[2rem] leading-[1.15] sm:text-[2.25rem]">Progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">{track.name}</p>
      </header>

      <AnalyticsView
        overall={overall}
        domains={bokDomains}
        subdomains={subdomains}
        focus={focus}
        strongest={strongest}
        weakest={weakest}
      />

      <section>
        <h2 className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
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

      {/*
        A learning recommendation rather than another chart. Oversight level is
        the judgement these analytics most often point at, and it is worth
        having the three postures to hand while reading where you are weakest.
      */}
      <section>
        <h2 className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Worth reviewing
        </h2>
        <OversightLevelComparison />
      </section>
    </div>
  );
}
