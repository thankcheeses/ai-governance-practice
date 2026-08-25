/*
  Repair seven items whose wrong options could be eliminated without knowing
  anything about AI governance.

  A distractor earns its place by being something a prepared candidate might
  actually choose — a real concept that is simply not the best answer here, or
  a plausible misreading of the stem. "A marketing brochure" as an alternative
  to a model card, or "the corporate travel and expenses policy" inside a
  pick-three, tests only whether the reader is awake. Worse, it inflates scores
  on a bank whose whole claim is that it exercises judgment.

  Every replacement below is a genuine artefact, obligation or failure mode.
  Several are deliberately adjacent to the key — a datasheet beside a model
  card, a deployer's impact assessment beside a provider's pre-market duties —
  because the distinction being drawn is itself worth knowing.

  Correct keys are untouched: only distractor positions are rewritten, so the
  answer letters and the correct option text are exactly as they were.

  Run:  node scripts/fix-p1-distractors.mjs [--write]
*/

import { readFileSync, writeFileSync } from "node:fs";

const QUESTIONS = "src/content/tracks/aigp-preparation/questions.json";
const write = process.argv.includes("--write");
const questions = JSON.parse(readFileSync(QUESTIONS, "utf8"));
const byId = (id) => questions.find((q) => q.id === id);

/** id -> { letter: replacement text } — distractor positions only. */
const REPLACEMENTS = {
  65: {
    A: "The team may select a model architecture more complex than the problem requires.",
    B: "The tool may reach production without a named owner accountable for its behaviour.",
    C: "The people who will operate the tool may first hear about it at launch.",
  },
  67: {
    A: "Because the feature set cannot be reconstructed if the pipeline is rebuilt later.",
    C: "Because undocumented choices only matter once the model underperforms in testing.",
    D: "Because the team will repeat the same evaluation work when the model is next revised.",
  },
  70: {
    A: "Distribution shift between the training data and the evaluation set, requiring the evaluation set to be re-drawn.",
    B: "A target leak among the training features, requiring the feature set to be re-derived.",
    C: "Insufficient training volume, requiring more examples before the model is evaluated again.",
  },
  71: {
    B: "A datasheet, which documents the dataset's composition, collection and intended uses.",
    C: "A system card, which describes the deployed system and its context rather than the model.",
    D: "A validation report, which records measured performance against agreed acceptance thresholds.",
  },
  81: {
    B: "Shadow deployment, where an unapproved copy of a system runs alongside the approved one.",
    C: "Vendor scope creep, where the supplier extends what the tool does without notifying customers.",
    D: "Model drift, where the system's behaviour changes as the pattern of use shifts.",
  },
  89: {
    B: "Business continuity, because an unavailable model interrupts service as any outage does.",
    D: "Physical and environmental security, which governs access to the plants and the equipment in them.",
  },
  97: {
    B: "A post-market monitoring report covering the system's first year in service.",
    E: "An impact assessment carried out by the deployer for its own context of use.",
  },
};

const LETTERS = ["A", "B", "C", "D", "E"];
const strip = (s) => s.replace(/^\s*[A-E][.)]\s*/, "").trim();
const keysOf = (q) => String(q.correct).split(",").map((s) => s.trim());

const before = new Map(
  questions.map((q) => [
    q.id,
    keysOf(q).map((k) => strip(q.options[LETTERS.indexOf(k)])),
  ]),
);

let touched = 0;
for (const [rawId, map] of Object.entries(REPLACEMENTS)) {
  const q = byId(Number(rawId));
  if (!q) continue;
  const correct = new Set(keysOf(q));
  for (const [letter, text] of Object.entries(map)) {
    if (correct.has(letter)) {
      console.error(`REFUSING: aigp-${rawId} ${letter} is a correct option`);
      process.exit(1);
    }
    const i = LETTERS.indexOf(letter);
    q.options[i] = `${letter}. ${text}`;
  }
  touched++;
}

/* -- verify the keys and the correct answers did not move ----------------- */
const problems = [];
for (const q of questions) {
  const now = keysOf(q).map((k) => strip(q.options[LETTERS.indexOf(k)]));
  if (JSON.stringify(now) !== JSON.stringify(before.get(q.id))) {
    problems.push(`aigp-${q.id}: correct answer text changed`);
  }
  q.options.forEach((o, i) => {
    if (!o.startsWith(`${LETTERS[i]}. `)) problems.push(`aigp-${q.id}: prefix/position mismatch`);
  });
  const texts = new Set(q.options.map(strip));
  if (texts.size !== q.options.length) problems.push(`aigp-${q.id}: duplicate option text`);
}

console.log(`rewrote distractors in ${touched} questions`);
if (problems.length) {
  console.error("\nREFUSING TO WRITE:");
  problems.forEach((p) => console.error("  " + p));
  process.exit(1);
}
console.log("keys unchanged, no duplicate options, prefixes aligned.");

if (write) {
  writeFileSync(QUESTIONS, JSON.stringify(questions, null, 2) + "\n");
  console.log("written.");
} else {
  console.log("dry run — pass --write to apply.");
}
