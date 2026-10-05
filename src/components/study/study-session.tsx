"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { domainOf } from "@/content/bok";
import { track } from "@/lib/telemetry";
import { FeedbackPanel } from "@/components/study/feedback-panel";
import { FirstAnswerNote } from "@/components/study/first-answer-note";
import { QuestionView } from "@/components/study/question-view";
import { ReadCoach } from "@/components/study/read-coach";
import { SessionComplete } from "@/components/study/session-complete";
import { useStudyHotkeys } from "@/components/study/use-study-hotkeys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ActiveSession } from "@/lib/active-session";
import {
  ACTIVE_SESSION_VERSION,
  clearActiveSession,
  writeActiveSession,
} from "@/lib/active-session";
import {
  canSubmit,
  gradeAnswer,
  isMultiSelect,
  requiredSelections,
  toggleSelection,
  verdictAnnouncement,
} from "@/lib/grading";
import { correctKeys } from "@/lib/presentation";
import { type CompletedResult } from "@/lib/results";
import { writeResult } from "@/lib/results-storage";
import {
  resultFromActiveSession,
  type Sitting,
  sittingComposition,
} from "@/lib/session";
import { gradePreview, newReviewCard } from "@/lib/spaced-repetition";
import { useProgress } from "@/lib/store/progress-provider";
import type { ReviewGrade, StudyMode } from "@/lib/types";
import { play } from "@/lib/sound";
import { useCueOnce } from "@/lib/use-cue";
import { cn } from "@/lib/utils";

interface StudySessionProps {
  sitting: Sitting;
  mode: StudyMode;
  label: string;
  withScheduling?: boolean;
  exitHref?: string;
  resumed?: ActiveSession | null;
  completedResult?: CompletedResult | null;
}

