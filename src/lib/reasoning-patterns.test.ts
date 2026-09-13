import assert from "node:assert/strict";
import { test } from "node:test";
import { getTrackQuestions } from "@/content/registry";
import type { DistractorType } from "@/content/types";
import {
  EMERGING_MIN_FOR_PATTERN,
  EMERGING_MIN_MARGIN,
  EMERGING_MIN_OBSERVATIONS,
  EMERGING_MIN_SHARE,
  FAMILIES,
  MIN_FOR_PATTERN,
  MIN_MARGIN,
  MIN_OBSERVATIONS,
  MIN_SHARE,
  RECENT_WINDOW,
  WINDOW,
  detectPattern,
  familyOf,
  observationsFrom,
  questionIdsForFamily,
  type PatternFamily,
} from "./reasoning-patterns";
import { emptyProgress, type Attempt, type UserProgress } from "./types";

/**
 * Every threshold in reasoning-patterns exists to stop a confident sentence
 * being built on too little evidence, so each one is tested at its boundary —
 * the value that must fail and the value that must pass. A test that only
 * exercises the happy path would let any of them be quietly loosened.
 *
 * Fixtures are built from the real bank rather than invented questions, because
 * the thing under test is how the module behaves on the labels that actually
 * exist. The helpers throw when the bank cannot supply what a case needs, so a
 * fixture can never silently become weaker than the case it was written for.
 */

const ALL = getTrackQuestions("aigp-preparation");

/** One (question, option) pair per distinct question carrying `family`. */
function missesFor(family: PatternFamily, count: number) {
  const wanted = new Set<DistractorType>(FAMILIES[family].types);
  const out: { questionId: string; optionId: string }[] = [];

  for (const q of ALL) {
    const types = q.reasoning?.distractorTypes;
    if (!types) continue;
    const hit = Object.entries(types).find(([, t]) => t && wanted.has(t));
    if (!hit) continue;
    out.push({ questionId: q.id, optionId: hit[0] });
    if (out.length === count) return out;
  }

  throw new Error(
    `bank has only ${out.length} distinct questions for "${family}", need ${count}`,
  );
}

interface Spec {
  questionId: string;
  optionId?: string;
  /** Extra selected options, for the multi-select case. */
  alsoSelected?: string[];
  correct?: boolean;
}

/**
 * Build progress whose attempts are ordered oldest to newest, one minute apart.
 * Order is what the window and staleness rules read, so it is explicit here
 * rather than left to whatever order the fixture happens to be written in.
 */
function progressOf(specs: Spec[]): UserProgress {
  const base = Date.parse("2026-01-01T00:00:00.000Z");
  const attempts: Attempt[] = specs.map((s, i) => ({
    id: `a${i}`,
    trackId: "aigp-preparation",
    questionId: s.questionId,
    selected: [
      ...(s.optionId ? [s.optionId] : []),
      ...(s.alsoSelected ?? []),
    ],
    correct: s.correct ?? false,
    responseTimeMs: 1000,
    difficulty: "applied",
    domain: "Governing AI Development",
    confidence: null,
    createdAt: new Date(base + i * 60_000).toISOString(),
    mode: "practice",
  }));
  return { ...emptyProgress("aigp-preparation"), attempts };
}

/**
 * Allocate specs across several families using globally distinct questions.
 *
 * A single question often carries labels from two families — a near miss on one
 * option and a wrong-party on another — so asking each family independently
 * hands the same question out twice, and the deduplication rule then correctly
 * collapses it, leaving the fixture smaller than the case needs. Allocating once
 * keeps the arithmetic in each test equal to the number of specs written.
 */
function allocate(...requests: [PatternFamily, number][]): Spec[] {
  const used = new Set<string>();
  const out: Spec[] = [];

  for (const [family, count] of requests) {
    const wanted = new Set<DistractorType>(FAMILIES[family].types);
    let taken = 0;

    for (const q of ALL) {
      if (used.has(q.id)) continue;
      const types = q.reasoning?.distractorTypes;
      if (!types) continue;
      const hit = Object.entries(types).find(([, t]) => t && wanted.has(t));
      if (!hit) continue;

      used.add(q.id);
      out.push({ questionId: q.id, optionId: hit[0] });
      if (++taken === count) break;
    }

    if (taken < count) {
      throw new Error(
        `bank can supply only ${taken} unused questions for "${family}", need ${count}`,
      );
    }
  }

  return out;
}

