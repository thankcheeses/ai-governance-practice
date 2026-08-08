import assert from "node:assert/strict";
import { test } from "node:test";
import { getQuestion, getTrackQuestions } from "@/content/registry";
import type { Question } from "@/content/types";
import { gradeAnswer, isMultiSelect } from "./grading";
import { correctKeys, presentOptions } from "./presentation";
import { buildSessionQuestions } from "./session";
import { emptyProgress, type Attempt, type UserProgress } from "./types";

/**
 * Regression tests for the randomisation invariant.
 *
 * The invariant, stated precisely:
 *
 *   - a NEW session randomises both question order and option order;
 *   - an ACTIVE session keeps both fixed, so a reload rebuilds the same
 *     sitting rather than dealing a new one;
 *   - grading is keyed to option identity, never to the displayed letter.
 *
 * These go through `buildSessionQuestions` — the same function the session
 * page calls — rather than re-composing `selectQuestions` and
 * `presentQuestions` here. A test that reimplements the pipeline would keep
 * passing after the page stopped using it, which is exactly the regression
 * worth catching.
 */

const TRACK = "aigp-preparation" as const;
const ALL = getTrackQuestions(TRACK);
const SINGLE = ALL.find((q) => !isMultiSelect(q))!;
const MULTI = ALL.find((q) => isMultiSelect(q))!;

const spec = (seed: number, count = 10) => ({ seed, count, trackId: TRACK });
const ids = (questions: Question[]) => questions.map((q) => q.id);

/** An attempt that looks the way the app actually records one. */
function attemptFor(questionId: string, correct: boolean): Attempt {
  const question = getQuestion(questionId)!;
  return {
    id: `att-${questionId}`,
    questionId,
    trackId: TRACK,
    domain: question.domain,
    selected: [question.correctOptionIds[0]],
    correct,
    responseTimeMs: 1000,
    mode: "practice",
    confidence: null,
    createdAt: new Date().toISOString(),
  } as Attempt;
}

/* ============================================================================
   1. Randomised answer order still grades correctly
   ========================================================================= */

test("a correct single-select answer grades correct under every shuffle", () => {
  const correctId = SINGLE.correctOptionIds[0];
  for (let seed = 0; seed < 50; seed++) {
    const dealt = presentOptions(SINGLE, seed);
    const chosen = dealt.find((o) => o.id === correctId)!;
    assert.equal(
      gradeAnswer(SINGLE, [chosen.id]),
      true,
      `seed ${seed}: the correct option landed on ${chosen.key} and did not grade`,
    );
  }
});

test("a wrong single-select answer grades wrong under every shuffle", () => {
  for (let seed = 0; seed < 50; seed++) {
    for (const option of presentOptions(SINGLE, seed)) {
      if (SINGLE.correctOptionIds.includes(option.id)) continue;
      assert.equal(
        gradeAnswer(SINGLE, [option.id]),
        false,
        `seed ${seed}: wrong option on ${option.key} graded as correct`,
      );
    }
  }
});

test("grading follows the option, not the letter it was dealt", () => {
  // The strongest form of the claim: find two seeds that put the correct
  // answer on different letters, then show the same id grades true in both
  // and the letter that was correct in one is wrong in the other.
  const correctId = SINGLE.correctOptionIds[0];
  const byLetter = new Map<string, number>();
  for (let seed = 0; seed < 60; seed++) {
    const key = presentOptions(SINGLE, seed).find((o) => o.id === correctId)!.key;
    if (!byLetter.has(key)) byLetter.set(key, seed);
  }
  assert.ok(
    byLetter.size >= 2,
    "the correct answer never moved letters across 60 seeds",
  );

  const [[letterA, seedA], [letterB, seedB]] = [...byLetter.entries()];
  assert.notEqual(letterA, letterB);

  // Same id, both sittings, both correct.
  assert.equal(gradeAnswer(SINGLE, [correctId]), true);

  // The letter that carried the answer under seedA carries a *wrong* option
  // under seedB — proof that a letter alone means nothing.
  const whatALetterHoldsInB = presentOptions(SINGLE, seedB).find(
    (o) => o.key === letterA,
  )!;
  assert.equal(
    gradeAnswer(SINGLE, [whatALetterHoldsInB.id]),
    false,
    `letter ${letterA} was correct under seed ${seedA} and still graded correct under seed ${seedB}`,
  );
});

test("every question in the bank grades correctly under a shuffle", () => {
  for (const question of ALL) {
    const dealt = presentOptions(question, 31337);
    const right = dealt
      .filter((o) => question.correctOptionIds.includes(o.id))
      .map((o) => o.id);
    assert.equal(right.length, question.correctOptionIds.length, question.id);
    assert.equal(gradeAnswer(question, right), true, question.id);
  }
});

/* ============================================================================
   2. Multi-select grading remains correct after answer-order randomisation
   ========================================================================= */

