import assert from "node:assert/strict";
import { test } from "node:test";
import { getTrackQuestions } from "@/content/registry";
import { namesLocatableInstrument } from "@/content/types";

/**
 * Structural invariants for the question bank.
 *
 * These are deliberately separate from `scenarios.test.ts`, which asserts
 * editorial properties, and from `check-content.ts`, which runs as a gate and
 * prints a report. The assertions here are the ones where a regression would
 * be invisible in the application until a learner hit it: an answer key that
 * references nothing, a scenario id that resolves to no scenario, a rationale
 * that names an option letter the learner was never shown.
 *
 * The bank size is pinned on purpose, unlike the derived counts elsewhere.
 * 350 is a product decision rather than an arithmetic fact, so it should take
 * a deliberate edit to change — which is exactly what a pinned assertion asks
 * for. Two other pins were removed in this same sitting because they were
 * pinning arithmetic; this one is not.
 */
const ALL = getTrackQuestions();

test("the bank is exactly 350 questions", () => {
  assert.equal(ALL.length, 350);
});

test("ids are unique", () => {
  const ids = ALL.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("no two questions ask the same thing", () => {
  // Normalised so that a reformatted duplicate is still caught.
  const seen = new Map<string, string>();
  for (const q of ALL) {
    const key = q.question.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
    const first = seen.get(key);
    assert.equal(first, undefined, `${q.id} repeats the stem of ${first}`);
    seen.set(key, q.id);
  }
});

test("every answer key references an option that exists", () => {
  for (const q of ALL) {
    const ids = new Set(q.options.map((o) => o.id));
    assert.ok(q.correctOptionIds.length > 0, `${q.id} has no correct answer`);
    for (const c of q.correctOptionIds) {
      assert.ok(ids.has(c), `${q.id}: correct answer "${c}" is not an option`);
    }
    assert.notEqual(
      q.correctOptionIds.length,
      q.options.length,
      `${q.id}: every option is correct, which is a free mark`,
    );
  }
});

test("option sets are well formed", () => {
  for (const q of ALL) {
    assert.ok(q.options.length >= 3, `${q.id} has fewer than three options`);
    const ids = q.options.map((o) => o.id);
    assert.equal(new Set(ids).size, ids.length, `${q.id} has a duplicate option id`);
    const texts = q.options.map((o) => o.text.trim().toLowerCase());
    assert.equal(new Set(texts).size, texts.length, `${q.id} has two options with the same text`);
    if (q.correctOptionIds.length > 1) {
      assert.ok(q.options.length >= 4, `${q.id} is multi-select with fewer than four options`);
    }
  }
});

test("every scenario reference resolves, and every scenario is used", () => {
  const linked = ALL.filter((q) => q.scenario);
  for (const q of linked) {
    assert.ok(q.scenario!.title, `${q.id}: scenario resolved but carries no title`);
    assert.ok(q.scenario!.body.length > 0, `${q.id}: scenario resolved but has no body`);
  }
  // A scenario nobody reaches is dead weight the learner pays for in bundle size.
  const used = new Set(linked.map((q) => q.scenario!.id));
  assert.ok(used.size > 0, "no scenario is referenced by any question");
});

test("a scenario-linked stem still names its own subject", () => {
  // These questions render under a scenario panel, so a bare "The department
  // is assessing..." is not broken — but it reads as a fragment anywhere the
  // panel is not directly above it, and that is how it was reported.
  const DANGLING = /^(the|this|these|that|it|they|its)\s+\w+\s+(is|are|was|were|has|have)\b/i;
  for (const q of ALL.filter((x) => x.scenario)) {
    const bare = DANGLING.test(q.question.trim()) && !/\b(department|vendor|committee|council|provider|team|model|tool|district|insurer|assistant|agent|clinic|property|supplier)\b/i.test(q.question.slice(0, 60));
    assert.ok(!bare, `${q.id}: stem opens with an unanchored reference — "${q.question.slice(0, 70)}"`);
  }
});

test("rationales never name an option letter", () => {
  // Options are dealt fresh each session and graded on identity, so "B is a
  // reasonable extrapolation" is wrong for most learners. All 296 original
  // questions already observed this; 22 added later did not, and this is the
  // guard that stops it coming back.
  const LETTER_REF =
    /\b[A-E] (is|are|describes|names|states|would|identifies|raises|asserts|proposes|applies|allocates|treats|misreads|jumps|sets|defends|understates|overstates|reaches|mistakes|skips|imports|adds|accepts|rejects|stops|and|half)\b/;
  for (const q of ALL) {
    assert.ok(
      !LETTER_REF.test(q.rationale),
      `${q.id}: rationale names an option letter, which the learner may never see`,
    );
  }
});

test("every wrong option is explained", () => {
  for (const q of ALL) {
    const wrong = q.options.filter((o) => !q.correctOptionIds.includes(o.id));
    for (const o of wrong) {
      const note = q.distractorNotes?.[o.id];
      assert.ok(note, `${q.id}: option ${o.id} is wrong and unexplained`);
      assert.ok(note!.length >= 45, `${q.id}: note on ${o.id} is too short to teach anything`);
    }
    // A note attached to the correct answer means the mapping has slipped.
    for (const c of q.correctOptionIds) {
      assert.equal(
        q.distractorNotes?.[c],
        undefined,
        `${q.id}: the correct option ${c} carries a distractor note`,
      );
    }
  }
});

test("source metadata is intact", () => {
  for (const q of ALL) {
    for (const s of q.sources ?? []) {
      assert.ok(
        namesLocatableInstrument(s.cite),
        `${q.id}: source names nothing locatable — "${s.cite}"`,
      );
      if (s.url) assert.match(s.url, /^https:\/\/\S+$/, `${q.id}: source url is not absolute https`);
      if (s.sourceDate) assert.match(s.sourceDate, /^\d{4}-\d{2}-\d{2}$/, `${q.id}: bad source date`);
    }
  }
});

test("no answer position is over-represented", () => {
  // Option ids are per-question, so position means index in the stored order.
  // The app deals fresh letters at runtime, which is why this is about the
  // file being inspectable rather than about what any learner is shown.
  const four = ALL.filter((q) => q.correctOptionIds.length === 1 && q.options.length === 4);
  const counts = new Map<number, number>();
  for (const q of four) {
    const i = q.options.findIndex((o) => o.id === q.correctOptionIds[0]);
    counts.set(i, (counts.get(i) ?? 0) + 1);
  }
  for (const [pos, n] of counts) {
    const share = n / four.length;
    assert.ok(share <= 0.4, `position ${pos} holds ${(share * 100).toFixed(0)}% of keys`);
    assert.ok(share >= 0.12, `position ${pos} holds only ${(share * 100).toFixed(0)}% of keys`);
  }
});