const specsFor = (family: PatternFamily, n: number): Spec[] =>
  allocate([family, n]);

/* ---------------------------------------------------------- family map -- */

test("every distractor type maps to exactly one family", () => {
  // An unmapped type would silently drop observations; a duplicated one would
  // make counts depend on object key order.
  const ALL_TYPES: DistractorType[] = [
    "missed_material_fact",
    "wrong_governing_obligation",
    "wrong_accountable_party",
    "premature_remediation",
    "risk_underestimation",
    "risk_overreaction",
    "lifecycle_confusion",
    "legal_ethical_conflation",
    "technically_correct_but_premature",
    "plausible_but_incomplete",
    "secondary_risk_prioritized",
  ];
  for (const type of ALL_TYPES) {
    assert.ok(familyOf(type), `${type} belongs to no family`);
  }
  const seen = new Set<DistractorType>();
  for (const definition of Object.values(FAMILIES)) {
    for (const type of definition.types) {
      assert.ok(!seen.has(type), `${type} appears in two families`);
      seen.add(type);
    }
  }
  assert.equal(seen.size, ALL_TYPES.length);
});

test("no learner-facing string contains a taxonomy key", () => {
  // The taxonomy is engine vocabulary. This is the assertion, not a habit.
  const keys = Object.values(FAMILIES).flatMap((d) => d.types as string[]);
  const dimensions = [
    "material_facts",
    "lifecycle_stage",
    "governing_obligation",
    "accountability",
    "legal_vs_ethical",
    "risk_prioritization",
    "sequencing",
    "proportionality",
  ];
  for (const definition of Object.values(FAMILIES)) {
    for (const copy of [definition.label, definition.practice]) {
      for (const forbidden of [...keys, ...dimensions]) {
        assert.ok(
          !copy.includes(forbidden),
          `copy "${copy}" leaks the internal key "${forbidden}"`,
        );
      }
      assert.ok(!/_/.test(copy), `copy "${copy}" looks like an identifier`);
    }
  }
});

/* --------------------------------------------------------- observations -- */

test("correct answers are never observations", () => {
  const specs = specsFor("wrongRule", 5).map((s) => ({ ...s, correct: true }));
  assert.equal(observationsFrom(progressOf(specs)).length, 0);
  assert.equal(detectPattern(progressOf(specs)), null);
});

test("a miss on an unlabelled question yields no observation", () => {
  const unlabelled = ALL.filter((q) => !q.reasoning).slice(0, 8);
  assert.ok(unlabelled.length === 8, "bank should have unlabelled questions");
  const specs = unlabelled.map((q) => ({
    questionId: q.id,
    optionId: q.options.find((o) => !q.correctOptionIds.includes(o.id))!.id,
  }));
  assert.equal(observationsFrom(progressOf(specs)).length, 0);
  assert.equal(detectPattern(progressOf(specs)), null);
});

test("a miss on a labelled question but an unlabelled option yields nothing", () => {
  // 92 of 156 wrong options are labelled, so this is the common case.
  const q = ALL.find(
    (x) =>
      x.reasoning?.distractorTypes &&
      x.options.some(
        (o) =>
          !x.correctOptionIds.includes(o.id) &&
          !x.reasoning!.distractorTypes![o.id],
      ),
  );
  assert.ok(q, "expected a labelled question with an unlabelled wrong option");
  const bare = q.options.find(
    (o) =>
      !q.correctOptionIds.includes(o.id) && !q.reasoning!.distractorTypes![o.id],
  )!;
  const observations = observationsFrom(
    progressOf([{ questionId: q.id, optionId: bare.id }]),
  );
  assert.equal(observations.length, 0);
});

test("a multi-select miss selecting two labelled options contributes nothing", () => {
  const q = ALL.find(
    (x) =>
      x.correctOptionIds.length > 1 &&
      Object.keys(x.reasoning?.distractorTypes ?? {}).length >= 2,
  );
  assert.ok(q, "expected a multi-select question with two labelled options");
  const [first, second] = Object.keys(q.reasoning!.distractorTypes!);

  // Both at once: undecidable, so it is dropped.
  assert.equal(
    observationsFrom(
      progressOf([{ questionId: q.id, optionId: first, alsoSelected: [second] }]),
    ).length,
    0,
  );
  // Exactly one: a usable observation.
  assert.equal(
    observationsFrom(progressOf([{ questionId: q.id, optionId: first }])).length,
    1,
  );
});

