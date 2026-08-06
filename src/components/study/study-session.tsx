"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FeedbackPanel } from "@/components/study/feedback-panel";
import { QuestionView } from "@/components/study/question-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { OptionKey, Question } from "@/content/types";
import { gradePreview, newReviewCard } from "@/lib/spaced-repetition";
import { useProgress } from "@/lib/store/progress-provider";
import type { Confidence, ReviewGrade, StudyMode } from "@/lib/types";
import { cn, pct } from "@/lib/utils";

interface StudySessionProps {
  questions: Question[];
  mode: StudyMode;
  label: string;
  /** Show Again/Hard/Good/Easy scheduling after each answer (review mode). */
  withScheduling?: boolean;
  exitHref?: string;
}

const CONFIDENCE_OPTIONS: { value: Confidence; label: string }[] = [
  { value: "guessed", label: "Guessed" },
  { value: "unsure", label: "Unsure" },
  { value: "confident", label: "Confident" },
];

/**
 * The learning loop: question → answer → feedback → rationale → key takeaway →
 * next → progress update. Used by both /study and /review; review mode adds
 * SM-2 scheduling buttons in place of the plain Continue action.
 */
export function StudySession({
  questions,
  mode,
  label,
  withScheduling = false,
  exitHref = "/home",
}: StudySessionProps) {
  const { recordAnswer, gradeReview, progress } = useProgress();

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [queuedCount, setQueuedCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const questionStart = useRef(Date.now());
  const feedbackAnchor = useRef<HTMLDivElement>(null);

  const question = questions[index];
  const total = questions.length;

  const handleSubmit = useCallback(() => {
    if (!selected || revealed || !question) return;
    const result = recordAnswer(
      question,
      selected,
      Date.now() - questionStart.current,
      mode,
      confidence,
    );
    setRevealed(true);
    setWasCorrect(result.correct);
    if (result.correct) setCorrectCount((c) => c + 1);
    if (result.queuedForReview) setQueuedCount((c) => c + 1);
    requestAnimationFrame(() =>
      feedbackAnchor.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  }, [selected, revealed, question, recordAnswer, mode, confidence]);

  const advance = useCallback(() => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setConfidence(null);
    setRevealed(false);
    questionStart.current = Date.now();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index, total]);

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
      progress.reviewCards[question.id] ??
      newReviewCard(question.id, question.trackId);
    return gradePreview(card);
  }, [question, withScheduling, progress.reviewCards]);

  // Enter submits, then continues.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter" || finished) return;
      if (!revealed && selected) handleSubmit();
      else if (revealed && !withScheduling) advance();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, selected, finished, withScheduling, handleSubmit, advance]);

  if (finished) {
    return (
      <SessionComplete
        correct={correctCount}
        total={total}
        label={label}
        queued={queuedCount}
      />
    );
  }

  if (!question) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold">Nothing to study here</h1>
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
    <div className="pb-32">
      {/* Session header */}
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Exit session">
          <Link href={exitHref}>
            <X className="h-4 w-4" />
          </Link>
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
        {/* Domain is the teal-tinted pill; difficulty stays neutral so the
            two read as different kinds of metadata. */}
        <Badge>{question.domain}</Badge>
        <Badge variant="outline" className="capitalize">
          {question.difficulty}
        </Badge>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <QuestionView
            question={question}
            selected={selected}
            revealed={revealed}
            onSelect={setSelected}
          />
        </motion.div>
      </AnimatePresence>

      {/* Optional confidence capture — feeds review queue prioritisation. */}
      {!revealed && selected ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6"
        >
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            How confident are you? (optional)
          </p>
          <div className="flex gap-2">
            {CONFIDENCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setConfidence((c) => (c === option.value ? null : option.value))
                }
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                  confidence === option.value
                    ? "border-accent bg-accent-subtle text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent-tint",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </motion.div>
      ) : null}

      <div ref={feedbackAnchor} className="scroll-mt-6" />

      {revealed ? (
        <div className="mt-7">
          <FeedbackPanel question={question} correct={wasCorrect} />

          {withScheduling ? (
            <div className="mt-6">
              <p className="mb-2.5 text-xs font-medium text-muted-foreground">
                When should this come back?
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {scheduling.map(({ grade, label: interval }) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => handleGrade(grade)}
                    className={cn(
                      "rounded-lg border bg-card p-3 text-center shadow-[var(--shadow-card)] transition-colors active:scale-[0.98]",
                      grade === "again" &&
                        "border-destructive/40 hover:bg-destructive-tint",
                      grade === "hard" && "border-warning/40 hover:bg-warning/10",
                      grade === "good" && "border-accent/50 hover:bg-accent-tint",
                      grade === "easy" && "border-success/40 hover:bg-success-tint",
                    )}
                  >
                    <div className="text-sm font-medium capitalize">{grade}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {interval}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 px-4 py-3 backdrop-blur-md pb-safe-nav sm:px-6 lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:backdrop-blur-none">
        <div className="mx-auto max-w-3xl">
          {!revealed ? (
            <Button
              size="lg"
              className="w-full"
              disabled={!selected}
              onClick={handleSubmit}
            >
              Submit answer
            </Button>
          ) : withScheduling ? (
            <p className="text-center text-sm text-muted-foreground">
              Choose an interval above to continue
            </p>
          ) : (
            <Button size="lg" className="w-full" onClick={advance}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionComplete({
  correct,
  total,
  label,
  queued,
}: {
  correct: number;
  total: number;
  label: string;
  /** Scenarios this session added to the review queue. */
  queued: number;
}) {
  const accuracy = pct(correct, total);
  const showQueue = queued > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-md py-10 text-center"
    >
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-accent/40 bg-accent-tint">
        <span className="text-2xl font-semibold tabular-nums text-primary">
          {accuracy}%
        </span>
      </div>
      <h1 className="text-2xl font-semibold">Session complete</h1>
      <p className="mt-2 text-muted-foreground">
        {correct} of {total} correct in {label.toLowerCase()}.
      </p>

      {/* The queue fills itself on every miss. Saying so here is the only
          place a learner finds out without going looking. */}
      {showQueue ? (
        <div className="mt-6 rounded-lg border border-accent/40 bg-accent-tint p-4 text-left">
          <p className="text-sm font-medium">
            {queued} {queued === 1 ? "scenario is" : "scenarios are"} now in your
            review queue
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Missed scenarios come back on a spaced schedule so they stick.
          </p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-2.5">
        {showQueue ? (
          <Button asChild size="lg">
            <Link href="/review">
              <RotateCcw className="h-4 w-4" />
              Review them now
            </Link>
          </Button>
        ) : null}
        <Button asChild size="lg" variant={showQueue ? "outline" : "default"}>
          <Link href="/home">Back to home</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/study">Start another session</Link>
        </Button>
      </div>
    </motion.div>
  );
}
