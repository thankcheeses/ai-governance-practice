"use client";

import { ChevronLeft, ChevronRight, Flag, LayoutGrid } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PresentedOption, Question } from "@/content/types";
import {
  EXAM_WARNING_MS,
  type ExamSession,
  type ExamSitting,
  answerQuestion,
  formatRemaining,
  goToIndex,
  isAcceptingAnswers,
  remainingMs,
  submitExam,
  submitIfExpired,
  toggleFlag,
  unansweredIds,
} from "@/lib/exam";
import { writeExamSession } from "@/lib/exam-storage";
import { isMultiSelect, requiredSelections, toggleSelection } from "@/lib/grading";
import { cn } from "@/lib/utils";

/**
 * A sitting under a clock.
 *
 * Deliberately unlike practice in the ways that matter:
 *
 *  - **Nothing is graded on screen.** No correct/incorrect colour, no
 *    rationale, no key takeaway until the paper is submitted. A candidate who
 *    learns the answer to question 4 while sitting question 4 is no longer
 *    being measured.
 *  - **Every question is reachable.** Practice is a queue; an exam is a paper
 *    you move around in, flag, and come back to.
 *  - **The clock is authoritative.** Remaining time is `deadline - now` on
 *    every tick, so a slept tab, a throttled interval or a reload all resolve
 *    to the same instant.
 */

interface ExamRunnerProps {
  session: ExamSession;
  sitting: ExamSitting;
  onChange: (next: ExamSession) => void;
  onSubmitted: (submitted: ExamSession) => void;
}

