#!/usr/bin/env node
/**
 * Validates the Body of Knowledge maintenance assertion.
 *
 * The study page tells learners "checked against the published Body of
 * Knowledge" on a named date, at a named version. That is a governance claim,
 * and a governance claim nobody can validate is decoration. This script makes
 * it checkable in CI:
 *
 *   - the three context fields are present and well-formed
 *   - the review date is a real ISO 8601 date, and not in the future
 *   - the prose in `context` names the same version as `contextVersion`, so
 *     the sentence a learner reads and the field a script reads cannot drift
 *   - the domain list matches the domain count the version is claimed against
 *
 * It reports the age of the assertion but does NOT fail on age. There is no
 * review cadence here on purpose: the authority sets its own revision
 * schedule, and asserting a calendar of our own would be a claim about
 * someone else's process. Re-check is event-triggered — see
 * docs/bok-maintenance.md.
 *
 * Run: npm run check:bok
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const registry = readFileSync(
  join(root, "src/content/registry.ts"),
  "utf8",
);

const errors = [];
const notes = [];

/** Pull a string field out of the registry source without importing TS. */
function field(name) {
  const m = registry.match(
    new RegExp(`${name}:\\s*\\n?\\s*"((?:[^"\\\\]|\\\\.)*)"`),
  );
  return m ? m[1] : null;
}

const context = field("context");
const authority = field("contextAuthority");
const version = field("contextVersion");
const reviewed = field("contextReviewed");

if (!context) {
  console.log("No track declares `context`; nothing to validate.");
  process.exit(0);
}

/* -- presence ----------------------------------------------------------- */

if (!authority) {
  errors.push(
    "`context` is set but `contextAuthority` is missing. A claim of alignment must name what it is aligned to.",
  );
}
if (!version) {
  errors.push(
    "`context` is set but `contextVersion` is missing. Authorities revise; an unversioned claim cannot be checked.",
  );
}
if (!reviewed) {
  errors.push(
    "`context` is set but `contextReviewed` is missing. Without a date the claim has no scope in time.",
  );
}

/* -- blueprint numbers must carry their source --------------------------- */

/*
 * The blueprint is a stronger claim than the outline. The outline says which
 * subject areas exist, which is descriptive; the blueprint says how many
 * questions each domain contributes to someone else's exam, which is a factual
 * assertion about a published document. So it may not exist here without that
 * document being named, versioned, dated and located.
 *
 * Read from source rather than imported: this script deliberately parses the TS
 * instead of loading it, so a broken module cannot make the check pass by
 * failing to import.
 */
const bok = readFileSync(join(root, "src/content/bok.ts"), "utf8");
const hasBlueprint = /export const DOMAIN_BLUEPRINT\b/.test(bok);