test("repeated attempts on one question count once — the SM-2 trap", () => {
  // The review queue shows the same question again by design, so without
  // deduplication a learner working their queue manufactures a pattern.
  const [a, b, c] = missesFor("wrongRule", 3);
  const specs: Spec[] = [
    { questionId: a.questionId, optionId: a.optionId },
    { questionId: a.questionId, optionId: a.optionId },
    { questionId: a.questionId, optionId: a.optionId },
    { questionId: b.questionId, optionId: b.optionId },
    { questionId: c.questionId, optionId: c.optionId },
  ];
  // Five attempts, three questions, three observations.
  assert.equal(observationsFrom(progressOf(specs)).length, 3);
  /*
   * And therefore an emerging signal, not a confirmed one. Without the
   * deduplication those five raw attempts would clear the confirmed floor, so
   * this asserts the tier the learner actually lands in rather than only the
   * observation count — the same question answered three times must not buy a
   * stronger claim.
   */
  const pattern = detectPattern(progressOf(specs));
  assert.equal(pattern?.strength, "emerging");
  assert.equal(pattern?.occurrences, 3);
  assert.equal(pattern?.observed, 3);
});

test("the most recent attempt on a question is the one kept", () => {
  const [a] = missesFor("wrongRule", 1);
  const observations = observationsFrom(
    progressOf([
      { questionId: a.questionId, optionId: a.optionId },
      { questionId: a.questionId, optionId: a.optionId },
    ]),
  );
  assert.equal(observations.length, 1);
  assert.equal(observations[0].createdAt, "2026-01-01T00:01:00.000Z");
});

/* ------------------------------------------------- minimum observations -- */

test("the three tiers sit where they are specified to sit", () => {
  // Below the emerging floor: nothing, whatever the split looks like.
  assert.equal(detectPattern(progressOf(specsFor("wrongRule", 2))), null);

  // Three and four observations are provisional, never confirmed.
  for (const n of [3, 4]) {
    const p = detectPattern(progressOf(specsFor("wrongRule", n)));
    assert.equal(p?.strength, "emerging", `${n} observations should be emerging`);
    assert.equal(p?.occurrences, n);
  }

  // Five is where the confirmed thresholds take over.
  const pattern = detectPattern(progressOf(specsFor("wrongRule", 5)));
  assert.equal(pattern?.strength, "confirmed");
  assert.equal(pattern?.family, "wrongRule");
  assert.equal(pattern?.occurrences, 5);
  assert.equal(pattern?.observed, 5);
  assert.equal(pattern?.questionIds.length, 5);
});

test("two occurrences is not a pattern, however uncontested", () => {
  /*
   * Isolates the per-family floor. Two wrongRule among three near misses clears
   * every other gate — five observations, no nameable rival, share exactly at
   * the floor — so only MIN_FOR_PATTERN can stop it. Without this case that
   * constant could be lowered with every test still green.
   */
  const specs = allocate(["wrongRule", 2], ["nearMiss", 3]);
  const observations = observationsFrom(progressOf(specs));
  assert.equal(observations.length, 5);
  assert.ok(2 / 5 >= MIN_SHARE, "fixture must clear the share floor");
  assert.equal(detectPattern(progressOf(specs)), null);

  // A third occurrence, nothing else changed, and it speaks.
  const enough = allocate(["wrongRule", 3], ["nearMiss", 3]);
  const pattern = detectPattern(progressOf(enough));
  assert.ok(pattern, "three occurrences should qualify");
  assert.equal(pattern.occurrences, 3);
});

/* ------------------------------------------------------ margin and ties -- */

test("a four-to-three lead is noise; five-to-three is a pattern", () => {
  const tie = allocate(["wrongRule", 4], ["wrongParty", 3]);
  assert.equal(detectPattern(progressOf(tie)), null);

  const clear = allocate(["wrongRule", 5], ["wrongParty", 3]);
  const pattern = detectPattern(progressOf(clear));
  assert.ok(pattern, "a two-occurrence margin should qualify");
  assert.equal(pattern.family, "wrongRule");
  assert.equal(pattern.observed, 8);
});

test("an exact tie names nothing", () => {
  const specs = allocate(["wrongRule", 4], ["wrongParty", 4]);
  assert.equal(detectPattern(progressOf(specs)), null);
});

/* ---------------------------------------------------------------- share -- */

