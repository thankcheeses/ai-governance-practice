"use client";

import { useState } from "react";
import { AppGate } from "@/components/app/app-gate";
import { StudySession } from "@/components/study/study-session";
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

  // Snapshot at mount: grading a card changes its due date, and we do not want
  // the queue reordering underneath the learner mid-session.
  const [questions] = useState(() =>
    buildReviewQueue(progress)
      .slice(0, REVIEW_BATCH)
      .map((item) => item.question),
  );

  return (
    <StudySession
      questions={questions}
      mode="review"
      label="Review"
      withScheduling
      exitHref="/review"
    />
  );
}
