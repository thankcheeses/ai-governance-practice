"use client";

import { Check, X } from "lucide-react";
import type { OptionKey, Question } from "@/content/types";
import { VisualAid } from "@/components/study/visual-aid";
import { cn } from "@/lib/utils";

interface QuestionViewProps {
  question: Question;
  selected: OptionKey | null;
  revealed: boolean;
  onSelect: (key: OptionKey) => void;
}

/**
 * One question per screen.
 *
 * Layout order is fixed: question text → optional visual aid → answer choices.
 * The diagram sits between the stem and the options so it is read as context
 * for the question rather than as commentary on an answer.
 *
 * Selection is single-choice and locks the moment the answer is revealed, so a
 * second tap can never change a recorded answer.
 */
export function QuestionView({
  question,
  selected,
  revealed,
  onSelect,
}: QuestionViewProps) {
  return (
    <div>
      <h1 className="measure text-pretty text-xl font-semibold leading-snug tracking-[-0.01em] sm:text-2xl sm:leading-snug">
        {question.question}
      </h1>

      {question.visualAid ? <VisualAid aid={question.visualAid} /> : null}

      <div
        role="radiogroup"
        aria-label="Answer choices"
        className={cn("space-y-2.5", question.visualAid ? "mt-2" : "mt-6")}
      >
        {question.options.map((option) => {
          const isSelected = selected === option.key;
          const isAnswer = option.key === question.correctAnswer;
          const showCorrect = revealed && isAnswer;
          const showWrong = revealed && isSelected && !isAnswer;

          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={revealed}
              onClick={() => onSelect(option.key)}
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
