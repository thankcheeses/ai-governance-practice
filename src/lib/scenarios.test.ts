import assert from "node:assert/strict";
import { test } from "node:test";
import { SUBDOMAINS, domainOf } from "@/content/bok";
import { getTrackQuestions } from "@/content/registry";
import type { Question } from "@/content/types";
import { gradeAnswer, isMultiSelect, requiredSelections } from "./grading";
import { groupScenarioFamilies, presentOptions, presentQuestions } from "./presentation";
import { emptyProgress } from "./types";
import { buildSitting } from "./session";

/**
 * Scenario families.
 *
 * The contract a family has to satisfy:
 *
 *   - every question is gradable from the scenario alone, so meeting one in
 *     isolation is never unfair and the order within a family cannot matter;
 *   - the family reads as a case study, so its questions arrive together;
 *   - grouping is a presentation decision and must not disturb the seeded
 *     reproducibility the session depends on.
 */

const TRACK = "aigp-preparation" as const;
const ALL = getTrackQuestions(TRACK);
const FAMILIES = new Map<string, Question[]>();
for (const q of ALL) {
  if (!q.scenario) continue;
  const list = FAMILIES.get(q.scenario.id) ?? [];
  list.push(q);
  FAMILIES.set(q.scenario.id, list);
}

/* ------------------------------------------------------------ content -- */

test("the bank has scenario families to check", () => {
  assert.ok(FAMILIES.size >= 3, `only ${FAMILIES.size} families`);
  for (const [id, members] of FAMILIES) {
    assert.ok(members.length >= 2, `${id} has ${members.length} question(s)`);
  }
});

test("every scenario carries a real fact pattern", () => {
  // A floor, not a target. Below roughly this length there is nothing to sift,
  // and the exercise collapses into an ordinary stem with extra words.
  for (const [id, members] of FAMILIES) {
    const scenario = members[0].scenario!;
    const words = scenario.body.join(" ").split(/\s+/).length;
    assert.ok(words >= 110, `${id} is only ${words} words`);
    assert.ok(scenario.body.length >= 3, `${id} has ${scenario.body.length} paragraphs`);
    assert.ok(scenario.sector.length > 0, `${id} has no sector`);
    assert.ok(scenario.title.length > 0, `${id} has no title`);
  }
});

test("scenario length spans a spectrum rather than clustering", () => {
  /*
    The bank is meant to train sustained reasoning *and* quick application, so
    it needs both. A bank of nothing but 400-word case studies trains stamina
    and starves everything else; a bank of nothing but short ones never builds
    the stamina at all. This pins the spread so neither drift passes review.
  */
  const lengths = [...FAMILIES.values()].map((m) =>
    m[0].scenario!.body.join(" ").split(/\s+/).length,
  );
  assert.ok(
    lengths.some((n) => n < 200),
    `no medium scenario under 200 words: ${lengths.join(", ")}`,
  );
  assert.ok(
    lengths.some((n) => n >= 300),
    `no long scenario of 300+ words: ${lengths.join(", ")}`,
  );
});

test("family sizes span a spectrum rather than clustering", () => {
  // Two-question families, three-to-four, and longer sustained ones all train
  // something different. Requiring each keeps the format from converging.
  const sizes = [...FAMILIES.values()].map((m) => m.length);
  assert.ok(sizes.includes(2), `no two-question family: ${sizes.join(", ")}`);
  assert.ok(
    sizes.some((n) => n >= 3 && n <= 4),
    `no three-or-four-question family: ${sizes.join(", ")}`,
  );
  assert.ok(sizes.some((n) => n >= 5), `no sustained family: ${sizes.join(", ")}`);
});

test("standalone questions remain the bulk of the bank", () => {
  /*
    Scenario families are the demanding minority, not the default. If most of
    the bank sat behind a fact pattern, a learner could not practise quick
    application, and a short session would become unusable.
  */
  const withScenario = ALL.filter((q) => q.scenario).length;
  const share = withScenario / ALL.length;
  assert.ok(
    share > 0.05 && share < 0.4,
    `${(share * 100).toFixed(0)}% of the bank is scenario-based`,
  );
});