export function StudySession({
  sitting,
  mode,
  label,
  withScheduling = false,
  exitHref = "/home",
  resumed = null,
  completedResult = null,
}: StudySessionProps) {
  const { recordAnswer, gradeReview, progress } = useProgress();
  const { seed, questions } = sitting;

  const [index, setIndex] = useState(() => resumed?.index ?? 0);
  const [selected, setSelected] = useState<string[]>(() => resumed?.selected ?? []);
  const [revealed, setRevealed] = useState(() => resumed?.revealed ?? false);
  const [wasCorrect, setWasCorrect] = useState(() => {
    if (!resumed?.revealed) return false;
    const q = sitting.questions[resumed.index];
    return q ? gradeAnswer(q, resumed.selected) : false;
  });
  const [answers, setAnswers] = useState<Record<string, string[]>>(() => resumed?.answers ?? {});
  const [startedAt] = useState(() => resumed?.startedAt ?? new Date().toISOString());
  const [correctCount, setCorrectCount] = useState(() => resumed?.correctCount ?? 0);
  const [queuedCount, setQueuedCount] = useState(() => resumed?.queuedCount ?? 0);
  const [finished, setFinished] = useState(() => completedResult !== null);
  const [completed, setCompleted] = useState<CompletedResult | null>(() => completedResult ?? null);

  const questionStart = useRef(Date.now());
  const feedbackAnchor = useRef<HTMLDivElement>(null);

  const question = questions[index];
  const total = questions.length;
  /*
    The opening cue, once, on a sitting that was dealt rather than restored.
    `resumed` is the stored sitting a refresh or a return brings back, so a
    null one is a genuine start. Nothing plays unless sound is on in Settings.
  */
  useCueOnce("begin", resumed === null && !finished && Boolean(question));

  const options = useMemo(() => sitting.options[index] ?? [], [sitting, index]);
  const answerKeys = useMemo(
    () => (question ? correctKeys(options, question) : []),
    [options, question],
  );

  useEffect(() => {
    if (finished || !question) return;
    const { questionIds, optionIds } = sittingComposition(sitting);
    writeActiveSession({
      version: ACTIVE_SESSION_VERSION,
      seed,
      trackId: progress.trackId,
      mode,
      label,
      withScheduling,
      exitHref,
      questionIds,
      optionIds,
      index,
      selected,
      revealed,
      confidence: null,
      answers,
      correctCount,
      queuedCount,
      startedAt,
      updatedAt: new Date().toISOString(),
    });
  }, [
    sitting, seed, progress.trackId, mode, label, withScheduling, exitHref,
    index, selected, revealed, answers, correctCount, queuedCount,
    startedAt, finished, question,
  ]);

  /*
    Submission takes the selection as an argument rather than reading it from
    state, and that is load-bearing rather than stylistic.

    Answers now commit on the choosing tap, so the submit happens in the same
    handler that sets the selection — at which point `selected` still holds the
    previous render's value. Reading state here would record the answer the
    learner had *before* the tap: on a single-select question, nothing. Passing
    the ids through is the only version that is correct under batching.
  */
  const submitAnswer = useCallback(
    (ids: string[]) => {
    if (revealed || !question || !canSubmit(question, ids)) return;
    const result = recordAnswer(
      question,
      ids,
      Date.now() - questionStart.current,
      mode,
      /*
        No confidence rating is collected any more, so every attempt from here
        on stores null. `calibration.ts` already distinguishes rated from
        unrated attempts and stays silent below its floor, so the calibration
        read degrades to saying nothing rather than to saying something wrong —
        and attempts recorded before this change keep their ratings.
      */
      null,
    );
    setRevealed(true);
    setWasCorrect(result.correct);
    /*
      Played here rather than through `useCueOnce`, which fires once per mount:
      this one has to sound on every graded answer. Being inside the click
      handler also means the user gesture browsers require for audio is still
      on the stack, so the first cue of a sitting is not refused.

      The panel states "Correct"/"Incorrect" in text either way — the sound
      carries no information the screen does not, which is what lets it stay
      off by default without the learner losing anything.
    */
    play(result.correct ? "correct" : "wrong");
    /*
      Counted, not identified. The domain and sub-domain are what make
      "accuracy by area across everyone" answerable; the question id and the
      chosen option are deliberately not sent, because they are not needed to
      answer it and they are what would make a row about a person.
    */
    track("question_answered", {
      mode,
      domain: domainOf(question.bokSubdomain),
      subdomain: question.bokSubdomain,
      correct: result.correct,
    });
    setAnswers((a) => ({ ...a, [question.id]: ids }));
    if (result.correct) setCorrectCount((c) => c + 1);
    if (result.queuedForReview) setQueuedCount((c) => c + 1);
    requestAnimationFrame(() =>
      feedbackAnchor.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
    },
    [revealed, question, recordAnswer, mode],
  );

  /*
    One tap answers the question. There is no second step.

    A learner picks an option and the answer is graded on that tap: no submit
    button, no window in which to reconsider. The intent is that the choice has
    to be made before the finger moves, which is how the item behaves under
    exam conditions and is not how it behaved when a selection could be nudged
    around while the options were re-read.

    The rule is uniform, so multi-select follows it too: selections below the
    required count can still be toggled freely, and the tap that completes the
    set commits it. The commitment point is therefore the same sentence in both
    cases — the answer is final once it is complete — rather than one rule for
    single-select and an exception for the other 41 questions.

    `canSubmit` decides when an answer is complete; it is unchanged. What
    changed is only who calls it.
  */
  const chooseOption = useCallback(
    (ids: string[]) => {
      setSelected(ids);
      if (question && canSubmit(question, ids)) submitAnswer(ids);
    },
    [question, submitAnswer],
  );

  const advance = useCallback(() => {
    if (index + 1 >= total) {
      const { questionIds, optionIds } = sittingComposition(sitting);
      const record = resultFromActiveSession({
        version: ACTIVE_SESSION_VERSION,
        seed,
        trackId: progress.trackId,
        mode,
        label,
        withScheduling,
        exitHref,
        questionIds,
        optionIds,
        index,
        selected,
        revealed,
        confidence: null,
        answers,
        correctCount,
        queuedCount,
        startedAt,
        updatedAt: new Date().toISOString(),
      });
      writeResult(record);
      track(mode === "review" ? "review_completed" : "study_completed", { mode });
      setCompleted(record);
      clearActiveSession();
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected([]);
    setRevealed(false);
    questionStart.current = Date.now();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [
    index, total, sitting, seed, progress.trackId, mode, label, withScheduling,
    exitHref, selected, revealed, answers, correctCount,
    queuedCount, startedAt,
  ]);

  const handleGrade = useCallback(
    (grade: ReviewGrade) => {
      if (!question) return;
      gradeReview(question.id, grade);
      advance();
    },
    [question, gradeReview, advance],
  );

  const scheduling = useMemo(() => {
    if (!question || !withScheduling) return [];
    const card =
      progress.reviewCards[question.id] ?? newReviewCard(question.id, question.trackId);
    return gradePreview(card);
  }, [question, withScheduling, progress.reviewCards]);

  useStudyHotkeys({
    question,
    options,
    selected,
    revealed,
    finished,
    withScheduling,
    onSelect: chooseOption,
    onAdvance: advance,
  });

  if (finished && completed) {
    return <SessionComplete result={completed} queued={queuedCount} />;
  }

  if (!question) {
    return (
      /*
        Typographic, with no illustration.

        This carried a meme image, and before that the brand mark. Neither
        earned the slot: the mark restated a header the learner could already
        see, and the image set a register the rest of the product does not
        use. An empty state has one job — say what happened and offer the next
        move — and it does that in words.
      */
      <div className="flex flex-col items-center py-16 text-center">
        <h1 className="text-[2rem] leading-[1.15] sm:text-[2.25rem]">
          Nothing to study here
        </h1>
        <p className="mt-2 text-muted-foreground">
          Try a different domain or come back once more questions are due.
        </p>
        <Button asChild className="mt-6">
          <Link href="/study">Choose a session</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-32">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Exit session">
          <Link href={exitHref} onClick={() => clearActiveSession()} />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-medium">{label}</span>
            <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
              {index + 1} / {total}
            </span>
          </div>
          <Progress value={((index + (revealed ? 1 : 0)) / total) * 100} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge>{question.domain}</Badge>
        <Badge variant="outline" className="capitalize">{question.difficulty}</Badge>
        {/*
          Shown only where there is something to press.

          On a phone this line advertised three keyboard shortcuts to a device
          with no keyboard — instructions the reader cannot act on, occupying
          the row that otherwise carries the domain and difficulty.

          `.keys-hint` gates on `any-pointer: fine` rather than on viewport
          width, because the question is whether a physical input device is
          attached, not how wide the screen is — a narrow browser window on a
          laptop still has the keys. It is CSS-only, so it cannot produce a
          hydration mismatch the way a `navigator`-sniffing effect would. A
          stylus tablet with no keyboard will still see it; the line is
          additive, so over-showing it costs nothing the way under-showing a
          control would.
        */}
        <span className="keys-hint text-[0.75rem] text-muted-foreground">Keys A–D · Enter · N</span>
      </div>

      <ReadCoach questionId={question.id} />

      <QuestionView
        question={question}
        options={options}
        selected={selected}
        revealed={revealed}
        onSelect={(key) => chooseOption(toggleSelection(question, selected, key))}
      />

      <div ref={feedbackAnchor} className="scroll-mt-6" />

      {/*
        The verdict, announced.

        The feedback panel states "Correct"/"Incorrect" in text, so a screen
        reader user can find the outcome — but only by going looking for it,
        and nothing told them it had arrived. Submitting an answer is the one
        moment in the loop where the page changes without the user moving, so
        it is the one that has to be spoken.

        This region is always mounted and starts empty, which is what makes it
        reliable: a live region inserted into the DOM at the same moment as its
        content is inconsistently announced across screen readers, while one
        that already exists and then changes is announced dependably. It is
        `polite` rather than `assertive` because the learner has just acted
        deliberately and is not being interrupted.

        The text is assembled here rather than read out of the panel so the two
        cannot drift apart silently; `formatAnswer` is the same helper the
        visible verdict uses.
      */}
      <p role="status" aria-live="polite" className="sr-only">
        {revealed ? verdictAnnouncement(wasCorrect, answerKeys) : ""}
      </p>

      {revealed ? (
        <div className="mt-7">
          <FirstAnswerNote attemptCount={progress.attempts.length} revealed={revealed} />
          <FeedbackPanel
            question={question}
            correct={wasCorrect}
            correctKeys={answerKeys}
            options={options}
            selected={selected}
          />
          {withScheduling ? (
            <div className="mt-6">
              <p className="mb-2.5 text-xs font-medium text-muted-foreground">When should this come back?</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {scheduling.map(({ grade, label: interval }) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => handleGrade(grade)}
                    className={cn(
                      "rounded-lg border border-l-4 bg-card p-3 text-center shadow-[var(--shadow-card)] transition-colors active:translate-y-px",
                      grade === "again" && "border-destructive hover:bg-destructive-tint",
                      grade === "hard" && "border-warning hover:bg-warning/15",
                      grade === "good" && "border-border-strong hover:bg-secondary",
                      grade === "easy" && "border-success hover:bg-success-tint",
                    )}
                  >
                    <div className="text-sm font-medium capitalize">{grade}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{interval}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/*
        The action bar, now reading as a layer rather than an edge.

        It was `bg-background` — the same colour as the page — separated from
        the content by a single hairline. So a sentence scrolling past it did
        not look like a sentence passing *behind* something; it looked like a
        sentence that had been cut off, which is exactly how it was reported.
        Nothing was in fact clipped: the scroll container reserves 204px, and
        the bar measures 141px after an answer and 109px before one at
        390×844, so the page still reaches its own end in both states. The
        defect was that the overlay was invisible as an overlay.

        A distinct surface, a blur and a soft upward shadow give it somewhere
        to be, so text visibly slides under a thing instead of vanishing. All
        three are reset at `lg`, where the bar stops being fixed at all.

        The Continue button is full-bleed only on a phone, where that is the
        right shape for a primary action. From `sm` up it stops growing with
        the container: at a 767px viewport it was a 767px-wide slab, which is
        not a button, it is a horizon. Before an answer there is no button at
        all, which is why the bar is shorter in that state.
      */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 pb-safe-nav shadow-[0_-10px_28px_-18px_rgb(0_0_0_/_0.35)] backdrop-blur-sm sm:px-6 lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:shadow-none lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-3xl flex-col items-stretch sm:items-center">
          {!revealed ? (
            /*
              No pre-answer control, because there is no longer a pre-answer
              step: the choosing tap is the submission.

              What stands here instead is the warning, and it is not optional
              decoration. A one-tap commit that the learner discovers by
              losing a mark is a trap; the same mechanic, announced before the
              first tap, is a rule. The sentence is what makes "know the
              answer before you touch it" a thing the learner was told rather
              than a thing that happened to them.

              It sits in the action bar rather than beside the options because
              the bar is where this screen has always said what the next move
              is, and because a fixed bar with nothing in it reads as a
              rendering fault.
            */
            <p className="text-center text-sm text-muted-foreground">
              {isMultiSelect(question)
                ? `Completing your ${requiredSelections(question)} choices submits the answer — there is no undo`
                : "Choosing an answer submits it — there is no undo"}
            </p>
          ) : withScheduling ? (
            <p className="text-center text-sm text-muted-foreground">Choose an interval above to continue</p>
          ) : (
            <Button size="lg" className="w-full sm:w-auto sm:min-w-[20rem]" onClick={advance}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
