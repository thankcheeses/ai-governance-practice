import assert from "node:assert/strict";
import { test } from "node:test";
import { getTrackQuestions } from "@/content/registry";

/**
 * Guards the reasoning labels applied in Increment 2.
 *
 * The labels are authored by source letter and converted to option ids when the
 * track loads, so the per-session shuffle cannot misattribute them. That
 * conversion is silent on failure: a label on a letter the question does not
 * have simply disappears, and a label on the correct option would teach the
 * engine that the right answer is a reasoning error. Neither is visible to the
 * type checker, because both are well-typed — they are content mistakes.
 *
 * These assertions run against the real bank, not a fixture, because the thing
 * being protected is the content.
 */

const ALL = getTrackQuestions("aigp-preparation");
const LABELLED = ALL.filter((q) => q.reasoning);

const DIMENSIONS = new Set([
  "material_facts",
  "lifecycle_stage",
  "governing_obligation",
  "accountability",
  "legal_vs_ethical",
  "risk_prioritization",
  "sequencing",
  "proportionality",
]);

const DISTRACTOR_TYPES = new Set([
  "missed_material_fact",
  "wrong_governing_obligation",
  "wrong_accountable_party",
  "premature_remediation",
  "risk_underestimation",
  "risk_overreaction",
  "lifecycle_confusion",
  "legal_ethical_conflation",
  "technically_correct_but_premature",
  "plausible_but_incomplete",
  "secondary_risk_prioritized",
]);

test("the calibration tranche is applied and no wider", () => {
  assert.equal(ALL.length, 296, "bank size changed");
  assert.equal(
    LABELLED.length,
    52,
    "the reviewed tranche is 52 questions — widening it needs its own review",
  );
});

test("unlabelled questions carry no reasoning metadata at all", () => {
  // `reasoning` is optional precisely so the other 244 keep working untouched.
  const bare = ALL.filter((q) => !q.reasoning);
  assert.equal(bare.length, 244);
  for (const q of bare) {
    assert.equal(q.reasoning, undefined, `${q.id} has a partial reasoning block`);
  }
});

test("every distractor label resolves to an option the question actually has", () => {
  for (const q of LABELLED) {
    const ids = new Set(q.options.map((o) => o.id));
    for (const optionId of Object.keys(q.reasoning?.distractorTypes ?? {})) {
      assert.ok(
        ids.has(optionId),
        `${q.id}: label on "${optionId}", which is not one of its options — ` +
          `a letter was used that this question does not have`,
      );
    }
  }
});

test("no distractor label sits on a correct option", () => {
  for (const q of LABELLED) {
    const correct = new Set(q.correctOptionIds);
    for (const optionId of Object.keys(q.reasoning?.distractorTypes ?? {})) {
      assert.ok(
        !correct.has(optionId),
        `${q.id}: "${optionId}" is a correct answer and must not carry a ` +
          `distractor type — selecting it is not a reasoning error`,
      );
    }
  }
});

test("every labelled question has at least one distractor label", () => {
  // A dimension with no per-option labels tells the engine what the item tests
  // but nothing about what a miss means, which is the half that is useful.
  for (const q of LABELLED) {
    const n = Object.keys(q.reasoning?.distractorTypes ?? {}).length;
    assert.ok(n > 0, `${q.id}: primary dimension but no distractor labels`);
  }
});

test("dimension and distractor values stay inside the taxonomy", () => {
  for (const q of LABELLED) {
    const r = q.reasoning!;
    assert.ok(
      DIMENSIONS.has(r.primaryDimension),
      `${q.id}: unknown primary dimension "${r.primaryDimension}"`,
    );
    for (const s of r.secondaryDimensions ?? []) {
      assert.ok(DIMENSIONS.has(s), `${q.id}: unknown secondary dimension "${s}"`);
      assert.notEqual(
        s,
        r.primaryDimension,
        `${q.id}: secondary dimension repeats the primary`,
      );
    }
    for (const [optionId, value] of Object.entries(r.distractorTypes ?? {})) {
      assert.ok(
        DISTRACTOR_TYPES.has(value as string),
        `${q.id}: unknown distractor type "${value}" on ${optionId}`,
      );
    }
  }
});

test("the tranche stays evenly spread across the eight dimensions", () => {
  // An uneven tranche would make the first pattern-detection experiments
  // measure the tranche rather than the learner.
  const counts = new Map<string, number>();
  for (const q of LABELLED) {
    const d = q.reasoning!.primaryDimension;
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  assert.equal(counts.size, 8, "all eight dimensions should be represented");
  for (const [dimension, n] of counts) {
    assert.ok(
      n >= 6 && n <= 7,
      `${dimension} has ${n} questions — the tranche was built 6–7 per dimension`,
    );
  }
});
