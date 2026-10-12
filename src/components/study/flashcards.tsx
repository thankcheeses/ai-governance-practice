"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { ConceptHighlight } from "@/components/study/concept-highlight";
import { ProtectedText } from "@/components/study/protected-text";
import { ScenarioPanel } from "@/components/study/question-view";
import { ReadAloud } from "@/components/study/read-aloud";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isMultiSelect } from "@/lib/grading";
import { answerText, type CardSource, type Flashcard } from "@/lib/flashcards";
import { gradePreview, newReviewCard } from "@/lib/spaced-repetition";
import { useProgress } from "@/lib/store/progress-provider";
import type { ReviewGrade } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * A deck of cards: the stem on the front, the answer on the back, and the four
 * ratings SM-2 was written for.
 *
 * ## It does not record an attempt
 *
 * `useProgress` is used for `gradeReview` and nothing else, and that is load
 * bearing rather than incidental — see the note in `src/lib/flashcards.ts`. A
 * rating here is the learner's claim about themselves; accuracy, and the
 * readiness band built on it, are measured against an answer key. The two must
 * not end up in the same series. `src/lib/flashcards.test.ts` asserts it by
 * forbidding the attempt-recording call anywhere in this file — including in a
 * comment, since a regex over source cannot tell the difference, and loosening
 * it so that it could would be a worse trade than rewording this sentence.
 *
 * ## Four ratings, not two
 *
 * Review mode offers "Try again" and "Move on", because there it is grading a
 * verdict the app already computed — the learner was right or wrong, and the
 * only open question is whether to see it again. Here there is no verdict, so
 * the rating *is* the answer, and the full Again/Hard/Good/Easy set earns its
 * place. Each button carries the interval it would actually produce, from
 * `gradePreview`, so the choice is informed rather than a guess at what the
 * words mean to the scheduler.
 */
const SOURCE_LABEL: Record<CardSource, { label: string; variant: "destructive" | "secondary" | "warning" }> = {
  due: { label: "Due", variant: "destructive" },
  new: { label: "New", variant: "secondary" },
  seen: { label: "Seen before", variant: "warning" },
};

const GRADE_LABEL: Record<ReviewGrade, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

