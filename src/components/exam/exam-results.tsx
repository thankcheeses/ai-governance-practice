"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConceptHighlight } from "@/components/study/concept-highlight";
import { getQuestion } from "@/content/registry";
import { SUBDOMAINS } from "@/content/bok";
import { ResultActions } from "@/components/results/result-actions";
import {
  type ExamSession,
  type ExamSlice,
  resultFromExam,
  scoreExam,
  sittingFromExam,
} from "@/lib/exam";
import { elapsedMs, formatDuration, timeRemainingAtFinish } from "@/lib/results";
import { cn } from "@/lib/utils";

/**
 * What the paper came to.
 *
 * The one honesty constraint that shapes this screen: it reports what happened
 * on this simulation and nothing beyond it. There is no predicted score, no
 * pass line, no "you are ready" — the questions are independently authored and
 * a percentage here is a fact about this bank, not about any real sitting.
 * Everything on screen is either a count, or a study pointer derived from one.
 */

export function ExamResults({
  session,
  onDiscard,
}: {
  session: ExamSession;
  onDiscard: () => void;
}) {
  const result = useMemo(() => scoreExam(session), [session]);
  const sitting = useMemo(() => sittingFromExam(session), [session]);
  const record = useMemo(() => resultFromExam(session), [session]);
  const [openId, setOpenId] = useState<string | null>(null);

  const weakest = useMemo(
    () =>
      result.bySubdomain
        .filter((s) => s.total >= 2)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3),
    [result],
  );

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <header className="mb-6">
        <p className="text-[0.6875rem] uppercase tracking-[0.1em] text-muted-foreground">
          Practice simulation · not a certification exam
        </p>
        <h1 className="mt-1 text-[1.875rem] leading-[1.15] sm:text-[2rem]">
          Practice exam complete
        </h1>
        <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
          {session.submittedReason === "expired"
            ? "Time ran out and the exam was submitted automatically."
            : "You submitted this exam."}{" "}
          These questions are independently written from the published body of
          knowledge. This score describes how you did here; it does not predict
          any certification result.
        </p>
      </header>

      <section className="mb-6 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <span className="text-[3rem] font-bold leading-none tabular-nums">
            {result.percentage}%
          </span>
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <Stat label="Correct" value={result.correct} />
            <Stat label="Incorrect" value={result.incorrect} />
            <Stat label="Unanswered" value={result.unanswered} />
            <Stat label="Flagged" value={result.flaggedCount} />
          </dl>
        </div>
        {record ? (
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-4 text-sm">
            <Stat label="Time used" value={formatDuration(elapsedMs(record))} />
            <Stat
              label="Time remaining"
              value={formatDuration(timeRemainingAtFinish(record) ?? 0)}
            />
          </dl>
        ) : null}
      </section>

      <Section title="Domain performance">
        <ul className="space-y-3">
          {result.byDomain.map((d) => (
            <SliceRow key={d.key} slice={d} prefix={d.roman} />
          ))}
        </ul>
      </Section>

      <Section title="Sub-domain performance">
        <ul className="space-y-3">
          {result.bySubdomain.map((s) => (
            <SliceRow
              key={s.key}
              slice={s}
              prefix={s.key}
              label={SUBDOMAINS.find((x) => x.id === s.key)?.competency}
            />
          ))}
        </ul>
      </Section>

      {weakest.length ? (
        <Section title="Where to study next">
          <ul className="space-y-3">
            {weakest.map((s) => {
              const meta = SUBDOMAINS.find((x) => x.id === s.key);
              return (
                <li key={s.key} className="rounded-lg border border-border bg-card p-4">
                  <p className="text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground">
                    {s.key} · {s.correct}/{s.total} correct
                  </p>
                  <p className="measure mt-1 text-[0.9375rem] font-medium">
                    {meta?.competency ?? s.key}
                  </p>
                  {meta?.recommendation ? (
                    <p className="measure mt-1.5 text-[0.875rem] leading-relaxed text-muted-foreground">
                      {meta.recommendation}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {result.missedIds.length && sitting ? (
        <Section title={`Review — ${result.missedIds.length} to revisit`}>
          <ul className="space-y-2.5">
            {result.missedIds.map((id) => {
              const question = getQuestion(id);
              if (!question) return null;
              const i = session.questionIds.indexOf(id);
              const chosen = session.answers[id] ?? [];
              const open = openId === id;
              return (
                <li key={id} className="rounded-lg border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : id)}
                    aria-expanded={open}
                    className="flex w-full items-start gap-3 p-4 text-left"
                  >
                    <span className="mt-px text-xs tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="measure flex-1 text-[0.9375rem] leading-relaxed">
                      {question.question}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-md border px-2 py-0.5 text-[0.6875rem]",
                        chosen.length
                          ? "border-destructive/40 text-destructive"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {chosen.length ? "incorrect" : "blank"}
                    </span>
                  </button>

                  {open ? (
                    <div className="space-y-4 border-t border-border p-4">
                      <ul className="space-y-1.5">
                        {sitting.options[i].map((o) => {
                          const isRight = question.correctOptionIds.includes(o.id);
                          const wasChosen = chosen.includes(o.id);
                          return (
                            <li
                              key={o.id}
                              className={cn(
                                "measure rounded-sm border px-3 py-2 text-[0.875rem] leading-relaxed",
                                isRight && "border-success bg-success-tint",
                                !isRight && wasChosen && "border-destructive bg-destructive-tint",
                                !isRight && !wasChosen && "border-border",
                              )}
                            >
                              <span className="mr-2 text-xs text-muted-foreground">
                                {o.key}
                              </span>
                              {o.text}
                              {isRight ? (
                                <span className="ml-2 text-[0.6875rem] text-success">
                                  correct
                                </span>
                              ) : wasChosen ? (
                                <span className="ml-2 text-[0.6875rem] text-destructive">
                                  your answer
                                </span>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>

                      <div>
                        <Label>Rationale</Label>
                        <p className="measure text-[0.9375rem] leading-[1.7] text-foreground/90">
                          <ConceptHighlight text={question.rationale} />
                        </p>
                      </div>

                      <div className="rounded-lg border border-accent/30 bg-accent-tint p-4">
                        <Label className="text-accent-strong">Key takeaway</Label>
                        <p className="measure text-[0.9375rem] font-medium leading-[1.7]">
                          {question.keyTakeaway}
                        </p>
                      </div>

                      {question.sources?.length ? (
                        <div>
                          <Label>Check it against</Label>
                          <ul className="measure space-y-1 text-[0.8125rem] text-muted-foreground">
                            {question.sources.map((s) => (
                              <li key={s}>· {s}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        {question.frameworkTags.map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {record ? <ResultActions result={record} /> : null}

      <div className="mt-8 flex flex-wrap gap-2.5">
        <Button asChild>
          <Link href="/home">Back to home</Link>
        </Button>
        <Button variant="outline" onClick={onDiscard}>
          Start a new exam
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3
      className={cn(
        "mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </h3>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SliceRow({
  slice,
  prefix,
  label,
}: {
  slice: ExamSlice;
  prefix: string;
  label?: string;
}) {
  return (
    <li>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="truncate text-sm">
          <span className="text-muted-foreground">{prefix}</span>{" "}
          {label ?? slice.label}
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
            slice.accuracy >= 80
              ? "bg-success"
              : slice.accuracy >= 60
                ? "bg-primary"
                : "bg-warning",
          )}
        />
      </div>
    </li>
  );
}
