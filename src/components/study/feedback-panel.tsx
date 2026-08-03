"use client";

import { motion } from "framer-motion";
import { CheckCircle2, KeyRound, XCircle } from "lucide-react";
import type { Question } from "@/content/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeedbackPanelProps {
  question: Question;
  correct: boolean;
}

/**
 * Post-answer feedback: result, rationale, the portable takeaway, and the
 * framework tags the item maps to. Deliberately ordered so the takeaway — the
 * thing worth remembering — reads last and sits visually apart.
 */
export function FeedbackPanel({ question, correct }: FeedbackPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl border p-4",
          correct
            ? "border-success/35 bg-success/10 text-success"
            : "border-destructive/35 bg-destructive/10 text-destructive",
        )}
      >
        {correct ? (
          <CheckCircle2 className="h-5 w-5 shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 shrink-0" />
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
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Rationale
        </h2>
        <p className="text-[0.9375rem] leading-relaxed text-foreground/90">
          {question.rationale}
        </p>
      </section>

      <section className="rounded-xl border border-primary/30 bg-primary/[0.07] p-4">
        <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <KeyRound className="h-3.5 w-3.5" />
          Key takeaway
        </h2>
        <p className="text-[0.9375rem] leading-relaxed text-foreground/90">
          {question.keyTakeaway}
        </p>
      </section>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
