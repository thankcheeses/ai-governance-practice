"use client";

import Link from "next/link";
import { AppGate } from "@/components/app/app-gate";
import { BrandMark } from "@/components/app/brand-mark";
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
        <h1 className="text-[2.25rem] font-bold leading-[1.15] tracking-tight">Review queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Missed scenarios first, then low-confidence answers, then scheduled
          reviews.
        </p>
      </header>

      {queue.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-8 text-center">
            <BrandMark variant="glass" />
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
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">
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

          <section>
            <h2 className="mb-3 font-mono text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              In the queue
            </h2>
            <ul className="space-y-2.5">
              {queue.slice(0, 20).map((item) => {
                const meta = REASON_META[item.reason];
                return (
                  <li
                    key={item.question.id}
                    className="border border-border bg-card p-4 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-sm leading-relaxed">
                        {item.question.question}
                      </p>
                      <Badge variant={meta.variant} className="shrink-0">
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.question.domain}
                      {item.card && item.card.repetitions > 0
                        ? ` · seen ${item.card.repetitions}×`
                        : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
            {queue.length > 20 ? (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                and {queue.length - 20} more
              </p>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
