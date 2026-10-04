import assert from "node:assert/strict";
import { test } from "node:test";
import { flawlessTally, isFlawless } from "./results";
import type { SittingScore } from "./results";

/**
 * The flawless predicate.
 *
 * The rule the owner asked for is "100% counts at any length", so the tests
 * that matter are the ones proving length is not consulted, and the ones
 * proving the near-misses that a percentage would round into 100% are not
 * flawless.
 */
function score(partial: Partial<SittingScore>): SittingScore {
  return {
    total: 0,
    correct: 0,
    incorrect: 0,
    unanswered: 0,
    percentage: 0,
    byDomain: [],
    bySubdomain: [],
    missedIds: [],
    flaggedCount: 0,
    ...partial,
  } as SittingScore;
}

test("a clean sweep is flawless at every length", () => {
  for (const n of [1, 5, 10, 25, 50, 100, 350]) {
    const s = score({ total: n, correct: n, percentage: 100 });
    assert.ok(isFlawless(s), `${n} of ${n} should be flawless`);
  }
});

test("one wrong answer is not flawless, however small the share", () => {
  const s = score({ total: 200, correct: 199, incorrect: 1, percentage: 100 });
  // 199/200 rounds to 100%, which is exactly why the predicate counts instead.
  assert.equal(s.percentage, 100);
  assert.equal(isFlawless(s), false);
});

test("an unanswered question disqualifies a sitting", () => {
  // A submitted-blank exam has zero incorrect answers, so incorrect alone
  // would call it flawless.
  const blank = score({ total: 50, correct: 0, unanswered: 50 });
  assert.equal(isFlawless(blank), false);

  const nearly = score({ total: 50, correct: 49, unanswered: 1, percentage: 98 });
  assert.equal(isFlawless(nearly), false);
});

test("an empty sitting is not flawless", () => {
  assert.equal(isFlawless(score({})), false);
});

test("the tally states counts, never a percentage or a claim", () => {
  const s = score({ total: 10, correct: 10, percentage: 100 });
  assert.equal(flawlessTally(s), "10 of 10");
  assert.doesNotMatch(flawlessTally(s), /%|ready|pass|exam/i);
});
