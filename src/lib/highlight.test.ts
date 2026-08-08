import assert from "node:assert/strict";
import { test } from "node:test";
import { CONCEPT_TERMS, CONCEPT_TERMS_BY_LENGTH } from "@/content/concepts";
import { getTrackQuestions } from "@/content/registry";
import { markConcepts } from "./highlight";

const join = (segments: { text: string }[]) => segments.map((s) => s.text).join("");
const marks = (text: string, limit?: number) =>
  markConcepts(text, limit).filter((s) => s.marked).map((s) => s.text);

/* ------------------------------------------------------------ integrity -- */

test("marking never changes the copy", () => {
  for (const q of getTrackQuestions("aigp-preparation")) {
    for (const text of [q.question, q.rationale, q.keyTakeaway]) {
      assert.equal(join(markConcepts(text)), text, `altered: ${q.id}`);
      assert.equal(join(markConcepts(text, 1)), text, `altered at limit 1: ${q.id}`);
      assert.equal(join(markConcepts(text, 0)), text, `altered at limit 0: ${q.id}`);
    }
  }
});

test("empty text yields no segments", () => {
  assert.deepEqual(markConcepts(""), []);
});

test("a limit of zero marks nothing but keeps the text", () => {
  const text = "Human oversight of a high-risk system under the EU AI Act.";
  const segments = markConcepts(text, 0);
  assert.equal(join(segments), text);
  assert.ok(segments.every((s) => !s.marked));
});

/* ----------------------------------------------------------- the rules -- */

test("a term marks once per block, however often it appears", () => {
  const text =
    "Human oversight matters. Without human oversight the control fails, so human oversight is required.";
  assert.deepEqual(marks(text), ["Human oversight"]);
});

test("marking is capped, and the overflow stays as plain text", () => {
  const text =
    "The provider ran an AI impact assessment, documented data lineage, applied " +
    "differential privacy, scheduled red teaming, and monitored for model drift " +
    "before release readiness.";
  assert.equal(marks(text, 2).length, 2);
  assert.equal(join(markConcepts(text, 2)), text);
  assert.ok(marks(text, 10).length > 2, "the cap, not the vocabulary, was the limit");
});

test("the longest matching term wins over its own fragments", () => {
  assert.deepEqual(
    marks("Run an AI impact assessment before deployment."),
    ["AI impact assessment"],
  );
  assert.deepEqual(marks("Run an impact assessment."), ["impact assessment"]);
});

test("a term is not matched inside another word", () => {
  // "provider" is a term of art; "providers'" and "videoprovider" are not it.
  assert.deepEqual(marks("The videoprovider declined."), []);
  assert.deepEqual(marks("The provider declined."), ["provider"]);
});

test("matching is case-insensitive but preserves the copy's own casing", () => {
  assert.deepEqual(marks("GDPR applies here."), ["GDPR"]);
  assert.deepEqual(marks("Transparency is required."), ["Transparency"]);
  assert.deepEqual(marks("We value transparency."), ["transparency"]);
});

test("segments are contiguous and in source order", () => {
  const text =
    "A deployer of a high-risk system must keep an audit trail and provide human oversight.";
  const segments = markConcepts(text);
  let cursor = 0;
  for (const segment of segments) {
    assert.equal(text.slice(cursor, cursor + segment.text.length), segment.text);
    cursor += segment.text.length;
  }
  assert.equal(cursor, text.length);
  assert.ok(segments.some((s) => s.marked), "expected at least one mark");
});

/* -------------------------------------------------------- the vocabulary -- */

test("the vocabulary holds no duplicates", () => {
  const seen = new Set(CONCEPT_TERMS.map((t) => t.toLowerCase()));
  assert.equal(seen.size, CONCEPT_TERMS.length, "a term is listed twice");
});

test("the vocabulary is ordered longest-first for matching", () => {
  for (let i = 1; i < CONCEPT_TERMS_BY_LENGTH.length; i++) {
    assert.ok(
      CONCEPT_TERMS_BY_LENGTH[i - 1].length >= CONCEPT_TERMS_BY_LENGTH[i].length,
      `out of order at ${i}: ${CONCEPT_TERMS_BY_LENGTH[i - 1]}`,
    );
  }
});

test("no question is striped end to end", () => {
  // The guard that matters editorially: a marked block must stay mostly plain.
  for (const q of getTrackQuestions("aigp-preparation")) {
    for (const text of [q.question, q.rationale, q.keyTakeaway]) {
      const markedChars = markConcepts(text)
        .filter((s) => s.marked)
        .reduce((n, s) => n + s.text.length, 0);
      assert.ok(
        markedChars / text.length < 0.35,
        `${q.id}: ${Math.round((markedChars / text.length) * 100)}% of the block is marked`,
      );
    }
  }
});