if (hasBlueprint) {
  const sourceBlock = /export const BLUEPRINT_SOURCE\s*=\s*\{([\s\S]*?)\}\s*as const;/.exec(bok);
  if (!sourceBlock) {
    errors.push(
      "DOMAIN_BLUEPRINT exists but BLUEPRINT_SOURCE does not. Blueprint numbers are a claim about a published document and may not be recorded without naming it.",
    );
  } else {
    const body = sourceBlock[1];
    const required = ["document", "title", "version", "effectiveDate", "retrievedOn", "pages"];
    for (const key of required) {
      if (!new RegExp(`\\b${key}\\s*:\\s*"[^"]+"`).test(body)) {
        errors.push(
          `BLUEPRINT_SOURCE is missing \`${key}\`. Without it the numbers cannot be traced back to what was read.`,
        );
      }
    }

    const bpVersion = /\bversion\s*:\s*"([^"]+)"/.exec(body)?.[1] ?? null;
    if (bpVersion && version && !version.includes(bpVersion)) {
      errors.push(
        `BLUEPRINT_SOURCE.version "${bpVersion}" disagrees with contextVersion "${version}". The blueprint and the outline must describe the same edition.`,
      );
    }

    const retrieved = /\bretrievedOn\s*:\s*"([^"]+)"/.exec(body)?.[1] ?? null;
    if (retrieved && !/^\d{4}-\d{2}-\d{2}$/.test(retrieved)) {
      errors.push(`BLUEPRINT_SOURCE.retrievedOn must be ISO 8601; got "${retrieved}".`);
    } else if (retrieved && new Date(`${retrieved}T00:00:00Z`) > new Date()) {
      errors.push(`BLUEPRINT_SOURCE.retrievedOn "${retrieved}" is in the future.`);
    }

    /*
     * Ranges, not points. A single number per domain would mean someone
     * collapsed a published span into a figure the authority never printed.
     */
    const entries = [...bok.matchAll(/(I{1,3}V?|IV):\s*\{\s*min:\s*(\d+),\s*max:\s*(\d+)\s*\}/g)];
    if (entries.length !== 4) {
      errors.push(
        `DOMAIN_BLUEPRINT should describe four domains as {min, max}; parsed ${entries.length}.`,
      );
    }
    for (const [, roman, min, max] of entries) {
      if (Number(min) > Number(max)) {
        errors.push(`DOMAIN_BLUEPRINT.${roman} has min ${min} above max ${max}.`);
      }
    }
    if (entries.length === 4) {
      const lo = entries.reduce((n, e) => n + Number(e[2]), 0);
      const hi = entries.reduce((n, e) => n + Number(e[3]), 0);
      notes.push(`blueprint: four domains, ${lo}-${hi} questions per exam form (counts, not percentages)`);
      if (lo === 100 || hi === 100) {
        errors.push(
          "DOMAIN_BLUEPRINT sums to 100, which suggests percentages. The published figures are question counts.",
        );
      }
    }
  }
}

/* -- the date is real, and is not a promise about the future ------------ */

let ageDays = null;
if (reviewed) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewed)) {
    errors.push(
      `contextReviewed must be ISO 8601 (YYYY-MM-DD); got "${reviewed}".`,
    );
  } else {
    const then = new Date(`${reviewed}T00:00:00Z`);
    if (Number.isNaN(then.getTime())) {
      errors.push(`contextReviewed "${reviewed}" is not a real date.`);
    } else {
      const now = new Date();
      ageDays = Math.floor((now - then) / 86_400_000);
      if (ageDays < 0) {
        errors.push(
          `contextReviewed "${reviewed}" is in the future. The field records a check that happened, not one that is planned.`,
        );
      }
    }
  }
}

/* -- prose and field cannot drift --------------------------------------- */

if (version && context) {
  // "v2.1" in the field should appear as "2.1" somewhere in the sentence.
  const bare = version.replace(/^v/i, "");
  if (!context.includes(bare)) {
    errors.push(
      `contextVersion is "${version}" but the \`context\` sentence never mentions ${bare}. The version a learner reads and the version a script reads must be the same one.`,
    );
  }
}

if (authority && context) {
  // The authority's distinguishing word should appear in the prose too.
  const key = authority.split(/\s+/)[0];
  if (!context.includes(key)) {
    errors.push(
      `contextAuthority is "${authority}" but "${key}" never appears in the \`context\` sentence.`,
    );
  }
}

/* -- structural claim matches the content ------------------------------- */

const domainCount = (
  registry.match(/aigpDomains/g) ? readFileSync(
    join(root, "src/content/tracks/aigp-preparation/questions.json"),
    "utf8",
  ) : "[]"
);
const domains = new Set(JSON.parse(domainCount).map((q) => q.domain));
if (context.includes("four-domain") && domains.size !== 4) {
  errors.push(
    `\`context\` claims a four-domain structure but the content has ${domains.size} domains.`,
  );
}

/* -- traceability: every sub-domain must have at least one question ----- */

/**
 * AIGP BoK v2.1 exam blueprint, read from the published document. The numbers
 * are the min/max questions the *exam* draws from each competency — not a
 * prescription for a practice bank. They are used here only as a proportional
 * signal, which is meaningful because the bank (82) and the exam (~85) happen
 * to be close in size.
 */
