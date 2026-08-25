/*
  The content release gate.

  One command answers "is this content safe to publish". Everything here is an
  invariant that was violated at some point in this project's history and cost
  real work to find — a bank of 296 items is past the size where a careful read
  catches these, so they are machine-checked instead.

  Each check names the defect it exists to prevent, because a failing check
  whose purpose is not obvious gets weakened rather than fixed.

  Run:  npm run check:content
*/

import { ALL_QUESTIONS } from "../src/content/registry";
import { SUBDOMAINS } from "../src/content/bok";
import { readFileSync } from "node:fs";

type Q = (typeof ALL_QUESTIONS)[number] & {
  bokSubdomain?: string;
  difficulty?: string;
  keyTakeaway?: string;
  sources?: string[];
  distractorNotes?: Record<string, string>;
  tags?: string[];
};

const QS = ALL_QUESTIONS as unknown as Q[];
const failures: string[] = [];
const notes: string[] = [];
const fail = (m: string) => failures.push(m);

/* ------------------------------------------------------------- schema -- */
// Every field the app or a reviewer relies on. A question missing any of these
// is half-authored, and the gap is invisible in the UI until someone hits it.
for (const q of QS) {
  const need: [string, unknown][] = [
    ["question text", q.question],
    ["domain", q.domain],
    ["bokSubdomain", q.bokSubdomain],
    ["difficulty", q.difficulty],
    ["rationale", q.rationale],
    ["keyTakeaway", q.keyTakeaway],
  ];
  for (const [name, v] of need) {
    if (!v || (typeof v === "string" && !v.trim())) fail(`${q.id}: missing ${name}`);
  }
  if (!q.options?.length) fail(`${q.id}: no options`);
  if (!q.correctOptionIds?.length) fail(`${q.id}: no correct answer`);
  if (!q.sources?.length) fail(`${q.id}: no source`);
  if (!q.tags?.length) fail(`${q.id}: no tags`);
}

/* --------------------------------------------------------- answer keys -- */
// The answer key is the one thing a study resource cannot get wrong. These
// catch corruption from bulk edits, which is exactly how a key gets broken.
const seenIds = new Set<string>();
for (const q of QS) {
  if (seenIds.has(q.id)) fail(`${q.id}: duplicate question id`);
  seenIds.add(q.id);

  const optionIds = q.options.map((o) => o.id);
  if (new Set(optionIds).size !== optionIds.length) fail(`${q.id}: duplicate option ids`);
  if (new Set(q.options.map((o) => o.text.trim())).size !== q.options.length) {
    fail(`${q.id}: two options with identical text`);
  }
  for (const id of q.correctOptionIds) {
    if (!optionIds.includes(id)) fail(`${q.id}: correct id ${id} is not one of its options`);
  }
  if (new Set(q.correctOptionIds).size !== q.correctOptionIds.length) {
    fail(`${q.id}: the same option is listed correct twice`);
  }
  if (q.options.length < 3) fail(`${q.id}: fewer than three options`);
}

/* -------------------------------------------------------- multi-select -- */
// A multi-select where every option is correct grades as a free mark, and a
// single-select stored as a set silently changes how it is graded.
for (const q of QS) {
  const n = q.correctOptionIds.length;
  if (n === q.options.length) fail(`${q.id}: degenerate multi-select — every option is correct`);
  if (n > 1 && q.options.length < 4) fail(`${q.id}: multi-select needs at least four options`);
}

/* ------------------------------------------------------------ sources -- */
// A source is only worth carrying if a learner can go and read the named
// thing. "FTC guidance" names nothing findable; "Lanham Act, Section 43(a)"
// does. This is the check that caught nine of the author's own sources.
const NAMED =
  /NIST|EU AI Act|ISO\/IEC|ISO |OECD|GDPR|Annex|Art\.|Title [IVX]+|Act\b|Convention|Directive|CFR|Regulation \(EU\)/;
const VAGUE = [
  /^HIPAA (Privacy|Security) Rule$/i,
  /^(FTC|EU|EEOC|HHS|OCR) guidance/i,
  /^guidance on/i,
  /^industry best practice/i,
  /^various sources/i,
];
for (const q of QS) {
  for (const s of q.sources ?? []) {
    if (!NAMED.test(s)) fail(`${q.id}: source names nothing locatable — "${s}"`);
    if (VAGUE.some((r) => r.test(s.trim()))) {
      fail(`${q.id}: source too vague to locate — "${s}". Name the instrument and section.`);
    }
    if (s.trim().length < 12) fail(`${q.id}: source is too short to identify anything — "${s}"`);
  }
}

