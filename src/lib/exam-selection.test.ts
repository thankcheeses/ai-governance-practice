import assert from "node:assert/strict";
import { test } from "node:test";
import { domainOf } from "@/content/bok";
import { getTrackQuestions } from "@/content/registry";
import { createExamSession } from "./exam";

/**
 * What an exam is allowed to deal.
 *
 * This file exists because the defect it guards against was invisible from
 * every surface the product has. The exam ran, scored correctly, and reported
 * honest per-domain figures — while drawing all 33 foundational questions
 * first on every sitting and never once reaching an advanced one. Measured
 * over five seeds before the fix: a 50-question exam dealt 33 / 17 / 0 across
 * the tiers and a 100-question exam dealt 33 / 67 / 0, so 142 advanced
 * questions, 41% of the bank, were unreachable through an exam at any length.
 *
 * Nothing failed. The only way to see it was to count, which is what this does.
 *
 * The assertions are deliberately loose bands rather than fixed counts: a
 * sample should look like the bank, and pinning exact numbers would break on
 * every content addition without catching anything a band does not.
 */
const SEEDS = [11, 2026, 777, 90210, 5, 31337];
const BY_ID = new Map(getTrackQuestions().map((q) => [q.id, q]));

function deal(count: number, seed: number) {
  const session = createExamSession({ trackId: "aigp-preparation", count, seed });
  return session.questionIds.map((id) => {
    const q = BY_ID.get(id);
    assert.ok(q, `exam dealt ${id}, which is not in the bank`);
    return q!;
  });
}

test("an exam reaches every difficulty tier", () => {
  for (const count of [25, 50, 100]) {
    for (const seed of SEEDS) {
      const tiers = new Set(deal(count, seed).map((q) => q.difficulty));
      assert.ok(
        tiers.has("advanced"),
        `${count}-question exam on seed ${seed} contains no advanced question`,
      );
      assert.ok(
        tiers.has("applied"),
        `${count}-question exam on seed ${seed} contains no applied question`,
      );
    }
  }
});

test("no single tier dominates an exam", () => {
  // The bank is roughly 9% foundational, 50% applied, 41% advanced. A sample
  // that lets any tier past 70% is not sampling, it is sorting — which is
  // exactly what the old difficulty weighting did.
  for (const count of [50, 100]) {
    for (const seed of SEEDS) {
      const dealt = deal(count, seed);
      const counts = new Map<string, number>();
      for (const q of dealt) counts.set(q.difficulty, (counts.get(q.difficulty) ?? 0) + 1);
      for (const [tier, n] of counts) {
        const share = n / dealt.length;
        assert.ok(
          share <= 0.7,
          `${count}q seed ${seed}: ${tier} holds ${(share * 100).toFixed(0)}% of the paper`,
        );
      }
    }
  }
});

test("no domain can vanish from an exam", () => {
  /*
    The per-draw check is deliberately only "present at all", because a 50-item
    sample genuinely does swing: Domain I is 19.7% of the bank, so a draw of 3
    is about 2.4 standard deviations low and will turn up legitimately. An
    assertion tight enough to call that a bug would fail on honest randomness.

    Absence is different. Two sittings in the QA runs gave Domain IV a single
    question out of fifty, and a sweep over 300 seeds then found draws with
    none at all — roughly a 4-in-10-million event under a fair draw, so not
    one. Systematic bias is caught by the next test instead.
  */
  for (const count of [50, 100]) {
    for (const seed of SEEDS) {
      const dealt = deal(count, seed);
      const counts = new Map<string, number>();
      for (const q of dealt) {
        const d = domainOf(q.bokSubdomain);
        assert.ok(d, `${q.id} has sub-domain ${q.bokSubdomain}, which maps to no domain`);
        counts.set(d, (counts.get(d) ?? 0) + 1);
      }
      for (const domain of ["I", "II", "III", "IV"]) {
        assert.ok(
          (counts.get(domain) ?? 0) > 0,
          `${count}q seed ${seed}: domain ${domain} is absent from the paper`,
        );
      }
    }
  }
});

test("over many seeds, an exam samples the bank's own shape", () => {
  /*
    This is the assertion that would have caught the jitter defect, and it is
    the one that catches a future one: a biased hash leaves the means wrong
    even when no single draw looks odd. Before the avalanche step was added
    every domain's mean was roughly right but its minimum was zero; a weighted
    or filtered selector would instead move the means.

    Averaged over 120 seeds, each domain's share must sit within 4 points of
    its share of the bank. Exam selection is not blueprint-apportioned — that
    is a separate change — so the bank is the correct reference here, not the
    published weights.
  */
  const bank = new Map<string, number>();
  for (const q of getTrackQuestions()) {
    const d = domainOf(q.bokSubdomain);
    assert.ok(d, `${q.id} has sub-domain ${q.bokSubdomain}, which maps to no domain`);
    bank.set(d, (bank.get(d) ?? 0) + 1);
  }
  const total = getTrackQuestions().length;

  const count = 50;
  const runs = 120;
  const seen = new Map<string, number>();
  for (let seed = 1; seed <= runs; seed++) {
    for (const q of deal(count, seed)) {
      const d = domainOf(q.bokSubdomain)!;
      seen.set(d, (seen.get(d) ?? 0) + 1);
    }
  }

  for (const domain of ["I", "II", "III", "IV"]) {
    const dealtShare = ((seen.get(domain) ?? 0) / (runs * count)) * 100;
    const bankShare = ((bank.get(domain) ?? 0) / total) * 100;
    assert.ok(
      Math.abs(dealtShare - bankShare) <= 4,
      `domain ${domain}: exams deal ${dealtShare.toFixed(1)}% against ${bankShare.toFixed(1)}% of the bank`,
    );
  }
});

test("an exam deals the requested number of distinct questions", () => {
  for (const count of [25, 50, 100]) {
    const ids = createExamSession({ trackId: "aigp-preparation", count, seed: 7 }).questionIds;
    assert.equal(ids.length, count);
    assert.equal(new Set(ids).size, count, "an exam repeated a question");
  }
});

test("the same seed deals the same exam", () => {
  // The seed is in the URL so a refresh restores the sitting rather than
  // dealing a new one; opting out of difficulty weighting must not have made
  // selection non-deterministic.
  const a = createExamSession({ trackId: "aigp-preparation", count: 50, seed: 4242 });
  const b = createExamSession({ trackId: "aigp-preparation", count: 50, seed: 4242 });
  assert.deepEqual(a.questionIds, b.questionIds);
});