const BLUEPRINT = [
  ["I.A", 4, 6], ["I.B", 5, 7], ["I.C", 6, 8],
  ["II.A", 4, 6], ["II.B", 4, 6], ["II.C", 6, 8], ["II.D", 3, 5],
  ["III.A", 6, 8], ["III.B", 6, 8], ["III.C", 8, 10],
  ["IV.A", 6, 8], ["IV.B", 5, 7], ["IV.C", 9, 11],
];

const enrichment = readFileSync(
  join(root, "src/content/tracks/aigp-preparation/enrichment.ts"),
  "utf8",
);
const tagged = {};
for (const m of enrichment.matchAll(/bokSubdomain:\s*"([^"]+)"/g)) {
  tagged[m[1]] = (tagged[m[1]] ?? 0) + 1;
}
const questionCount = JSON.parse(
  readFileSync(join(root, "src/content/tracks/aigp-preparation/questions.json"), "utf8"),
).length;
const taggedTotal = Object.values(tagged).reduce((a, b) => a + b, 0);

if (taggedTotal !== questionCount) {
  errors.push(
    `${taggedTotal} of ${questionCount} questions carry a bokSubdomain. Coverage cannot be computed from a partial mapping.`,
  );
}

const known = new Set(BLUEPRINT.map(([id]) => id));
for (const id of Object.keys(tagged)) {
  if (!known.has(id)) {
    errors.push(`bokSubdomain "${id}" is not a sub-domain of the recorded version.`);
  }
}

const uncovered = BLUEPRINT.filter(([id]) => !tagged[id]).map(([id]) => id);
if (uncovered.length) {
  errors.push(
    `No questions map to ${uncovered.join(", ")}. Either write scenarios for them or stop claiming full sub-domain coverage.`,
  );
}

/* -- report ------------------------------------------------------------- */

console.log("Body of Knowledge assertion");
console.log(`  authority  ${authority ?? "—"}`);
console.log(`  version    ${version ?? "—"}`);
console.log(`  reviewed   ${reviewed ?? "—"}${ageDays !== null ? `  (${ageDays} days ago)` : ""}`);
console.log(`  domains    ${domains.size}`);
console.log(`  coverage   ${BLUEPRINT.length - uncovered.length}/${BLUEPRINT.length} sub-domains, ${taggedTotal}/${questionCount} questions mapped`);
console.log();

console.log("Traceability against the v2.1 exam blueprint");
console.log("  sub-domain  exam  bank  ");
for (const [id, lo, hi] of BLUEPRINT) {
  const n = tagged[id] ?? 0;
  const flag = n === 0 ? "  NOT COVERED" : n < lo ? "  under" : n > hi ? "  over" : "";
  console.log(`  ${id.padEnd(10)} ${`${lo}-${hi}`.padStart(5)} ${String(n).padStart(5)}${flag}`);
}
console.log();
console.log("  `under`/`over` compare bank counts to the exam's own weighting.");
console.log("  They are proportional signals, not failures — a practice bank is");
console.log("  not obliged to mirror an exam. Coverage gaps are failures.");
console.log();

if (errors.length) {
  for (const e of errors) console.error(`FAIL  ${e}`);
  console.error(`\n${errors.length} problem(s) with the maintenance assertion.`);
  process.exit(1);
}

console.log("Assertion is well-formed and consistent with the content.");
console.log();
console.log("The authority reviews its BoK annually and gives at least 90 days'");
console.log("notice before changed content reaches the exam. Re-check on an event,");
console.log("not on a calendar of our own:");
console.log("  - the authority publishes a new Body of Knowledge version");
console.log("  - the authority changes the exam blueprint");
console.log("  - the domain structure changes materially");
console.log("  - content is added that claims coverage beyond what was checked");
console.log();
console.log("Procedure: docs/bok-maintenance.md");
for (const n of notes) console.log(n);