/* --------------------------------------------------- distractor notes -- */
// The notes are where most of the teaching happens. A learner who picked a
// wrong answer needs to know what it got right before hearing why it loses.
for (const q of QS) {
  const correct = new Set(q.correctOptionIds);
  const wrong = q.options.filter((o) => !correct.has(o.id));
  const dn = q.distractorNotes ?? {};
  for (const id of Object.keys(dn)) {
    if (correct.has(id)) fail(`${q.id}: a distractor note is attached to a correct option`);
    if (!q.options.some((o) => o.id === id)) fail(`${q.id}: note ${id} matches no option`);
  }
  for (const o of wrong) {
    if (!dn[o.id]) fail(`${q.id}: no distractor note for ${o.id}`);
    else if (dn[o.id].trim().length < 45) {
      fail(`${q.id}: distractor note for ${o.id} is too short to explain anything`);
    }
  }
}

/*
  The two-part standard, as a ratchet rather than a gate.

  The project's pedagogical claim is that a note says what the distractor gets
  right before saying why it loses. That is a claim about meaning, and no
  regular expression decides it — this looks for the concessive move such a
  note almost always makes. It is a proxy, so it is used to stop the share
  falling rather than to judge any individual note.
*/
const CONCESSIVE =
  /\b(but|although|though|while|and it|and that|rather than|does not|is not|it is|which is|worth|genuinely|real|reasonable|fair|useful|necessary|matters|correct)\b/i;
let concessive = 0;
let noteTotal = 0;
for (const q of QS) {
  for (const v of Object.values(q.distractorNotes ?? {})) {
    noteTotal++;
    if (CONCESSIVE.test(v)) concessive++;
  }
}
const concessivePct = (concessive / noteTotal) * 100;
const CONCESSIVE_FLOOR = 38;
if (concessivePct < CONCESSIVE_FLOOR) {
  fail(
    `only ${concessivePct.toFixed(1)}% of distractor notes concede anything before refusing it (floor ${CONCESSIVE_FLOOR}%). ` +
      `Notes should say what the option gets right, then why it still loses.`,
  );
}
notes.push(`distractor notes: ${noteTotal}, ${concessivePct.toFixed(0)}% two-part (floor ${CONCESSIVE_FLOOR}%)`);

/* ------------------------------------------------- answer distribution -- */
// Stored keys were once B 69%, D 0% across 150 consecutive questions. The app
// shuffles, so no learner saw it — but the repository is public and a reviewer
// reading questions.json would reasonably conclude the keys were generated.
const LETTERS = ["A", "B", "C", "D", "E"];
const single = QS.filter((q) => q.correctOptionIds.length === 1);
const pos: Record<string, number> = {};
for (const q of single) {
  const i = q.options.findIndex((o) => o.id === q.correctOptionIds[0]);
  pos[LETTERS[i]] = (pos[LETTERS[i]] ?? 0) + 1;
}
const fourOpt = single.filter((q) => q.options.length === 4).length;
for (const L of ["A", "B", "C", "D"]) {
  const share = ((pos[L] ?? 0) / single.length) * 100;
  if (share > 40) fail(`answer position ${L} holds ${share.toFixed(1)}% of keys (limit 40%)`);
  if (share < 12) fail(`answer position ${L} holds only ${share.toFixed(1)}% of keys (floor 12%)`);
}
notes.push(
  `answer positions: ${["A", "B", "C", "D"].map((L) => `${L} ${(((pos[L] ?? 0) / single.length) * 100).toFixed(0)}%`).join("  ")} (${fourOpt} four-option items)`,
);

/* -------------------------------------------------------- length bias -- */
// If the correct option is reliably the longest, the bank can be passed by
// counting words.
let longest = 0;
let ratioSum = 0;
for (const q of single) {
  const correct = q.options.find((o) => q.correctOptionIds.includes(o.id))!;
  const wrong = q.options.filter((o) => !q.correctOptionIds.includes(o.id));
  if (wrong.every((o) => correct.text.length > o.text.length)) longest++;
  const avgWrong = wrong.reduce((a, o) => a + o.text.length, 0) / wrong.length;
  ratioSum += correct.text.length / avgWrong;
}
const longestPct = (longest / single.length) * 100;
const meanRatio = ratioSum / single.length;
if (longestPct > 38) fail(`correct option is longest in ${longestPct.toFixed(0)}% of items (limit 38%)`);
if (meanRatio > 1.15) fail(`correct options average ${meanRatio.toFixed(2)}x the length of distractors (limit 1.15x)`);
notes.push(`length bias: longest ${longestPct.toFixed(0)}% (chance 25%), mean ratio ${meanRatio.toFixed(2)}x`);

