#!/usr/bin/env node
/**
 * External-corpus exclusion check.
 *
 *   npm run check:exclusion -- /path/outside/the/repo/corpus.txt
 *
 * Answers exactly one question: **did we accidentally author something
 * substantially similar to that corpus?**
 *
 * It does not answer, and must never be used to answer, "how should we write
 * this question?" The corpus is a filter, not a source.
 *
 * ---------------------------------------------------------------------------
 * Why the corpus is never stored here
 *
 * The reason this script takes a path instead of reading a checked-in fixture
 * is that the corpora worth checking against — recalled exam items, a
 * competitor's proprietary bank, anything under an NDA — are precisely the
 * things that must not enter the repository, the build, CI, or a PR. A
 * committed fixture would put the material in git history permanently, publish
 * it on every clone, and ship it to anyone who inspects the deployed bundle.
 *
 * So this script refuses to read a corpus that lives inside the repository.
 * That refusal is the enforcement: it is not possible to satisfy this tool by
 * copying the file in, which removes the shortcut a hurried developer would
 * otherwise take.
 *
 * ---------------------------------------------------------------------------
 * What it cannot do
 *
 * Finding no overlap shows our content is not derived from *this* corpus. It
 * says nothing about any corpus you have not supplied, and in particular it
 * cannot check against a live certification exam, whose items are not public.
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, relative, isAbsolute, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(join(dirname(fileURLToPath(import.meta.url)), ".."));

/* Thresholds. A shared run of this many words is not coincidence in prose. */
const RUN_ALERT = 12;
const RUN_SCAN = 8;
const STEM_JACCARD_ALERT = 0.35;

const args = process.argv.slice(2);
const showMatches = args.includes("--show-matches");
const corpusArg = args.find((a) => !a.startsWith("--"));

if (!corpusArg) {
  console.error(`
Usage: npm run check:exclusion -- <path-to-corpus> [--show-matches]

  <path-to-corpus>  A plain-text file OUTSIDE this repository.
  --show-matches    Print the overlapping text. Off by default, because the
                    overlap is by definition corpus text and this output may
                    end up in a log.

The corpus must not be copied into the repository. See the header of
scripts/check-exclusion.mjs for why.
`);
  process.exit(2);
}

const corpusPath = isAbsolute(corpusArg) ? corpusArg : resolve(process.cwd(), corpusArg);

/* --- the refusal that does the enforcing -------------------------------- */
const rel = relative(REPO, corpusPath);
const insideRepo = rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
if (insideRepo) {
  console.error(`
REFUSED: the corpus is inside the repository.

  ${corpusPath}

An exclusion corpus is material that must not be committed, built, deployed or
published. Move it somewhere outside ${REPO} and pass that path instead.
`);
  process.exit(2);
}

if (!existsSync(corpusPath) || !statSync(corpusPath).isFile()) {
  console.error(`No readable file at: ${corpusPath}`);
  process.exit(2);
}

/* ------------------------------------------------------------------------ */

const corpus = readFileSync(corpusPath, "utf8");
const questions = JSON.parse(
  readFileSync(join(REPO, "src/content/tracks/aigp-preparation/questions.json"), "utf8"),
);
const scenarios = JSON.parse(
  readFileSync(join(REPO, "src/content/tracks/aigp-preparation/scenarios.json"), "utf8"),
);

const norm = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const STOP = new Set(
  "a an the of to and or in for on with is are be as that this by from at it its their they which what should would could most least best first before after when who how why do does not no you your our we us if then than there here all following".split(
    " ",
  ),
);
const content = (s) => norm(s).split(" ").filter((w) => w && !STOP.has(w));

function runs(s, n) {
  const w = norm(s).split(" ").filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
}

function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const x of A) if (B.has(x)) shared++;
  return shared / (A.size + B.size - shared);
}

const corpusScan = runs(corpus, RUN_SCAN);
const corpusAlert = runs(corpus, RUN_ALERT);
const corpusWords = content(corpus);

/* Corpus items, split on blank lines, for stem-level similarity. */
const corpusChunks = corpus
  .split(/\n\s*\n|\nQuestion\s*:\s*\d+/i)
  .map((c) => c.trim())
  .filter((c) => c.split(/\s+/).length >= 12)
  .map(content);

const id = (q) => `aigp-${String(q.id).padStart(3, "0")}`;
const findings = [];
let peakRun = { id: "", n: 0, text: "" };

for (const q of questions) {
  const full = [q.question, ...q.options].join(" ");

  for (const r of runs(full, RUN_ALERT)) {
    if (corpusAlert.has(r)) {
      findings.push({ kind: `shared ${RUN_ALERT}-word run`, id: id(q), text: r });
      break;
    }
  }

  const mine = runs(full, RUN_SCAN);
  let shared = 0;
  for (const r of mine) if (corpusScan.has(r)) shared++;
  if (mine.size && shared / mine.size > 0.15) {
    findings.push({
      kind: "high n-gram density",
      id: id(q),
      text: `${((shared / mine.size) * 100).toFixed(1)}% of ${RUN_SCAN}-word runs`,
    });
  }
  if (shared > peakRun.n) peakRun = { id: id(q), n: shared, text: "" };

  const stem = content(q.question);
  for (const chunk of corpusChunks) {
    const sim = jaccard(stem, chunk);
    if (sim >= STEM_JACCARD_ALERT) {
      findings.push({
        kind: "stem resembles a corpus item",
        id: id(q),
        text: `${(sim * 100).toFixed(0)}% vocabulary overlap`,
      });
      break;
    }
  }
}

for (const s of scenarios) {
  const body = s.body.join(" ");
  for (const r of runs(body, RUN_ALERT)) {
    if (corpusAlert.has(r)) {
      findings.push({ kind: `shared ${RUN_ALERT}-word run`, id: s.id, text: r });
      break;
    }
  }
  const overlap = jaccard(content(body), corpusWords);
  if (overlap > 0.12) {
    findings.push({
      kind: "scenario vocabulary overlap",
      id: s.id,
      text: `${(overlap * 100).toFixed(1)}%`,
    });
  }
}

/* -------------------------------------------------------------- report -- */

console.log("External-corpus exclusion check");
console.log(`  bank    : ${questions.length} questions, ${scenarios.length} scenarios`);
console.log(`  corpus  : ${norm(corpus).split(" ").length} words, ${corpusChunks.length} items`);
console.log(`  corpus path is outside the repository — not copied, not stored\n`);

if (!findings.length) {
  console.log(`  No overlap above threshold.`);
  console.log(
    `  Highest single-question ${RUN_SCAN}-word-run count: ${peakRun.n} (${peakRun.id || "n/a"})`,
  );
} else {
  console.log(`  ${findings.length} finding(s) for human review:\n`);
  for (const f of findings) {
    console.log(`  [${f.kind}] ${f.id}`);
    if (showMatches) console.log(`      ${f.text}`);
  }
  if (!showMatches) {
    console.log(`\n  Re-run with --show-matches to see the overlapping text.`);
    console.log(`  It is withheld by default because it is corpus text.`);
  }
  console.log(
    `\n  A finding is not proof of copying — shared domain vocabulary is normal.`,
  );
  console.log(`  Read the item and decide. Do not auto-rewrite.`);
}

console.log(
  `\n  Scope: this shows only whether our content resembles the corpus supplied.`,
);
console.log(
  `  It cannot check against a live certification exam; those items are not public.`,
);

process.exit(findings.length ? 1 : 0);