test("a leader under the share floor names nothing", () => {
  // 3 of 10 clears the count and the margin, and still is not a tendency.
  const specs = allocate(["wrongRule", 3], ["wrongParty", 1], ["nearMiss", 6]);
  const observations = observationsFrom(progressOf(specs));
  assert.equal(observations.length, 10);
  assert.ok(3 / 10 < MIN_SHARE);
  assert.equal(detectPattern(progressOf(specs)), null);
});

/* -------------------------------------------------------------- nearMiss -- */

test("the near-miss label never becomes a pattern but still counts", () => {
  // plausible_but_incomplete is the largest label in the bank. On frequency
  // alone it would win most counts and say nothing useful.
  const specs = allocate(["nearMiss", 6], ["wrongRule", 2]);
  assert.equal(detectPattern(progressOf(specs)), null);
  // It is excluded from naming, not from the evidence.
  assert.equal(observationsFrom(progressOf(specs)).length, 8);
});

test("near misses are part of the denominator a learner is shown", () => {
  const specs = allocate(["wrongRule", 5], ["nearMiss", 4]);
  const pattern = detectPattern(progressOf(specs));
  assert.ok(pattern);
  assert.equal(pattern.occurrences, 5);
  // 9, not 5: the learner is told what the claim was drawn from.
  assert.equal(pattern.observed, 9);
});

/* ----------------------------------------------------------- staleness -- */

test("a pattern the learner has stopped repeating is not raised", () => {
  // Eight old wrongRule observations, then twelve near misses. The leader still
  // clears count, margin and share — and has not happened recently.
  const specs = allocate(["wrongRule", 8], ["nearMiss", 12]);
  const observations = observationsFrom(progressOf(specs));
  assert.equal(observations.length, 20);
  assert.ok(8 / 20 >= MIN_SHARE, "fixture must clear the share floor");
  assert.equal(
    detectPattern(progressOf(specs)),
    null,
    "every occurrence sits outside the recent window",
  );
});

test("the same shape still speaks when one occurrence is recent", () => {
  // Isolates staleness from the other rules: identical counts, one moved late.
  const both = allocate(["wrongRule", 8], ["nearMiss", 12]);
  const rule = both.slice(0, 8);
  const near = both.slice(8);
  const specs = [...rule.slice(0, 7), ...near, rule[7]];
  const observations = observationsFrom(progressOf(specs));
  assert.equal(observations.length, 20);
  const pattern = detectPattern(progressOf(specs));
  assert.ok(pattern, "a live pattern of the same size should be raised");
  assert.equal(pattern.family, "wrongRule");
  assert.equal(pattern.occurrences, 8);
  assert.equal(pattern.observed, 20);
});

/* --------------------------------------------------------- emerging tier -- */

test("an emerging signal needs a clear margin, not just a lead", () => {
  // Two of three, with the third a near miss: runner-up zero, margin two.
  const qualifies = allocate(["wrongRule", 2], ["nearMiss", 1]);
  const pattern = detectPattern(progressOf(qualifies));
  assert.equal(pattern?.strength, "emerging");
  assert.equal(pattern?.occurrences, 2);
  assert.equal(pattern?.observed, 3);

  // Two of three where the third is a different nameable family: margin one.
  // This is the case that would fire at 24.8% on learners with no pattern.
  const contested = allocate(["wrongRule", 2], ["wrongParty", 1]);
  assert.equal(observationsFrom(progressOf(contested)).length, 3);
  assert.equal(detectPattern(progressOf(contested)), null);
});

test("an emerging signal needs half the observations behind it", () => {
  // Two of four clears the count and the margin and still is not half.
  const specs = allocate(["wrongRule", 2], ["nearMiss", 2]);
  assert.equal(observationsFrom(progressOf(specs)).length, 4);
  assert.ok(2 / 4 >= EMERGING_MIN_SHARE, "two of four is exactly the floor");
  assert.equal(detectPattern(progressOf(specs))?.strength, "emerging");

  // Two of five would be below it — but five observations is the confirmed
  // tier's territory, where two occurrences is short of the floor anyway.
  const five = allocate(["wrongRule", 2], ["nearMiss", 3]);
  assert.equal(detectPattern(progressOf(five)), null);
});

