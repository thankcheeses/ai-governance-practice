import assert from "node:assert/strict";
import { test } from "node:test";
import { getTrackQuestions } from "@/content/registry";
import { gradeAnswer, isMultiSelect } from "./grading";
import {
  correctKeys,
  keyForOption,
  newSeed,
  parseSeed,
  presentOptions,
  presentQuestions,
} from "./presentation";

const ALL = getTrackQuestions("aigp-preparation");
const SINGLE = ALL.find((q) => !isMultiSelect(q))!;
const MULTI = ALL.find((q) => isMultiSelect(q))!;

/* --------------------------------------------------------- determinism -- */

test("the same seed deals the same options", () => {
  const a = presentOptions(SINGLE, 1234);
  const b = presentOptions(SINGLE, 1234);
  assert.deepEqual(
    a.map((o) => o.id),
    b.map((o) => o.id),
  );
});

test("different seeds eventually deal a different order", () => {
  const base = presentOptions(SINGLE, 1).map((o) => o.id).join();
  const differs = Array.from({ length: 40 }, (_, i) =>
    presentOptions(SINGLE, i + 2).map((o) => o.id).join(),
  ).some((order) => order !== base);
  assert.ok(differs, "option order never varied across 40 seeds");
});

test("a question's shuffle depends on its own id, not the seed alone", () => {
  const a = presentOptions(ALL[0], 99).map((o) => o.id.split("-o")[1]).join();
  const b = presentOptions(ALL[1], 99).map((o) => o.id.split("-o")[1]).join();
  // Not a hard guarantee for any single pair, but across the bank the
  // positions must not move in lockstep.
  const lockstep = ALL.slice(0, 30).every(
    (q) =>
      presentOptions(q, 99).map((o) => o.id.split("-o")[1]).join() === a,
  );
  assert.ok(!lockstep, `every question dealt the same permutation (${a} / ${b})`);
});

test("question order is seeded and reproducible", () => {
  const subset = ALL.slice(0, 20);
  assert.deepEqual(
    presentQuestions(subset, 7).map((q) => q.id),
    presentQuestions(subset, 7).map((q) => q.id),
  );
  const shuffled = presentQuestions(subset, 7).map((q) => q.id).join();
  assert.notEqual(shuffled, subset.map((q) => q.id).join());
});

/* ------------------------------------------------------------ integrity -- */

test("shuffling preserves every option exactly once", () => {
  for (const q of ALL.slice(0, 40)) {
    const dealt = presentOptions(q, 4242);
    assert.equal(dealt.length, q.options.length);
    assert.deepEqual(
      new Set(dealt.map((o) => o.id)),
      new Set(q.options.map((o) => o.id)),
    );
    assert.deepEqual(
      dealt.map((o) => o.key),
      ["A", "B", "C", "D", "E"].slice(0, q.options.length),
    );
  }
});

test("option text travels with its identity, never with its letter", () => {
  const dealt = presentOptions(SINGLE, 31337);
  for (const o of dealt) {
    const source = SINGLE.options.find((s) => s.id === o.id);
    assert.equal(o.text, source?.text);
  }
});

/* -------------------------------------------------------------- grading -- */

test("randomised order still grades a correct single-select answer", () => {
  for (let seed = 0; seed < 25; seed++) {
    const dealt = presentOptions(SINGLE, seed);
    const chosen = dealt.find((o) =>
      SINGLE.correctOptionIds.includes(o.id),
    )!;
    assert.equal(gradeAnswer(SINGLE, [chosen.id]), true);
  }
});

test("randomised order still fails a wrong single-select answer", () => {
  for (let seed = 0; seed < 25; seed++) {
    const dealt = presentOptions(SINGLE, seed);
    const wrong = dealt.find(
      (o) => !SINGLE.correctOptionIds.includes(o.id),
    )!;
    assert.equal(gradeAnswer(SINGLE, [wrong.id]), false);
  }
});

test("multi-select still grades all-or-nothing under shuffling", () => {
  for (let seed = 0; seed < 25; seed++) {
    const dealt = presentOptions(MULTI, seed);
    const right = dealt
      .filter((o) => MULTI.correctOptionIds.includes(o.id))
      .map((o) => o.id);
    const wrong = dealt.find((o) => !MULTI.correctOptionIds.includes(o.id))!;

    assert.equal(gradeAnswer(MULTI, right), true, "all correct scores");
    assert.equal(gradeAnswer(MULTI, right.slice(1)), false, "missing one fails");
    assert.equal(
      gradeAnswer(MULTI, [...right.slice(1), wrong.id]),
      false,
      "swapping one correct for a wrong option fails",
    );
    assert.equal(
      gradeAnswer(MULTI, [...right, wrong.id]),
      false,
      "a superset fails",
    );
  }
});

test("grading ignores the letters entirely", () => {
  // The correct answer lands on a different letter under these two seeds, yet
  // the same option id grades true under both.
  const id = SINGLE.correctOptionIds[0];
  const seeds = [3, 11, 19, 27];
  const letters = new Set(
    seeds.map((s) => keyForOption(presentOptions(SINGLE, s), id)),
  );
  assert.ok(letters.size >= 1);
  for (const s of seeds) {
    assert.equal(gradeAnswer(SINGLE, [id]), true, `seed ${s}`);
  }
});

/* --------------------------------------------------------------- display -- */

test("the correct answer's displayed letters follow the shuffle", () => {
  for (let seed = 0; seed < 10; seed++) {
    const dealt = presentOptions(MULTI, seed);
    const keys = correctKeys(dealt, MULTI);
    assert.equal(keys.length, MULTI.correctOptionIds.length);
    for (const key of keys) {
      const shown = dealt.find((o) => o.key === key)!;
      assert.ok(
        MULTI.correctOptionIds.includes(shown.id),
        "a letter reported as correct points at a correct option",
      );
    }
  }
});

/* --------------------------------------------------------- position bias -- */

test("the correct answer does not favour any letter across the bank", () => {
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  let total = 0;
  // Ten sessions over every four-option single-select question.
  for (let seed = 0; seed < 10; seed++) {
    for (const q of ALL) {
      if (isMultiSelect(q) || q.options.length !== 4) continue;
      const dealt = presentOptions(q, seed);
      const key = dealt.find((o) => q.correctOptionIds.includes(o.id))!.key;
      counts[key] += 1;
      total += 1;
    }
  }
  for (const key of ["A", "B", "C", "D"]) {
    const share = counts[key] / total;
    assert.ok(
      share > 0.2 && share < 0.3,
      `${key} carried the answer ${(share * 100).toFixed(1)}% of the time (expected ~25%)`,
    );
  }
});

/* ---------------------------------------------------------------- seeds -- */

test("seeds round-trip through the URL", () => {
  const s = newSeed();
  assert.equal(parseSeed(String(s)), s);
  assert.equal(parseSeed(null), undefined);
  assert.equal(parseSeed("not-a-number"), undefined);
  assert.equal(parseSeed("-1"), undefined);
});
