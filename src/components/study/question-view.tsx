"use client";

import { Check, X } from "lucide-react";
import type { PresentedOption, Question } from "@/content/types";
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
      <h1 className="measure text-pretty text-xl font-semibold leading-snug tracking-[-0.01em] sm:text-2xl sm:leading-snug">
        {question.question}
      </h1>

      {question.visualAid ? <VisualAid aid={question.visualAid} /> : null}

      {multi ? (
        <p className="mt-5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Multi-select · choose {required} of {question.options.length} · no
          partial credit
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
                "flex w-full items-start gap-3.5 border p-4 text-left",
                "transition-colors duration-150 disabled:cursor-default",

                // Resting: plain surface, 1px rule.
                !revealed &&
                  !isSelected &&
                  "border-border bg-card hover:border-border-strong hover:bg-secondary",

                // Selected: the stroke doubles and darkens. No tint, no
                // scaling — selection is a border weight the eye reads at a
                // glance. Padding drops 1px so the box does not shift.
                isSelected &&
                  !revealed &&
                  "border-2 border-foreground bg-secondary p-[0.9375rem]",

                // Post-answer states stay informational, not celebratory.
                showCorrect && "border-success bg-success-tint",
                showWrong && "border-destructive bg-destructive-tint",
                revealed &&
                  !showCorrect &&
                  !showWrong &&
                  "border-border bg-card opacity-60",
              )}
            >
              <span
                className={cn(
                  "mt-px flex h-6 w-6 shrink-0 items-center justify-center border text-xs font-semibold transition-colors",
                  isSelected &&
                    !revealed &&
                    "border-foreground bg-foreground text-background",
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
              <span className="text-[0.9375rem] leading-relaxed sm:text-base">
                {option.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
