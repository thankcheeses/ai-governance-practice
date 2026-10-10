"use client";

import { useMemo, useState } from "react";
import { QuestionView } from "@/components/study/question-view";
import { Button } from "@/components/ui/button";
import type { ReviewItem } from "@/lib/spaced-repetition";
import { canSubmit, gradeAnswer } from "@/lib/grading";
import { presentOptions } from "@/lib/presentation";
import { useCueOnce } from "@/lib/use-cue";
import { cn } from "@/lib/utils";

/**
 * A second look at something the learner already missed, mid-practice.
 *
 * ## It is framed as outside the run, because it is
 *
 * The card is visibly a different surface from the sitting it interrupts, and
 * says in words that it does not count. That is not decoration: the run says
 * "4 / 10" at the top, and a question that looked like part of the run but did
 * not move that counter would read as a bug. Naming it as a bonus is cheaper
 * and more honest than making it blend in.
 *
 * Nothing here touches the sitting's score, count or accuracy — see
 * `bonus-review.ts` for why that matters to the readiness verdict. What it does
 * do is report the answer upward so the caller can advance the spaced-repetition
 * schedule, which is the entire reason to show it.
 *
 * ## Why it reuses `QuestionView`
 *
 * Same component, same markup, same `data-speak` hooks — so read-aloud,
 * concept highlighting, multi-select handling and the no-copy protection all
 * work here without being reimplemented or remembered. A bonus question that
 * quietly lost read-aloud would be a worse failure than not shipping one.
 *
 * The `revealed` state is local and one-shot: this is a single question, there
 * is no next, and the only exit is the button.
 */
export function BonusReview({
  item,
  seed,
  onAnswered,
  onDismiss,
}: {
  item: ReviewItem;
  /** The sitting's seed, so option order is stable across a resume. */
  seed: number;
  /** Reports correctness up so the caller can reschedule the card. */
  onAnswered: (correct: boolean, selected: string[]) => void;
  onDismiss: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(false);

  // Announced with its own cue, because the card appears between questions and
  // a learner heads-down in a run needs to know what is in front of them
  // changed kind. Once per mount is exactly right: it is one card.
  useCueOnce("bonus", true);

  const options = useMemo(
    () => presentOptions(item.question, seed),
    [item.question, seed],
  );

  const submit = (ids: string[]) => {
    if (revealed || !canSubmit(item.question, ids)) return;
    const wasRight = gradeAnswer(item.question, ids);
    setSelected(ids);
    setRevealed(true);
    setCorrect(wasRight);
    onAnswered(wasRight, ids);
  };

  return (
    <section
      aria-labelledby="bonus-heading"
      className={cn(
        "rounded-2xl border border-accent/40 bg-accent-tint/40 p-5 shadow-card sm:p-6",
        "animate-in fade-in",
      )}
    >
      <header className="mb-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-accent-strong">
          Bonus &middot; second look
        </p>
        <h2 id="bonus-heading" className="mt-1 font-serif text-[1.25rem] leading-snug">
          {item.reason === "missed"
            ? "You missed this one before."
            : item.reason === "low-confidence"
              ? "You were unsure about this one."
              : "This one is due for review."}
        </h2>
        <p className="measure mt-1.5 text-[0.875rem] leading-relaxed text-muted-foreground">
          It does not count toward this session&rsquo;s score either way
          {" — "}
          it only updates when you&rsquo;ll see it again.
        </p>
      </header>

      <QuestionView
        question={item.question}
        options={options}
        selected={selected}
        revealed={revealed}
        onSelect={(optionId) => {
          /*
            Mirrors the study session's commit rule rather than inventing a
            second one: on single-select the first tap is the answer, on
            multi-select the tap that completes the set is. Behaving
            differently here would teach a habit that is wrong everywhere else.
          */
          const next = selected.includes(optionId)
            ? selected.filter((id) => id !== optionId)
            : [...selected, optionId];
          setSelected(next);
          if (canSubmit(item.question, next)) submit(next);
        }}
      />

      {revealed ? (
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-[0.9375rem] font-medium">
            {correct ? "Right this time." : "Still not quite."}
          </p>
          {item.question.keyTakeaway ? (
            <p className="measure mt-1.5 text-[0.875rem] leading-relaxed text-muted-foreground">
              {item.question.keyTakeaway}
            </p>
          ) : null}
          <p className="measure mt-2 text-xs text-muted-foreground">
            {correct
              ? "Scheduled further out. Back to your session."
              : "It will come round again sooner. Back to your session."}
          </p>
          <Button className="mt-4" onClick={onDismiss}>
            Back to the session
          </Button>
        </div>
      ) : (
        <div className="mt-5 border-t border-border pt-4">
          <Button variant="ghost" onClick={onDismiss}>
            Skip this
          </Button>
        </div>
      )}
    </section>
  );
}
