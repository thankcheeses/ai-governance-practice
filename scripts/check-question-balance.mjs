/**
 * Fails when a question can be answered without understanding it.
 *
 * The bank had a severe length tell: the correct option was the single longest
 * one in 43 of 50 questions, so always picking the longest scored 86% against a
 * 25% baseline. An assessment with that property measures option-spotting, not
 * judgment, which is the entire thing this product claims to build.
 *
 * Run: npm run check:questions
 */
import { readFileSync } from "node:fs";

const SOURCE = "src/content/tracks/aigp-preparation/questions.json";

/**
 * Thresholds are deliberately blunt. A subtle statistical test would be easy to
 * game by nudging a few characters; these force genuinely comparable options.
 */
const LIMITS = {
  // Longest option may exceed the shortest by at most this fraction.
  spreadRatio: 0.6,
  // Absolute character spread, to catch short options where a ratio is noisy.
  spreadChars: 60,
  // Across the whole bank, how often the correct answer may be the longest.
  // 0.25 is chance for 4 options; allow modest slack for natural variation.
  longestRate: 0.38,
  // Mean correct length / mean distractor length across the bank.
  meanRatio: 1.15,
  // Share of correct answers allowed to sit on any single letter. The bank
  // shipped with 96% on B and zero on A, so answering B blindly scored 96%.
  maxPositionShare: 0.35,
  minPositionShare: 0.15,
};

const strip = (s) => s.replace(/^[A-D][.)]\s*/, "").trim();

const questions = JSON.parse(readFileSync(SOURCE, "utf8"));
const failures = [];
let longestCount = 0;
let sumCorrect = 0;
let sumDistractor = 0;
let distractorCount = 0;

for (const q of questions) {
  const options = q.options.map(strip);
  const correctIndex = "ABCD".indexOf(q.correct);

  if (correctIndex < 0 || correctIndex >= options.length) {
    failures.push(`q${q.id}: correct answer "${q.correct}" is not one of the options`);
    continue;
  }

  const lengths = options.map((o) => o.length);
  const max = Math.max(...lengths);
  const min = Math.min(...lengths);
  const spread = max - min;

  if (lengths[correctIndex] === max && lengths.filter((l) => l === max).length === 1) {
    longestCount++;
  }

  sumCorrect += lengths[correctIndex];
  lengths.forEach((l, i) => {
    if (i !== correctIndex) {
      sumDistractor += l;
      distractorCount++;
    }
  });

  if (spread > LIMITS.spreadChars && spread / max > LIMITS.spreadRatio) {
    failures.push(
      `q${q.id}: option lengths ${lengths.join("/")} — spread ${spread} chars ` +
        `(${Math.round((spread / max) * 100)}% of longest)`,
    );
  }

  // A distractor that is a bare fragment reads as filler regardless of spread.
  const runt = lengths.findIndex((l) => l < 25);
  if (runt >= 0) {
    failures.push(
      `q${q.id}: option ${"ABCD"[runt]} is ${lengths[runt]} chars — too short to be a serious choice`,
    );
  }
}

const n = questions.length;
const longestRate = longestCount / n;
const meanRatio = sumCorrect / n / (sumDistractor / distractorCount);

console.log(`questions: ${n}`);
console.log(
  `correct-is-longest: ${longestCount}/${n} (${Math.round(longestRate * 100)}%)` +
    `  limit ${Math.round(LIMITS.longestRate * 100)}%  chance 25%`,
);
console.log(
  `mean correct/distractor length: ${meanRatio.toFixed(2)}x  limit ${LIMITS.meanRatio}x`,
);

const positions = { A: 0, B: 0, C: 0, D: 0 };
for (const q of questions) positions[q.correct] = (positions[q.correct] ?? 0) + 1;
console.log(
  "answer positions: " +
    ["A", "B", "C", "D"].map((k) => `${k} ${Math.round((positions[k] / n) * 100)}%`).join("  ") +
    `  allowed ${Math.round(LIMITS.minPositionShare * 100)}-${Math.round(LIMITS.maxPositionShare * 100)}%`,
);

for (const letter of ["A", "B", "C", "D"]) {
  const share = positions[letter] / n;
  if (share > LIMITS.maxPositionShare) {
    failures.push(
      `BANK: ${Math.round(share * 100)}% of answers are "${letter}" — ` +
        `answering "${letter}" blindly scores ${Math.round(share * 100)}%`,
    );
  } else if (share < LIMITS.minPositionShare) {
    failures.push(
      `BANK: only ${Math.round(share * 100)}% of answers are "${letter}" — ` +
        `test-takers learn to discount it`,
    );
  }
}

if (longestRate > LIMITS.longestRate) {
  failures.push(
    `BANK: correct answer is the longest option ${Math.round(longestRate * 100)}% ` +
      `of the time (limit ${Math.round(LIMITS.longestRate * 100)}%) — ` +
      `picking the longest option scores ${Math.round(longestRate * 100)}%`,
  );
}

if (meanRatio > LIMITS.meanRatio) {
  failures.push(
    `BANK: correct options average ${meanRatio.toFixed(2)}x the length of ` +
      `distractors (limit ${LIMITS.meanRatio}x)`,
  );
}

if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log("\nall questions balanced");
