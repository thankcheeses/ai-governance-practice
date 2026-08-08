"use client";

import { useState } from "react";
import { AppGate } from "@/components/app/app-gate";
import { StudySession } from "@/components/study/study-session";
import { resumeActiveSession } from "@/lib/active-session";
import { newSeed } from "@/lib/presentation";
import { presentSitting, sittingFromSnapshot } from "@/lib/session";
import { buildReviewQueue } from "@/lib/spaced-repetition";
import { useProgress } from "@/lib/store/progress-provider";

/** Reviews run in batches so a large backlog does not become one long session. */
const REVIEW_BATCH = 15;

export default function ReviewSessionPage() {
  return (
    <AppGate>
      <ReviewSession />
    </AppGate>
  );
}

function ReviewSession() {
  const { progress } = useProgress();

  /*
    Resume before building. A review sitting carries no seed in the URL, so the
    stored sitting is the only record of what was on screen — rebuilding would
    re-run the queue against review cards that answering has already
    rescheduled, and deal a different batch.

    Resolved once, in a state initialiser, so this never re-runs on a render.
  */
  const [{ sitting, resumed }] = useState(() => {
    const stored = resumeActiveSession({ mode: "review" });
    const restored = stored ? sittingFromSnapshot(stored) : null;
    if (stored && restored) return { sitting: restored, resumed: stored };

    const seed = newSeed();
    const questions = buildReviewQueue(progress)
      .slice(0, REVIEW_BATCH)
      .map((item) => item.question);
    return { sitting: presentSitting(questions, seed), resumed: null };
  });

  return (
    <StudySession
      sitting={sitting}
      resumed={resumed}
      mode="review"
      label="Review"
      withScheduling
      exitHref="/review"
    />
  );
}
