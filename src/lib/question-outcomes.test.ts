import assert from "node:assert/strict";
import test from "node:test";
import { getTrackQuestions } from "@/content/registry";
import scenarios from "@/content/tracks/aigp-preparation/scenarios.json";
import { questionOutcomes, scoreSitting } from "./results";
import { resultReportOps } from "./results-pdf";
import { buildBoard, laneFor } from "./scenario-board";

const bank = getTrackQuestions("aigp-preparation");

function sittingOf(n: number, answer: (i: number) => "right" | "wrong" | "blank") {
  const qs = bank.slice(0, n);
  const answers: Record<string, string[]> = {};
  qs.forEach((q, i) => {
    const how = answer(i);
    if (how === "blank") return;
    const wrong = q.options.find((o) => !q.correctOptionIds.includes(o.id))!;
    answers[q.id] = how === "right" ? [...q.correctOptionIds] : [wrong.id];
  });
  return { questionIds: qs.map((q) => q.id), answers };
}

test("question outcomes are green exactly where the score counts a question correct", () => {
  const sitting = sittingOf(12, (i) => (i % 3 === 0 ? "right" : i % 3 === 1 ? "wrong" : "blank"));
  const outcomes = questionOutcomes(sitting);
  const score = scoreSitting(sitting);

  assert.equal(outcomes.length, 12);
  assert.deepEqual(outcomes.map((o) => o.number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.equal(outcomes.filter((o) => o.status === "correct").length, score.correct);
  assert.deepEqual(
    outcomes.filter((o) => o.status !== "correct").map((o) => o.questionId),
    score.missedIds,
    "red buttons and the missed list must be the same questions",
  );
  assert.equal(outcomes[1].status, "incorrect");
  assert.equal(outcomes[2].status, "unanswered");
});

test("the PDF draws one green or red button per question", () => {
  const sitting = sittingOf(10, (i) => (i < 4 ? "right" : "wrong"));
  const result = {
    version: 1,
    mode: "practice" as const,
    sittingId: "t",
    trackId: "aigp-preparation" as const,
    label: "Mixed practice",
    seed: 1,
    questionIds: sitting.questionIds,
    optionIds: sitting.questionIds.map((id) => bank.find((q) => q.id === id)!.options.map((o) => o.id)),
    answers: sitting.answers,
    flagged: [],
    startedAt: "2026-10-01T10:00:00Z",
    completedAt: "2026-10-01T10:20:00Z",
    reason: "completed" as const,
    durationMs: null,
    deadline: null,
  };
  const ops = resultReportOps(result, { now: new Date("2026-10-01T10:20:00Z") });
  const tagged = (tag: string) => ops.filter((op) => "tag" in op && op.tag === tag).length;
  assert.equal(tagged("question-correct"), 4);
  assert.equal(tagged("question-missed"), 6);
  assert.equal(tagged("missed-pill"), 6, "every missed question in the list gets a red button");
});

test("every scenario fact lands on the case board exactly once, verbatim", () => {
  for (const s of scenarios) {
    const lanes = buildBoard(s);
    const placed = lanes.flatMap((l) => l.facts);
    assert.deepEqual(
      [...placed].sort((a, b) => a.label.localeCompare(b.label)),
      [...s.facts].sort((a, b) => a.label.localeCompare(b.label)),
      `${s.id}: the board must show the brief's own facts, no more and no fewer`,
    );
  }
});

test("no current scenario fact falls through to the catch-all lane", () => {
  const unplaced = scenarios.flatMap((s) =>
    s.facts.filter((f) => laneFor(f.label) === "context").map((f) => `${s.id}: ${f.label}`),
  );
  assert.deepEqual(unplaced, [], "add a lane pattern for these labels");
});
