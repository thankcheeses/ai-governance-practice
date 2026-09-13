import assert from "node:assert/strict";
import { test } from "node:test";
import { BLUEPRINT_SOURCE, DOMAIN_BLUEPRINT } from "@/content/bok";
import {
  midpointOf,
  planDrill,
  questionsByDomain,
  shortfallNote,
} from "./blueprint-drill";

/**
 * The blueprint is a factual claim about someone else's published document, so
 * these assertions are about fidelity as much as arithmetic: the numbers must
 * stay what was read out of the source, they must stay ranges rather than
 * collapsing into invented points, and a drill the bank cannot fill must say so
 * rather than quietly returning a different shape.
 */

test("the recorded blueprint matches the published document", () => {
  // Read from AIGP BoK v2.1, pages 4-9. If the authority republishes, this
  // fails and forces a fresh reading rather than a silent drift.
  assert.deepEqual(DOMAIN_BLUEPRINT, {
    I: { min: 16, max: 20 },
    II: { min: 19, max: 23 },
    III: { min: 21, max: 25 },
    IV: { min: 21, max: 25 },
  });
  assert.equal(BLUEPRINT_SOURCE.version, "2.1");
  assert.equal(BLUEPRINT_SOURCE.effectiveDate, "2026-02-02");
  assert.equal(BLUEPRINT_SOURCE.pages, "4-9");
});

test("the blueprint is question counts, not percentages", () => {
  const lo = Object.values(DOMAIN_BLUEPRINT).reduce((n, d) => n + d.min, 0);
  const hi = Object.values(DOMAIN_BLUEPRINT).reduce((n, d) => n + d.max, 0);
  assert.equal(lo, 77);
  assert.equal(hi, 93);
  // The tell that someone has converted them: percentages sum to 100.
  assert.notEqual(lo, 100);
  assert.notEqual(hi, 100);
});

test("every domain is a range, never a single point", () => {
  for (const [roman, d] of Object.entries(DOMAIN_BLUEPRINT)) {
    assert.ok(d.max > d.min, `${roman} collapsed to a point — the source publishes a span`);
  }
});

test("a drill the length of an exam reproduces the published midpoints", () => {
  // 85 is the midpoint of the 77-93 span, so the apportionment should land
  // exactly on each domain's own midpoint. This is the arithmetic's sanity check.
  const plan = planDrill(85);
  assert.deepEqual(
    plan.allocations.map((a) => a.allocated),
    [midpointOf("I"), midpointOf("II"), midpointOf("III"), midpointOf("IV")],
  );
  assert.deepEqual(plan.allocations.map((a) => a.allocated), [18, 21, 23, 23]);
});

test("the parts always sum to exactly what was requested", () => {
  // Four independent roundings would land on 24 or 26 about as often as 25.
  for (const n of [5, 7, 10, 13, 25, 33, 50, 85]) {
    const plan = planDrill(n);
    assert.equal(plan.total, n, `requested ${n}, allocated ${plan.total}`);
  }
});

test("emphasis follows the blueprint, not the bank", () => {
  const plan = planDrill(25);
  const by = Object.fromEntries(plan.allocations.map((a) => [a.roman, a.allocated]));
  // Domain I has the smallest published range and must get the smallest share,
  // even though the bank holds plenty of Domain I questions.
  assert.ok(by.I < by.II, "I should draw less than II");
  assert.ok(by.II < by.III, "II should draw less than III");
  assert.equal(by.III, by.IV, "III and IV share a published range");
});

test("the real bank can fill a 25-question drill without shortfall", () => {
  const plan = planDrill(25);
  assert.equal(plan.short, false);
  assert.equal(shortfallNote(plan), null);
  for (const a of plan.allocations) {
    assert.equal(a.shortfall, 0);
    assert.ok(a.available >= a.allocated);
  }
});

test("a request larger than the bank reports the shortfall rather than repeating", () => {
  const byDomain = questionsByDomain();
  const smallest = Math.min(...Object.values(byDomain).map((ids) => ids.length));
  // Ask for far more than any domain holds.
  const plan = planDrill(smallest * 12);
  assert.ok(plan.short, "a request this large must be short somewhere");
  assert.ok(plan.total < plan.requested, "total must fall short, not pad");

  const note = shortfallNote(plan);
  assert.ok(note, "a short plan must produce a note");
  assert.match(note, /of/);
  assert.match(note, /Domain/);
  // Terse enough to survive the truncated session label.
  assert.ok(note.length < 80, `note is ${note.length} chars — it will be truncated away`);

  // Never allocate more than exists. That is the silent-reuse failure.
  for (const a of plan.allocations) assert.ok(a.allocated <= a.available);
});

test("every question maps into exactly one blueprint domain", () => {
  const byDomain = questionsByDomain();
  const all = Object.values(byDomain).flat();
  assert.equal(new Set(all).size, all.length, "a question was counted twice");
  assert.equal(all.length, 296, "every question should belong to a domain");
});
