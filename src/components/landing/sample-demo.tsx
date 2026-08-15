"use client";

import { useMemo, useState } from "react";
import { FeedbackPanel } from "@/components/study/feedback-panel";
import { QuestionView } from "@/components/study/question-view";
import { Button } from "@/components/ui/button";
import { canSubmit, gradeAnswer, toggleSelection } from "@/lib/grading";
import { correctKeys, presentOptions } from "@/lib/presentation";
import { SAMPLE_SEED, sampleQuestion } from "./sample-question";

/**
 * One real question, completely isolated from the learner's record.
 *
 * The isolation is the whole point of this component and it is enforced by
 * omission: **it never calls `useProgress()`.** The progress provider persists
 * on every state change, so the only reliable way not to write is not to hold
 * the handle. Nothing here creates an attempt, enqueues a review card,
 * advances the streak, completes onboarding, opens an active session, or makes
 * a Supabase request.
 *
 * Selection lives in local `useState` and grading goes through the same pure
 * `gradeAnswer` the real session uses — which is also what `StudySession` does
 * on its resume path, for exactly this reason. So the demo cannot drift from
 * the product: it is the product's own grading, minus the recording.
 */
export function SampleDemo() {
  const question = sampleQuestion();
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);

  // Fixed seed, memoised on the question — the order must be identical on the
  // server and the client or hydration discards the markup.
  const options = useMemo(
    () => (question ? presentOptions(question, SAMPLE_SEED) : []),
    [question],
  );

  if (!question) return null;

  const correct = gradeAnswer(question, selected);
  const ready = canSubmit(question, selected);

  return (
    <div>
      <QuestionView
        question={question}
        options={options}
        selected={selected}
        revealed={revealed}
        onSelect={(id) =>
          setSelected((current) => toggleSelection(question, current, id))
        }
      />

      {!revealed ? (
        <Button
          size="lg"
          variant={ready ? "default" : "outline"}
          className="mt-7 w-full"
          disabled={!ready}
          onClick={() => setRevealed(true)}
        >
          {ready ? "Check answer" : "Choose an answer"}
        </Button>
      ) : (
        <div className="mt-8">
          <FeedbackPanel
            question={question}
            correct={correct}
            correctKeys={correctKeys(options, question)}
            options={options}
            selected={selected}
          />
          <Button
            variant="outline"
            className="mt-7"
            onClick={() => {
              setSelected([]);
              setRevealed(false);
            }}
          >
            Try it again
          </Button>
        </div>
      )}
    </div>
  );
}
