"use client";

import { useCallback, useMemo, useState } from "react";
import { QuestionView } from "@/components/study/question-view";
import { Button } from "@/components/ui/button";
import { getQuestion } from "@/content/registry";
import type { Question } from "@/content/types";
import type { ExamSession } from "@/lib/exam";
import { canSubmit, gradeAnswer } from "@/lib/grading";
import { presentOptions } from "@/lib/presentation";
import { useProgress } from "@/lib/store/progress-provider";
import { play } from "@/lib/sound";
import { cn } from "@/lib/utils";

/**
 * A second look at the questions a sitting got wrong, taken after it is scored.
 *
 * ## The exam score does not move, and that is the point
 *
 * This was asked for as a way to "bring their score up". During the exam that
 * would have destroyed the one thing exam mode simulates — a timed sitting with
 * no second chances — so it happens afterwards instead. But afterwards, editing
 * the number would be worse than useless: the score is a record of what
 * happened at the time, and a record you can go back and improve is not a
 * record. `ExamResults` computes it from the submitted `session`, which this
 * component receives as a read-only prop and never writes to.
 *
 * So redemption reports its own number instead: how many of the missed ones
 * came back on a second look. "You recovered 7 of 12" says the thing the
 * learner actually wants to know — did it land after all — without pretending
 * the sitting went differently than it did. Two honest numbers beat one
 * flattering one, and the screen shows both.
 *
 * ## What it does change
 *
 * An attempt is recorded and the spaced-repetition schedule moves, exactly as
 * the mid-practice bonus does. That is the part with lasting value: a question
 * answered correctly here stops reading as missed, and stops coming back as
 * often.
 *
 * ## Options are re-shuffled
 *
 * Deliberately not the order the exam dealt. Re-presenting a question in its
 * original layout lets a learner pass on "it was the third one" without having
 * understood anything, which is the opposite of what a second look is for. The
 * order is still seeded, so it survives a re-render.
 */
export function ExamRedemption({
  session,
  missedIds,
}: {
  /** Read-only. Nothing here writes to the submitted sitting. */
  session: ExamSession;
  missedIds: readonly string[];
}) {
  const { recordAnswer, gradeReview } = useProgress();

  const questions = useMemo(
    () =>
      missedIds
        .map((id) => getQuestion(id))
        .filter((q): q is Question => Boolean(q)),
    [missedIds],
  );

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [recovered, setRecovered] = useState(0);

  const question = questions[index];
  const total = questions.length;
  const finished = started && index >= total;

  const options = useMemo(
    () =>
      question
        ? // A different seed from the exam's, so the layout is not the one the
          // learner may have memorised the position in.
          presentOptions(question, (session.seed ^ 0x5eed) >>> 0)
        : [],
    [question, session.seed],
  );

  const begin = useCallback(() => {
    setStarted(true);
    // Same cue as the mid-practice bonus: this is the same kind of moment,
    // and a second sound for it would be noise.
    play("bonus");
  }, []);

  const submit = useCallback(
    (ids: string[]) => {
      if (!question || revealed || !canSubmit(question, ids)) return;
      const right = gradeAnswer(question, ids);
      setSelected(ids);
      setRevealed(true);
      setWasCorrect(right);
      if (right) setRecovered((n) => n + 1);

      /*
        Recorded as review rather than practice, because that is what it is:
        a second pass over something already seen and already graded. The
        schedule moves either way — correct pushes it out, wrong brings it
        back sooner — which is the lasting half of this feature.
      */
      recordAnswer(question, ids, 0, "review", null);
      gradeReview(question.id, right ? "good" : "again");
    },
    [question, revealed, recordAnswer, gradeReview],
  );

  const next = useCallback(() => {
    setIndex((i) => i + 1);
    setSelected([]);
    setRevealed(false);
  }, []);

  if (total === 0) return null;

  if (!started) {
    return (
      <div className="rounded-xl border border-accent/35 bg-accent-tint/40 p-5">
        <p className="font-serif text-[1.125rem] leading-snug">
          Take a second look?
        </p>
        <p className="measure mt-1.5 text-[0.875rem] leading-relaxed text-muted-foreground">
          {`Work through the ${total} you missed, one at a time, with the answer
          revealed after each. Your exam score above does not change — this
          reports separately how many came back on a second look, and it
          updates when you'll see each one again.`}
        </p>
        <Button className="mt-4" onClick={begin}>
          {`Review the ${total} I missed`}
        </Button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="rounded-xl border border-accent/35 bg-accent-tint/40 p-5">
        <p className="font-serif text-[1.25rem] leading-snug">
          {`You recovered ${recovered} of ${total}.`}
        </p>
        <p className="measure mt-1.5 text-[0.875rem] leading-relaxed text-muted-foreground">
          {recovered === total
            ? "Every one of them landed on the second look. Your exam score above is unchanged — it records the sitting, not the study afterwards."
            : recovered === 0
              ? "None of them came back yet. They are scheduled to return sooner in review, which is exactly what that queue is for."
              : `The ${total - recovered} still outstanding are scheduled to come back sooner. Your exam score above is unchanged — it records the sitting, not the study afterwards.`}
        </p>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="rounded-xl border border-accent/35 bg-accent-tint/40 p-5 sm:p-6">
      <header className="mb-5 flex items-baseline justify-between gap-3">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-accent-strong">
          Second look
        </p>
        <p className="text-[0.75rem] tabular-nums text-muted-foreground">
          {`${index + 1} / ${total}`}
          <span aria-hidden className="mx-2 text-border-strong">
            ·
          </span>
          {`${recovered} recovered`}
        </p>
      </header>

      <QuestionView
        key={question.id}
        question={question}
        options={options}
        selected={selected}
        revealed={revealed}
        onSelect={(optionId) => {
          // Mirrors the study loop's commit rule rather than inventing a second
          // one: the tap that completes a valid selection is the answer.
          const nextSelected = selected.includes(optionId)
            ? selected.filter((id) => id !== optionId)
            : [...selected, optionId];
          setSelected(nextSelected);
          if (canSubmit(question, nextSelected)) submit(nextSelected);
        }}
      />

      {revealed ? (
        <div className="mt-5 border-t border-border pt-4">
          <p
            className={cn(
              "text-[0.9375rem] font-medium",
              wasCorrect ? "text-success-foreground" : "text-foreground",
            )}
          >
            {wasCorrect ? "Recovered." : "Still not quite."}
          </p>
          {question.keyTakeaway ? (
            <p className="measure mt-1.5 text-[0.875rem] leading-relaxed text-muted-foreground">
              {question.keyTakeaway}
            </p>
          ) : null}
          <Button className="mt-4" onClick={next}>
            {index + 1 >= total ? "See how you did" : "Next"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