test("a failed confirmed signal is not restated as an emerging one", () => {
  /*
   * The tiers must not overlap. Four wrongRule and three wrongParty is seven
   * observations: the confirmed thresholds reject it on margin, and the
   * emerging thresholds would accept nothing here either — but the point is
   * that emerging is never even consulted at five or more. Without that rule a
   * rejected claim would be laundered into a weaker one on identical evidence.
   */
  const specs = allocate(["wrongRule", 4], ["wrongParty", 3]);
  assert.equal(observationsFrom(progressOf(specs)).length, 7);
  assert.equal(detectPattern(progressOf(specs)), null);

  // The same shape below the boundary is a legitimate emerging signal, which
  // is what makes the previous assertion about the boundary and not the split.
  const below = allocate(["wrongRule", 2], ["nearMiss", 1]);
  assert.equal(detectPattern(progressOf(below))?.strength, "emerging");
});

test("an emerging signal can dissolve as evidence arrives", () => {
  // Four of four is emerging. A fifth observation from another family drops the
  // leader to four of five: still confirmed-eligible. A fifth that splits the
  // lead instead leaves nothing, and that silence is correct.
  const four = allocate(["wrongRule", 4]);
  assert.equal(detectPattern(progressOf(four))?.strength, "emerging");

  const five = allocate(["wrongRule", 3], ["wrongParty", 2]);
  assert.equal(observationsFrom(progressOf(five)).length, 5);
  assert.equal(
    detectPattern(progressOf(five)),
    null,
    "a three-to-two split at the confirmed tier is not a pattern",
  );
});

test("the emerging tier never names the near-miss family either", () => {
  const near = allocate(["nearMiss", 3]);
  assert.equal(observationsFrom(progressOf(near)).length, 3);
  assert.equal(detectPattern(progressOf(near)), null);

  // Counted in the denominator there as everywhere else.
  const mixed = detectPattern(progressOf(allocate(["wrongRule", 2], ["nearMiss", 1])));
  assert.equal(mixed?.observed, 3);
  assert.equal(mixed?.occurrences, 2);
});

test("the staleness gate is inert at the emerging tier, by arithmetic", () => {
  /*
   * Documenting a limit rather than claiming a guarantee. The gate runs on the
   * same code path for both tiers, but it asks whether an occurrence falls in
   * the last RECENT_WINDOW (10) observations — and the emerging window is at
   * most four, so every observation is always "recent" there and the gate can
   * never suppress anything.
   *
   * That is the right behaviour and not a gap to plug: with four observations
   * there is no meaningful split between old and recent to draw. The assertion
   * exists so the limit is visible in CI, and so that raising the emerging
   * ceiling above RECENT_WINDOW later cannot happen without this failing and
   * forcing the recency question to be reconsidered.
   */
  assert.ok(
    MIN_OBSERVATIONS - 1 < RECENT_WINDOW,
    "the emerging window must stay inside the recency window, or staleness " +
      "starts silently filtering provisional signals on partial evidence",
  );
});

test("both tiers report the denominator they were drawn from", () => {
  const emerging = detectPattern(
    progressOf(allocate(["wrongRule", 2], ["nearMiss", 2])),
  );
  assert.equal(emerging?.occurrences, 2);
  assert.equal(emerging?.observed, 4);

  const confirmed = detectPattern(
    progressOf(allocate(["wrongRule", 5], ["nearMiss", 4])),
  );
  assert.equal(confirmed?.strength, "confirmed");
  assert.equal(confirmed?.occurrences, 5);
  assert.equal(confirmed?.observed, 9);
});

/* ------------------------------------------ threshold interaction -- */

/*
 * Three of the emerging constants cannot be caught by mutating them, because
 * the margin rule already entails them. Mutation testing said so: lowering
 * EMERGING_MIN_FOR_PATTERN or EMERGING_MIN_SHARE changed no behaviour at all.
 *
 * That does not make them decoration — they state the rule that was agreed, and
 * they become load-bearing the moment the margin changes. What follows asserts
 * the entailments directly, so a future edit that breaks one fails here instead
 * of silently removing a safeguard someone believes is active.
 */

test("the emerging occurrence floor is entailed by its margin", () => {
  // runner-up cannot be negative, so margin N forces a lead of at least N.
  assert.ok(
    EMERGING_MIN_MARGIN >= EMERGING_MIN_FOR_PATTERN,
    "lowering the margin below the occurrence floor makes the floor the only " +
      "thing stopping a single observation being named — re-check both together",
  );
});

