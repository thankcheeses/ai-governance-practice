/*
  The last content pass: length tells, two accuracy defects, one weak item.

  Length. Across 255 single-select items the correct option was the longest in
  35%, against 25% by chance. That headline overstates the problem — the median
  margin is four characters, which nobody can exploit. The exploitable tell sits
  in about a dozen items where the correct option runs fourteen to thirty-four
  characters longer than every distractor, and four of those were introduced by
  this project's own recent rewrites.

  The fix lengthens a distractor rather than truncating the key, except where
  the key was genuinely padded. Truncating a correct answer risks losing the
  precision that made it correct; giving a distractor more substance removes the
  tell and makes the option more plausible at the same time.

  Accuracy. aigp-004's rationale asserted one route into the high-risk tier as
  though it were the only one. aigp-026 asked for the definition of "model
  drift" and treated concept drift as a synonym for it — the two imply different
  remedies, which is the thing actually worth knowing, and it was also the
  weakest of three drift items.

  Run:  node scripts/apply-final-fixes.mjs <fixes.json> [--write]
*/

import { readFileSync, writeFileSync } from "node:fs";

const QUESTIONS = "src/content/tracks/aigp-preparation/questions.json";
const ENRICHMENT = "src/content/tracks/aigp-preparation/enrichment.ts";
const [path] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const write = process.argv.includes("--write");
const LETTERS = ["A", "B", "C", "D", "E"];

const fixes = JSON.parse(readFileSync(path, "utf8"));
const questions = JSON.parse(readFileSync(QUESTIONS, "utf8"));
let enrichment = readFileSync(ENRICHMENT, "utf8");
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const strip = (s) => s.replace(/^\s*[A-E][.)]\s*/, "").trim();
const keysOf = (q) => String(q.correct).split(",").map((s) => s.trim());
const problems = [];

/* -- distractor lengthening / targeted edits ---------------------------- */
for (const [rawId, edits] of Object.entries(fixes.optionEdits ?? {})) {
  const q = questions.find((x) => x.id === Number(rawId));
  if (!q) { problems.push(`aigp-${rawId}: missing`); continue; }
  const correct = new Set(keysOf(q));

  for (const [target, text] of Object.entries(edits)) {
    let letter = target;
    if (target === "__longest") {
      // The longest wrong option, resolved at apply time.
      let best = -1, bestLen = -1;
      q.options.forEach((o, i) => {
        if (correct.has(LETTERS[i])) return;
        if (strip(o).length > bestLen) { bestLen = strip(o).length; best = i; }
      });
      letter = LETTERS[best];
    }
    if (correct.has(letter)) {
      problems.push(`aigp-${rawId}: refusing to edit correct option ${letter}`);
      continue;
    }
    q.options[LETTERS.indexOf(letter)] = `${letter}. ${text}`;
  }
}

/* -- trimming a genuinely padded key ------------------------------------ */
for (const [rawId, text] of Object.entries(fixes.correctEdits ?? {})) {
  const q = questions.find((x) => x.id === Number(rawId));
  if (!q) { problems.push(`aigp-${rawId}: missing`); continue; }
  const k = keysOf(q);
  if (k.length !== 1) { problems.push(`aigp-${rawId}: not single-select`); continue; }
  q.options[LETTERS.indexOf(k[0])] = `${k[0]}. ${text}`;
}

/* -- rationale precision ------------------------------------------------ */
for (const [rawId, text] of Object.entries(fixes.rationaleEdits ?? {})) {
  const q = questions.find((x) => x.id === Number(rawId));
  if (!q) { problems.push(`aigp-${rawId}: missing`); continue; }
  q.rationale = text;
}

/* -- full rewrites ------------------------------------------------------ */
for (const [rawId, r] of Object.entries(fixes.rewrites ?? {})) {
  const id = Number(rawId);
  const q = questions.find((x) => x.id === id);
  if (!q) { problems.push(`aigp-${id}: missing`); continue; }
  Object.assign(q, {
    domain: r.domain, question: r.question, options: r.options,
    correct: r.correct, rationale: r.rationale, tags: r.tags,
  });

  const m = new RegExp(`\\n  ${id}: \\{`).exec(enrichment);
  if (!m) { problems.push(`aigp-${id}: enrichment entry missing`); continue; }
  const start = m.index;
  const next = /\n  \d+: \{/g;
  next.lastIndex = start + 1;
  const nm = next.exec(enrichment);
  const end = nm ? nm.index : enrichment.lastIndexOf("\n};");

  const L = [`\n  ${id}: {`, `    bokSubdomain: "${r.bokSubdomain}",`,
    `    difficulty: "${r.difficulty}",`, `    keyTakeaway:`,
    `      "${esc(r.keyTakeaway)}",`,
    `    frameworkTags: [${r.frameworkTags.map((t) => `"${esc(t)}"`).join(", ")}],`,
    `    distractorNotes: {`];
  for (const l of LETTERS.filter((l) => l in r.distractorNotes)) {
    L.push(`      ${l}:`, `        "${esc(r.distractorNotes[l])}",`);
  }
  L.push(`    },`, `    sources: [`);
  for (const s of r.sources) L.push(`      "${esc(s)}",`);
  L.push(`    ],`, `  },`);
  enrichment = enrichment.slice(0, start) + L.join("\n") + enrichment.slice(end);
}

/* -- verify -------------------------------------------------------------- */
let stillLongest = 0;
const single = questions.filter((q) => keysOf(q).length === 1);
for (const q of single) {
  const ci = LETTERS.indexOf(keysOf(q)[0]);
  const c = strip(q.options[ci]).length;
  const w = q.options.filter((_, i) => i !== ci).map((o) => strip(o).length);
  if (w.every((n) => c > n)) stillLongest++;

  q.options.forEach((o, i) => {
    if (!o.startsWith(`${LETTERS[i]}. `)) problems.push(`aigp-${q.id}: prefix mismatch`);
  });
  if (new Set(q.options.map(strip)).size !== q.options.length) {
    problems.push(`aigp-${q.id}: duplicate option text`);
  }
}
if (questions.length !== 296) problems.push(`bank size changed: ${questions.length}`);

console.log(`correct-is-longest: ${stillLongest}/${single.length} = ${(stillLongest / single.length * 100).toFixed(1)}% (was 35.3%, chance 25%)`);
if (problems.length) {
  console.error("\nREFUSING TO WRITE:");
  problems.forEach((p) => console.error("  " + p));
  process.exit(1);
}
console.log("bank still 296; prefixes and option uniqueness intact.");

if (write) {
  writeFileSync(QUESTIONS, JSON.stringify(questions, null, 2) + "\n");
  writeFileSync(ENRICHMENT, enrichment);
  console.log("written.");
} else console.log("dry run — pass --write to apply.");
