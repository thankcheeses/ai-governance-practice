"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { OptionKey, PresentedOption, Question } from "@/content/types";
import { formatAnswer, isMultiSelect } from "@/lib/grading";
import { ConceptHighlight } from "@/components/study/concept-highlight";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeedbackPanelProps {
  question: Question;
  correct: boolean;
  /** Letters the correct options were dealt in this session's shuffle. */
  correctKeys: readonly OptionKey[];
  /** Options in this session's dealt order, so notes carry their own letter. */
  options: readonly PresentedOption[];
  /** Option ids the learner chose, so their own near-miss is called out first. */
  selected: readonly string[];
}

/**
 * Post-answer feedback.
 *
 * Three tiers, in this order:
 *
 *   1. The verdict — a coded strip with a heavy left rule. Loud but small; it
 *      is the least durable thing on the screen.
 *   2. The rationale — plain body text at reading measure, with terms of art
 *      marked so the concept under test can be found without reading every
 *      word.
 *   3. The key takeaway — an accent-tinted panel, the heaviest element here.
 *      It is the
 *      part worth carrying into the next scenario, so it outweighs the score.
 *
 * Colour is functional throughout: green confirms, red alerts, and the left
 * rule carries the signal so the text beside it stays fully legible.
 */
/**
 * The one heading style in this panel. Small, mono, letter-spaced — it names
 * the block without competing with the block's own text for attention.
 */
function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "mb-2.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function FeedbackPanel({
  question,
  correct,
  correctKeys,
  options,
  selected,
}: FeedbackPanelProps) {
  /*
    Wrong options that carry a note, ordered so the learner's own choice comes
    first. Most of the learning in a judgement item is in the near-miss — an
    action that is genuinely governance work but wrong here, or right but out
    of sequence — and the one they picked is the one they need explained.
  */
  const distractors = options
    .filter(
      (o) =>
        !question.correctOptionIds.includes(o.id) &&
        question.distractorNotes?.[o.id],
    )
    .sort((a, b) => {
      const aChosen = selected.includes(a.id) ? 0 : 1;
      const bChosen = selected.includes(b.id) ? 0 : 1;
      return aChosen - bChosen || a.key.localeCompare(b.key);
    });
  return (
    <div className="space-y-6">
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg border border-l-4 px-4 py-3",
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
              — the {isMultiSelect(question) ? "answers are" : "answer is"}{" "}
              {formatAnswer(correctKeys)}
            </span>
          ) : null}
        </div>
      </div>

      <section>
        <SectionLabel>Rationale</SectionLabel>
        <p className="measure text-[0.9375rem] leading-[1.7] text-foreground/90">
          <ConceptHighlight text={question.rationale} />
        </p>
      </section>

      {/*
        The anchor of the screen. An accent tint rather than an inverted slab:
        it still outweighs everything around it, but it reads as the product's
        own voice rather than as a warning notice.
      */}
      <section className="rounded-lg border border-accent/30 bg-accent-tint p-5 shadow-[var(--shadow-card)]">
        <SectionLabel className="text-accent-strong">Key takeaway</SectionLabel>
        <p className="measure text-base font-medium leading-[1.7] text-foreground">
          <ConceptHighlight text={question.keyTakeaway} limit={2} />
        </p>
      </section>

      {distractors.length ? (
        <section>
          <SectionLabel>Why the others are wrong</SectionLabel>
          <ul className="space-y-2.5">
            {distractors.map((option) => (
              <li
                key={option.id}
                className={cn(
                  "measure flex gap-3 rounded-lg border p-3.5 text-[0.875rem] leading-[1.7]",
                  selected.includes(option.id)
                    ? "border-destructive/40 bg-destructive-tint"
                    : "border-border bg-card",
                )}
              >
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-strong font-mono text-[0.6875rem] font-semibold text-muted-foreground">
                  {option.key}
                </span>
                <span className="text-foreground/90">
                  {question.distractorNotes![option.id]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {question.sources?.length ? (
        <section>
          <SectionLabel>Check it against</SectionLabel>
          <ul className="measure space-y-1 font-mono text-[0.8125rem] leading-relaxed text-muted-foreground">
            {question.sources.map((source) => (
              <li key={source} className="flex gap-2">
                <span aria-hidden className="select-none text-border-strong">
                  &middot;
                </span>
                {source}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <SectionLabel>Frameworks referenced</SectionLabel>
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
