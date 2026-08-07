import assert from "node:assert/strict";
import { test } from "node:test";
import { getTrackQuestions } from "@/content/registry";
import { SUBDOMAINS } from "@/content/bok";
import {
  bandFor,
  domainSlices,
  focusAreas,
  overallStats,
  strongestArea,
  subdomainOf,
  subdomainSlices,
  weakAreaQuestionIds,
  weakestArea,
} from "./analytics";
import { emptyProgress, type Attempt, type UserProgress } from "./types";

const ALL = getTrackQuestions("aigp-preparation");

/** Build progress from a list of [questionId, correct] pairs. */
function progressWith(pairs: [string, boolean][]): UserProgress {
  const attempts: Attempt[] = pairs.map(([questionId, correct], i) => {
    const q = ALL.find((x) => x.id === questionId);
    if (!q) throw new Error(`fixture references unknown question ${questionId}`);
    return {
      id: `${questionId}-${i}`,
      trackId: "aigp-preparation",
      questionId,
      selected: correct ? [q.correctOptionIds[0]] : [`${questionId}-o9`],
      correct,
      responseTimeMs: 1000,
      difficulty: q.difficulty,
      domain: q.domain,
      confidence: null,
      createdAt: new Date().toISOString(),
      mode: "practice",
    };
  });
  return { ...emptyProgress(), attempts };
}

/** N questions from one sub-domain, as [id, correct] pairs. */
function fromSubdomain(sub: string, n: number, correct: boolean): [string, boolean][] {
  return ALL.filter((q) => q.bokSubdomain === sub)
    .slice(0, n)
    .map((q) => [q.id, correct] as [string, boolean]);
}

/* ---------------------------------------------------------------- bands -- */

test("bands follow the stated thresholds, including the boundaries", () => {
  assert.equal(bandFor(100), "strong");
  assert.equal(bandFor(80), "strong");
  assert.equal(bandFor(79), "moderate");
  assert.equal(bandFor(60), "moderate");
  assert.equal(bandFor(59), "focus");
  assert.equal(bandFor(0), "focus");
});

/* ------------------------------------------------------------ empty state -- */

test("no answered questions yields an explicit empty state, not a zero score", () => {
  const s = overallStats(emptyProgress());
  assert.equal(s.hasData, false);
  assert.equal(s.answered, 0);
  assert.equal(s.accuracy, 0);
  assert.equal(s.available, ALL.length);
});

test("empty history produces no focus areas and no strongest or weakest", () => {
  const p = emptyProgress();
  assert.deepEqual(focusAreas(p), []);
  assert.equal(strongestArea(p), undefined);
  assert.equal(weakestArea(p), undefined);
  assert.deepEqual(weakAreaQuestionIds(p), []);
});

test("every sub-domain still appears with zero answered on an empty history", () => {
  const slices = subdomainSlices(emptyProgress());
  assert.equal(slices.length, SUBDOMAINS.length);
  assert.ok(slices.every((s) => s.answered === 0 && s.available > 0));
});

/* ------------------------------------------------------------ percentages -- */

test("overall accuracy is correct answers over answers, rounded", () => {
  const p = progressWith([
    ...fromSubdomain("I.A", 3, true),
    ...fromSubdomain("I.B", 1, false),
  ]);
  const s = overallStats(p);
  assert.equal(s.answered, 4);
  assert.equal(s.correct, 3);
  assert.equal(s.accuracy, 75);
  assert.equal(s.hasData, true);
});

test("a perfect score reports 100 and produces no focus areas", () => {
  const pairs = SUBDOMAINS.flatMap((s) => fromSubdomain(s.id, 3, true));
  const p = progressWith(pairs);
  assert.equal(overallStats(p).accuracy, 100);
  assert.deepEqual(focusAreas(p), []);
  assert.deepEqual(weakAreaQuestionIds(p), []);
  assert.equal(strongestArea(p)?.accuracy, 100);
});

test("repeat attempts on one question count separately in accuracy but once in seen", () => {
  const [id] = ALL.map((q) => q.id);
  const p = progressWith([[id, false], [id, true]]);
  const s = overallStats(p);
  assert.equal(s.answered, 2);
  assert.equal(s.accuracy, 50);
  assert.equal(s.seen, 1);
});

/* ------------------------------------------------------------ aggregation -- */

test("sub-domain is derived from the question id, not stored on the attempt", () => {
  const q = ALL[0];
  const p = progressWith([[q.id, true]]);
  assert.equal(subdomainOf(p.attempts[0]), q.bokSubdomain);
  // The attempt itself carries no sub-domain field.
  assert.equal("bokSubdomain" in p.attempts[0], false);
});

