"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DimensionalMark } from "@/components/civic/dimensional-mark";
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
import { canSubmit, gradeAnswer, toggleSelection } from "@/lib/grading";
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
import type { Confidence, ReviewGrade, StudyMode } from "@/lib/types";
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

const CONFIDENCE_OPTIONS: { value: Confidence; label: string }[] = [
  { value: "guessed", label: "Guessed" },
  { value: "unsure", label: "Unsure" },
  { value: "confident", label: "Confident" },
];

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
  const [confidence, setConfidence] = useState<Confidence | null>(() => resumed?.confidence ?? null);
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
      confidence,
      answers,
      correctCount,
      queuedCount,
      startedAt,
      updatedAt: new Date().toISOString(),
    });
  }, [
    sitting, seed, progress.trackId, mode, label, withScheduling, exitHref,
    index, selected, revealed, confidence, answers, correctCount, queuedCount,
    startedAt, finished, question,
  ]);

  const handleSubmit = useCallback(() => {
    if (revealed || !question || !canSubmit(question, selected)) return;
    const result = recordAnswer(
      question,
      selected,
      Date.now() - questionStart.current,
      mode,
      confidence,
    );
    setRevealed(true);
    setWasCorrect(result.correct);
    setAnswers((a) => ({ ...a, [question.id]: selected }));
    if (result.correct) setCorrectCount((c) => c + 1);
    if (result.queuedForReview) setQueuedCount((c) => c + 1);
    requestAnimationFrame(() =>
      feedbackAnchor.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }, [selected, revealed, question, recordAnswer, mode, confidence]);

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
        confidence,
        answers,
        correctCount,
        queuedCount,
        startedAt,
        updatedAt: new Date().toISOString(),
      });
      writeResult(record);
      setCompleted(record);
      clearActiveSession();
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected([]);
    setConfidence(null);
    setRevealed(false);
    questionStart.current = Date.now();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [
    index, total, sitting, seed, progress.trackId, mode, label, withScheduling,
    exitHref, selected, revealed, confidence, answers, correctCount,
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
    onSelect: (ids) => setSelected(ids),
    onSubmit: handleSubmit,
    onAdvance: advance,
  });

  if (finished && completed) {
    return <SessionComplete result={completed} queued={queuedCount} />;
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <DimensionalMark name="brand" size="xl" />
        <h1 className="mt-5 text-[2rem] leading-[1.15] sm:text-[2.25rem]">Nothing to study here</h1>
        <p className="mt-2 text-muted-foreground">Try a different domain or come back once more questions are due.</p>
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
        <span className="text-[0.75rem] text-muted-foreground">Keys A–D · Enter · N</span>
      </div>

      <ReadCoach questionId={question.id} />

      <QuestionView
        question={question}
        options={options}
        selected={selected}
        revealed={revealed}
        onSelect={(key) => setSelected((cur) => toggleSelection(question, cur, key))}
      />

      {!revealed && selected.length > 0 ? (
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium text-muted-foreground">How confident are you? (optional)</p>
          <div className="flex gap-2">
            {CONFIDENCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setConfidence((c) => (c === option.value ? null : option.value))}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                  confidence === option.value
                    ? "border-accent bg-accent-tint font-medium text-accent-foreground ring-1 ring-inset ring-accent"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div ref={feedbackAnchor} className="scroll-mt-6" />

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

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background px-4 py-3 pb-safe-nav sm:px-6 lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0">
        <div className="mx-auto max-w-3xl">
          {!revealed ? (
            <Button size="lg" className="w-full" disabled={!canSubmit(question, selected)} onClick={handleSubmit}>
              Submit answer
            </Button>
          ) : withScheduling ? (
            <p className="text-center text-sm text-muted-foreground">Choose an interval above to continue</p>
          ) : (
            <Button size="lg" className="w-full" onClick={advance}>Continue</Button>
          )}
        </div>
      </div>
    </div>
  );
}
