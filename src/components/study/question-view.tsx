"use client";

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

      {/*
        The question stem is a key learning question, which is exactly what the
        design system reserves the editorial serif for. It is also the largest
        text on the screen and sits at reading measure, so the decision gets the
        space it needs to be read carefully rather than skimmed.
      */}
      <h1 className="measure text-pretty font-serif text-[1.375rem] leading-snug sm:text-[1.625rem] sm:leading-snug">
        <ConceptHighlight text={question.question} limit={3} />
      </h1>

      {question.visualAid ? <VisualAid aid={question.visualAid} /> : null}

      {multi ? (
        /* One text node, spaces and all: the separators are decoration, and a
           screen reader must still hear "choose 2 of 5, no partial credit". */
        <p className="mt-5 inline-block rounded-md border border-accent-subtle bg-accent-tint px-3 py-1.5 text-[0.8125rem] font-medium text-accent-foreground">
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
                "transition-all duration-[120ms] not-disabled:active:translate-y-px",
                "disabled:cursor-default",

                // Resting: a premium selectable surface, lifted just off the
                // page so the choices read as separate objects rather than as
                // list rows.
                !revealed &&
                  !isSelected &&
                  "border-border bg-card shadow-[var(--shadow-raised)] hover:border-border-strong hover:bg-secondary/60",

                // Selected: a periwinkle ring drawn *inside* the border rather
                // than a heavier border, so the box never changes size and the
                // row does not shift under the cursor.
                isSelected &&
                  !revealed &&
                  "border-accent bg-accent-tint shadow-[var(--shadow-card)] ring-1 ring-inset ring-accent",

                // Post-answer states stay informational, not celebratory.
                showCorrect &&
                  "border-success bg-success-tint ring-1 ring-inset ring-success",
                showWrong && "border-destructive bg-destructive-tint",
                revealed &&
                  !showCorrect &&
                  !showWrong &&
                  "border-border bg-card opacity-60",
              )}
            >
              {/*
                The leading node carries the option letter, and after the reveal
                it carries a drawn glyph instead. Correctness is never signalled
                by colour alone: the glyph shape differs, and `FeedbackPanel`
                states the outcome in words directly beneath.
              */}
              <span
                className={cn(
                  "mt-px flex h-7 w-7 shrink-0 items-center justify-center border text-[0.8125rem] font-semibold transition-colors",
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
                  <MarkGlyph kind="correct" />
                ) : showWrong ? (
                  <MarkGlyph kind="incorrect" />
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
 * The correctness glyphs, drawn inline rather than pulled from an icon set.
 *
 * They live inside a node that is already sized and coloured by the caller, so
 * they are pure geometry at 14px: a confirmed path and a crossed path. Both are
 * `aria-hidden` — the option's `aria-checked` state and the feedback panel's
 * wording carry the meaning to a screen reader.
 */
function MarkGlyph({ kind }: { kind: "correct" | "incorrect" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      {kind === "correct" ? (
        <path d="M5 12.5 10 17.5 19 7" />
      ) : (
        <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
      )}
    </svg>
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
      className="mb-7 rounded-xl border border-border bg-card p-6 shadow-card sm:p-7"
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Scenario
        </h2>
        <span className="text-[0.75rem] text-muted-foreground">
          {scenario.sector}
        </span>
      </header>

      {/* The brief's title is display type, so it takes the serif. */}
      <p className="measure mb-4 font-serif text-[1.125rem] leading-snug text-foreground">
        {scenario.title}
      </p>

      <div className="space-y-3.5">
        {scenario.body.map((paragraph, i) => (
          <p
            key={i}
            className="measure text-[0.9375rem] leading-[1.75] text-foreground/90"
          >
            <ConceptHighlight text={paragraph} limit={2} />
          </p>
        ))}
      </div>

      {scenario.facts?.length ? (
        <dl className="mt-5 grid gap-x-5 gap-y-2 border-t border-border pt-4 text-[0.875rem] sm:grid-cols-[minmax(9rem,auto)_1fr]">
          {scenario.facts.map((fact) => (
            <div key={fact.label} className="contents">
              <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground sm:pt-1">
                {fact.label}
              </dt>
              <dd className="measure mb-2 leading-relaxed sm:mb-0">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
