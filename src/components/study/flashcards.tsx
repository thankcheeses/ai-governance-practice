"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { ConceptHighlight } from "@/components/study/concept-highlight";
import { ProtectedText } from "@/components/study/protected-text";
import { ScenarioPanel } from "@/components/study/question-view";
import { ReadAloud } from "@/components/study/read-aloud";
import { MascotAvatar, MascotScene, MascotTip } from "@/components/app/mascot";
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

/**
 * Each rating in its own colour, from "missed it" red to "knew it cold" blue,
 * with a plain-words hint so the four are not just adjectives.
 */
const GRADE_STYLE: Record<ReviewGrade, { button: string; tile: string; hint: string }> = {
  again: {
    button: "border-destructive bg-destructive-tint text-destructive",
    tile: "border-destructive/50 bg-destructive-tint text-destructive",
    hint: "Didn't know it",
  },
  hard: {
    button: "border-warning bg-warning/15 text-warning",
    tile: "border-warning/50 bg-warning/15 text-warning",
    hint: "Got it, barely",
  },
  good: {
    button: "border-success bg-success-tint text-success",
    tile: "border-success/50 bg-success-tint text-success",
    hint: "Knew it",
  },
  easy: {
    button: "border-primary bg-primary/10 text-primary",
    tile: "border-primary/50 bg-primary/10 text-primary",
    hint: "Knew it cold",
  },
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
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <MascotScene scene="gate" className="rounded-none" />
        <div className="p-6">
          <MascotTip mood="smile">
            You&apos;re all caught up — nothing is due today.
          </MascotTip>
          <p className="measure mt-4 text-[0.875rem] leading-relaxed text-muted-foreground">
            Every question in this track is already scheduled further out than
            today. Practice adds new ones to the deck.
          </p>
          <Button asChild className="mt-4">
            <Link href={exitHref}>Back</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    const soon = rated.again + rated.hard;
    return (
      <div className="overflow-hidden rounded-2xl border border-accent/35 bg-card shadow-card">
        <MascotScene scene="desk" className="rounded-none" />
        <div className="p-6">
          <MascotTip mood="smile">
            {`Deck done — ${total} ${total === 1 ? "card" : "cards"} rated. Nice work.`}
          </MascotTip>

          <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(GRADE_LABEL) as ReviewGrade[]).map((g) => (
              <li
                key={g}
                className={cn("rounded-lg border-2 px-3 py-2 text-center", GRADE_STYLE[g].tile)}
              >
                <span className="block text-[1.25rem] font-bold tabular-nums">{rated[g]}</span>
                <span className="block text-[0.75rem] font-medium">{GRADE_LABEL[g]}</span>
              </li>
            ))}
          </ul>

          <p className="measure mt-4 text-[0.875rem] leading-relaxed text-muted-foreground">
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
      </div>
    );
  }

  const { question } = entry;
  const answers = answerText(question);
  const meta = SOURCE_LABEL[entry.source];
  const behind = Math.min(2, total - index - 1);

  return (
    <div>
      {/* Progress through the deck: a bar, and where you are in words. */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-[0.75rem] text-muted-foreground">
          <span className="flex items-center gap-2">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            <span>{question.domain}</span>
          </span>
          <span className="tabular-nums">{`Card ${index + 1} of ${total}`}</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={index}
          aria-label="Cards rated"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>
      </div>

      <MascotTip mood={revealed ? "smile" : "think"} className="mb-5">
        {revealed
          ? "How close were you? Be honest — your rating only decides when this card comes back."
          : isMultiSelect(question)
            ? "This one has two parts. Say both out loud before you flip."
            : "Say your answer out loud before you flip. Recalling it cold is what makes it stick."}
      </MascotTip>

      <ReadAloud targetRef={spoken} questionId={question.id} />

      {/* Read-aloud covers the scenario and the card face together. */}
      <div ref={spoken}>
      {question.scenario ? (
        <ScenarioPanel key={question.id} scenario={question.scenario} />
      ) : null}

      {/*
        The card itself, with the rest of the deck stacked behind it so the
        pile visibly shrinks. Keyed on the face so turning it over replays the
        flip; motion-safe only, so reduced motion gets a plain swap.
      */}
      <div className="relative" style={{ paddingBottom: behind * 6 }}>
        {Array.from({ length: behind }, (_, k) => (
          <div
            key={k}
            aria-hidden
            className="absolute inset-x-0 top-0 rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
            style={{
              bottom: 0,
              transform: `translate(${(k + 1) * 5}px, ${(k + 1) * 6}px)`,
              zIndex: -1 - k,
              opacity: 1 - (k + 1) * 0.25,
            }}
          />
        ))}

        <article
          // Per card and per face: replays the flip, and gives a translated page
          // fresh text to translate instead of the last card's (translation-guard.ts).
          key={`${question.id}-${revealed ? "back" : "front"}`}
          className={cn(
            "relative overflow-hidden rounded-2xl border bg-card shadow-[0_2px_4px_rgb(15_23_42/0.06),0_14px_32px_-12px_rgb(15_23_42/0.25)]",
            "motion-safe:animate-[card-flip-in_280ms_ease-out]",
            revealed ? "border-success/60" : "border-border-strong",
          )}
        >
          {/* The coloured band an index card has along its top edge. */}
          <div
            aria-hidden
            className={cn("h-2", revealed ? "bg-success" : "bg-primary")}
          />
          <div
            className="px-5 pb-6 pt-4 sm:px-7"
            style={{
              // Faint ruled lines, like a real index card.
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgb(107 127 215 / 0.10) 31px, rgb(107 127 215 / 0.10) 32px)",
            }}
          >
            <p
              className={cn(
                "mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em]",
                revealed ? "bg-success-tint text-success" : "bg-accent-tint text-accent-strong",
              )}
            >
              {revealed ? "Back · the answer" : "Front · recall it"}
            </p>

            {!revealed ? (
              <>
                <div>
                  <ProtectedText
                    as="h1"
                    data-speak
                    className="measure text-pretty font-serif text-[1.375rem] leading-snug sm:text-[1.625rem] sm:leading-snug"
                  >
                    <ConceptHighlight text={question.question} limit={3} />
                  </ProtectedText>
                </div>

                {/*
                  The arity is still worth saying with no options on screen:
                  "name the two things" is a different recall task from "name
                  the thing", and a learner who recalls one of two has not
                  recovered the item.
                */}
                {isMultiSelect(question) ? (
                  <p className="mt-4 inline-block rounded-md border border-accent-subtle bg-accent-tint px-3 py-1.5 text-[0.8125rem] font-medium text-accent-foreground">
                    {`Two parts — recall both`}
                  </p>
                ) : null}

                <ol className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] text-muted-foreground">
                  {["Read it", "Answer in your head", "Say it out loud", "Flip"].map((step, i) => (
                    <li key={step} className="flex items-center gap-2">
                      {i > 0 ? <span aria-hidden>→</span> : null}
                      <span className="rounded-full border border-border bg-card px-2 py-0.5">
                        {`${i + 1}. ${step}`}
                      </span>
                    </li>
                  ))}
                </ol>

                <p className="measure mt-4 text-[0.8125rem] leading-relaxed text-muted-foreground">
                  Nothing is being scored — the rating you give yourself
                  afterwards only decides when this comes back.
                </p>

                <Button
                  size="lg"
                  className="mt-5 w-full sm:w-auto sm:min-w-[16rem]"
                  onClick={() => setRevealed(true)}
                >
                  Flip the card
                </Button>
              </>
            ) : (
              <div className="space-y-5">
                <p className="measure text-[0.875rem] leading-relaxed text-muted-foreground">
                  {question.question}
                </p>

                <section>
                  <h2 className="mb-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-success">
                    {answers.length > 1 ? "The answer, both parts" : "The answer"}
                  </h2>
                  <ul className="space-y-2">
                    {answers.map((text) => (
                      <li
                        key={text}
                        className="measure flex gap-2.5 rounded-lg border border-success/40 bg-success-tint px-3.5 py-2.5 text-[0.9375rem] font-medium leading-[1.6]"
                      >
                        <span aria-hidden className="mt-0.5 font-bold text-success">✓</span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="flex gap-3 rounded-xl border border-accent/35 bg-accent-tint/60 p-4">
                  <MascotAvatar mood="smile" className="h-10 w-10" />
                  <div>
                    <h2 className="mb-1 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-accent-strong">
                      Remember this
                    </h2>
                    <p className="measure text-[0.9375rem] leading-[1.65]">
                      {question.keyTakeaway}
                    </p>
                  </div>
                </section>

                {question.sources?.length ? (
                  <section>
                    <h2 className="mb-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
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
              </div>
            )}
          </div>
        </article>
      </div>
      </div>

      {revealed ? (
        <section className="mt-6">
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
                  "rounded-xl border-2 p-3 text-center shadow-[var(--shadow-card)]",
                  "transition-[transform,filter] active:translate-y-px hover:brightness-105",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  GRADE_STYLE[grade].button,
                )}
              >
                <span className="block text-sm font-semibold">
                  {GRADE_LABEL[grade]}
                </span>
                <span className="block text-[0.6875rem] opacity-80">
                  {GRADE_STYLE[grade].hint}
                </span>
                {/*
                  The interval the scheduler would actually produce, not a
                  description of it. "Good" means nothing on its own; "Good —
                  6 days" is a decision the learner can make.
                */}
                <span className="mt-1 block text-[0.75rem] font-medium tabular-nums">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
