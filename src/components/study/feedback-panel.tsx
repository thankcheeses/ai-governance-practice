"use client";

import { motion } from "framer-motion";
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
 * Hierarchy is deliberate: the result is a quiet one-line strip, the rationale
 * is plain body text, and the Key Takeaway is a solid deep-teal block — the
 * strongest element on the screen. The takeaway is the part worth carrying to
 * the next scenario, so it gets the visual weight, not the score.
 */
export function FeedbackPanel({ question, correct }: FeedbackPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg border px-4 py-3",
          correct
            ? "border-success/30 bg-success-tint text-success"
            : "border-destructive/30 bg-destructive-tint text-destructive",
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
        <p className="text-[0.9375rem] leading-relaxed text-foreground/90">
          {question.rationale}
        </p>
      </section>

      {/* The anchor of the screen. Solid brand teal, white text. */}
      <section
        className={cn(
          "relative overflow-hidden rounded-lg p-5",
          "bg-primary text-white shadow-[var(--shadow-accent)]",
        )}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25"
          aria-hidden
        />
        <h2 className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-accent-subtle">
          Key takeaway
        </h2>
        <p className="text-base font-medium leading-relaxed">
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
    </motion.div>
  );
}
