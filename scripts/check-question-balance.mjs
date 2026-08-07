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
  // Smallest share any one domain may hold. Guards against a bank that drifts
  // toward whichever domain is easiest to write for.
  minDomainShare: 0.1,
};

/**
 * Domains the bank is expected to cover, mirroring the published AIGP blueprint
 * structure. A question landing outside this set is a typo, not a new domain —
 * the registry derives its domain list from the content, so a stray string
 * silently creates a phantom domain in the UI.
 */
const EXPECTED_DOMAINS = [
  "Foundations of AI Governance",
  "Laws, Standards, and Frameworks",
  "Governing AI Development",
  "Governing AI Deployment and Use",
];

const strip = (s) => s.replace(/^[A-D][.)]\s*/, "").trim();

const questions = JSON.parse(readFileSync(SOURCE, "utf8"));
const failures = [];
let longestCount = 0;
let sumCorrect = 0;
let sumDistractor = 0;
let distractorCount = 0;

/**
 * Multi-select items are excluded from the length and position statistics.
 * Both measures assume exactly one correct option: "is the correct answer the
 * longest" and "which letter carries the answer" are undefined when three of
 * five options are correct. They are validated for shape only, and counted
 * separately in the summary so the exclusion is visible rather than silent.
 */
const KEYS = ["A", "B", "C", "D", "E"];
const parseCorrect = (c) => String(c).split(",").map((k) => k.trim().toUpperCase());
const singleSelect = questions.filter((q) => parseCorrect(q.correct).length === 1);
const multiSelect = questions.filter((q) => parseCorrect(q.correct).length > 1);

for (const q of questions) {
  const keys = parseCorrect(q.correct);
  const seen = new Set();
  for (const k of keys) {
    const i = KEYS.indexOf(k);
    if (i < 0 || i >= q.options.length) {
      failures.push(`q${q.id}: correct answer "${k}" is not one of the options`);
    }
    if (seen.has(k)) failures.push(`q${q.id}: correct answer "${k}" is repeated`);
    seen.add(k);
  }
  if (keys.length > 1 && q.options.length < 5) {
    failures.push(
      `q${q.id}: multi-select needs five options, has ${q.options.length}`,
    );
  }
  if (keys.length >= q.options.length) {
    failures.push(`q${q.id}: every option is correct — there is nothing to choose`);
  }
}

for (const q of singleSelect) {
  const options = q.options.map(strip);
  const correctIndex = KEYS.indexOf(parseCorrect(q.correct)[0]);
  if (correctIndex < 0 || correctIndex >= options.length) continue;

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

const n = singleSelect.length;
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
for (const q of singleSelect) {
  const k = parseCorrect(q.correct)[0];
  positions[k] = (positions[k] ?? 0) + 1;
}
console.log(
  `single-select ${n} of ${questions.length}; multi-select ${multiSelect.length} (excluded from length and position statistics)`,
);
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

const domains = {};
for (const q of questions) domains[q.domain] = (domains[q.domain] ?? 0) + 1;

console.log("domains:");
for (const [name, count] of Object.entries(domains).sort((a, b) => b[1] - a[1])) {
  const known = EXPECTED_DOMAINS.includes(name);
  console.log(
    `  ${known ? " " : "?"} ${name.padEnd(34)} ${String(count).padStart(3)}  ${Math.round((count / n) * 100)}%`,
  );
  if (!known) {
    failures.push(`BANK: unrecognised domain "${name}" — check for a typo`);
  }
}

for (const name of EXPECTED_DOMAINS) {
  const count = domains[name] ?? 0;
  if (count / n < LIMITS.minDomainShare) {
    failures.push(
      `BANK: domain "${name}" holds only ${Math.round((count / n) * 100)}% of the bank ` +
        `(minimum ${Math.round(LIMITS.minDomainShare * 100)}%)`,
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
