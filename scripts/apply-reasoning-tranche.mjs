/**
 * Apply the Increment 2 calibration tranche to enrichment.ts.
 *
 * The labels are authored in prose, in docs/increment-2-calibration-tranche.md,
 * because that is the form they were reviewed in — a table a person argued with,
 * not a data file. This script is the single path from that document to
 * `reasoning` blocks on the enrichment entries, so the document stays the source
 * of truth and the code stays derivable from it.
 *
 * It is not a migration to be run twice. It refuses when any reasoning block is
 * already present, because re-running it after a hand-correction would silently
 * discard the correction.
 *
 *   node scripts/apply-reasoning-tranche.mjs [--dry-run]
 *
 * Predecessor note: the original tranche of 51 labels was prepared in a working
 * copy that never reached git. `primaryDimension` occurs zero times in
 * enrichment.ts at every commit before this one, so those labels were not
 * recovered — the 52 here are a fresh pass over the source questions.
 */
import { readFileSync, writeFileSync } from "node:fs";

const DOC = "docs/increment-2-calibration-tranche.md";
const FILE = "src/content/tracks/aigp-preparation/enrichment.ts";
const dryRun = process.argv.includes("--dry-run");

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

/* ------------------------------------------------------------------ parse -- */

const lines = readFileSync(DOC, "utf8").split("\n");
const from = lines.findIndex((l) => l.startsWith("## The tranche"));
const to = lines.findIndex((l, i) => i > from && /^## /.test(l));
if (from < 0 || to < 0) {
  console.error(`${DOC}: could not locate the tranche section`);
  process.exit(1);
}

const items = new Map();
const problems = [];
let cur = null;

for (const line of lines.slice(from, to)) {
  const head = line.match(/^\*\*aigp-(\d+)\*\*/);
  if (head) {
    const id = Number(head[1]);
    if (items.has(id)) problems.push(`aigp-${head[1]}: appears twice`);
    cur = { id, distractorTypes: {} };
    items.set(id, cur);
    continue;
  }
  if (!cur) continue;

  const primary = line.match(
    /^Primary `(\w+)`(?:, secondar(?:y|ies) ((?:`\w+`(?:,? (?:and )?)?)+))?/,
  );
  if (primary) {
    if (cur.primaryDimension) problems.push(`aigp-${cur.id}: two Primary lines`);
    cur.primaryDimension = primary[1];
    if (primary[2]) {
      cur.secondaryDimensions = [...primary[2].matchAll(/`(\w+)`/g)].map((m) => m[1]);
    }
    continue;
  }

  const label = line.match(/^- `([A-E])` → `(\w+)`/);
  if (label) {
    if (cur.distractorTypes[label[1]]) {
      problems.push(`aigp-${cur.id}: option ${label[1]} labelled twice`);
    }
    cur.distractorTypes[label[1]] = label[2];
  }
}

for (const item of items.values()) {
  if (!item.primaryDimension) {
    problems.push(`aigp-${item.id}: no primary dimension`);
  } else if (!DIMENSIONS.has(item.primaryDimension)) {
    problems.push(`aigp-${item.id}: unknown dimension "${item.primaryDimension}"`);
  }
  for (const s of item.secondaryDimensions ?? []) {
    if (!DIMENSIONS.has(s)) problems.push(`aigp-${item.id}: unknown secondary "${s}"`);
    if (s === item.primaryDimension) {
      problems.push(`aigp-${item.id}: secondary repeats the primary`);
    }
  }
  for (const [option, value] of Object.entries(item.distractorTypes)) {
    if (!DISTRACTOR_TYPES.has(value)) {
      problems.push(`aigp-${item.id}: unknown distractor type "${value}" on ${option}`);
    }
  }
  if (Object.keys(item.distractorTypes).length === 0) {
    problems.push(`aigp-${item.id}: primary dimension but no distractor labels`);
  }
}

if (problems.length) {
  console.error(`${problems.length} problem(s) in ${DOC}:\n`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

const labelCount = [...items.values()].reduce(
  (n, i) => n + Object.keys(i.distractorTypes).length,
  0,
);
console.log(`parsed ${items.size} questions, ${labelCount} distractor labels`);

/* ------------------------------------------------------------------ apply -- */

const source = readFileSync(FILE, "utf8").split("\n");
if (source.some((l) => l.includes("reasoning:"))) {
  console.error(
    `\n${FILE} already contains reasoning blocks — refusing to run.\n` +
      `Re-running would discard any hand-correction made since. Edit the file ` +
      `directly, or revert it first if you mean to regenerate from the document.`,
  );
  process.exit(1);
}

/*
 * Entries are keyed by source question number and close with a line that is
 * exactly "  },". Nested objects inside an entry close at deeper indentation,
 * so that anchor is unambiguous — verified by the entry-start count matching.
 */
const starts = source.filter((l) => /^  \d+: \{$/.test(l)).length;
const closes = source.filter((l) => l === "  },").length;
if (starts !== closes) {
  console.error(`${FILE}: ${starts} entry starts but ${closes} closes — not safe to edit`);
  process.exit(1);
}

const out = [];
const applied = new Set();
let key = null;

for (const line of source) {
  const start = line.match(/^  (\d+): \{$/);
  if (start) key = Number(start[1]);

  if (line === "  },") {
    const item = key === null ? undefined : items.get(key);
    if (item) {
      // Placed last in the entry, matching the field order declared on
      // QuestionEnrichment in src/content/types.ts.
      out.push("    reasoning: {");
      out.push(`      primaryDimension: "${item.primaryDimension}",`);
      if (item.secondaryDimensions?.length) {
        const list = item.secondaryDimensions.map((s) => `"${s}"`).join(", ");
        out.push(`      secondaryDimensions: [${list}],`);
      }
      const options = Object.keys(item.distractorTypes).sort();
      if (options.length) {
        out.push("      distractorTypes: {");
        for (const o of options) {
          out.push(`        ${o}: "${item.distractorTypes[o]}",`);
        }
        out.push("      },");
      }
      out.push("    },");
      applied.add(key);
    }
    key = null;
  }
  out.push(line);
}

const missing = [...items.keys()].filter((k) => !applied.has(k));
if (missing.length) {
  console.error(`no enrichment entry exists for: ${missing.join(", ")}`);
  process.exit(1);
}

if (dryRun) {
  console.log(`dry run: would write ${applied.size} reasoning blocks to ${FILE}`);
  process.exit(0);
}

writeFileSync(FILE, out.join("\n"));
console.log(`wrote ${applied.size} reasoning blocks to ${FILE}`);
console.log("verify with: npm test && npm run check:content");
