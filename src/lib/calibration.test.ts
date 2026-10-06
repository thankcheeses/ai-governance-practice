import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GAP_THRESHOLD,
  MIN_ATTEMPTS,
  MIN_FOR_NORM,
  MIN_PER_BUCKET,
  assessCalibration,
  classifyMiss,
  medianResponseMs,
  missBreakdown,
} from "./calibration";
import type { Attempt, Confidence } from "./types";

/**
 * Calibration makes a claim about a learner's self-knowledge, which is a more
 * personal thing to be wrong about than accuracy. So most of these assertions
 * are about the refusals: what it must not say, and how much evidence it
 * demands before saying anything.
 */

let seq = 0;
function attempt(
  correct: boolean,
  confidence: Confidence | null,
  responseTimeMs = 30_000,
  questionId?: string,
): Attempt {
  // Incremented in the body, not in a default parameter. Putting `++seq` in
  // the default for questionId meant it never ran when a questionId was passed
  // explicitly — so every attempt in the dedup tests shared one id and one
  // timestamp, and those tests passed even with dedup removed entirely.
  const n = ++seq;
  return {
    id: `a-${n}`,
    trackId: "aigp-preparation",
    questionId: questionId ?? `q-${n}`,
    selected: ["o1"],
    correct,
    responseTimeMs,
    difficulty: "applied",
    domain: "Foundations of AI Governance",
    confidence,
    createdAt: new Date(2026, 0, 1, 0, 0, n).toISOString(),
    mode: "practice",
  };
}

function many(n: number, correct: boolean, confidence: Confidence | null): Attempt[] {
  return Array.from({ length: n }, () => attempt(correct, confidence));
}

/* ------------------------------------------------------------- refusals -- */

test("says nothing at all below the evidence floor", () => {
  const c = assessCalibration(many(MIN_ATTEMPTS - 1, false, "confident"));
  assert.equal(c.verdict, "insufficient");
  assert.equal(c.headline, null, "a headline was produced on thin evidence");
});

test("an empty history is insufficient, not calibrated", () => {
  const c = assessCalibration([]);
  assert.equal(c.verdict, "insufficient");
  assert.equal(c.headline, null);
});

test("unrated attempts never count toward the floor", () => {
  // Confidence is optional in the UI, so a learner can have hundreds of
  // attempts and no calibration data. That must read as "not yet", not as a
  // verdict computed from nothing.
  const c = assessCalibration(many(200, false, null));
  assert.equal(c.verdict, "insufficient");
  assert.equal(c.rated, 0);
  assert.equal(c.unrated, 200);
  assert.equal(c.headline, null);
});

test("a thin confident bucket blocks a verdict even when the total is large", () => {
  // Plenty of rated answers, but almost none of them confident — the claim is
  // about the confident ones, so there is nothing to say.
  const c = assessCalibration([
    ...many(MIN_ATTEMPTS + 10, true, "guessed"),
    ...many(MIN_PER_BUCKET - 1, false, "confident"),
  ]);
  assert.equal(c.verdict, "insufficient");
});

/* -------------------------------------------------------------- verdict -- */

test("being wrong when confident reads as overconfidence", () => {
  const c = assessCalibration([
    ...many(6, false, "confident"),
    ...many(4, true, "confident"),
    ...many(6, true, "unsure"),
  ]);
  assert.equal(c.verdict, "overconfident");
  assert.match(c.headline!, /40%/);
  assert.match(c.headline!, /slowing down/);
});

test("being right when confident reads as calibrated, not as praise", () => {
  const c = assessCalibration([
    ...many(9, true, "confident"),
    ...many(1, false, "confident"),
    ...many(6, true, "unsure"),
  ]);
  assert.equal(c.verdict, "calibrated");
  assert.doesNotMatch(c.headline!, /excellent|great|well done|perfect/i);
});

test("underconfidence is reported too, and does not read as a problem", () => {
  // 100% on the confident bucket is 15 points above implied, which is inside
  // the threshold; the signal has to come from elsewhere being low. A learner
  // who is right far more than they claim is told so.
  const c = assessCalibration([
    ...many(MIN_PER_BUCKET + 8, true, "confident"),
    ...many(6, true, "guessed"),
  ]);
  assert.ok(["calibrated", "underconfident"].includes(c.verdict));
  if (c.verdict === "underconfident") {
    assert.match(c.headline!, /better than you think|know this better/i);
  }
});

test("guessing wrong is never held against the learner", () => {
  // Wrong on everything guessed, right on everything confident. That is
  // well-calibrated behavior and must not be reported as a failure.
  const c = assessCalibration([
    ...many(10, true, "confident"),
    ...many(10, false, "guessed"),
  ]);
  assert.notEqual(c.verdict, "overconfident");
});