export function Flashcards({
  deck,
  exitHref,
}: {
  deck: readonly Flashcard[];
  exitHref: string;
}) {
  const { gradeReview } = useProgress();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [rated, setRated] = useState<Record<ReviewGrade, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const spoken = useRef<HTMLDivElement>(null);

  const entry = deck[index];
  const total = deck.length;
  const done = index >= total;

  const previews = useMemo(() => {
    if (!entry) return [];
    const card =
      entry.card ?? newReviewCard(entry.question.id, entry.question.trackId);
    return gradePreview(card);
  }, [entry]);

  const rate = useCallback(
    (grade: ReviewGrade) => {
      if (!entry) return;
      gradeReview(entry.question.id, grade);
      setRated((prev) => ({ ...prev, [grade]: prev[grade] + 1 }));
      setRevealed(false);
      setIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [entry, gradeReview],
  );

  if (total === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <p className="font-serif text-[1.125rem]">No cards to deal.</p>
        <p className="measure mt-1.5 text-[0.875rem] leading-relaxed text-muted-foreground">
          Every question in this track is already scheduled further out than
          today. Practice adds new ones to the deck.
        </p>
        <Button asChild className="mt-4">
          <Link href={exitHref}>Back</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    const soon = rated.again + rated.hard;
    return (
      <div className="rounded-xl border border-accent/35 bg-accent-tint/40 p-6">
        <p className="font-serif text-[1.25rem] leading-snug">
          {`${total} ${total === 1 ? "card" : "cards"} rated.`}
        </p>
        <p className="measure mt-1.5 text-[0.875rem] leading-relaxed text-muted-foreground">
          {soon > 0
            ? `${soon} ${soon === 1 ? "comes" : "come"} back within a day or two; the rest are scheduled further out.`
            : "All of them are scheduled further out than they were."}
        </p>
        {/*
          Said on the way out, not buried in a settings page. A learner who has
          just rated twenty cards "Easy" and then finds the dashboard unmoved
          deserves to have been told why, in the place where they would
          otherwise wonder.
        */}
        <p className="measure mt-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
          Rating a card moves when you will see it again. It does not change
          your accuracy or your readiness — those count answers graded against
          the options, not how well you felt you knew something.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <Link href={exitHref}>Done</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/study">Practice with options</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { question } = entry;
  const answers = answerText(question);
  const meta = SOURCE_LABEL[entry.source];

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <Badge variant={meta.variant}>{meta.label}</Badge>
          <span className="text-[0.75rem] text-muted-foreground">
            {question.domain}
          </span>
        </div>
        <p className="text-[0.75rem] tabular-nums text-muted-foreground">
          {`${index + 1} / ${total}`}
        </p>
      </header>

      <ReadAloud targetRef={spoken} questionId={question.id} />

      <div ref={spoken}>
        {question.scenario ? (
          <ScenarioPanel scenario={question.scenario} />
        ) : null}

        <ProtectedText
          as="h1"
          data-speak
          className="measure text-pretty font-serif text-[1.375rem] leading-snug sm:text-[1.625rem] sm:leading-snug"
        >
          <ConceptHighlight text={question.question} limit={3} />
        </ProtectedText>
      </div>

      {/*
        The arity is still worth saying with no options on screen: "name the two
        things" is a different recall task from "name the thing", and a learner
        who recalls one of two has not recovered the item.
      */}
      {isMultiSelect(question) ? (
        <p className="mt-4 inline-block rounded-md border border-accent-subtle bg-accent-tint px-3 py-1.5 text-[0.8125rem] font-medium text-accent-foreground">
          {`Two parts — recall both`}
        </p>
      ) : null}

      {!revealed ? (
        <div className="mt-7">
          <p className="measure text-[0.875rem] leading-relaxed text-muted-foreground">
            Answer it in your head first. Nothing is being scored — the rating
            you give yourself afterwards only decides when this comes back.
          </p>
          <Button size="lg" className="mt-4 w-full sm:w-auto sm:min-w-[16rem]" onClick={() => setRevealed(true)}>
            Show answer
          </Button>
        </div>
      ) : (
        <div className="mt-7 space-y-6">
          <section className="rounded-xl border border-success/40 bg-success-tint p-5">
            <h2 className="mb-2.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {answers.length > 1 ? "The answer, both parts" : "The answer"}
            </h2>
            <ul className="space-y-2">
              {answers.map((text) => (
                <li
                  key={text}
                  className="measure text-[0.9375rem] font-medium leading-[1.7]"
                >
                  {text}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-accent/35 bg-accent-tint/50 p-5">
            <h2 className="mb-2.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              What to carry forward
            </h2>
            <p className="measure text-[0.9375rem] leading-[1.7]">
              {question.keyTakeaway}
            </p>
          </section>

          {question.sources?.length ? (
            <section>
              <h2 className="mb-2.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Check it against
              </h2>
              <ul className="measure space-y-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
                {question.sources.map((source) => (
                  <li key={source.cite} className="flex gap-2">
                    <span aria-hidden className="select-none text-border-strong">
                      &middot;
                    </span>
                    <span>
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-border-strong underline-offset-2 hover:decoration-current"
                        >
                          {source.cite}
                        </a>
                      ) : (
                        source.cite
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="mb-2.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              How well did you know it?
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {previews.map(({ grade, label }) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => rate(grade)}
                  className={cn(
                    "rounded-lg border bg-card p-3 text-center shadow-[var(--shadow-card)]",
                    "transition-colors active:translate-y-px",
                    grade === "again"
                      ? "border-destructive hover:bg-destructive-tint"
                      : "border-border-strong hover:bg-secondary",
                  )}
                >
                  <span className="block text-sm font-medium">
                    {GRADE_LABEL[grade]}
                  </span>
                  {/*
                    The interval the scheduler would actually produce, not a
                    description of it. "Good" means nothing on its own; "Good —
                    6 days" is a decision the learner can make.
                  */}
                  <span className="mt-0.5 block text-[0.75rem] text-muted-foreground">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
