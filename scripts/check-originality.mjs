#!/usr/bin/env node
/**
 * Internal originality and near-duplication check.
 *
 * What this does: compares every question in the bank against every other one
 * and flags pairs that look like the same item twice — the same stem lightly
 * reworded, the same scenario with the nouns swapped, or the same answer set
 * reused under a different question.
 *
 * What this does NOT do, and cannot: verify that the bank does not resemble a
 * real certification exam. Those items are not public. No tool can check
 * against a corpus nobody outside the certifying body holds, and any claim to
 * have done so would be false. This checks the bank against *itself*.
 *
 * It reports and exits non-zero on findings. It never edits content — a flagged
 * pair may be a genuine duplicate, or two items that legitimately test the same
 * competency from different angles, and only a human reading both can tell.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const track = join(root, "src/content/tracks/aigp-preparation");
const questions = JSON.parse(readFileSync(join(track, "questions.json"), "utf8"));
const scenarios = JSON.parse(readFileSync(join(track, "scenarios.json"), "utf8"));

/* Thresholds. Tuned so that legitimately related items pass and reworded
   duplicates do not; raise them only with a reason. */
const STEM_JACCARD = 0.5;
const OPTION_JACCARD = 0.55;
const SHARED_RUN_WORDS = 12;
const SCENARIO_JACCARD = 0.45;

const STOP = new Set(
  "a an the of to and or in for on with is are be as that this by from at it its their they which what should would could most least best first before after when who how why are do does not no you your our we us if then than there here".split(
    " ",
  ),
);

const norm = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const content = (s) => norm(s).split(" ").filter((w) => w && !STOP.has(w));

function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const x of A) if (B.has(x)) shared++;
  return shared / (A.size + B.size - shared);
}

function runs(s, n) {
  const w = norm(s).split(" ").filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
}

function longestSharedRun(a, b) {
  for (let n = 30; n >= SHARED_RUN_WORDS; n--) {
    const A = runs(a, n);
    if (!A.size) continue;
    const B = runs(b, n);
    for (const r of A) if (B.has(r)) return { n, text: r };
  }
  return null;
}

const findings = [];
const id = (q) => `aigp-${String(q.id).padStart(3, "0")}`;

/* ---------------------------------------------- question-vs-question ---- */

for (let i = 0; i < questions.length; i++) {
  for (let j = i + 1; j < questions.length; j++) {
    const a = questions[i];
    const b = questions[j];

    // Two questions on the same scenario are supposed to share vocabulary;
    // they are compared on their stems only, at a higher bar.
    const sameFamily =
      a.scenarioId && b.scenarioId && a.scenarioId === b.scenarioId;

    const stem = jaccard(content(a.question), content(b.question));
    if (stem >= (sameFamily ? 0.75 : STEM_JACCARD)) {
      findings.push({
        kind: sameFamily ? "near-duplicate stem within a family" : "near-duplicate stem",
        a: id(a),
        b: id(b),
        detail: `stem overlap ${(stem * 100).toFixed(0)}%`,
      });
    }

    const optA = a.options.map((o) => norm(o).replace(/^[a-e]\s/, ""));
    const optB = b.options.map((o) => norm(o).replace(/^[a-e]\s/, ""));
    const opts = jaccard(optA.flatMap(content), optB.flatMap(content));
    if (opts >= OPTION_JACCARD && !sameFamily) {
      findings.push({
        kind: "reused answer set",
        a: id(a),
        b: id(b),
        detail: `option overlap ${(opts * 100).toFixed(0)}%`,
      });
    }

    // Identical option text across two questions is always worth a look.
    for (const oa of optA) {
      if (oa.split(" ").length < 6) continue;
      if (optB.includes(oa)) {
        findings.push({
          kind: "identical option text",
          a: id(a),
          b: id(b),
          detail: `"${oa.slice(0, 60)}..."`,
        });
        break;
      }
    }

    if (!sameFamily) {
      const run = longestSharedRun(a.question, b.question);
      if (run) {
        findings.push({
          kind: "shared verbatim run",
          a: id(a),
          b: id(b),
          detail: `${run.n} words: "${run.text.slice(0, 70)}"`,
        });
      }
    }
  }
}

/* -------------------------------------------- scenario-vs-scenario ------ */

for (let i = 0; i < scenarios.length; i++) {
  for (let j = i + 1; j < scenarios.length; j++) {
    const a = scenarios[i];
    const b = scenarios[j];
    const overlap = jaccard(
      content(a.body.join(" ")),
      content(b.body.join(" ")),
    );
    if (overlap >= SCENARIO_JACCARD) {
      findings.push({
        kind: "near-duplicate scenario",
        a: a.id,
        b: b.id,
        detail: `body overlap ${(overlap * 100).toFixed(0)}% — check whether the governance problem differs or only the industry nouns`,
      });
    }
  }
}

/* ------------------------------------------------------- reporting ------ */

console.log("Internal originality check");
console.log(`  ${questions.length} questions, ${scenarios.length} scenarios`);
console.log(
  `  thresholds: stem ${STEM_JACCARD}, options ${OPTION_JACCARD}, run ${SHARED_RUN_WORDS} words, scenario ${SCENARIO_JACCARD}`,
);
console.log();

if (!findings.length) {
  console.log("  No near-duplicate pairs found.");
} else {
  console.log(`  ${findings.length} pair(s) flagged for human review:\n`);
  for (const f of findings) {
    console.log(`  [${f.kind}] ${f.a} <-> ${f.b}`);
    console.log(`      ${f.detail}`);
  }
  console.log(
    "\n  These are flags, not verdicts. Two items may legitimately test one",
  );
  console.log(
    "  competency from different angles. Read both before changing either.",
  );
}

console.log(
  "\n  Scope: this compares the bank against itself. It cannot and does not",
);
console.log(
  "  check against any real certification exam — those items are not public.",
);

process.exit(findings.length ? 1 : 0);
