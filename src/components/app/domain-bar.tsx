"use client";

import type { DomainStat } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Horizontal bars rather than a chart library: accuracy per domain reads
 * faster as a ranked list, and it keeps the bundle free of a charting
 * dependency for what is fundamentally four numbers.
 */
export function DomainAccuracyChart({ stats }: { stats: DomainStat[] }) {
  const sorted = [...stats].sort((a, b) => b.accuracy - a.accuracy);

  return (
    <ul className="space-y-4">
      {sorted.map((stat) => {
        const started = stat.answered > 0;
        return (
          <li key={stat.domain}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium">{stat.domain}</span>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {started ? `${stat.accuracy}%` : "—"}
              </span>
            </div>

            <div
              className="h-2 overflow-hidden rounded-full bg-secondary ring-1 ring-inset ring-border"
              role="img"
              aria-label={`${stat.domain}: ${started ? `${stat.accuracy}% accuracy` : "not started"}`}
            >
              <div
                style={{ width: `${started ? stat.accuracy : 0}%` }}
                className={cn(
                  "h-full rounded-full transition-[width] duration-500 ease-out",
                  stat.accuracy >= 80
                    ? "bg-success"
                    : stat.accuracy >= 60
                      ? "bg-primary"
                      : "bg-warning",
                )}
              />
            </div>

            <p className="mt-1.5 text-xs text-muted-foreground">
              {started
                ? `${stat.correct}/${stat.answered} correct · ${stat.mastered}/${stat.total} mastered`
                : `${stat.total} questions · not started`}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/** Seven-day forecast of scheduled reviews. */
export function ReviewForecast({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex items-end justify-between gap-2" role="img" aria-label="Reviews scheduled over the next seven days">
      {data.map((day) => (
        <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs tabular-nums text-muted-foreground">
            {day.count || ""}
          </span>
          <div
            style={{ height: `${Math.max(4, (day.count / max) * 64)}px` }}
            className={cn(
              "w-full rounded-sm",
              day.count > 0 ? "bg-primary" : "bg-secondary",
            )}
          />
          <span className="text-[0.6875rem] text-muted-foreground">
            {new Date(day.date).toLocaleDateString(undefined, {
              weekday: "narrow",
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