export function ExamRunner({
  session,
  sitting,
  onChange,
  onSubmitted,
}: ExamRunnerProps) {
  const [now, setNow] = useState(() => Date.now());
  const [navOpen, setNavOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const submittedRef = useRef(false);

  const question: Question | undefined = sitting.questions[session.index];
  const options: PresentedOption[] = sitting.options[session.index] ?? [];
  const total = session.questionIds.length;
  // Memoised so the empty-array fallback is not a new reference each render,
  // which would re-create every callback that depends on it.
  const selected = useMemo(
    () => (question ? (session.answers[question.id] ?? []) : []),
    [question, session.answers],
  );
  const multi = question ? isMultiSelect(question) : false;
  const open = isAcceptingAnswers(session, now);

  const left = remainingMs(session, now);
  const warning = left <= EXAM_WARNING_MS && left > 0;

  /*
    One second tick, purely to re-render the clock. It never decrements a
    stored value — `remainingMs` recomputes from the deadline — so a tab that
    slept for an hour shows the truth on its first frame back.
  */
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // The deadline closes the paper on its own, whether or not anyone is looking.
  useEffect(() => {
    if (submittedRef.current) return;
    const expired = submitIfExpired(session, now);
    if (expired !== session) {
      submittedRef.current = true;
      writeExamSession(expired);
      onSubmitted(expired);
    }
  }, [session, now, onSubmitted]);

  const commit = useCallback(
    (next: ExamSession) => {
      if (next === session) return;
      writeExamSession(next);
      onChange(next);
    },
    [session, onChange],
  );

  const handleSelect = useCallback(
    (optionId: string) => {
      if (!question || !open) return;
      const next = toggleSelection(question, selected, optionId);
      commit(answerQuestion(session, question.id, next));
    },
    [question, open, selected, session, commit],
  );

  const move = useCallback(
    (delta: number) => commit(goToIndex(session, session.index + delta)),
    [session, commit],
  );

  const handleSubmit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const done = submitExam(session, "manual");
    writeExamSession(done);
    onSubmitted(done);
  }, [session, onSubmitted]);

  // Arrow keys move between questions; the exam is a paper, not a queue.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (confirming) return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, confirming]);

  const unanswered = useMemo(() => unansweredIds(session).length, [session]);

  if (!question) return null;

  return (
    <div className="pb-40 lg:pb-10">
      <ExamHeader
        index={session.index}
        total={total}
        remaining={left}
        warning={warning}
        unanswered={unanswered}
        flagged={session.flagged.length}
        onOpenNav={() => setNavOpen((v) => !v)}
        navOpen={navOpen}
      />

      {navOpen ? (
        <QuestionNavigator
          session={session}
          onPick={(i) => {
            commit(goToIndex(session, i));
            setNavOpen(false);
          }}
        />
      ) : null}

      <div className="mx-auto max-w-3xl">
        {question.scenario ? (
          <section
            aria-label="Scenario"
            className="mb-6 rounded-lg border border-border bg-card p-5"
          >
            <h2 className="mb-3 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Scenario · {question.scenario.sector}
            </h2>
            <p className="measure mb-3 text-[0.9375rem] font-semibold leading-snug">
              {question.scenario.title}
            </p>
            <div className="space-y-3">
              {question.scenario.body.map((p, i) => (
                <p key={i} className="measure text-[0.875rem] leading-[1.7] text-foreground/90">
                  {p}
                </p>
              ))}
            </div>
            {question.scenario.facts?.length ? (
              <dl className="mt-4 grid gap-x-4 gap-y-1.5 border-t border-border pt-3 text-[0.8125rem] sm:grid-cols-[minmax(9rem,auto)_1fr]">
                {question.scenario.facts.map((f) => (
                  <div key={f.label} className="contents">
                    <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-muted-foreground sm:pt-0.5">
                      {f.label}
                    </dt>
                    <dd className="measure mb-1.5 leading-relaxed sm:mb-0">{f.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>
        ) : null}

        <h1 className="measure text-pretty text-xl font-semibold leading-snug sm:text-2xl sm:leading-snug">
          {question.question}
        </h1>

        {multi ? (
          <p className="mt-5 inline-block rounded-md border border-accent-subtle bg-accent-tint px-2.5 py-1.5 font-mono text-xs font-medium text-accent-foreground">
            <span className="font-semibold">Multi-select</span>
            {` · choose ${requiredSelections(question)} of ${question.options.length}`}
          </p>
        ) : null}

        <div
          role={multi ? "group" : "radiogroup"}
          aria-label="Answer choices"
          className={cn("space-y-2.5", multi ? "mt-3" : "mt-6")}
        >
          {options.map((option) => {
            const chosen = selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                role={multi ? "checkbox" : "radio"}
                aria-checked={chosen}
                disabled={!open}
                onClick={() => handleSelect(option.id)}
                className={cn(
                  "flex w-full items-start gap-3.5 rounded-lg border p-4 text-left",
                  "transition-[background-color,border-color] duration-150",
                  "disabled:cursor-default disabled:opacity-70",
                  /*
                    Selected, never "right". The only state an option has during
                    an exam is chosen or not chosen — no success or destructive
                    colour appears anywhere on this screen.
                  */
                  chosen
                    ? "border-accent bg-accent-tint ring-1 ring-inset ring-accent"
                    : "border-border bg-card hover:border-border-strong hover:bg-secondary",
                )}
              >
                <span
                  className={cn(
                    "mt-px flex h-6 w-6 shrink-0 items-center justify-center border font-mono text-xs font-semibold",
                    multi ? "rounded-md" : "rounded-full",
                    chosen
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border-strong text-muted-foreground",
                  )}
                >
                  {option.key}
                </span>
                <span className="measure text-[0.9375rem] leading-relaxed sm:text-base">
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background px-4 py-3 pb-safe-nav sm:px-6 lg:static lg:mt-8 lg:border-0 lg:px-0 lg:pb-0">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => move(-1)}
            disabled={session.index === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <Button
            variant={session.flagged.includes(question.id) ? "default" : "outline"}
            size="sm"
            onClick={() => commit(toggleFlag(session, question.id))}
            disabled={!open}
            aria-pressed={session.flagged.includes(question.id)}
          >
            <Flag className="h-4 w-4" />
            {session.flagged.includes(question.id) ? "Flagged" : "Flag"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => move(1)}
            disabled={session.index >= total - 1}
            className="ml-auto"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button size="sm" onClick={() => setConfirming(true)} disabled={!open}>
            Submit exam
          </Button>
        </div>
      </div>

      {confirming ? (
        <SubmitConfirmation
          total={total}
          unanswered={unanswered}
          flagged={session.flagged.length}
          onCancel={() => setConfirming(false)}
          onConfirm={handleSubmit}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ExamHeader({
  index,
  total,
  remaining,
  warning,
  unanswered,
  flagged,
  onOpenNav,
  navOpen,
}: {
  index: number;
  total: number;
  remaining: number;
  warning: boolean;
  unanswered: number;
  flagged: number;
  onOpenNav: () => void;
  navOpen: boolean;
}) {
  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono text-sm font-semibold tabular-nums">
          {index + 1} <span className="text-muted-foreground">/ {total}</span>
        </span>

        <span
          role="timer"
          aria-live={warning ? "polite" : "off"}
          aria-label={`Time remaining ${formatRemaining(remaining)}`}
          className={cn(
            "rounded-md border px-2.5 py-1 font-mono text-sm font-semibold tabular-nums",
            warning
              ? "border-warning bg-warning/10 text-warning"
              : "border-border text-foreground",
          )}
        >
          {formatRemaining(remaining)}
          {warning ? <span className="sr-only"> — time is nearly up</span> : null}
        </span>

        <span className="font-mono text-xs text-muted-foreground">
          {unanswered} unanswered
          {flagged > 0 ? ` · ${flagged} flagged` : ""}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenNav}
          aria-expanded={navOpen}
          className="ml-auto"
        >
          <LayoutGrid className="h-4 w-4" />
          {navOpen ? "Hide" : "All questions"}
        </Button>
      </div>
    </div>
  );
}

function QuestionNavigator({
  session,
  onPick,
}: {
  session: ExamSession;
  onPick: (index: number) => void;
}) {
  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-4">
      <p className="mb-3 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground">
        Answered · <span className="text-foreground">filled</span> ·
        flagged · <span className="text-warning">ringed</span>
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-1.5">
        {session.questionIds.map((id, i) => {
          const answered = (session.answers[id]?.length ?? 0) > 0;
          const flagged = session.flagged.includes(id);
          const current = i === session.index;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPick(i)}
              aria-current={current ? "true" : undefined}
              aria-label={`Question ${i + 1}${answered ? ", answered" : ", unanswered"}${flagged ? ", flagged" : ""}`}
              className={cn(
                "flex h-9 items-center justify-center rounded-sm border font-mono text-xs tabular-nums transition-colors",
                answered
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-border-strong",
                flagged && "ring-2 ring-inset ring-warning",
                current && "outline outline-2 outline-offset-2 outline-accent",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SubmitConfirmation({
  total,
  unanswered,
  flagged,
  onCancel,
  onConfirm,
}: {
  total: number;
  unanswered: number;
  flagged: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-raised)]"
      >
        <h2 id="submit-title" className="text-lg font-semibold">
          Submit this exam?
        </h2>
        <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
          {unanswered > 0
            ? `${unanswered} of ${total} questions are unanswered and will be marked incorrect.`
            : `All ${total} questions are answered.`}
          {flagged > 0 ? ` ${flagged} are flagged for review.` : ""}
        </p>
        <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
          You cannot change answers after submitting.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" onClick={onCancel}>
            Keep working
          </Button>
          <Button onClick={onConfirm} className="ml-auto">
            Submit exam
          </Button>
        </div>
      </div>
    </div>
  );
}