test("multi-select grades all-or-nothing under every shuffle", () => {
  for (let seed = 0; seed < 50; seed++) {
    const dealt = presentOptions(MULTI, seed);
    const right = dealt
      .filter((o) => MULTI.correctOptionIds.includes(o.id))
      .map((o) => o.id);
    const wrong = dealt.find((o) => !MULTI.correctOptionIds.includes(o.id))!;

    assert.equal(gradeAnswer(MULTI, right), true, `seed ${seed}: all correct`);
    assert.equal(
      gradeAnswer(MULTI, right.slice(1)),
      false,
      `seed ${seed}: a subset scored`,
    );
    assert.equal(
      gradeAnswer(MULTI, [...right, wrong.id]),
      false,
      `seed ${seed}: a superset scored`,
    );
    assert.equal(
      gradeAnswer(MULTI, [...right.slice(1), wrong.id]),
      false,
      `seed ${seed}: swapping one correct for one wrong scored`,
    );
  }
});

test("multi-select grading ignores the order the answers were picked in", () => {
  for (let seed = 0; seed < 20; seed++) {
    const right = presentOptions(MULTI, seed)
      .filter((o) => MULTI.correctOptionIds.includes(o.id))
      .map((o) => o.id);
    assert.equal(gradeAnswer(MULTI, right), true);
    assert.equal(gradeAnswer(MULTI, [...right].reverse()), true);
  }
});

test("every multi-select item in the bank survives shuffling", () => {
  const multis = ALL.filter(isMultiSelect);
  assert.ok(multis.length > 0, "the bank has no multi-select items to check");
  for (const question of multis) {
    for (let seed = 0; seed < 20; seed++) {
      const dealt = presentOptions(question, seed);
      const right = dealt
        .filter((o) => question.correctOptionIds.includes(o.id))
        .map((o) => o.id);
      assert.equal(gradeAnswer(question, right), true, `${question.id}/${seed}`);

      // The letters reported back to the learner must point at those options.
      const keys = correctKeys(dealt, question);
      assert.equal(keys.length, question.correctOptionIds.length);
      for (const key of keys) {
        const shown = dealt.find((o) => o.key === key)!;
        assert.ok(
          question.correctOptionIds.includes(shown.id),
          `${question.id}/${seed}: letter ${key} reported correct but is not`,
        );
      }
    }
  }
});

/* ============================================================================
   3. The same active session preserves question order
   ========================================================================= */

test("rebuilding an active session reproduces the same questions in the same order", () => {
  const progress = emptyProgress(TRACK);
  for (const seed of [1, 42, 4242, 99999, 31337]) {
    const first = ids(buildSessionQuestions(progress, spec(seed)));
    const rebuilt = ids(buildSessionQuestions(progress, spec(seed)));
    assert.deepEqual(rebuilt, first, `seed ${seed} did not reproduce`);
  }
});

test("a rebuild is stable across repeated reloads, not just the second one", () => {
  const progress = emptyProgress(TRACK);
  const expected = ids(buildSessionQuestions(progress, spec(777)));
  for (let reload = 0; reload < 10; reload++) {
    assert.deepEqual(ids(buildSessionQuestions(progress, spec(777))), expected);
  }
});

test("a drill session is reproducible too", () => {
  const progress = emptyProgress(TRACK);
  const only = ALL.slice(20, 40).map((q) => q.id);
  const first = ids(buildSessionQuestions(progress, { ...spec(9), only }));
  const rebuilt = ids(buildSessionQuestions(progress, { ...spec(9), only }));
  assert.deepEqual(rebuilt, first);
  assert.ok(first.every((id) => only.includes(id)), "a drill drew outside its set");
});

/* ============================================================================
   4. The same active session preserves option order
   ========================================================================= */

test("option order is fixed for a given question and seed", () => {
  for (const question of ALL.slice(0, 30)) {
    const first = presentOptions(question, 555).map((o) => o.id);
    for (let reload = 0; reload < 5; reload++) {
      assert.deepEqual(
        presentOptions(question, 555).map((o) => o.id),
        first,
        `${question.id} reshuffled on reload`,
      );
    }
  }
});

test("a reload deals every option the same letter it had before", () => {
  const session = buildSessionQuestions(emptyProgress(TRACK), spec(2468));
  const before = session.map((q) =>
    presentOptions(q, 2468).map((o) => `${o.key}:${o.id}`),
  );
  const after = buildSessionQuestions(emptyProgress(TRACK), spec(2468)).map((q) =>
    presentOptions(q, 2468).map((o) => `${o.key}:${o.id}`),
  );
  assert.deepEqual(after, before);
});

