"use client";

import { DimensionalMark } from "@/components/civic/dimensional-mark";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppGate } from "@/components/app/app-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTrackQuestions } from "@/content/registry";
import {
  examDurationMs,
  DEFAULT_EXAM_QUESTIONS,
  formatRemaining,
  isSubmitted,
} from "@/lib/exam";
import { resumeExamSession } from "@/lib/exam-storage";
import { useProgress } from "@/lib/store/progress-provider";

/**
 * The door into exam mode.
 *
 * It exists partly to set expectations — length, clock, no feedback until the
 * end — and partly because starting a three-hour sitting by accident from a
 * nav link would be a genuinely bad experience.
 */
export default function ExamStartPage() {
  return (
    <AppGate>
      <ExamStart />
    </AppGate>
  );
}

const LENGTHS = [25, 50, 100];

function ExamStart() {
  const router = useRouter();
  const { progress } = useProgress();
  const available = getTrackQuestions(progress.trackId).length;

  const [count, setCount] = useState(DEFAULT_EXAM_QUESTIONS);
  const [inProgress, setInProgress] = useState<{ index: number; total: number } | null>(
    null,
  );

  useEffect(() => {
    const stored = resumeExamSession();
    if (stored && !isSubmitted(stored)) {
      setInProgress({ index: stored.index, total: stored.questionIds.length });
    }
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <p className="text-[0.6875rem] uppercase tracking-[0.1em] text-muted-foreground">
          Practice simulation
        </p>
        <h1 className="mt-1 text-[1.875rem] leading-[1.15] sm:text-[2rem]">
          Practice exam
        </h1>
        <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
          A timed drill over independently authored scenarios, written from the
          published body of knowledge to rehearse the concepts under time
          pressure. No feedback until you submit. It is not a replica of any
          certification exam, does not reproduce one, and does not predict a
          result.
        </p>
      </header>

      {inProgress ? (
        <Card className="mb-6 border-accent/40">
          <CardContent className="p-5">
            <h2 className="font-semibold">You have an exam in progress</h2>
            <p className="measure mt-1 text-sm leading-relaxed text-muted-foreground">
              Question {inProgress.index + 1} of {inProgress.total}. The clock
              has been running since you started.
            </p>
            <Button className="mt-4" onClick={() => router.push("/exam/session")}>
              Resume exam
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardContent className="space-y-5 p-5">
          <div>
            <p className="mb-2.5 text-[0.8125rem] uppercase tracking-[0.1em] text-muted-foreground">
              Questions
            </p>
            <div className="grid grid-cols-3 gap-2">
              {LENGTHS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  aria-pressed={count === n}
                  disabled={n > available}
                  className={
                    "rounded-lg border bg-card py-2.5 text-sm tabular-nums transition-colors disabled:opacity-40 " +
                    (count === n
                      ? "border-accent bg-accent-tint font-semibold text-accent-foreground ring-1 ring-inset ring-accent"
                      : "border-border text-muted-foreground hover:bg-secondary")
                  }
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {available} questions in the bank
            </p>
          </div>

          <ul className="space-y-2 border-t border-border pt-4 text-[0.9375rem]">
            <li className="flex items-start gap-2.5">
              <DimensionalMark name="exam" size="sm" />
              <span>
                {formatRemaining(examDurationMs(count))} on the clock for{" "}
                {count} questions. It runs on a wall-clock deadline — closing
                the tab does not pause it.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <DimensionalMark name="study" size="sm" />
              <span>
                Move freely between questions, flag any to revisit, and submit
                when ready.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <DimensionalMark name="insight" size="sm" tone="insight" />
              <span>
                No answers, rationales or scoring appear until you submit.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full"
        onClick={() => router.push(`/exam/session?count=${count}`)}
        disabled={Boolean(inProgress)}
      >
        {inProgress ? "Finish your exam in progress first" : `Start ${count}-question exam`}
      </Button>
    </div>
  );
}
