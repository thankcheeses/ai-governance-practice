/*
  Replace questions and their enrichment wholesale.

  Twelve items are rewritten here. Each was rewritten because it had a defect,
  not because a percentage needed moving:

    - aigp-007, aigp-010, aigp-289 were conceptual duplicates of aigp-064,
      aigp-071 and aigp-149. Each now tests a materially different judgement.
    - aigp-019, aigp-021, aigp-046, aigp-050 were four of six items asking
      variations of "why disclose that the agent is not human". They now test
      timing, subcontractor flow-down, the business associate relationship and
      secondary use of de-identified data.
    - aigp-032, aigp-034, aigp-036, aigp-040, aigp-063 asked a candidate to
      name a concept — a pillar, a NIST programme, a failure mode, a framework.
      This project's claim is that it exercises judgement, and a definition
      question does not. Each now poses a decision.

  Because each rewrite also carries a new bokSubdomain, the effect is to move
  coverage towards the blueprint without inflating the bank: the item count is
  unchanged at 296, which matters because that number appears in the README,
  the hero image and the landing page.

  Every replacement supplies the full set — stem, options, key, rationale,
  takeaway, notes, sources, domain, sub-domain, difficulty, tags — so no item
  can end up half-migrated.

  Run:  node scripts/apply-rewrites.mjs <rewrites.json> [--write]
*/

import { readFileSync, writeFileSync } from "node:fs";

const QUESTIONS = "src/content/tracks/aigp-preparation/questions.json";
const ENRICHMENT = "src/content/tracks/aigp-preparation/enrichment.ts";
const [path] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const write = process.argv.includes("--write");
const LETTERS = ["A", "B", "C", "D", "E"];

const rewrites = JSON.parse(readFileSync(path, "utf8"));
const questions = JSON.parse(readFileSync(QUESTIONS, "utf8"));
let enrichment = readFileSync(ENRICHMENT, "utf8");

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const problems = [];
let done = 0;

for (const [rawId, r] of Object.entries(rewrites)) {
  const id = Number(rawId);
  const q = questions.find((x) => x.id === id);
  if (!q) {
    problems.push(`aigp-${id}: no such question`);
    continue;
  }

  // ---- question file
  q.domain = r.domain;
  q.question = r.question;
  q.options = r.options;
  q.correct = r.correct;
  q.rationale = r.rationale;
  q.tags = r.tags;

  // ---- enrichment entry, rebuilt entirely
  const entry = new RegExp(`\\n  ${id}: \\{`);
  const m = entry.exec(enrichment);
  if (!m) {
    problems.push(`aigp-${id}: enrichment entry not found`);
    continue;
  }
  const start = m.index;
  const next = /\n  \d+: \{/g;
  next.lastIndex = start + 1;
  const nm = next.exec(enrichment);
  const end = nm ? nm.index : enrichment.lastIndexOf("\n};");

  const lines = [`\n  ${id}: {`];
  lines.push(`    bokSubdomain: "${r.bokSubdomain}",`);
  lines.push(`    difficulty: "${r.difficulty}",`);
  lines.push(`    keyTakeaway:`);
  lines.push(`      "${esc(r.keyTakeaway)}",`);
  lines.push(`    frameworkTags: [${r.frameworkTags.map((t) => `"${esc(t)}"`).join(", ")}],`);
  lines.push(`    distractorNotes: {`);
  for (const l of LETTERS.filter((l) => l in r.distractorNotes)) {
    lines.push(`      ${l}:`);
    lines.push(`        "${esc(r.distractorNotes[l])}",`);
  }
  lines.push(`    },`);
  lines.push(`    sources: [`);
  for (const s of r.sources) lines.push(`      "${esc(s)}",`);
  lines.push(`    ],`);
  lines.push(`  },`);

  enrichment = enrichment.slice(0, start) + lines.join("\n") + enrichment.slice(end);
  done++;
}

/* -- integrity -------------------------------------------------------- */
for (const q of questions) {
  const keys = String(q.correct).split(",").map((s) => s.trim());
  for (const k of keys) {
    const i = LETTERS.indexOf(k);
    if (i < 0 || i >= q.options.length) problems.push(`aigp-${q.id}: key ${k} out of range`);
  }
  q.options.forEach((o, i) => {
    if (!o.startsWith(`${LETTERS[i]}. `)) problems.push(`aigp-${q.id}: prefix/position mismatch`);
  });
  if (new Set(q.options.map((o) => o.replace(/^[A-E]\. /, ""))).size !== q.options.length) {
    problems.push(`aigp-${q.id}: duplicate option text`);
  }
}
if (questions.length !== 296) problems.push(`bank size changed: ${questions.length}`);

console.log(`rewritten: ${done}`);
if (problems.length) {
  console.error("\nREFUSING TO WRITE:");
  problems.forEach((p) => console.error("  " + p));
  process.exit(1);
}
console.log("bank still 296; keys, prefixes and option uniqueness intact.");

if (write) {
  writeFileSync(QUESTIONS, JSON.stringify(questions, null, 2) + "\n");
  writeFileSync(ENRICHMENT, enrichment);
  console.log("written.");
} else {
  console.log("dry run — pass --write to apply.");
}
