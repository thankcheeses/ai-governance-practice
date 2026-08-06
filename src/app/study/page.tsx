"use client";

import { ArrowRight, Shuffle, Target } from "lucide-react";
import Link from "next/link";
import { AppGate } from "@/components/app/app-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTrack, getTrackQuestions } from "@/content/registry";
import { domainStats, focusDomains } from "@/lib/adaptive";
import { useProgress } from "@/lib/store/progress-provider";

const SESSION_LENGTHS = [5, 10, 20];

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
        <h1 className="text-2xl font-semibold tracking-tight">Study</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {track.name} · {track.questionCount} scenarios, all free
        </p>
        {track.context ? (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {track.context}
          </p>
        ) : null}
      </header>

      {/* Focus session — only once weak-domain accuracy means something. */}
      {focus.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Focus session
          </h2>
          <Card className="border-accent/40">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-tint ring-1 ring-accent/25">
                  <Target className="h-4 w-4 text-primary" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold">
                    Drill your {focus.length === 1 ? "weakest domain" : "weakest domains"}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Scenarios drawn only from where your accuracy is lowest.
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {focus.map((d) => (
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
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {SESSION_LENGTHS.map((count) => (
                  <Button key={count} asChild>
                    <Link href={`/study/session?focus=weak&count=${count}`}>
                      {count} scenarios
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {/* Mixed practice */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mixed practice
        </h2>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-tint ring-1 ring-accent/25">
                <Shuffle className="h-4 w-4 text-primary" />
              </span>
              <div>
                <h3 className="font-semibold">Adaptive session</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Scenarios across every domain, ordered by what you have not
                  seen and where your accuracy is weakest.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {SESSION_LENGTHS.map((count) => (
                <Button key={count} asChild variant="secondary">
                  <Link href={`/study/session?count=${count}`}>{count} scenarios</Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Domain practice */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Practise by domain
        </h2>

        <div className="space-y-2.5">
          {track.domains.map((domain) => {
            const stat = stats.find((s) => s.domain === domain);
            const count = countByDomain.get(domain) ?? 0;

            return (
              <Link
                key={domain}
                href={`/study/session?domain=${encodeURIComponent(domain)}`}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-px hover:border-accent/50 hover:shadow-[var(--shadow-card-hover)]"
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
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
