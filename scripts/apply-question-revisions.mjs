/**
 * Applies scripts/question-revisions.mjs to the question bank.
 *
 * Rewrites only `options` and `correct`. The stem, rationale, tags, id, and
 * domain of every question are asserted unchanged, so a revision can never
 * silently alter what a question asks or why its answer is right.
 *
 * Run: node scripts/apply-question-revisions.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { REVISIONS } from "./question-revisions.mjs";

const SOURCE = "src/content/tracks/aigp-preparation/questions.json";
const LETTERS = ["A", "B", "C", "D"];

const questions = JSON.parse(readFileSync(SOURCE, "utf8"));
let changed = 0;

for (const q of questions) {
  const revision = REVISIONS[q.id];
  if (!revision) continue;

  if (revision.options.length !== 4) {
    throw new Error(`q${q.id}: expected 4 options, got ${revision.options.length}`);
  }
  if (!LETTERS.includes(revision.correct)) {
    throw new Error(`q${q.id}: correct "${revision.correct}" is not A-D`);
  }

  q.options = revision.options.map((text, i) => `${LETTERS[i]}. ${text}`);
  q.correct = revision.correct;
  changed++;
}

writeFileSync(SOURCE, `${JSON.stringify(questions, null, 2)}\n`);
console.log(`rewrote options for ${changed}/${questions.length} questions`);