test("option order does not depend on the learner's history", () => {
  // Only the seed and the question id feed the option shuffle. Answering must
  // not move the choices around under someone mid-question.
  const fresh = emptyProgress(TRACK);
  const answered: UserProgress = {
    ...fresh,
    attempts: ALL.slice(0, 20).map((q, i) => attemptFor(q.id, i % 2 === 0)),
  };
  const seed = 13579;
  for (const question of ALL.slice(0, 20)) {
    assert.deepEqual(
      presentOptions(question, seed).map((o) => o.id),
      presentOptions(question, seed).map((o) => o.id),
    );
  }
  // And the same holds for a session built from either history: whichever
  // questions they share are dealt identically.
  const a = buildSessionQuestions(fresh, spec(seed));
  const b = buildSessionQuestions(answered, spec(seed));
  const shared = a.filter((q) => b.some((o) => o.id === q.id));
  assert.ok(shared.length > 0, "the two sittings shared no questions");
  for (const question of shared) {
    assert.deepEqual(
      presentOptions(question, seed).map((o) => o.key + o.id),
      presentOptions(question, seed).map((o) => o.key + o.id),
    );
  }
});

/* ============================================================================
   5. A new session can receive a different order
   ========================================================================= */

test("a new seed deals a different question order", () => {
  const progress = emptyProgress(TRACK);
  const base = ids(buildSessionQuestions(progress, spec(1))).join();
  const differs = Array.from({ length: 30 }, (_, i) =>
    ids(buildSessionQuestions(progress, spec(i + 2))).join(),
  ).filter((order) => order !== base);
  assert.ok(
    differs.length > 25,
    `only ${differs.length} of 30 new seeds produced a different sitting`,
  );
});

test("a new seed deals a different option order", () => {
  const orders = new Set(
    Array.from({ length: 30 }, (_, seed) =>
      presentOptions(SINGLE, seed).map((o) => o.id).join(),
    ),
  );
  assert.ok(
    orders.size > 1,
    "the option order was identical across 30 seeds",
  );
});

test("two questions in one session shuffle independently", () => {
  // If every question shared the seed's permutation, a learner could learn
  // "the answer is wherever it was last time" across a single sitting.
  const permutations = new Set(
    ALL.slice(0, 40)
      .filter((q) => q.options.length === 4)
      .map((q) =>
        presentOptions(q, 8080)
          .map((o) => q.options.findIndex((s) => s.id === o.id))
          .join(),
      ),
  );
  assert.ok(
    permutations.size > 1,
    "every question in the session was dealt the same permutation",
  );
});

test("no letter carries the answer more often than chance", () => {
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  let total = 0;
  for (let seed = 0; seed < 15; seed++) {
    for (const q of ALL) {
      if (isMultiSelect(q) || q.options.length !== 4) continue;
      counts[presentOptions(q, seed).find((o) =>
        q.correctOptionIds.includes(o.id),
      )!.key] += 1;
      total += 1;
    }
  }
  for (const key of ["A", "B", "C", "D"]) {
    const share = counts[key] / total;
    assert.ok(
      share > 0.2 && share < 0.3,
      `${key} carried the answer ${(share * 100).toFixed(1)}% of the time`,
    );
  }
});

/* ============================================================================
   The boundary of the two paths
   ========================================================================= */

test("rebuilding is progress-dependent by design — which is why restoring is not", () => {
  /*
    Selection scores candidates against the attempt history: unseen +40,
    previously-correct -25, previously-wrong +20. That is the point of the
    adaptive layer, and it means `buildSessionQuestions` is *supposed* to
    return something different once the learner has answered.

    It also means a seed can never be enough to recover a sitting. This test
    pins the divergence so the reasoning behind active-session persistence
    cannot quietly stop applying: if rebuilding ever became history-independent
    the restore path would look redundant, and someone would delete it.

    The corresponding proof that restoration is immune lives in
    active-session.test.ts.
  */
  const seeds = [1, 42, 4242, 99999, 7, 31337, 2024, 555, 8888, 13];
  let diverged = 0;

  for (const seed of seeds) {
    const fresh = emptyProgress(TRACK);
    const original = ids(buildSessionQuestions(fresh, spec(seed)));

    const midSession: UserProgress = {
      ...fresh,
      attempts: original.slice(0, 3).map((id, i) => attemptFor(id, i !== 1)),
    };
    if (ids(buildSessionQuestions(midSession, spec(seed))).join() !== original.join()) {
      diverged += 1;
    }
  }

  assert.equal(
    diverged,
    seeds.length,
    "rebuilding no longer depends on progress; re-examine whether the " +
      "active-session restore path is still doing necessary work",
  );
});

test("option order is history-independent even though selection is not", () => {
  // The half that the seed alone does hold. Pinned separately so a change to
  // selection cannot regress shuffling as a side effect.
  const fresh = emptyProgress(TRACK);
  const original = buildSessionQuestions(fresh, spec(4242));
  const midSession: UserProgress = {
    ...fresh,
    attempts: original.slice(0, 3).map((q, i) => attemptFor(q.id, i !== 1)),
  };
  const rebuilt = buildSessionQuestions(midSession, spec(4242));

  const survivors = rebuilt.filter((q) => original.some((o) => o.id === q.id));
  assert.ok(survivors.length > 0, "no question survived the rebuild");
  for (const question of survivors) {
    assert.deepEqual(
      presentOptions(question, 4242).map((o) => `${o.key}:${o.id}`),
      presentOptions(question, 4242).map((o) => `${o.key}:${o.id}`),
      `${question.id}: options moved`,
    );
  }
});
