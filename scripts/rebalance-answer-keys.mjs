/*
  One-off: even out where the correct answer sits in the source file.

  Why this matters even though the app shuffles. `presentOptions` deals fresh
  letters every session and correctness is stored against option identity, so a
  learner never sees the stored order. But the repository is public and the
  bank is meant to be inspected: anyone opening questions.json sees the keys as
  authored, and in aigp-109..296 that was B 69%, C 3%, D 0% — no D answer in a
  hundred and fifty consecutive questions. That reads as carelessness whatever
  the runtime does, and it is the kind of thing a reviewer finds first.

  The transformation is a single swap per question: the correct option trades
  places with whichever option currently occupies the target position. A swap
  rather than a shuffle because it touches exactly two letters, which keeps the
  distractor-note remapping to a two-key exchange and makes the whole change
  auditable by eye.

  Distractor notes live in enrichment.ts keyed by source letter, so they are
  remapped in the same pass. Notes and options must not drift apart: a note
  explaining why "the vendor's user interface" is wrong, attached after a swap
  to an option about data quality, would be worse than no note at all.

  Multi-select items are left alone. They are excluded from position statistics
  anyway, and permuting a set of keys buys nothing.

  Run:  node scripts/rebalance-answer-keys.mjs [--write]
  Without --write it reports what it would do and changes nothing.
*/

import { readFileSync, writeFileSync } from "node:fs";

const QUESTIONS = "src/content/tracks/aigp-preparation/questions.json";
const ENRICHMENT = "src/content/tracks/aigp-preparation/enrichment.ts";
const LETTERS = ["A", "B", "C", "D", "E"];
const write = process.argv.includes("--write");

/** Only this range is skewed; aigp-001..108 is already even and is left alone. */
const FROM = 109;
const TO = 296;

const strip = (s) => s.replace(/^\s*[A-E][.)]\s*/, "").trim();
const keysOf = (q) => String(q.correct).split(",").map((s) => s.trim()).filter(Boolean);

const questions = JSON.parse(readFileSync(QUESTIONS, "utf8"));

/* ---- record the "before" picture, for verification after the fact ------- */
const before = new Map();
for (const q of questions) {
  before.set(q.id, {
    texts: q.options.map(strip).slice().sort(),
    correct: keysOf(q).map((k) => strip(q.options[LETTERS.indexOf(k)])).sort(),
  });
}

/* ---- decide a target position for each item ----------------------------- */
const targets = questions.filter(
  (q) => q.id >= FROM && q.id <= TO && keysOf(q).length === 1,
);

// Round-robin across the positions each question actually has, so a 4-option
// item never gets assigned E.
const cursor = {};
const swaps = new Map();
for (const q of targets) {
  const n = q.options.length;
  cursor[n] = (cursor[n] ?? -1) + 1;
  const ti = cursor[n] % n;
  const ci = LETTERS.indexOf(keysOf(q)[0]);
  if (ci !== ti) swaps.set(q.id, [ci, ti]);
}

/* ---- apply to questions.json ------------------------------------------- */
for (const q of questions) {
  const swap = swaps.get(q.id);
  if (!swap) continue;
  const [ci, ti] = swap;
  const texts = q.options.map(strip);
  [texts[ci], texts[ti]] = [texts[ti], texts[ci]];
  q.options = texts.map((t, i) => `${LETTERS[i]}. ${t}`);
  q.correct = LETTERS[ti];
}

/* ---- apply the same swap to enrichment.ts distractor notes -------------- */
let enrichment = readFileSync(ENRICHMENT, "utf8");
let notesRemapped = 0;

for (const [id, [ci, ti]] of swaps) {
  const a = LETTERS[ci];
  const b = LETTERS[ti];

  // Locate this question's entry, then its distractorNotes block.
  const entry = new RegExp(`\\n  ${id}: \\{`);
  const m = entry.exec(enrichment);
  if (!m) continue;
  const start = m.index;
  const nextEntry = /\n  \d+: \{/g;
  nextEntry.lastIndex = start + 1;
  const nm = nextEntry.exec(enrichment);
  const end = nm ? nm.index : enrichment.length;

  const block = enrichment.slice(start, end);
  const dn = /(distractorNotes: \{)([\s\S]*?)(\n    \},)/.exec(block);
  if (!dn) continue;

  // Swap the two letter keys. Only keys at note indentation are touched, so
  // letters appearing inside note prose are unaffected.
  const remapped = dn[2].replace(
    /(\n      )([A-E])(:)/g,
    (_, ws, letter, colon) => {
      const to = letter === a ? b : letter === b ? a : letter;
      return `${ws}${to}${colon}`;
    },
  );
  if (remapped !== dn[2]) notesRemapped++;

  const newBlock = block.slice(0, dn.index) + dn[1] + remapped + dn[3] +
    block.slice(dn.index + dn[0].length);
  enrichment = enrichment.slice(0, start) + newBlock + enrichment.slice(end);
}

/* ---- verify nothing but position changed ------------------------------- */
const problems = [];
for (const q of questions) {
  const b = before.get(q.id);
  const texts = q.options.map(strip).slice().sort();
  if (JSON.stringify(texts) !== JSON.stringify(b.texts)) {
    problems.push(`aigp-${q.id}: option text set changed`);
  }
  const correct = keysOf(q)
    .map((k) => strip(q.options[LETTERS.indexOf(k)]))
    .sort();
  if (JSON.stringify(correct) !== JSON.stringify(b.correct)) {
    problems.push(`aigp-${q.id}: correct answer TEXT changed — ${b.correct} -> ${correct}`);
  }
  // Prefixes must agree with position.
  q.options.forEach((o, i) => {
    if (!o.startsWith(`${LETTERS[i]}. `)) problems.push(`aigp-${q.id}: bad prefix at ${i}`);
  });
}

const dist = {};
for (const q of questions) {
  if (keysOf(q).length !== 1) continue;
  dist[keysOf(q)[0]] = (dist[keysOf(q)[0]] ?? 0) + 1;
}
const total = Object.values(dist).reduce((a, b) => a + b, 0);

console.log(`swapped: ${swaps.size} questions`);
console.log(`distractor-note blocks remapped: ${notesRemapped}`);
console.log("new single-select position distribution:");
for (const k of Object.keys(dist).sort()) {
  console.log(`  ${k}: ${dist[k]} (${((dist[k] / total) * 100).toFixed(1)}%)`);
}

if (problems.length) {
  console.error("\nREFUSING TO WRITE — content changed:");
  problems.slice(0, 20).forEach((p) => console.error("  " + p));
  process.exit(1);
}

if (write) {
  writeFileSync(QUESTIONS, JSON.stringify(questions, null, 2) + "\n");
  writeFileSync(ENRICHMENT, enrichment);
  console.log("\nwritten.");
} else {
  console.log("\ndry run — pass --write to apply.");
}
