"use client";

import { useMemo, useState } from "react";
import { ConceptHighlight } from "@/components/study/concept-highlight";
import { Badge } from "@/components/ui/badge";
import {
  type CompletedResult,
  type QuestionOutcome,
  questionOutcomes,
} from "@/lib/results";
import { sittingFromComposition } from "@/lib/session";
import { cn } from "@/lib/utils";

/**
 * Every question in the sitting as a button: green if it was answered
 * correctly, red if it was missed.
 *
 * "Missed" means answered wrongly *or* left blank, exactly as the score counts
 * it — a blank costs the same as a wrong answer, so it gets the same colour. A
 * blank is still told apart from a wrong answer by a dashed edge and by its
 * label, because "I ran out of time" and "I chose badly" need different study.
 *
 * Colour is never the only signal: each button carries a tick or a cross and
 * an accessible name that says the outcome in words.
 *
 * Selecting a button opens that question underneath with the options marked,
 * the rationale and the key takeaway — the same review for a question you got
 * right as for one you missed, because confirming *why* a right answer was
 * right is part of the study.
 */
export function QuestionMap({
  result,
  title = "Every question",
}: {
  result: CompletedResult;
  title?: string;
}) {
  const outcomes = useMemo(() => questionOutcomes(result), [result]);
  const sitting = useMemo(
    () => sittingFromComposition(result.questionIds, result.optionIds, result.seed),
    [result],
  );
  const [openId, setOpenId] = useState<string | null>(null);

  if (!outcomes.length) return null;
  const right = outcomes.filter((o) => o.status === "correct").length;
  const open = outcomes.find((o) => o.questionId === openId) ?? null;

  return (
    <section className="mb-8" aria-labelledby="question-map-title">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2
          id="question-map-title"
          className="text-[0.8125rem] font-medium uppercase tracking-[0.1em] text-muted-foreground"
        >
          {title}
        </h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[0.75rem] text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-3 w-3 rounded-[4px] bg-success" />
            Correct · {right}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-3 w-3 rounded-[4px] bg-destructive" />
            Missed · {outcomes.length - right}
          </li>
        </ul>
      </div>

      <p className="measure mb-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
        Tap a number to see the question, your answer and why the right one is
        right.
      </p>

      <ol className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
        {outcomes.map((o) => (
          <li key={o.questionId}>
            <OutcomeButton
              outcome={o}
              selected={o.questionId === openId}
              onSelect={() =>
                setOpenId((cur) => (cur === o.questionId ? null : o.questionId))
              }
            />
          </li>
        ))}
      </ol>

      {open && sitting ? (
        <QuestionDetail
          key={open.questionId}
          outcome={open}
          sitting={sitting}
          chosen={result.answers[open.questionId] ?? []}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </section>
  );
}

function OutcomeButton({
  outcome,
  selected,
  onSelect,
}: {
  outcome: QuestionOutcome;
  selected: boolean;
  onSelect: () => void;
}) {
  const correct = outcome.status === "correct";
  const words =
    outcome.status === "correct"
      ? "correct"
      : outcome.status === "incorrect"
        ? "missed, answered incorrectly"
        : "missed, left blank";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Question ${outcome.number}: ${words}`}
      data-status={outcome.status}
      className={cn(
        "relative flex h-11 w-full items-center justify-center rounded-lg border text-[0.875rem] font-semibold tabular-nums",
        "shadow-[0_1px_0_rgb(0_0_0/0.12)] transition-transform duration-100 active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        correct
          ? "border-success bg-success text-success-foreground hover:brightness-110"
          : "border-destructive bg-destructive text-destructive-foreground hover:brightness-110",
        outcome.status === "unanswered" && "border-dashed border-destructive-foreground/70",
        selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
      )}
    >
      {outcome.number}
      <span aria-hidden className="absolute right-1 top-0.5 text-[0.625rem] leading-none opacity-90">
        {correct ? "✓" : outcome.status === "incorrect" ? "✕" : "–"}
      </span>
    </button>
  );
}

function QuestionDetail({
  outcome,
  sitting,
  chosen,
  onClose,
}: {
  outcome: QuestionOutcome;
  sitting: NonNullable<ReturnType<typeof sittingFromComposition>>;
  chosen: string[];
  onClose: () => void;
}) {
  const i = outcome.number - 1;
  const question = sitting.questions[i];
  const options = sitting.options[i];
  if (!question || !options) return null;
  const correct = outcome.status === "correct";

  return (
    <div
      className={cn(
        "mt-4 rounded-xl border-2 bg-card p-5",
        correct ? "border-success" : "border-destructive",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <Badge variant={correct ? "success" : "destructive"}>
          {`Question ${outcome.number} · ${
            correct ? "correct" : outcome.status === "incorrect" ? "missed" : "left blank"
          }`}
        </Badge>
        <button
          type="button"
          onClick={onClose}
          className="text-[0.8125rem] text-muted-foreground underline decoration-border-strong underline-offset-2 hover:decoration-current"
        >
          Close
        </button>
      </div>

      <p className="measure text-[0.9375rem] leading-relaxed">{question.question}</p>

      <ul className="mt-4 space-y-1.5">
        {options.map((o) => {
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
              <span className="mr-2 text-xs text-muted-foreground">{o.key}</span>
              {o.text}
              {isRight ? (
                <span className="ml-2 text-[0.6875rem] text-success">
                  {wasChosen ? "correct · your answer" : "correct"}
                </span>
              ) : wasChosen ? (
                <span className="ml-2 text-[0.6875rem] text-destructive">your answer</span>
              ) : null}
            </li>
          );
        })}
      </ul>

      <h3 className="mb-2 mt-5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        Rationale
      </h3>
      <p className="measure text-[0.9375rem] leading-[1.7] text-foreground/90">
        <ConceptHighlight text={question.rationale} />
      </p>

      <div className="mt-4 rounded-lg border border-accent/30 bg-accent-tint p-4">
        <h3 className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-accent-strong">
          Key takeaway
        </h3>
        <p className="measure text-[0.9375rem] font-medium leading-[1.7]">
          {question.keyTakeaway}
        </p>
      </div>

      {question.sources?.length ? (
        <div className="mt-4">
          <h3 className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Check it against
          </h3>
          <ul className="measure space-y-1 text-[0.8125rem] text-muted-foreground">
            {question.sources.map((s) => (
              <li key={s.cite}>
                ·{" "}
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-border-strong underline-offset-2 hover:decoration-current"
                  >
                    {s.cite}
                  </a>
                ) : (
                  s.cite
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {question.frameworkTags.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {question.frameworkTags.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
