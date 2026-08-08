"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AppGate } from "@/components/app/app-gate";
import { ExamResults } from "@/components/exam/exam-results";
import { ExamRunner } from "@/components/exam/exam-runner";
import {
  DEFAULT_EXAM_DURATION_MS,
  DEFAULT_EXAM_QUESTIONS,
  type ExamSession,
  createExamSession,
  isSubmitted,
  resultFromExam,
  sittingFromExam,
  submitIfExpired,
} from "@/lib/exam";
import { writeResult } from "@/lib/results-storage";
import {
  clearExamSession,
  resumeExamSession,
  writeExamSession,
} from "@/lib/exam-storage";
import { newSeed } from "@/lib/presentation";
import { useProgress } from "@/lib/store/progress-provider";

export default function ExamSessionPage() {
  return (
    <AppGate>
      <Suspense fallback={<Loading />}>
        <ExamSessionView />
      </Suspense>
    </AppGate>
  );
}

/**
 * Resume first, create second.
 *
 * A stored exam is authoritative and is never rebuilt: its question ids, option
 * order and — most importantly — its deadline are facts about a sitting that is
 * already underway. Re-deriving any of them would either deal a different paper
 * or hand back time that has already been spent.
 *
 * `AppGate` holds children until progress has hydrated, so this initialiser
 * runs after mount and reading `localStorage` here cannot desynchronise the
 * server and client renders.
 */
function ExamSessionView() {
  const params = useSearchParams();
  const router = useRouter();
  const { progress } = useProgress();

  const [session, setSession] = useState<ExamSession>(() => {
    const stored = resumeExamSession();
    if (stored) {
      // A sitting whose clock ran out while nobody was looking is closed on the
      // way back in, before a single question can be rendered.
      const settled = submitIfExpired(stored);
      if (settled !== stored) writeExamSession(settled);
      return settled;
    }

    const requested = Number(params.get("count"));
    const count =
      Number.isFinite(requested) && requested > 0
        ? requested
        : DEFAULT_EXAM_QUESTIONS;

    const created = createExamSession({
      seed: newSeed(),
      count,
      durationMs: DEFAULT_EXAM_DURATION_MS,
      trackId: progress.trackId,
    });
    writeExamSession(created);
    return created;
  });

  /*
    Keep the finished exam as a result in its own right.

    The exam session already survives a refresh, but it is the record of a
    *sitting* and "Start a new exam" clears it. The result is a different kind
    of thing — something the learner earned and may want to print or send
    later — so it is copied into the results store the moment the exam closes,
    however it closed.
  */
  useEffect(() => {
    if (!isSubmitted(session)) return;
    const record = resultFromExam(session);
    if (record) writeResult(record);
  }, [session]);

  const handleDiscard = useCallback(() => {
    clearExamSession();
    router.push("/exam");
  }, [router]);

  const sitting = sittingFromExam(session);

  // A sitting that cannot be rebuilt — a question removed from the bank since
  // it was written — is unusable rather than partially usable.
  if (!sitting) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold">This exam can no longer be restored</h1>
        <p className="measure mx-auto mt-2 text-muted-foreground">
          Its questions have changed since it was started. Nothing from it has
          been scored.
        </p>
        <button
          type="button"
          onClick={handleDiscard}
          className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Start a new exam
        </button>
      </div>
    );
  }

  if (isSubmitted(session)) {
    return <ExamResults session={session} onDiscard={handleDiscard} />;
  }

  return (
    <ExamRunner
      session={session}
      sitting={sitting}
      onChange={setSession}
      onSubmitted={setSession}
    />
  );
}

function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <span className="skeleton h-2 w-40" role="status" aria-label="Loading exam" />
    </div>
  );
}