test("the emerging share floor never rejects on its own at 3-4 observations", () => {
  /*
   * Enumerated rather than reasoned about: with a margin of two, no split of
   * three or four observations produces a share between the emerging floor and
   * the confirmed one, so the share threshold currently rejects nothing the
   * margin has not already rejected. If the emerging window ever widens, this
   * stops holding and the share floor starts doing independent work — which is
   * fine, but should be a decision rather than a surprise.
   */
  const reachable: number[] = [];
  for (let total = EMERGING_MIN_OBSERVATIONS; total < MIN_OBSERVATIONS; total++) {
    for (let lead = 0; lead <= total; lead++) {
      for (let runner = 0; runner + lead <= total; runner++) {
        if (lead - runner < EMERGING_MIN_MARGIN) continue;
        if (lead < EMERGING_MIN_FOR_PATTERN) continue;
        reachable.push(lead / total);
      }
    }
  }
  assert.ok(reachable.length > 0, "the emerging tier must be reachable at all");
  for (const share of reachable) {
    assert.ok(
      share >= EMERGING_MIN_SHARE,
      `a reachable split gives share ${share.toFixed(2)}, below the floor — ` +
        `the share rule now rejects independently and needs its own case`,
    );
  }
});

test("emerging can never accept where confirmed rejects", () => {
  /*
   * This is what makes the no-downgrade boundary safe rather than merely
   * stated. Above MIN_OBSERVATIONS the emerging thresholds are strictly harder
   * than the confirmed ones, so even if the boundary were removed a rejected
   * confirmed claim could not reappear as an emerging one.
   *
   * The boundary stays in the code because it encodes the intent directly and
   * does not depend on this arithmetic holding. This test is what would tell
   * us the arithmetic had stopped holding — at which point the boundary would
   * become the only thing preventing a laundered claim.
   */
  const accepts = (t: { occ: number; margin: number; share: number },
                   lead: number, runner: number, total: number) =>
    lead >= t.occ && lead - runner >= t.margin && lead / total >= t.share;

  const emerging = { occ: EMERGING_MIN_FOR_PATTERN, margin: EMERGING_MIN_MARGIN, share: EMERGING_MIN_SHARE };
  const confirmed = { occ: MIN_FOR_PATTERN, margin: MIN_MARGIN, share: MIN_SHARE };

  for (let total = MIN_OBSERVATIONS; total <= WINDOW; total++) {
    for (let lead = 0; lead <= total; lead++) {
      for (let runner = 0; runner + lead <= total; runner++) {
        if (accepts(emerging, lead, runner, total)) {
          assert.ok(
            accepts(confirmed, lead, runner, total),
            `${lead}/${runner} of ${total} would be emerging but not confirmed — ` +
              `the no-downgrade boundary is now load-bearing and needs a real case`,
          );
        }
      }
    }
  }
});

/* ------------------------------------------------- targeted practice -- */

test("practice ids come from the whole labelled bank, not just past misses", () => {
  const ids = questionIdsForFamily("wrongRule");
  assert.ok(ids.length >= 5, "expected several practice questions");
  const missed = new Set(specsFor("wrongRule", 3).map((s) => s.questionId));
  assert.ok(
    ids.some((id) => !missed.has(id)),
    "practice should offer questions the learner has not already seen wrong",
  );
  for (const id of ids) {
    assert.ok(
      ALL.find((q) => q.id === id)?.reasoning,
      `${id} is offered for practice but carries no labels`,
    );
  }
});

/* ------------------------------------------- what the tranche cannot do -- */

test("three families cannot fire yet, and that is recorded not hidden", () => {
  /*
   * A family needs MIN_DISTINCT_QUESTIONS to be nameable at all. Three families
   * span fewer than three questions in the current tranche, so they are
   * undetectable however often a learner makes the mistake — actedEarly most
   * notably, which is the most instructive of the nine.
   *
   * This is an argument for a second tranche, not for lowering the floor. The
   * test exists so the limitation is visible in CI rather than discovered when
   * someone wonders why the feature never mentions it.
   */
  const spans = new Map<PatternFamily, Set<string>>();
  for (const q of ALL) {
    const types = q.reasoning?.distractorTypes;
    if (!types) continue;
    for (const type of Object.values(types)) {
      if (!type) continue;
      const family = familyOf(type)!;
      if (!spans.has(family)) spans.set(family, new Set());
      spans.get(family)!.add(q.id);
    }
  }

  const thin = [...spans.entries()]
    .filter(([family, qs]) => FAMILIES[family].nameable && qs.size < 3)
    .map(([family]) => family)
    .sort();

  assert.deepEqual(thin, ["actedEarly", "commitmentAsRequirement", "wrongPhase"]);
});
