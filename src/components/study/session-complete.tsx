"use client";

import Link from "next/link";
import { FlorkArt } from "@/components/app/flork-art";
import { ResultActions } from "@/components/results/result-actions";
import { Button } from "@/components/ui/button";
import { SUBDOMAINS } from "@/content/bok";
import {
  type CompletedResult,
  type ResultSlice,
  elapsedMs,
  formatDuration,
  scoreSitting,
  weakestSubdomains,
} from "@/lib/results";
import { florkForScore } from "@/lib/flork";
import { cn } from "@/lib/utils";


export function SessionComplete({
  result,
  queued,
}: {
  result: CompletedResult;
  queued: number;
}) {
  const score = scoreSitting(result);
  const showQueue = queued > 0;
  const weak = weakestSubdomains(score);
  return (
    <div className="mx-auto max-w-3xl pb-16">
      <header className="mb-6 text-center">
        <div className="mb-5 flex items-center justify-center gap-4">
          <FlorkArt name={florkForScore(score.percentage)} size="lg" />
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/25 bg-accent-tint shadow-[var(--shadow-card)]">
            <span className="text-2xl font-semibold tabular-nums text-primary">
              {score.percentage}%
            </span>
          </div>
        </div>
        <h1 className="text-[2rem] leading-[1.15] sm:text-[2.25rem]">Session complete</h1>
        <p className="mt-2 text-muted-foreground">
          {score.correct} of {score.total} correct in {result.label.toLowerCase()}.
        </p>
      </header>
      <section className="mb-6 rounded-lg border border-border bg-card p-5">
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <SummaryStat label="Correct" value={score.correct} />
          <SummaryStat label="Incorrect" value={score.incorrect} />
          {score.unanswered > 0 ? (
            <SummaryStat label="Unanswered" value={score.unanswered} />
          ) : null}
          <SummaryStat label="Time used" value={formatDuration(elapsedMs(result))} />
        </dl>
      </section>
      {showQueue ? (
        <div className="mb-6 rounded-lg border border-l-4 border-primary bg-accent-tint p-4">
          <p className="text-sm font-medium">
            {queued} {queued === 1 ? "scenario is" : "scenarios are"} now in your review queue
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Missed scenarios come back on a spaced schedule so they stick.
          </p>
        </div>
      ) : null}
      {score.byDomain.length ? (
        <section className="mb-8">
          <h2 className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">Domain performance</h2>
          <ul className="space-y-3">
            {score.byDomain.map((d) => (
              <SummaryRow key={d.key} prefix={d.roman} label={d.label} slice={d} />
            ))}
          </ul>
        </section>
      ) : null}
      {score.bySubdomain.length ? (
        <section className="mb-8">
          <h2 className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">Sub-domain performance</h2>
          <ul className="space-y-3">
            {score.bySubdomain.map((sub) => (
              <SummaryRow
                key={sub.key}
                prefix={sub.key}
                label={SUBDOMAINS.find((x) => x.id === sub.key)?.competency ?? sub.key}
                slice={sub}
              />
            ))}
          </ul>
        </section>
      ) : null}
      {weak.length ? (
        <section className="mb-8">
          <h2 className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">Where to study next</h2>
          <ul className="space-y-3">
            {weak.map((sub) => {
              const meta = SUBDOMAINS.find((x) => x.id === sub.key);
              return (
                <li key={sub.key} className="rounded-lg border border-border bg-card p-4">
                  <p className="text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground">
                    {sub.key} · {sub.correct}/{sub.total} correct
                  </p>
                  <p className="measure mt-1 text-[0.9375rem] font-medium">{meta?.competency ?? sub.key}</p>
                  {meta?.recommendation ? (
                    <p className="measure mt-1.5 text-[0.875rem] leading-relaxed text-muted-foreground">{meta.recommendation}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <ResultActions result={result} />
      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        {showQueue ? (
          <Button asChild size="lg"><Link href="/review">Review them now</Link></Button>
        ) : null}
        <Button asChild size="lg" variant={showQueue ? "outline" : "default"}>
          <Link href="/home">Back to home</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/study">Start another session</Link>
        </Button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function SummaryRow({
  prefix,
  label,
  slice,
}: {
  prefix: string;
  label: string;
  slice: ResultSlice;
}) {
  return (
    <li>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="truncate text-sm">
          <span className="text-muted-foreground">{prefix}</span> {label}
        </span>
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {slice.correct}/{slice.total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary ring-1 ring-inset ring-border">
        <div
          style={{ width: `${slice.accuracy}%` }}
          className={cn(
            "h-full rounded-full",
            slice.accuracy >= 80 ? "bg-success" : slice.accuracy >= 60 ? "bg-primary" : "bg-warning",
          )}
        />
      </div>
    </li>
  );
}