test("an attempt referencing a removed question is ignored rather than throwing", () => {
  const p = progressWith([[ALL[0].id, true]]);
  p.attempts.push({ ...p.attempts[0], id: "x", questionId: "aigp-999" });
  assert.equal(subdomainOf(p.attempts[1]), undefined);
  const total = subdomainSlices(p).reduce((n, s) => n + s.answered, 0);
  assert.equal(total, 1, "the dangling attempt is excluded from every slice");
});

test("domain aggregation totals match the attempts supplied", () => {
  const p = progressWith([
    ...fromSubdomain("I.A", 3, true),
    ...fromSubdomain("III.B", 2, false),
  ]);
  const slices = domainSlices(p);
  assert.equal(slices.reduce((n, s) => n + s.answered, 0), 5);
  const foundations = slices.find((s) => s.id === "Foundations of AI Governance");
  assert.equal(foundations?.correct, 3);
  assert.equal(foundations?.accuracy, 100);
});

test("sub-domain aggregation is independent of the track's own domain field", () => {
  // Item 26 is filed under Foundations but tests III.C.
  const q26 = ALL.find((q) => q.id === "aigp-026");
  assert.ok(q26, "fixture question exists");
  assert.equal(q26.domain, "Foundations of AI Governance");
  assert.equal(q26.bokSubdomain, "III.C");
  const p = progressWith([[q26.id, false]]);
  assert.equal(domainSlices(p).find((s) => s.id === q26.domain)?.answered, 1);
  assert.equal(subdomainSlices(p).find((s) => s.id === "III.C")?.answered, 1);
});

test("sub-domain availability sums to the size of the bank", () => {
  const total = subdomainSlices(emptyProgress()).reduce(
    (n, s) => n + s.available,
    0,
  );
  assert.equal(total, ALL.length);
});

/* --------------------------------------------------------- weak areas -- */

test("weak areas are identified and ordered weakest first", () => {
  const p = progressWith([
    ...fromSubdomain("II.C", 4, false), //   0%
    ...fromSubdomain("III.C", 4, true),
    ...fromSubdomain("I.C", 3, false), //    0%, fewer attempts
    ...fromSubdomain("IV.A", 3, true),
  ]);
  const focus = focusAreas(p);
  assert.ok(focus.length >= 2);
  assert.equal(focus[0].id, "II.C", "tie on accuracy breaks toward more evidence");
  assert.ok(focus.every((f) => f.accuracy < 80));
  assert.ok(focus.every((f) => f.recommendation.length > 20));
});

test("a sub-domain below the evidence threshold is unmeasured, not weak", () => {
  const p = progressWith(fromSubdomain("II.B", 2, false));
  assert.deepEqual(focusAreas(p), [], "two wrong answers is not yet a weakness");
  assert.equal(weakestArea(p), undefined);
});

test("strongest and weakest ignore sub-domains without enough evidence", () => {
  const p = progressWith([
    ...fromSubdomain("I.A", 4, true), //   100% with evidence
    ...fromSubdomain("II.B", 1, false), //   0% but only one attempt
  ]);
  assert.equal(strongestArea(p)?.id, "I.A");
  assert.equal(weakestArea(p)?.id, "I.A", "the single-attempt slice is excluded");
});

test("a weak-area drill draws only from the weak sub-domains", () => {
  const p = progressWith([
    ...fromSubdomain("II.C", 4, false),
    ...fromSubdomain("I.A", 4, true),
  ]);
  const ids = weakAreaQuestionIds(p, "aigp-preparation", 15);
  assert.ok(ids.length > 0);
  const subs = new Set(
    ids.map((id) => ALL.find((q) => q.id === id)?.bokSubdomain),
  );
  const focusIds = new Set(focusAreas(p).map((f) => f.id));
  assert.ok([...subs].every((s) => focusIds.has(s!)), `drew from ${[...subs]}`);
  assert.ok(!ids.some((id) => ALL.find((q) => q.id === id)?.bokSubdomain === "I.A"));
});

test("a weak-area drill puts unseen questions before ones already answered", () => {
  const answered = fromSubdomain("II.C", 4, false);
  const p = progressWith(answered);
  const ids = weakAreaQuestionIds(p, "aigp-preparation", 15);
  const answeredIds = new Set(answered.map(([id]) => id));
  const firstSeenIndex = ids.findIndex((id) => answeredIds.has(id));
  const lastUnseenIndex = ids.reduce(
    (acc, id, i) => (answeredIds.has(id) ? acc : i),
    -1,
  );
  if (firstSeenIndex !== -1 && lastUnseenIndex !== -1) {
    assert.ok(lastUnseenIndex < firstSeenIndex, "unseen questions come first");
  }
});

test("a weak-area drill respects the requested count", () => {
  const p = progressWith(fromSubdomain("IV.C", 4, false));
  assert.ok(weakAreaQuestionIds(p, "aigp-preparation", 5).length <= 5);
});
