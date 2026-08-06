"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { Question } from "@/content/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeedbackPanelProps {
  question: Question;
  correct: boolean;
}

/**
 * Post-answer feedback.
 *
 * Hierarchy is deliberate: the result is a coded strip with a heavy left rule,
 * the rationale is plain body text, and the Key Takeaway is a solid inverted
 * block — the strongest element on the screen. The takeaway is the part worth
 * carrying to the next scenario, so it gets the weight, not the score.
 *
 * Colour is functional. Blue confirms and red alerts, per the palette; the
 * left rule carries the signal so the text beside it stays fully legible.
 */
export function FeedbackPanel({ question, correct }: FeedbackPanelProps) {
  return (
    <div className="space-y-6">
      <div
        className={cn(
          "flex items-center gap-2.5 border border-l-4 px-4 py-3",
          correct
            ? "border-success bg-success-tint text-success"
            : "border-destructive bg-destructive-tint text-destructive",
        )}
      >
        {correct ? (
          <CheckCircle2 className="h-[1.125rem] w-[1.125rem] shrink-0" />
        ) : (
          <XCircle className="h-[1.125rem] w-[1.125rem] shrink-0" />
        )}
        <div className="text-[0.9375rem] font-semibold">
          {correct ? "Correct" : "Incorrect"}
          {!correct ? (
            <span className="ml-1.5 font-normal opacity-90">
              — the answer is {question.correctAnswer}
            </span>
          ) : null}
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Rationale
        </h2>
        <p className="measure text-[0.9375rem] leading-relaxed text-foreground/90">
          {question.rationale}
        </p>
      </section>

      {/* The anchor of the screen: the surface inverted, nothing else. */}
      <section className="bg-foreground p-5 text-background">
        <h2 className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] opacity-70">
          Key takeaway
        </h2>
        <p className="measure text-base font-medium leading-relaxed">
          {question.keyTakeaway}
        </p>
      </section>

      <section>
        <h2 className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Frameworks
        </h2>
        <div className="flex flex-wrap gap-2">
          {question.frameworkTags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
          {question.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
