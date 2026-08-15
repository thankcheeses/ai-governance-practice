import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SAMPLE_QUESTION_ID,
  SAMPLE_SEED,
  sampleQuestion,
} from "./sample-question";
import { isMultiSelect } from "@/lib/grading";
import { correctKeys, presentOptions } from "@/lib/presentation";

/*
  What these can and cannot cover.

  The test runner is `tsx --test "src/**\/*.test.ts"` — the glob excludes
  `.tsx`, and there is no DOM environment, so nothing here renders a component.
  The demo's isolation from progress therefore **cannot** be asserted in this
  harness; it is guaranteed structurally instead, by `SampleDemo` never
  importing the progress provider, and is verified in the browser.

  What is testable is the part most likely to break silently: the sample
  drifting out of the bank, or the option order stopping being deterministic
  and taking hydration down with it.
*/

test("the landing sample exists in the question bank", () => {
  const question = sampleQuestion();
  assert.ok(question, `${SAMPLE_QUESTION_ID} should resolve`);
  assert.equal(question.id, SAMPLE_QUESTION_ID);
});

test("the landing sample is single-select", () => {
  // The demo's submit gate is `canSubmit`, which for a multi-select item
  // requires an exact count the landing copy never states. A sample that
  // became multi-select would present a button that looks broken.
  const question = sampleQuestion()!;
  assert.equal(isMultiSelect(question), false);
  assert.equal(question.correctOptionIds.length, 1);
});

test("the landing sample carries the feedback the demo shows", () => {
  const question = sampleQuestion()!;
  assert.ok(question.rationale.length > 0, "rationale is shown after checking");
  assert.ok(question.keyTakeaway.length > 0, "key takeaway is the anchor panel");
});

test("the fixed seed deals a stable option order", () => {
  // This is the hydration guarantee. If `presentOptions` were ever called with
  // a random seed here, the server and client would disagree on option order
  // and React would discard the markup on the app's most public route.
  const question = sampleQuestion()!;
  const first = presentOptions(question, SAMPLE_SEED);
  const second = presentOptions(question, SAMPLE_SEED);

  assert.deepEqual(
    first.map((o) => o.id),
    second.map((o) => o.id),
  );
  assert.deepEqual(
    first.map((o) => o.key),
    second.map((o) => o.key),
  );
});

test("every option is dealt exactly once, with one correct letter", () => {
  const question = sampleQuestion()!;
  const presented = presentOptions(question, SAMPLE_SEED);

  assert.equal(presented.length, question.options.length);
  assert.equal(
    new Set(presented.map((o) => o.id)).size,
    question.options.length,
    "no option is dropped or duplicated by the shuffle",
  );
  assert.equal(correctKeys(presented, question).length, 1);
});
