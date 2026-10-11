import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * The exam score is a record of the sitting, and a record you can go back and
 * improve is not a record.
 *
 * Redemption was asked for as a way to bring the score up. During the exam that
 * would have destroyed what exam mode simulates; after it, editing the number
 * would be worse — so the feature reports its own recovery count instead and
 * leaves the score alone. That separation is the whole design, and it is the
 * kind that erodes quietly: one reasonable-looking change to "reflect the
 * second attempt" and the number stops meaning what the screen says it means.
 *
 * Source-shape tests, for the reason `theme-init-placement.test.ts` and
 * `gpai-modules.test.ts` are: the behavior needs a DOM to observe, the runner
 * has none, and the alternative to asserting on the source is asserting
 * nothing.
 */
const REDEMPTION = "src/components/exam/exam-redemption.tsx";
const RESULTS = "src/components/exam/exam-results.tsx";

test("redemption cannot rescore, re-record or re-submit the sitting", () => {
  const source = readFileSync(REDEMPTION, "utf8");

  // Each of these is a real way the score could move. `scoreExam` recomputes
  // it, `writeResult`/`resultFromExam` persist a result record, and assigning
  // into `session` would change the input the score is derived from.
  for (const forbidden of [
    /\bscoreExam\b/,
    /\bwriteResult\b/,
    /\bresultFromExam\b/,
    /\bclearActiveSession\b/,
    /session\.answers\s*\[/,
    /session\.\w+\s*=[^=]/,
  ]) {
    assert.ok(
      !forbidden.test(source),
      `${REDEMPTION} matches ${forbidden} — the exam score must stay a record ` +
        "of the sitting, not something a later attempt can edit",
    );
  }
});

test("redemption receives the sitting read-only", () => {
  const source = readFileSync(REDEMPTION, "utf8");
  // No setter, no dispatch, no callback that could write upward. The props are
  // the session and the ids it missed, and that is all.
  for (const forbidden of [/setSession/, /onScoreChange/, /updateSession/]) {
    assert.ok(
      !forbidden.test(source),
      `${REDEMPTION} matches ${forbidden} — it must not be able to change the sitting`,
    );
  }
});

test("the results screen computes its score before redemption can run", () => {
  /*
    Ordering matters as well as capability. `result` is derived from `session`
    by `scoreExam` at the top of the component; the redemption element is
    rendered from that same already-computed value. If the score were ever
    derived from something redemption touched, this would be the line to catch
    it.
  */
  const source = readFileSync(RESULTS, "utf8");
  const scored = source.indexOf("scoreExam(session)");
  const rendered = source.indexOf("<ExamRedemption");
  assert.ok(scored >= 0, "the results screen no longer scores the exam here");
  assert.ok(rendered >= 0, "the results screen no longer renders redemption");
  assert.ok(
    scored < rendered,
    "redemption is rendered before the score is computed — the score must be " +
      "settled from the submitted sitting first",
  );
});

test("redemption does record an attempt and move the schedule", () => {
  // The other half: it must not be inert. A second look that changed nothing
  // at all would leave the question coming back exactly as often, which is the
  // thing it is supposed to fix.
  const source = readFileSync(REDEMPTION, "utf8");
  assert.match(source, /recordAnswer\(/, "no attempt is recorded");
  assert.match(source, /gradeReview\(/, "the review schedule is never updated");
  assert.match(
    source,
    /gradeReview\([^)]*right \? "good" : "again"/,
    "the schedule does not reflect whether the second look succeeded",
  );
});

test("options are re-shuffled rather than re-dealt in the exam's order", () => {
  /*
    Re-presenting a question in its original layout lets a learner pass on
    "it was the third one" without understanding it, which is the opposite of
    what a second look is for. The seed is derived from the sitting's, so the
    order still survives a re-render.
  */
  const source = readFileSync(REDEMPTION, "utf8");
  assert.match(source, /presentOptions\(/, "options are not presented at all");
  assert.ok(
    !/sitting\.options/.test(source),
    "redemption re-deals the exam's own option order, so position can be memorised",
  );
  assert.match(
    source,
    /session\.seed \^/,
    "the option order is not derived from the sitting's seed",
  );
});
