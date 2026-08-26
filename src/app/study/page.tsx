"use client";

import Link from "next/link";
import { DimensionalMark } from "@/components/civic/dimensional-mark";
import { AppGate } from "@/components/app/app-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTrack, getTrackQuestions } from "@/content/registry";
import { domainStats, focusDomains } from "@/lib/adaptive";
import { useProgress } from "@/lib/store/progress-provider";

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
        <div className="overflow-hidden rounded-xl border border-border divide-y divide-border">
          {[...countByDomain.entries()].map(([domain, count]) => {
            const stat = stats.find((s) => s.domain === domain);
            return (
              <Link
                key={domain}
                href={`/study/session?domain=${encodeURIComponent(domain)}`}
                className="flex items-center gap-4 bg-card p-4 transition-colors duration-150 hover:bg-secondary"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{domain}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {count} scenarios
                    {stat && stat.answered > 0
                      ? ` · ${stat.accuracy}% accuracy · ${stat.mastered} mastered`
                      : " · not started"}
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
