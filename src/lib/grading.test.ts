import assert from "node:assert/strict";
import { test } from "node:test";
import type { Question } from "@/content/types";
const oid = (letter: string) =>
  `test-001-o${["A", "B", "C", "D", "E"].indexOf(letter) + 1}`;

import {
  canSubmit,
  formatAnswer,
  gradeAnswer,
  isMultiSelect,
  requiredSelections,
  toggleSelection,
} from "./grading";

/** Minimal question fixture — only the fields grading actually reads. */
function q(correctLetters: string[], optionCount = 4): Question {
  const keys = ["A", "B", "C", "D", "E"];
  const oid = (letter: string) => `test-001-o${keys.indexOf(letter) + 1}`;
  return {
    id: "test-001",
    trackId: "aigp-preparation",
    domain: "Foundations of AI Governance",
    difficulty: "applied",
    question: "Fixture",
    options: keys.slice(0, optionCount).map((letter, i) => ({
      id: `test-001-o${i + 1}`,
      text: letter,
    })),
    correctOptionIds: correctLetters.map(oid),
    rationale: "",
    keyTakeaway: "",
    frameworkTags: [],
    bokSubdomain: "I.A",
    tags: [],
    createdDate: "",
    updatedDate: "",
  };
}

/* ---------------------------------------------------------------- shape -- */

test("arity is derived from the answer set, not a flag", () => {
  assert.equal(isMultiSelect(q(["B"])), false);
  assert.equal(isMultiSelect(q(["A", "C", "D"], 5)), true);
  assert.equal(requiredSelections(q(["A", "C", "D"], 5)), 3);
  assert.equal(requiredSelections(q(["B"])), 1);
});

/* ------------------------------------------------- single-select grading -- */

test("single-select: the correct option scores", () => {
  assert.equal(gradeAnswer(q(["B"]), ["B"].map(oid)), true);
});

test("single-select: a wrong option does not score", () => {
  assert.equal(gradeAnswer(q(["B"]), ["C"].map(oid)), false);
});

test("single-select: an empty answer does not score", () => {
  assert.equal(gradeAnswer(q(["B"]), [].map(oid)), false);
});

test("single-select: the right option plus another does not score", () => {
  // Guards the regression where multi-select support loosens single-select.
  assert.equal(gradeAnswer(q(["B"]), ["B", "C"].map(oid)), false);
});

/* -------------------------------------------------- multi-select grading -- */

test("multi-select: all correct selections score", () => {
  assert.equal(gradeAnswer(q(["A", "C", "D"], 5), ["A", "C", "D"].map(oid)), true);
});

test("multi-select: order of selection is irrelevant", () => {
  assert.equal(gradeAnswer(q(["A", "C", "D"], 5), ["D", "A", "C"].map(oid)), true);
});

test("multi-select: missing one correct selection fails — no partial credit", () => {
  assert.equal(gradeAnswer(q(["A", "C", "D"], 5), ["A", "C"].map(oid)), false);
});

test("multi-select: an incorrect option among correct ones fails", () => {
  assert.equal(gradeAnswer(q(["A", "C", "D"], 5), ["A", "C", "B"].map(oid)), false);
});

test("multi-select: every correct option plus one extra fails", () => {
  assert.equal(gradeAnswer(q(["A", "C", "D"], 5), ["A", "C", "D", "E"].map(oid)), false);
});

test("multi-select: a wholly wrong set of the right size fails", () => {
  assert.equal(gradeAnswer(q(["A", "C", "D"], 5), ["B", "E", "A"].map(oid)), false);
});

test("multi-select: duplicates are a UI event, not an extra selection", () => {
  assert.equal(
    gradeAnswer(q(["A", "C", "D"], 5), ["A", "C", "D", "C"].map(oid)),
    true,
  );
});

/* -------------------------------------------------------------- toggling -- */

test("single-select toggling replaces rather than accumulates", () => {
  const s = q(["B"]);
  assert.deepEqual(toggleSelection(s, [].map(oid), oid("A")), ["A"].map(oid));
  assert.deepEqual(toggleSelection(s, ["A"].map(oid), oid("C")), ["C"].map(oid));
});

test("single-select toggling the chosen option clears it", () => {
  assert.deepEqual(toggleSelection(q(["B"]), ["A"], "A"), [].map(oid));
});

test("multi-select toggling adds and removes", () => {
  const m = q(["A", "C", "D"], 5);
  assert.deepEqual(toggleSelection(m, ["A"].map(oid), oid("C")), ["A", "C"].map(oid));
  assert.deepEqual(toggleSelection(m, ["A", "C"].map(oid), oid("A")), ["C"].map(oid));
});

/* ------------------------------------------------------------ submission -- */

test("single-select submits on exactly one choice", () => {
  const s = q(["B"]);
  assert.equal(canSubmit(s, []), false);
  assert.equal(canSubmit(s, ["A"]), true);
});

test("multi-select submits only on the stated number of choices", () => {
  const m = q(["A", "C", "D"], 5);
  assert.equal(canSubmit(m, ["A"]), false);
  assert.equal(canSubmit(m, ["A", "C"]), false);
  assert.equal(canSubmit(m, ["A", "C", "D"]), true);
  assert.equal(canSubmit(m, ["A", "C", "D", "E"]), false);
});

/* -------------------------------------------------------------- display -- */

test("answers display in canonical order regardless of selection order", () => {
  assert.equal(formatAnswer(["D", "A", "C"]), "A, C, D");
  assert.equal(formatAnswer(["B"]), "B");
});