test("the threshold is exact", () => {
  // Implied accuracy for "confident" is 85. A bucket at exactly 85 −
  // GAP_THRESHOLD must trip; one point better must not.
  const target = 85 - GAP_THRESHOLD; // 65
  const n = 20;
  const trip = assessCalibration([
    ...many((target / 100) * n, true, "confident"),
    ...many(n - (target / 100) * n, false, "confident"),
  ]);
  assert.equal(trip.verdict, "overconfident");

  const safe = assessCalibration([
    ...many(14, true, "confident"),
    ...many(6, false, "confident"),
  ]); // 70%
  assert.equal(safe.verdict, "calibrated");
});

/* ----------------------------------------------------------------- dedup -- */

test("reviewing one question repeatedly cannot manufacture a verdict", () => {
  // /review re-serves the same question by design. Without dedup, one item
  // answered twenty times would look like twenty pieces of evidence.
  const repeated = Array.from({ length: 20 }, () =>
    attempt(false, "confident", 30_000, "same-question"),
  );
  const c = assessCalibration(repeated);
  assert.equal(c.rated, 1, "the same question was counted more than once");
  assert.equal(c.verdict, "insufficient");
});

test("dedup keeps the most recent attempt, not the first", () => {
  const older = attempt(false, "confident", 30_000, "q-x");
  const newer = { ...attempt(true, "confident", 30_000, "q-x"), createdAt: "2027-01-01T00:00:00.000Z" };
  const c = assessCalibration([older, newer]);
  const confident = c.buckets.find((b) => b.confidence === "confident")!;
  assert.equal(confident.answered, 1);
  assert.equal(confident.correct, 1, "kept the stale attempt");
});

/* ------------------------------------------------------------- misstype -- */

test("there is no personal norm below the floor", () => {
  assert.equal(medianResponseMs(many(MIN_FOR_NORM - 1, true, null)), null);
  assert.equal(classifyMiss(attempt(false, null, 1_000), null), "unknown");
});

test("a miss far faster than the learner's own norm is rushed", () => {
  const median = 60_000;
  assert.equal(classifyMiss(attempt(false, null, 20_000), median), "rushed");
  assert.equal(classifyMiss(attempt(false, null, 55_000), median), "considered");
});

test("the norm is the learner's own, not a fixed number of seconds", () => {
  // A fast reader answering in 8s and a slow one answering in 40s are both
  // engaging fully. A fixed threshold would call the first careless.
  const fast = Array.from({ length: 12 }, () => attempt(true, null, 8_000));
  const slow = Array.from({ length: 12 }, () => attempt(true, null, 80_000));
  assert.equal(classifyMiss(attempt(false, null, 7_000), medianResponseMs(fast)), "considered");
  assert.equal(classifyMiss(attempt(false, null, 7_000), medianResponseMs(slow)), "rushed");
});

test("a couple of fast misses is noise and says nothing", () => {
  const history = [
    ...Array.from({ length: 12 }, () => attempt(true, null, 60_000)),
    attempt(false, null, 5_000),
  ];
  assert.equal(missBreakdown(history).headline, null);
});

test("enough misses but little rushing still says nothing", () => {
  // Isolates the share threshold from the volume threshold. Without this,
  // setting the share to zero passed the suite — the only test covering it
  // was already blocked by having too few classified misses to speak at all.
  const history = [
    ...Array.from({ length: 20 }, () => attempt(true, null, 60_000)),
    ...Array.from({ length: 2 }, () => attempt(false, null, 5_000)),
    ...Array.from({ length: 12 }, () => attempt(false, null, 70_000)),
  ];
  const b = missBreakdown(history);
  assert.equal(b.rushed, 2);
  assert.equal(b.considered, 12);
  assert.equal(b.headline, null, "reported rushing from a 14% share");
});

test("rushing is reported only once it is a real share of the misses", () => {
  const history = [
    ...Array.from({ length: 20 }, () => attempt(true, null, 60_000)),
    ...Array.from({ length: 8 }, () => attempt(false, null, 5_000)),
    ...Array.from({ length: 6 }, () => attempt(false, null, 70_000)),
  ];
  const b = missBreakdown(history);
  assert.equal(b.rushed, 8);
  assert.equal(b.considered, 6);
  assert.match(b.headline!, /reading problem rather than a knowledge one/);
});

test("nothing here ever predicts an outcome", () => {
  const c = assessCalibration([
    ...many(6, false, "confident"),
    ...many(4, true, "confident"),
    ...many(6, true, "unsure"),
  ]);
  const text = `${c.headline ?? ""} ${missBreakdown(many(30, false, null)).headline ?? ""}`;
  for (const forbidden of [/pass/i, /fail/i, /ready/i, /predict/i, /score of/i, /likely to/i]) {
    assert.doesNotMatch(text, forbidden, `calibration copy implied a prediction: ${forbidden}`);
  }
});
