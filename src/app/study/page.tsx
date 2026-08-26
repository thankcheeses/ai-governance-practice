"use client";

import Link from "next/link";
import { DimensionalMark } from "@/components/civic/dimensional-mark";
import { AppGate } from "@/components/app/app-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTrack, getTrackQuestions } from "@/content/registry";
import { domainStats, focusDomains } from "@/lib/adaptive";
import { domainVisual } from "@/lib/domain-visual";
import { useProgress } from "@/lib/store/progress-provider";
import { cn } from "@/lib/utils";

const SESSION_LENGTHS = [5, 10, 20];

/**
 * ISO date to "25 August 2026". Parsed and formatted in UTC so the displayed
 * date is the date that was recorded, not the reader's local shift of it —
 * an audit assertion that changes by timezone is not an audit assertion.
 */
function formatReviewDate(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function StudyPage() {
  return (
    <AppGate>
      <Study />
    </AppGate>
  );
}

function Study() {
  const { progress } = useProgress();
  const track = getTrack(progress.trackId);
  const questions = getTrackQuestions(progress.trackId);
  const stats = domainStats(progress, progress.trackId);
  const focus = focusDomains(progress, progress.trackId);

  // Domains are derived from content — never a hardcoded list.
  const countByDomain = new Map<string, number>();
  for (const q of questions) {
    countByDomain.set(q.domain, (countByDomain.get(q.domain) ?? 0) + 1);
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-accent-strong">
          Practice
        </p>
        <h1 className="text-[2rem] leading-[1.15] sm:text-[2.25rem]">Study</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {track.name} · {track.questionCount} scenarios, all free
        </p>
        {track.context ? (
          <div className="mt-3 border-l-2 border-border-strong pl-3">
            <p className="measure text-xs leading-relaxed text-muted-foreground">
              {track.context}
            </p>
            {/*
              Three assertions, three lines. Crammed onto one they ran to 192
              characters and stopped being scannable; separated, each is a
              distinct claim a reader can check independently.
            */}
            {track.contextReviewed ? (
              <dl className="measure mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground">
                <dt>Authority</dt>
                <dd>{track.contextAuthority ?? "—"}</dd>
                <dt>Version</dt>
                <dd>{track.contextVersion ?? "—"}</dd>
                <dt>Checked</dt>
                <dd>{formatReviewDate(track.contextReviewed)}</dd>
                {track.contextCoverage ? (
                  <>
                    <dt>Coverage</dt>
                    <dd>{track.contextCoverage}</dd>
                  </>
                ) : null}
              </dl>
            ) : null}
          </div>
        ) : null}
      </header>

      {/* Focus session — only once weak-domain accuracy means something. */}
      {focus.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Focus session
          </h2>
          <Card className="border-primary/30 shadow-[var(--shadow-accent)]">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <DimensionalMark name="progress" size="md" tone="accent" />
                <div className="min-w-0">
                  <h3 className="font-semibold">
                    Drill your{" "}
                    {focus.length === 1 ? "weak domain" : "weak domains"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {focus.join(", ")}
                  </p>
                  <div className="mt-4">
                    <Button asChild size="sm">
                      <Link
                        href={`/study/session?focus=1&count=10`}
                      >
                        Start focus session
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Session length
        </h2>
        <div className="flex flex-wrap gap-2">
          {SESSION_LENGTHS.map((n) => (
            <Button key={n} asChild variant="outline" size="sm">
              <Link href={`/study/session?count=${n}`}>{n} questions</Link>
            </Button>
          ))}
          <Button asChild variant="outline" size="sm">
            <Link href="/study/session">Continue</Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          By domain
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[...countByDomain.entries()].map(([domain, count]) => {
            const stat = stats.find((s) => s.domain === domain);
            const visual = domainVisual(domain);
            const answered = stat?.answered ?? 0;
            const accuracy = stat?.accuracy;
            return (
              <Link
                key={domain}
                href={`/study/session?domain=${encodeURIComponent(domain)}`}
                className={cn(
                  "group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4",
                  "shadow-card transition-colors duration-150 hover:border-border-strong",
                  "no-underline",
                )}
              >
                <span
                  aria-hidden
                  className={cn("absolute inset-y-0 left-0 w-[3px]", visual.accentClass)}
                />
                <div className="flex items-start justify-between gap-3 pl-2">
                  <div className="min-w-0">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Domain {visual.roman}
                    </p>
                    <h3 className="mt-1 text-[0.9375rem] font-semibold leading-snug text-foreground">
                      {domain}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-md border px-2 py-0.5 text-[0.6875rem] font-medium tabular-nums",
                      visual.chipClass,
                    )}
                  >
                    {count}
                  </span>
                </div>
                <div className="pl-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary ring-1 ring-inset ring-border">
                    <div
                      className={cn("h-full rounded-full transition-all", visual.accentClass)}
                      style={{
                        width: `${Math.min(100, Math.round((answered / Math.max(count, 1)) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {answered > 0
                      ? `${answered} answered · ${accuracy}% accuracy · ${stat?.mastered ?? 0} mastered`
                      : `${count} scenarios · not started`}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