test("every member of a family shares one scenario object", () => {
  // Resolved by reference, so a scenario edit cannot apply to some of its
  // questions and not others.
  for (const members of FAMILIES.values()) {
    const first = members[0].scenario;
    for (const q of members) assert.equal(q.scenario, first, q.id);
  }
});

test("questions in a family interrogate different things", () => {
  // Six restatements of one answer would be six times the reading for one
  // idea. Stems within a family must not be near-copies of each other.
  const words = (s: string) =>
    new Set(s.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter((w) => w.length > 4));
  for (const [id, members] of FAMILIES) {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = words(members[i].question);
        const b = words(members[j].question);
        let shared = 0;
        for (const w of a) if (b.has(w)) shared++;
        const overlap = shared / Math.min(a.size, b.size);
        assert.ok(
          overlap < 0.7,
          `${id}: ${members[i].id} and ${members[j].id} overlap ${(overlap * 100).toFixed(0)}%`,
        );
      }
    }
  }
});

test("no question's options give away a sibling's answer", () => {
  // A correct option text appearing verbatim among a sibling's options would
  // let a candidate answer one question by reading another.
  for (const [id, members] of FAMILIES) {
    for (const q of members) {
      const correct = q.options
        .filter((o) => q.correctOptionIds.includes(o.id))
        .map((o) => o.text.toLowerCase());
      for (const other of members) {
        if (other.id === q.id) continue;
        for (const o of other.options) {
          assert.ok(
            !correct.includes(o.text.toLowerCase()),
            `${id}: ${q.id}'s answer appears in ${other.id}'s options`,
          );
        }
      }
    }
  }
});

test("every scenario question is gradable on its own", () => {
  // Nothing in a stem may point at a sibling — "as in the previous question",
  // "the action you selected", and so on.
  const dependent = /previous question|prior question|your (?:earlier|previous) answer|question \d/i;
  for (const members of FAMILIES.values()) {
    for (const q of members) {
      assert.ok(!dependent.test(q.question), `${q.id} refers to another question`);
      for (const o of q.options) {
        assert.ok(!dependent.test(o.text), `${q.id} option refers to another question`);
      }
    }
  }
});

test("scenario questions grade correctly under shuffling, like any other", () => {
  for (const members of FAMILIES.values()) {
    for (const q of members) {
      for (let seed = 0; seed < 20; seed++) {
        const dealt = presentOptions(q, seed);
        const right = dealt
          .filter((o) => q.correctOptionIds.includes(o.id))
          .map((o) => o.id);
        assert.equal(gradeAnswer(q, right), true, `${q.id}/${seed}`);
        if (isMultiSelect(q)) {
          assert.equal(gradeAnswer(q, right.slice(1)), false, `${q.id}: subset scored`);
          assert.equal(requiredSelections(q), q.correctOptionIds.length);
        }
      }
    }
  }
});

/* ----------------------------------------------------------- grouping -- */

test("a family's questions arrive together in a sitting", () => {
  const all = presentQuestions(ALL, 4242);
  const seenAt = new Map<string, number[]>();
  all.forEach((q, i) => {
    if (!q.scenario) return;
    const list = seenAt.get(q.scenario.id) ?? [];
    list.push(i);
    seenAt.set(q.scenario.id, list);
  });
  for (const [id, positions] of seenAt) {
    const span = positions[positions.length - 1] - positions[0] + 1;
    assert.equal(span, positions.length, `${id} is split across the sitting`);
  }
});

test("grouping preserves every question exactly once", () => {
  const grouped = groupScenarioFamilies(ALL);
  assert.equal(grouped.length, ALL.length);
  assert.deepEqual(new Set(grouped.map((q) => q.id)), new Set(ALL.map((q) => q.id)));
});

