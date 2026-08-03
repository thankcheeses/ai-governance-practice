"use client";

import { Check, X } from "lucide-react";
import type { OptionKey, Question } from "@/content/types";
import { cn } from "@/lib/utils";

interface QuestionViewProps {
  question: Question;
  selected: OptionKey | null;
  revealed: boolean;
  onSelect: (key: OptionKey) => void;
}

/**
 * One question per screen. Selection is single-choice and locks the moment the
 * answer is revealed, so a second tap can never change a recorded answer.
 */
export function QuestionView({
  question,
  selected,
  revealed,
  onSelect,
}: QuestionViewProps) {
  return (
    <div>
      <h1 className="text-pretty text-xl font-semibold leading-snug sm:text-2xl sm:leading-snug">
        {question.question}
      </h1>

      <div
        role="radiogroup"
        aria-label="Answer choices"
        className="mt-6 space-y-2.5"
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
                "flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-all duration-150",
                "disabled:cursor-default",
                !revealed &&
                  "hover:border-primary/60 hover:bg-accent/40 active:scale-[0.99]",
                isSelected && !revealed && "border-primary bg-primary/10",
                !isSelected && !revealed && "border-border bg-card",
                showCorrect && "border-success bg-success/10",
                showWrong && "border-destructive bg-destructive/10",
                revealed &&
                  !showCorrect &&
                  !showWrong &&
                  "border-border bg-card opacity-55",
              )}
            >
              <span
                className={cn(
                  "mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold",
                  isSelected &&
                    !revealed &&
                    "border-primary bg-primary text-primary-foreground",
                  showCorrect && "border-success bg-success text-success-foreground",
                  showWrong &&
                    "border-destructive bg-destructive text-destructive-foreground",
                  !isSelected &&
                    !showCorrect &&
                    "border-border text-muted-foreground",
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
