import assert from "node:assert/strict";
import { test } from "node:test";
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

test("a scenario carries enough fact pattern to reason over", () => {
  for (const [id, members] of FAMILIES) {
    const scenario = members[0].scenario!;
    const words = scenario.body.join(" ").split(/\s+/).length;
    assert.ok(words >= 150, `${id} is only ${words} words`);
    assert.ok(scenario.body.length >= 3, `${id} has ${scenario.body.length} paragraphs`);
    assert.ok(scenario.sector.length > 0, `${id} has no sector`);
    assert.ok(scenario.title.length > 0, `${id} has no title`);
  }
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
  const named = /NIST|EU AI Act|ISO\/IEC|OECD|GDPR|Annex|Art\./;
  for (const q of withSources) {
    for (const s of q.sources!) {
      assert.ok(named.test(s), `${q.id}: unusable source reference "${s}"`);
    }
  }
});