test("grouping is deterministic and leaves standalone order alone", () => {
  const shuffled = presentQuestions(ALL, 77);
  assert.deepEqual(
    groupScenarioFamilies(shuffled).map((q) => q.id),
    groupScenarioFamilies(shuffled).map((q) => q.id),
  );
  // Standalone questions keep their relative order through grouping.
  const before = shuffled.filter((q) => !q.scenario).map((q) => q.id);
  const after = groupScenarioFamilies(shuffled)
    .filter((q) => !q.scenario)
    .map((q) => q.id);
  assert.deepEqual(after, before);
});

test("grouping does not break seeded reproducibility", () => {
  const progress = emptyProgress(TRACK);
  for (const seed of [1, 42, 4242]) {
    const a = buildSitting(progress, { seed, count: 20, trackId: TRACK });
    const b = buildSitting(progress, { seed, count: 20, trackId: TRACK });
    assert.deepEqual(
      a.questions.map((q) => q.id),
      b.questions.map((q) => q.id),
      `seed ${seed}`,
    );
    assert.deepEqual(
      a.options.map((r) => r.map((o) => o.id)),
      b.options.map((r) => r.map((o) => o.id)),
    );
  }
});

/* -------------------------------------------------------- provenance -- */

test("scenario questions carry distractor notes for every wrong option", () => {
  for (const members of FAMILIES.values()) {
    for (const q of members) {
      const wrong = q.options.filter((o) => !q.correctOptionIds.includes(o.id));
      for (const o of wrong) {
        assert.ok(
          q.distractorNotes?.[o.id],
          `${q.id}: no note for wrong option ${o.id}`,
        );
      }
    }
  }
});

test("a distractor note is never attached to a correct option", () => {
  for (const q of ALL) {
    if (!q.distractorNotes) continue;
    for (const id of Object.keys(q.distractorNotes)) {
      assert.ok(
        !q.correctOptionIds.includes(id),
        `${q.id}: note attached to correct option ${id}`,
      );
      assert.ok(
        q.options.some((o) => o.id === id),
        `${q.id}: note attached to unknown option ${id}`,
      );
    }
  }
});

test("items carrying sources name something checkable", () => {
  const withSources = ALL.filter((q) => q.sources?.length);
  assert.ok(withSources.length >= 27, `only ${withSources.length} items cite a source`);
  // A source is usable when a learner can go and read the named thing: a
  // framework, a standard, a regulation, or a titled statute. Free prose is not.
  const named = /NIST|EU AI Act|ISO\/IEC|OECD|GDPR|Annex|Art\.|Title [IVX]+|Act\b|Convention|Directive/;
  for (const q of withSources) {
    for (const s of q.sources!) {
      assert.ok(named.test(s), `${q.id}: unusable source reference "${s}"`);
    }
  }
});

/* ------------------------------------------------------- bank quality -- */

test("the bank is large enough to sustain repeated sittings", () => {
  // A 100-question exam drawn from a bank barely larger than itself deals
  // nearly the same paper every time.
  assert.ok(ALL.length >= 250, `the bank holds only ${ALL.length} questions`);
  assert.ok(
    ALL.length <= 320,
    `${ALL.length} questions — growth past this needs a coverage argument, not momentum`,
  );
});

test("every published sub-domain is covered, and none is a token entry", () => {
  const counts = new Map<string, number>();
  for (const q of ALL) counts.set(q.bokSubdomain, (counts.get(q.bokSubdomain) ?? 0) + 1);
  for (const sub of SUBDOMAINS) {
    const n = counts.get(sub.id) ?? 0;
    assert.ok(n >= 12, `${sub.id} has only ${n} questions`);
  }
  assert.equal(counts.size, SUBDOMAINS.length, "a question maps outside the outline");
});

test("no domain dominates the bank", () => {
  const byDomain = new Map<string, number>();
  for (const q of ALL) {
    const roman = domainOf(q.bokSubdomain);
    if (!roman) continue;
    byDomain.set(roman, (byDomain.get(roman) ?? 0) + 1);
  }
  for (const [roman, n] of byDomain) {
    const share = n / ALL.length;
    assert.ok(
      share >= 0.15 && share <= 0.35,
      `domain ${roman} is ${(share * 100).toFixed(1)}% of the bank`,
    );
  }
});