/* ----------------------------------------------------------- coverage -- */
// Every competency must stay represented, and the percentages must be computed
// against the whole bank — a previous version divided by the single-select
// count and reported domain shares summing to 116%.
const cov: Record<string, number> = {};
for (const q of QS) cov[q.bokSubdomain!] = (cov[q.bokSubdomain!] ?? 0) + 1;
for (const s of SUBDOMAINS as { id: string }[]) {
  if (!cov[s.id]) fail(`BoK competency ${s.id} has no questions`);
}
for (const id of Object.keys(cov)) {
  if (!(SUBDOMAINS as { id: string }[]).some((s) => s.id === id)) {
    fail(`unknown BoK sub-domain "${id}"`);
  }
}
const domains: Record<string, number> = {};
for (const q of QS) domains[q.domain] = (domains[q.domain] ?? 0) + 1;
const domainTotal = Object.values(domains).reduce((a, b) => a + b, 0);
if (domainTotal !== QS.length) fail(`domain counts sum to ${domainTotal}, not ${QS.length}`);

/* ------------------------------------------------- documentation drift -- */
// docs/bok-maintenance.md once claimed "82/82 questions mapped" against a bank
// of 296. A number in prose cannot be trusted to age; this makes it fail.
const doc = readFileSync("docs/bok-maintenance.md", "utf8");
if (!doc.includes(`${QS.length}/${QS.length} questions mapped`)) {
  fail(
    `docs/bok-maintenance.md does not record the current bank size — expected "${QS.length}/${QS.length} questions mapped"`,
  );
}

/* -------------------------------------------------- metadata integrity -- */
const DIFFICULTIES = new Set(["foundational", "applied", "advanced"]);
for (const q of QS) {
  if (!DIFFICULTIES.has(q.difficulty!)) fail(`${q.id}: unknown difficulty "${q.difficulty}"`);
  if (q.rationale && q.rationale.trim().length < 80) {
    fail(`${q.id}: rationale is too short to justify an answer`);
  }
  if (q.keyTakeaway && q.keyTakeaway.trim().length < 40) {
    fail(`${q.id}: key takeaway is too short to carry a lesson`);
  }
}

/* ------------------------------------------- independence of the project -- */
// The project states in three places that it is independent. These strings
// must never appear in learner-facing content.
const FORBIDDEN = [
  /\brecalled\s+(exam\s+)?question/i,
  /\bactual\s+exam\s+question/i,
  /\bpredicts?\s+your\s+(exam\s+)?score/i,
  /\bofficial\s+IAPP\b/i,
  /\bendorsed\s+by\s+IAPP\b/i,
];
for (const q of QS) {
  const blob = `${q.question} ${q.rationale} ${q.keyTakeaway ?? ""} ${q.options.map((o) => o.text).join(" ")}`;
  for (const r of FORBIDDEN) {
    if (r.test(blob)) fail(`${q.id}: content implies affiliation or exam reproduction — ${r}`);
  }
}

/* --------------------------------------------------------------- report -- */
console.log(`content gate — ${QS.length} questions, ${single.length} single-select, ${QS.length - single.length} multi-select`);
notes.forEach((n) => console.log(`  ${n}`));
console.log(`  BoK competencies covered: ${Object.keys(cov).length}/${(SUBDOMAINS as unknown[]).length}`);
console.log(
  `  domains: ${Object.entries(domains)
    .map(([d, n]) => `${d.split(" ").pop()} ${((n / QS.length) * 100).toFixed(0)}%`)
    .join("  ")}`,
);

if (failures.length) {
  console.error(`\n${failures.length} content failure(s):`);
  failures.slice(0, 40).forEach((f) => console.error(`  ✗ ${f}`));
  if (failures.length > 40) console.error(`  … and ${failures.length - 40} more`);
  process.exit(1);
}
console.log("\ncontent gate passed.");
