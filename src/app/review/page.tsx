"use client";

import Link from "next/link";
import { AppGate } from "@/components/app/app-gate";
import { DimensionalMark } from "@/components/civic/dimensional-mark";
import { MonitoringThatActuallyWorks } from "@/components/civic/gpai";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildReviewQueue, upcomingReviews, type ReviewReason } from "@/lib/spaced-repetition";
import { useProgress } from "@/lib/store/progress-provider";

const REASON_META: Record<
  ReviewReason,
  { label: string; variant: "destructive" | "warning" | "secondary" }
> = {
  missed: { label: "Missed", variant: "destructive" },
  "low-confidence": { label: "Low confidence", variant: "warning" },
  due: { label: "Due", variant: "secondary" },
};

export default function ReviewPage() {
  return (
    <AppGate>
      <Review />
    </AppGate>
  );
}

function Review() {
  const { progress } = useProgress();

  const queue = buildReviewQueue(progress);
  const upcoming = upcomingReviews(progress, 7);
  const upcomingTotal = upcoming.reduce((sum, day) => sum + day.count, 0);

  const counts = queue.reduce<Record<ReviewReason, number>>(
    (acc, item) => {
      acc[item.reason] += 1;
      return acc;
    },
    { missed: 0, "low-confidence": 0, due: 0 },
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-accent-strong">
          Spaced practice
        </p>
        <h1 className="text-[2rem] leading-[1.15] sm:text-[2.25rem]">
          Return to the decision
        </h1>
        <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
          Missed scenarios first, then low-confidence answers, then scheduled
          reviews. Coming back to a decision you got wrong is where most of the
          learning actually happens.
        </p>
      </header>

      {queue.length === 0 ? (
        <Card className="border-accent/20 bg-gradient-to-br from-accent-tint/40 via-card to-card shadow-card">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <DimensionalMark name="brand" size="xl" tone="accent" />
            <h2 className="mt-5 font-semibold">Nothing due right now</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {upcomingTotal > 0
                ? `${upcomingTotal} ${upcomingTotal === 1 ? "question" : "questions"} scheduled over the next 7 days.`
                : "Work through some scenarios and anything you miss will appear here."}
            </p>
            <Button asChild className="mt-5">
              <Link href="/study">Go to study</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-accent/25 bg-gradient-to-br from-accent-tint/35 via-card to-card shadow-card">
            <CardContent className="p-5">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl tabular-nums tracking-tight text-foreground">
                  {queue.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  {queue.length === 1 ? "question" : "questions"} ready
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(Object.keys(counts) as ReviewReason[])
                  .filter((reason) => counts[reason] > 0)
                  .map((reason) => {
                    const meta = REASON_META[reason];
                    return (
                      <Badge key={reason} variant={meta.variant}>
                        {counts[reason]} {meta.label.toLowerCase()}
                      </Badge>
                    );
                  })}
              </div>

              <Button asChild size="lg" className="mt-5 w-full">
                <Link href="/review/session">Start review</Link>
              </Button>
            </CardContent>
          </Card>

          <MonitoringThatActuallyWorks />

          <section>
            <h2 className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              In the queue
            </h2>
            <ul className="space-y-2.5">
              {queue.slice(0, 20).map((item) => {
                const meta = REASON_META[item.reason];
                return (
                  <li
                    key={item.question.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-sm leading-relaxed">
                        {item.question.question}
                      </p>
                      <Badge variant={meta.variant} className="shrink-0">
                        {meta.label}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
            {queue.length > 20 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                and {queue.length - 20} more in the full session
              </p>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
