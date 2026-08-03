"use client";

import { ArrowRight, Lock, Shuffle } from "lucide-react";
import Link from "next/link";
import { AppGate } from "@/components/app/app-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTrack } from "@/content/registry";
import { domainStats } from "@/lib/adaptive";
import { availableQuestions, FREE_QUESTION_LIMIT } from "@/lib/entitlements";
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
  const { progress, entitlements } = useProgress();
  const track = getTrack(progress.trackId);
  const available = availableQuestions(progress.tier, progress.trackId);
  const stats = domainStats(progress, progress.trackId);

  // Domains are derived from content — never a hardcoded list.
  const availableByDomain = new Map<string, number>();
  for (const q of available) {
    availableByDomain.set(q.domain, (availableByDomain.get(q.domain) ?? 0) + 1);
  }

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Study</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {track.name} · {available.length} of {track.questionCount} questions
          available
        </p>
      </header>

      {/* Mixed practice */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mixed practice
        </h2>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Shuffle className="h-4 w-4 text-primary" />
              </span>
              <div>
                <h3 className="font-semibold">Adaptive session</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Questions across every domain, ordered by what you have not
                  seen and where your accuracy is weakest.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {SESSION_LENGTHS.map((count) => (
                <Button key={count} asChild variant="secondary">
                  <Link href={`/study/session?count=${count}`}>{count} questions</Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Domain practice */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Practise by domain
          </h2>
          {!entitlements.domainFiltering ? (
            <Badge variant="outline">
              <Lock className="h-3 w-3" />
              Pro
            </Badge>
          ) : null}
        </div>

        <div className="space-y-2.5">
          {track.domains.map((domain) => {
            const stat = stats.find((s) => s.domain === domain);
            const count = availableByDomain.get(domain) ?? 0;
            const locked = !entitlements.domainFiltering || count === 0;

            return (
              <Link
                key={domain}
                href={
                  locked
                    ? "/upgrade"
                    : `/study/session?domain=${encodeURIComponent(domain)}`
                }
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium">{domain}</h3>
                    {locked ? (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {count} available
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

      {!entitlements.fullLibrary ? (
        <Card className="border-primary/30">
          <CardContent className="p-5">
            <h3 className="font-semibold">You are on the free tier</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Free access covers the first {FREE_QUESTION_LIMIT} questions of the
              track with mixed practice. Pro unlocks the full library, domain
              filtering, the review queue, and full spaced repetition.
            </p>
            <Button asChild className="mt-4 w-full sm:w-auto">
              <Link href="/upgrade">See what Pro includes</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
