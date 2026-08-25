/*
  Add distractorNotes and sources to existing enrichment entries.

  Entries aigp-001..108 carried a bokSubdomain, a difficulty, a keyTakeaway and
  framework tags, but no per-distractor notes and no sources — while 109..296
  had both. That gap is the reason a third of the bank could tell a learner
  which answer was right without telling them why the one they picked was
  wrong, which is most of the teaching.

  This injects authored content into entries that already exist, immediately
  before their closing brace. It refuses to overwrite: an entry that already
  has distractorNotes or sources is left alone and reported, so re-running is
  safe and a batch can never silently clobber earlier work.

  Content is supplied as a JSON file mapping question id to
  { distractorNotes: { LETTER: text }, sources: [text] }.

  Run:  node scripts/add-enrichment.mjs <batch.json> [--write]
*/

import { readFileSync, writeFileSync } from "node:fs";

const ENRICHMENT = "src/content/tracks/aigp-preparation/enrichment.ts";
const QUESTIONS = "src/content/tracks/aigp-preparation/questions.json";
const [batchPath] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const write = process.argv.includes("--write");

if (!batchPath) {
  console.error("usage: node scripts/add-enrichment.mjs <batch.json> [--write]");
  process.exit(1);
}

const batch = JSON.parse(readFileSync(batchPath, "utf8"));
const questions = JSON.parse(readFileSync(QUESTIONS, "utf8"));
const LETTERS = ["A", "B", "C", "D", "E"];
let enrichment = readFileSync(ENRICHMENT, "utf8");

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

/** Wrap a long string the way the file already formats its prose. */
function fmt(indent, text) {
  return `${indent}"${esc(text)}",`;
}

const problems = [];
const skipped = [];
let added = 0;

for (const [rawId, payload] of Object.entries(batch)) {
  const id = Number(rawId);
  const q = questions.find((x) => x.id === id);
  if (!q) {
    problems.push(`aigp-${id}: no such question`);
    continue;
  }

  // Notes must name real distractors, never the correct option.
  const correct = new Set(String(q.correct).split(",").map((s) => s.trim()));
  for (const letter of Object.keys(payload.distractorNotes ?? {})) {
    const i = LETTERS.indexOf(letter);
    if (i < 0 || i >= q.options.length) {
      problems.push(`aigp-${id}: note for ${letter}, which is not an option`);
    }
    if (correct.has(letter)) {
      problems.push(`aigp-${id}: note attached to correct option ${letter}`);
    }
  }
  // Every wrong option should get one.
  const wrong = q.options
    .map((_, i) => LETTERS[i])
    .filter((l) => !correct.has(l));
  const covered = new Set(Object.keys(payload.distractorNotes ?? {}));
  for (const l of wrong) {
    if (!covered.has(l)) problems.push(`aigp-${id}: no note for distractor ${l}`);
  }

  // Locate the entry and its closing brace.
  const entry = new RegExp(`\\n  ${id}: \\{`);
  const m = entry.exec(enrichment);
  if (!m) {
    problems.push(`aigp-${id}: enrichment entry not found`);
    continue;
  }
  const start = m.index;
  const nextEntry = /\n  \d+: \{/g;
  nextEntry.lastIndex = start + 1;
  const nm = nextEntry.exec(enrichment);
  const end = nm ? nm.index : enrichment.length;
  const block = enrichment.slice(start, end);

  if (/distractorNotes:|sources:/.test(block)) {
    skipped.push(id);
    continue;
  }

  const closing = block.lastIndexOf("\n  },");
  if (closing < 0) {
    problems.push(`aigp-${id}: could not find entry close`);
    continue;
  }

  const lines = [];
  const notes = payload.distractorNotes ?? {};
  if (Object.keys(notes).length) {
    lines.push("    distractorNotes: {");
    for (const letter of LETTERS.filter((l) => l in notes)) {
      lines.push(`      ${letter}:`);
      lines.push(fmt("        ", notes[letter]));
    }
    lines.push("    },");
  }
  if (payload.sources?.length) {
    lines.push("    sources: [");
    for (const s of payload.sources) lines.push(fmt("      ", s));
    lines.push("    ],");
  }

  const injected = block.slice(0, closing) + "\n" + lines.join("\n") +
    block.slice(closing);
  enrichment = enrichment.slice(0, start) + injected + enrichment.slice(end);
  added++;
}

console.log(`entries updated: ${added}`);
if (skipped.length) console.log(`already had content, skipped: ${skipped.join(", ")}`);
if (problems.length) {
  console.error("\nREFUSING TO WRITE:");
  problems.forEach((p) => console.error("  " + p));
  process.exit(1);
}

if (write) {
  writeFileSync(ENRICHMENT, enrichment);
  console.log("written.");
} else {
  console.log("dry run — pass --write to apply.");
}