test("healthcare is one context among many, not the house style", () => {
  /*
    The product began as a clinical-governance tool and the bank inherited its
    examples. A learner sitting a general AI governance exam has to reason
    about lending, employment, education, media and manufacturing too, so this
    caps the concentration rather than forbidding the sector.
  */
  const clinical =
    /health|clinic|patient|hospital|\bPHI\b|HIPAA|medical|triage|sepsis|radiolog/i;
  const n = ALL.filter((q) => clinical.test(q.question + q.tags.join(" "))).length;
  assert.ok(
    n / ALL.length < 0.25,
    `${((n / ALL.length) * 100).toFixed(1)}% of the bank is healthcare`,
  );
});

test("multi-select items are present without taking over", () => {
  const share = ALL.filter(isMultiSelect).length / ALL.length;
  assert.ok(
    share >= 0.08 && share <= 0.25,
    `${(share * 100).toFixed(1)}% of the bank is multi-select`,
  );
});

test("difficulty spans the range rather than sitting at one level", () => {
  const counts = new Map<string, number>();
  for (const q of ALL) counts.set(q.difficulty, (counts.get(q.difficulty) ?? 0) + 1);
  for (const level of ["foundational", "applied", "advanced"]) {
    const n = counts.get(level) ?? 0;
    assert.ok(n / ALL.length >= 0.08, `only ${n} ${level} questions`);
  }
});

test("the correct answer is not the longest option often enough to be a tell", () => {
  /*
    The classic multiple-choice giveaway: the right answer is the one the
    author elaborated, so a candidate who knows nothing can score well above
    chance by picking the longest option. Measured two ways, because either
    alone can be gamed — how often the correct option is the longest, and how
    much longer it runs on average.
  */
  let longest = 0;
  let totalDelta = 0;
  for (const q of ALL) {
    const correct = q.options.filter((o) => q.correctOptionIds.includes(o.id));
    const wrong = q.options.filter((o) => !q.correctOptionIds.includes(o.id));
    const max = Math.max(...q.options.map((o) => o.text.length));
    if (correct.some((o) => o.text.length === max)) longest += 1;
    const mean = (os: typeof correct) =>
      os.reduce((n, o) => n + o.text.length, 0) / os.length;
    totalDelta += mean(correct) - mean(wrong);
  }
  const share = longest / ALL.length;
  const delta = totalDelta / ALL.length;
  assert.ok(
    share < 0.5,
    `the correct option is the longest in ${(share * 100).toFixed(1)}% of items`,
  );
  assert.ok(
    Math.abs(delta) < 8,
    `correct options run ${delta.toFixed(1)} characters longer than distractors on average`,
  );
});

test("no two questions are near-duplicates of each other", () => {
  // Cheap shingle overlap over the stems. Two items testing one idea in
  // near-identical words waste a sitting and inflate the bank's apparent size.
  const shingles = (s: string) => {
    const words = s
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    const out = new Set<string>();
    for (let i = 0; i + 4 < words.length; i++) out.add(words.slice(i, i + 5).join(" "));
    return out;
  };
  const prepared = ALL.map((q) => ({ id: q.id, grams: shingles(q.question) }));
  for (let i = 0; i < prepared.length; i++) {
    for (let j = i + 1; j < prepared.length; j++) {
      const a = prepared[i].grams;
      const b = prepared[j].grams;
      if (!a.size || !b.size) continue;
      let shared = 0;
      for (const g of a) if (b.has(g)) shared += 1;
      const overlap = shared / Math.min(a.size, b.size);
      assert.ok(
        overlap < 0.5,
        `${prepared[i].id} and ${prepared[j].id} share ${(overlap * 100).toFixed(0)}% of their phrasing`,
      );
    }
  }
});
