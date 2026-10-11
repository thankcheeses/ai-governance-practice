import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  BONUS_AFTER_EVERY,
  MAX_BONUS_PER_SITTING,
  bonusSlots,
  pickBonus,
} from "./bonus-review";
import { emptyProgress, type Attempt, type UserProgress } from "./types";

/* ------------------------------------------------------------------ */
/* Where bonuses are allowed to appear                                 */
/* ------------------------------------------------------------------ */

/**
 * The constraint the owner set: never in a timed exam.
 *
 * It holds structurally rather than by a flag someone has to remember — the
 * exam renders `ExamRunner`, which has no path to this module. A source-shape
 * test because that is the only way to assert it without a DOM, and because
 * the failure it guards against is someone later importing this into the exam
 * for a perfectly reasonable-sounding reason.
 */
test("the exam cannot reach bonus questions", () => {
  for (const file of [
    "src/components/exam/exam-runner.tsx",
    "src/components/exam/exam-results.tsx",
    "src/app/exam/session/page.tsx",
  ]) {
    const source = readFileSync(file, "utf8");
    assert.ok(
      !/bonus-review|BonusReview/.test(source),
      `${file} references bonus review — a timed exam must never be interrupted ` +
        "by a freebie; that is the one thing exam mode exists to simulate",
    );
  }
});

/* ------------------------------------------------------------------ */
/* Slot placement                                                      */
/* ------------------------------------------------------------------ */

test("a sitting no longer than the cadence gets none", () => {
  assert.deepEqual(bonusSlots(1, BONUS_AFTER_EVERY), []);
  assert.deepEqual(bonusSlots(1, 1), []);
  assert.deepEqual(bonusSlots(1, 0), []);
});

test("slots are sorted, unique, and never after the last question", () => {
  // A bonus after the final answer would land between the run and its results
  // screen, which is the one transition that should not be interrupted.
  for (let seed = 0; seed < 40; seed++) {
    for (const total of [5, 10, 20, 25, 50]) {
      const slots = bonusSlots(seed, total);
      assert.deepEqual([...slots].sort((a, b) => a - b), slots, "not sorted");
      assert.equal(new Set(slots).size, slots.length, "duplicate slot");
      for (const s of slots) {
        assert.ok(s >= 0 && s < total - 1, `slot ${s} out of range for ${total}`);
      }
    }
  }
});

test("the per-sitting ceiling holds however long the sitting is", () => {
  for (const total of [10, 25, 50, 100, 500]) {
    assert.ok(
      bonusSlots(7, total).length <= MAX_BONUS_PER_SITTING,
      `${total} questions produced more than ${MAX_BONUS_PER_SITTING} bonuses`,
    );
  }
});

test("slots are stable for a seed, which is what makes a resume the same run", () => {
  /*
    The load-bearing one. A study session is persisted and restored across
    refreshes; `Math.random()` here would re-roll on every restore, so a learner
    who refreshed would get a different number of bonuses in different places
    than one who did not.
  */
  for (let seed = 0; seed < 25; seed++) {
    assert.deepEqual(
      bonusSlots(seed, 20),
      bonusSlots(seed, 20),
      "the same seed produced different slots",
    );
  }
});

test("different seeds place bonuses differently", () => {
  // Otherwise "seeded" would just mean "fixed", and every sitting of a given
  // length would interleave at identical points.
  const seen = new Set(
    Array.from({ length: 30 }, (_, seed) => bonusSlots(seed, 20).join(",")),
  );
  assert.ok(seen.size > 1, "every seed produced the same placement");
});

test("bonuses never land back to back", () => {
  // Candidates are block ends rather than free positions precisely so the
  // spacing stays sane; two in a row reads as a bug rather than a bonus.
  for (let seed = 0; seed < 60; seed++) {
    const slots = bonusSlots(seed, 30);
    for (let i = 1; i < slots.length; i++) {
      assert.ok(
        slots[i]! - slots[i - 1]! >= BONUS_AFTER_EVERY,
        `slots ${slots[i - 1]} and ${slots[i]} are adjacent (seed ${seed})`,
      );
    }
  }
});

/* ------------------------------------------------------------------ */
/* Which question is offered                                           */
/* ------------------------------------------------------------------ */

/** A single recorded attempt, shaped exactly as the store writes them. */
function attempt(questionId: string, correct: boolean, i = 0): Attempt {
  return {
    id: `a${i}`,
    trackId: "aigp-preparation",
    questionId,
    selected: [correct ? "right" : "wrong"],
    correct,
    responseTimeMs: 1000,
    difficulty: "applied",
    domain: "Foundations of AI Governance",
    confidence: null,
    createdAt: new Date().toISOString(),
    mode: "practice",
  };
}

function progressWith(...attempts: Attempt[]): UserProgress {
  return { ...emptyProgress(), attempts };
}

function progressWithMiss(questionId: string): UserProgress {
  return progressWith(attempt(questionId, false));
}

test("an empty history offers nothing", () => {
  assert.equal(pickBonus(emptyProgress(), []), null);
});

test("a missed question is offered", () => {
  const progress = progressWithMiss("aigp-001");
  const picked = pickBonus(progress, []);
  assert.equal(picked?.question.id, "aigp-001");
  assert.equal(picked?.reason, "missed");
});

test("a question already in this sitting is never offered", () => {
  /*
    Two ways this feature would obviously look broken: showing a question the
    learner is about to meet normally, and showing one they just saw. Both are
    the caller passing ids in here, so both are this function's job.
  */
  const progress = progressWithMiss("aigp-001");
  assert.equal(pickBonus(progress, ["aigp-001"]), null);
});

test("exclusion falls through to the next candidate rather than giving up", () => {
  const progress = progressWith(
    attempt("aigp-001", false, 0),
    attempt("aigp-002", false, 1),
  );

  const picked = pickBonus(progress, ["aigp-001"]);
  assert.equal(picked?.question.id, "aigp-002");
});

test("a question answered correctly is not offered as a miss", () => {
  const progress = progressWith(attempt("aigp-001", true));
  const picked = pickBonus(progress, []);
  assert.notEqual(
    picked?.reason,
    "missed",
    "a question the learner got right was offered as a miss",
  );
});
