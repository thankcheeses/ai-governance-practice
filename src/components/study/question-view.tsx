"use client";

import { Check, X } from "lucide-react";
import type { PresentedOption, Question, Scenario } from "@/content/types";
import { ConceptHighlight } from "@/components/study/concept-highlight";
import { VisualAid } from "@/components/study/visual-aid";
import { isMultiSelect, requiredSelections } from "@/lib/grading";
import { cn } from "@/lib/utils";

interface QuestionViewProps {
  question: Question;
  /** Options in the order this session deals them, with their letters. */
  options: readonly PresentedOption[];
  /** Option ids, not letters — see lib/presentation.ts. */
  selected: readonly string[];
  revealed: boolean;
  onSelect: (optionId: string) => void;
}

/**
 * One question per screen.
 *
 * Layout order is fixed: question text → optional visual aid → answer choices.
 * The diagram sits between the stem and the options so it is read as context
 * for the question rather than as commentary on an answer.
 *
 * Arity follows the question. Single-select renders radios; multi-select
 * renders checkboxes and states how many choices are required *before* the
 * learner answers, because the grading is all-or-nothing and discovering the
 * requirement afterwards would be an interface failure rather than a knowledge
 * one. Either way selection locks the moment the answer is revealed, so a
 * second tap can never change a recorded answer.
 */
export function QuestionView({
  question,
  options,
  selected,
  revealed,
  onSelect,
}: QuestionViewProps) {
  const multi = isMultiSelect(question);
  const required = requiredSelections(question);

  return (
    <div>
      {question.scenario ? <ScenarioPanel scenario={question.scenario} /> : null}

      <h1 className="measure text-pretty text-xl font-semibold leading-snug tracking-[-0.01em] sm:text-2xl sm:leading-snug">
        <ConceptHighlight text={question.question} limit={3} />
      </h1>

      {question.visualAid ? <VisualAid aid={question.visualAid} /> : null}

      {multi ? (
        /* One text node, spaces and all: the separators are decoration, and a
           screen reader must still hear "choose 2 of 5, no partial credit". */
        <p className="mt-5 inline-block rounded-md border border-accent-subtle bg-accent-tint px-2.5 py-1.5 font-mono text-xs font-medium text-accent-foreground">
          <span className="font-semibold">Multi-select</span>
          {` · choose ${required} of ${question.options.length} · no partial credit`}
        </p>
      ) : null}

      <div
        role={multi ? "group" : "radiogroup"}
        aria-label="Answer choices"
        className={cn(
          "space-y-2.5",
          question.visualAid ? "mt-2" : multi ? "mt-3" : "mt-6",
        )}
      >
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isAnswer = question.correctOptionIds.includes(option.id);
          const showCorrect = revealed && isAnswer;
          const showWrong = revealed && isSelected && !isAnswer;

          return (
            <button
              key={option.id}
              type="button"
              role={multi ? "checkbox" : "radio"}
              aria-checked={isSelected}
              disabled={revealed}
              onClick={() => onSelect(option.id)}
              className={cn(
                "flex w-full items-start gap-3.5 rounded-lg border p-4 text-left",
                "transition-[background-color,border-color,box-shadow] duration-150",
                "disabled:cursor-default",

                // Resting: a card of its own, lifted just off the page so the
                // choices read as separate objects rather than as list rows.
                !revealed &&
                  !isSelected &&
                  "border-border bg-card shadow-[var(--shadow-card)] hover:border-border-strong hover:bg-secondary",

                // Selected: an accent ring drawn *inside* the border rather than a
                // heavier border, so the box never changes size and the row
                // does not shift under the cursor.
                isSelected &&
                  !revealed &&
                  "border-accent bg-accent-tint ring-1 ring-inset ring-accent",

                // Post-answer states stay informational, not celebratory.
                showCorrect && "border-success bg-success-tint ring-1 ring-inset ring-success",
                showWrong && "border-destructive bg-destructive-tint",
                revealed &&
                  !showCorrect &&
                  !showWrong &&
                  "border-border bg-card opacity-60",
              )}
            >
              <span
                className={cn(
                  "mt-px flex h-6 w-6 shrink-0 items-center justify-center border font-mono text-xs font-semibold transition-colors",
                  multi ? "rounded-md" : "rounded-full",
                  isSelected &&
                    !revealed &&
                    "border-primary bg-primary text-primary-foreground",
                  showCorrect && "border-success bg-success text-success-foreground",
                  showWrong &&
                    "border-destructive bg-destructive text-destructive-foreground",
                  !isSelected &&
                    !showCorrect &&
                    "border-border-strong text-muted-foreground",
                )}
              >
                {showCorrect ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : showWrong ? (
                  <X className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  option.key
                )}
              </span>
              <span className="measure text-[0.9375rem] leading-relaxed sm:text-base">
                {option.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The fact pattern, above the question it belongs to.
 *
 * Deliberately not collapsed by default and deliberately not truncated. The
 * skill being practised is reading a dense brief and working out which facts
 * bear on the decision — hiding two thirds of it behind a "show more" would
 * remove the exercise. It is set at reading measure and given its own surface
 * so the eye can tell scenario from question at a glance.
 *
 * The same scenario renders above each of its questions. That is intentional:
 * every question is gradable on its own, so a learner who meets one in
 * isolation still has everything they need.
 */
function ScenarioPanel({ scenario }: { scenario: Scenario }) {
  return (
    <section
      aria-label="Scenario"
      className="mb-6 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]"
    >
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Scenario
        </h2>
        <span className="font-mono text-[0.6875rem] text-muted-foreground">
          {scenario.sector}
        </span>
      </header>

      <p className="measure mb-3 text-[0.9375rem] font-semibold leading-snug">
        {scenario.title}
      </p>

      <div className="space-y-3">
        {scenario.body.map((paragraph, i) => (
          <p key={i} className="measure text-[0.875rem] leading-[1.7] text-foreground/90">
            <ConceptHighlight text={paragraph} limit={2} />
          </p>
        ))}
      </div>

      {scenario.facts?.length ? (
        <dl className="mt-4 grid gap-x-4 gap-y-1.5 border-t border-border pt-3 text-[0.8125rem] sm:grid-cols-[minmax(9rem,auto)_1fr]">
          {scenario.facts.map((fact) => (
            <div key={fact.label} className="contents">
              <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-muted-foreground sm:pt-0.5">
                {fact.label}
              </dt>
              <dd className="measure mb-1.5 leading-relaxed sm:mb-0">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
