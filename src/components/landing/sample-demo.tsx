"use client";

import { useMemo, useState } from "react";
import { FeedbackPanel } from "@/components/study/feedback-panel";
import { QuestionView } from "@/components/study/question-view";
import { Button } from "@/components/ui/button";
import { canSubmit, gradeAnswer, toggleSelection } from "@/lib/grading";
import { correctKeys, presentOptions } from "@/lib/presentation";
import { SAMPLE_SEED, sampleQuestion } from "./sample-question";

export function SampleDemo() {
  const question = sampleQuestion();
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);

  const options = useMemo(
    () => (question ? presentOptions(question, SAMPLE_SEED) : []),
    [question],
  );

  if (!question) return null;

  const correct = gradeAnswer(question, selected);
  const ready = canSubmit(question, selected);

  return (
    <div>
      <p className="mb-5 text-[0.8125rem] text-muted-foreground">
        Pick one. This does not save.
      </p>
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
