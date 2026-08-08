import assert from "node:assert/strict";
import { test } from "node:test";
import { getQuestion, getTrackQuestions } from "@/content/registry";
import {
  ACTIVE_SESSION_KEY,
  type ActiveSession,
  type StorageLike,
  clearActiveSession,
  readActiveSession,
  resumeActiveSession,
  validateActiveSession,
  writeActiveSession,
} from "./active-session";
import { gradeAnswer, isMultiSelect } from "./grading";
import {
  buildSitting,
  presentSitting,
  sittingComposition,
  sittingFromSnapshot,
} from "./session";
import { emptyProgress, type Attempt, type UserProgress } from "./types";

/**
 * The invariant: once a sitting begins, reconstructing it must give back the
 * same sitting — the same questions in the same order, the same options in the
 * same order, and the same place within it.
 *
 * These tests run against the real storage contract by injecting a Storage
 * implementation, so serialisation is exercised rather than mocked away.
 */

const TRACK = "aigp-preparation" as const;
const ALL = getTrackQuestions(TRACK);
const PROGRESS_KEY = "nhid-clinical:progress:v1";

class MemoryStorage implements StorageLike {
  readonly data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

/** A sitting plus the snapshot that would have been written for it. */
function startSitting(
  seed = 4242,
  count = 10,
  progress: UserProgress = emptyProgress(TRACK),
) {
  const sitting = buildSitting(progress, { seed, count, trackId: TRACK });
  const { questionIds, optionIds } = sittingComposition(sitting);
  const snapshot: ActiveSession = {
    version: 1,
    seed,
    trackId: TRACK,
    mode: "practice",
    label: "Mixed practice",
    withScheduling: false,
    exitHref: "/study",
    questionIds,
    optionIds,
    index: 0,
    selected: [],
    revealed: false,
    confidence: null,
    correctCount: 0,
    queuedCount: 0,
    updatedAt: new Date().toISOString(),
  };
  return { sitting, snapshot };
}

function attemptFor(questionId: string, correct: boolean): Attempt {
  const q = getQuestion(questionId)!;
  return {
    id: `att-${questionId}`,
    questionId,
    trackId: TRACK,
    domain: q.domain,
    selected: [q.correctOptionIds[0]],
    correct,
    responseTimeMs: 1000,
    mode: "practice",
    confidence: null,
    createdAt: new Date().toISOString(),
  } as Attempt;
}

/* ========================================================================
   1-4. The sitting survives reconstruction, exactly
   ===================================================================== */

test("1. an active sitting survives a round trip through storage", () => {
  const storage = new MemoryStorage();
  const { snapshot } = startSitting();
  writeActiveSession(snapshot, storage);

  const resumed = resumeActiveSession({ mode: "practice", seed: 4242 }, storage);
  assert.ok(resumed, "nothing came back");
  assert.deepEqual(resumed, snapshot);
});

test("2. question ids come back identical and in the same order", () => {
  const storage = new MemoryStorage();
  const { sitting, snapshot } = startSitting();
  writeActiveSession(snapshot, storage);

  const resumed = resumeActiveSession({ mode: "practice", seed: 4242 }, storage)!;
  const restored = sittingFromSnapshot(resumed)!;
  assert.deepEqual(
    restored.questions.map((q) => q.id),
    sitting.questions.map((q) => q.id),
  );
});

test("3. option ids come back identical, in order, with the same letters", () => {
  const storage = new MemoryStorage();
  const { sitting, snapshot } = startSitting();
  writeActiveSession(snapshot, storage);

  const restored = sittingFromSnapshot(
    resumeActiveSession({ mode: "practice", seed: 4242 }, storage)!,
  )!;

  assert.deepEqual(
    restored.options.map((row) => row.map((o) => `${o.key}:${o.id}`)),
    sitting.options.map((row) => row.map((o) => `${o.key}:${o.id}`)),
  );
});

test("4. the current index survives", () => {
  const storage = new MemoryStorage();
  const { snapshot } = startSitting();
  writeActiveSession({ ...snapshot, index: 6 }, storage);

  const resumed = resumeActiveSession({ mode: "practice", seed: 4242 }, storage)!;
  assert.equal(resumed.index, 6);
});

/* ========================================================================
   5-7. In-flight answer state survives
   ===================================================================== */

test("5. selected option ids survive", () => {
  const storage = new MemoryStorage();
  const { sitting, snapshot } = startSitting();
  const picked = sitting.options[3][2].id;
  writeActiveSession({ ...snapshot, index: 3, selected: [picked] }, storage);

  const resumed = resumeActiveSession({ mode: "practice", seed: 4242 }, storage)!;
  assert.deepEqual(resumed.selected, [picked]);
  // And the id still points at the option the learner actually clicked.
  const restored = sittingFromSnapshot(resumed)!;
  assert.equal(
    restored.options[3].find((o) => o.id === picked)!.text,
    sitting.options[3][2].text,
  );
});

test("6. revealed state survives", () => {
  const storage = new MemoryStorage();
  const { sitting, snapshot } = startSitting();
  const picked = sitting.options[1][0].id;
  writeActiveSession(
    { ...snapshot, index: 1, selected: [picked], revealed: true },
    storage,
  );

  const resumed = resumeActiveSession({ mode: "practice", seed: 4242 }, storage)!;
  assert.equal(resumed.revealed, true);
});

test("7. confidence survives", () => {
  const storage = new MemoryStorage();
  const { snapshot } = startSitting();
  for (const confidence of ["guessed", "unsure", "confident", null] as const) {
    writeActiveSession({ ...snapshot, confidence }, storage);
    const resumed = resumeActiveSession(
      { mode: "practice", seed: 4242 },
      storage,
    )!;
    assert.equal(resumed.confidence, confidence);
  }
});

/* ========================================================================
   8. A different seed is a different sitting
   ===================================================================== */

test("8. a different seed does not resume the stored sitting", () => {
  const storage = new MemoryStorage();
  const { snapshot } = startSitting(4242);
  writeActiveSession(snapshot, storage);

  assert.equal(
    resumeActiveSession({ mode: "practice", seed: 9999 }, storage),
    null,
    "a new seed resumed someone else's sitting",
  );
  // And it did not destroy the stored one, which is still valid.
  assert.ok(resumeActiveSession({ mode: "practice", seed: 4242 }, storage));
});

test("8b. a different mode does not resume the stored sitting", () => {
  const storage = new MemoryStorage();
  const { snapshot } = startSitting();
  writeActiveSession(snapshot, storage);
  assert.equal(resumeActiveSession({ mode: "review" }, storage), null);
  // A review page must not wipe a practice sitting on its way past.
  assert.ok(resumeActiveSession({ mode: "practice", seed: 4242 }, storage));
});

/* ========================================================================
   9-10. Bad state fails safely
   ===================================================================== */

test("9. corrupt storage fails safely and clears itself", () => {
  for (const junk of [
    "not json at all",
    "null",
    "[]",
    '"a string"',
    "42",
    "{}",
    '{"version":1}',
  ]) {
    const storage = new MemoryStorage();
    storage.setItem(ACTIVE_SESSION_KEY, junk);
    assert.equal(
      resumeActiveSession({ mode: "practice", seed: 1 }, storage),
      null,
      `resumed from ${junk}`,
    );
    assert.equal(
      storage.getItem(ACTIVE_SESSION_KEY),
      null,
      `corrupt value survived: ${junk}`,
    );
  }
});

test("10. a mismatched question sequence fails safely", () => {
  const { snapshot } = startSitting();

  // A question that no longer exists.
  assert.equal(
    validateActiveSession({
      ...snapshot,
      questionIds: [...snapshot.questionIds.slice(0, -1), "aigp-does-not-exist"],
    }),
    null,
    "accepted an unresolvable question id",
  );

  // Option rows that no longer line up with the questions.
  assert.equal(
    validateActiveSession({ ...snapshot, optionIds: snapshot.optionIds.slice(1) }),
    null,
    "accepted mismatched option-row count",
  );

  // An option id from a different question.
  const foreign = ALL.find((q) => q.id !== snapshot.questionIds[0])!.options[0].id;
  const swapped = snapshot.optionIds.map((row) => [...row]);
  swapped[0][0] = foreign;
  assert.equal(
    validateActiveSession({ ...snapshot, optionIds: swapped }),
    null,
    "accepted a foreign option id",
  );

  // A duplicated option, which would render the same choice twice.
  const duped = snapshot.optionIds.map((row) => [...row]);
  duped[0][1] = duped[0][0];
  assert.equal(
    validateActiveSession({ ...snapshot, optionIds: duped }),
    null,
    "accepted a duplicated option",
  );

  // A row that dropped an option.
  const short = snapshot.optionIds.map((row) => [...row]);
  short[0] = short[0].slice(0, -1);
  assert.equal(validateActiveSession({ ...snapshot, optionIds: short }), null);
});

test("10b. an out-of-bounds index fails safely", () => {
  const { snapshot } = startSitting();
  for (const index of [-1, snapshot.questionIds.length, 999, 1.5, "2"]) {
    assert.equal(
      validateActiveSession({ ...snapshot, index }),
      null,
      `accepted index ${index}`,
    );
  }
});

test("10c. a selection that is not on the current question fails safely", () => {
  const { snapshot } = startSitting();
  // Valid id, wrong question — the classic off-by-one after content changes.
  const otherQuestionsOption = snapshot.optionIds[5][0];
  assert.equal(
    validateActiveSession({
      ...snapshot,
      index: 0,
      selected: [otherQuestionsOption],
    }),
    null,
  );
  assert.equal(
    validateActiveSession({ ...snapshot, selected: ["nope"] }),
    null,
  );
});

test("10d. a stale version is discarded rather than migrated", () => {
  const { snapshot } = startSitting();
  assert.equal(validateActiveSession({ ...snapshot, version: 0 }), null);
  assert.equal(validateActiveSession({ ...snapshot, version: 2 }), null);
});

test("10e. impossible tallies fail safely", () => {
  const { snapshot } = startSitting();
  assert.equal(validateActiveSession({ ...snapshot, correctCount: -1 }), null);
  assert.equal(validateActiveSession({ ...snapshot, correctCount: 999 }), null);
  assert.equal(validateActiveSession({ ...snapshot, queuedCount: -1 }), null);
});

/* ========================================================================
   11-12. The sitting is cleared when it is over
   ===================================================================== */

test("11. exiting clears the active sitting", () => {
  const storage = new MemoryStorage();
  const { snapshot } = startSitting();
  writeActiveSession(snapshot, storage);
  assert.ok(readActiveSession(storage));

  clearActiveSession(storage);
  assert.equal(readActiveSession(storage), null);
  assert.equal(resumeActiveSession({ mode: "practice", seed: 4242 }, storage), null);
});

test("12. finishing clears the active sitting", () => {
  // Same mechanism as exit — asserted separately because they are separate
  // call sites in the component and either could regress alone.
  const storage = new MemoryStorage();
  const { snapshot } = startSitting();
  writeActiveSession({ ...snapshot, index: 9, revealed: true }, storage);
  clearActiveSession(storage);
  assert.equal(readActiveSession(storage), null);
});

/* ========================================================================
   13-14. Grading is unaffected by restoration
   ===================================================================== */

test("13. single-select grading is still correct after restoration", () => {
  const storage = new MemoryStorage();
  const { sitting, snapshot } = startSitting();
  writeActiveSession(snapshot, storage);
  const restored = sittingFromSnapshot(
    resumeActiveSession({ mode: "practice", seed: 4242 }, storage)!,
  )!;

  let checked = 0;
  for (let i = 0; i < restored.questions.length; i++) {
    const question = restored.questions[i];
    if (isMultiSelect(question)) continue;
    checked++;

    const correct = restored.options[i].find((o) =>
      question.correctOptionIds.includes(o.id),
    )!;
    assert.equal(gradeAnswer(question, [correct.id]), true, question.id);

    for (const wrong of restored.options[i].filter(
      (o) => !question.correctOptionIds.includes(o.id),
    )) {
      assert.equal(gradeAnswer(question, [wrong.id]), false, question.id);
    }

    // The letter the option carries is the same one it carried before.
    const before = sitting.options[i].find((o) => o.id === correct.id)!;
    assert.equal(correct.key, before.key, `${question.id} changed letters`);
  }
  assert.ok(checked > 0, "no single-select questions were checked");
});

test("14. multi-select all-or-nothing grading survives restoration", () => {
  const storage = new MemoryStorage();
  const multis = ALL.filter(isMultiSelect);
  assert.ok(multis.length > 0);

  // Build a sitting made only of multi-select items so they are certain to
  // appear, then restore it and re-grade.
  const seed = 31337;
  const sitting = presentSitting(multis, seed);
  const { questionIds, optionIds } = sittingComposition(sitting);
  writeActiveSession(
    {
      version: 1,
      seed,
      trackId: TRACK,
      mode: "practice",
      label: "Multi",
      withScheduling: false,
      exitHref: "/study",
      questionIds,
      optionIds,
      index: 0,
      selected: [],
      revealed: false,
      confidence: null,
      correctCount: 0,
      queuedCount: 0,
      updatedAt: new Date().toISOString(),
    },
    storage,
  );

  const restored = sittingFromSnapshot(
    resumeActiveSession({ mode: "practice", seed }, storage)!,
  )!;

  for (let i = 0; i < restored.questions.length; i++) {
    const question = restored.questions[i];
    const right = restored.options[i]
      .filter((o) => question.correctOptionIds.includes(o.id))
      .map((o) => o.id);
    const wrong = restored.options[i].find(
      (o) => !question.correctOptionIds.includes(o.id),
    )!;

    assert.equal(gradeAnswer(question, right), true, `${question.id}: all`);
    assert.equal(
      gradeAnswer(question, right.slice(1)),
      false,
      `${question.id}: subset scored`,
    );
    assert.equal(
      gradeAnswer(question, [...right, wrong.id]),
      false,
      `${question.id}: superset scored`,
    );
    assert.equal(
      gradeAnswer(question, [...right.slice(1), wrong.id]),
      false,
      `${question.id}: swap scored`,
    );
  }
});

/* ========================================================================
   15. Storage separation
   ===================================================================== */

test("15. the active sitting never touches progress storage", () => {
  const storage = new MemoryStorage();
  storage.setItem(PROGRESS_KEY, JSON.stringify(emptyProgress(TRACK)));
  const progressBefore = storage.getItem(PROGRESS_KEY);

  const { snapshot } = startSitting();
  writeActiveSession(snapshot, storage);
  clearActiveSession(storage);

  assert.equal(storage.getItem(PROGRESS_KEY), progressBefore);
  assert.deepEqual(
    [...storage.data.keys()].sort(),
    [PROGRESS_KEY],
    "the active session left a key behind after clearing",
  );
});

test("15b. the active sitting stores no attempt-shaped data", () => {
  const storage = new MemoryStorage();
  const { snapshot } = startSitting();
  writeActiveSession(snapshot, storage);
  const stored = JSON.parse(storage.getItem(ACTIVE_SESSION_KEY)!);

  for (const key of ["attempts", "reviewCards", "streak", "dailyGoal"]) {
    assert.equal(key in stored, false, `active session carries ${key}`);
  }
});

/* ========================================================================
   The selection bug: restoration must not re-run selection
   ===================================================================== */

test("restoration ignores the attempt history that would change selection", () => {
  /*
    The bug this exists to prevent: rebuilding a sitting from its seed after
    answering. Selection scores against the attempt history — unseen +40,
    previously-correct -25, previously-wrong +20 — so answering three questions
    changes which ten the scorer picks.

    Measured on this bank: 0 of 10 seeds reproduce the sitting, ~7 of 10
    questions survive, and all three already-answered ones drop out. The fix is
    that restoration never asks the scorer anything.
  */
  const seeds = [1, 42, 4242, 99999, 7, 31337, 2024, 555, 8888, 13];

  for (const seed of seeds) {
    const storage = new MemoryStorage();
    const fresh = emptyProgress(TRACK);
    const { sitting, snapshot } = startSitting(seed, 10, fresh);
    writeActiveSession({ ...snapshot, index: 3 }, storage);

    // The learner answers the first three. Progress now looks quite different.
    const midSession: UserProgress = {
      ...fresh,
      attempts: sitting.questions
        .slice(0, 3)
        .map((q, i) => attemptFor(q.id, i !== 1)),
    };

    // Restoration: unchanged, because it never consults progress.
    const restored = sittingFromSnapshot(
      resumeActiveSession({ mode: "practice", seed }, storage)!,
    )!;
    assert.deepEqual(
      restored.questions.map((q) => q.id),
      sitting.questions.map((q) => q.id),
      `seed ${seed}: the restored sitting differs`,
    );
    assert.deepEqual(
      restored.options.map((r) => r.map((o) => o.id)),
      sitting.options.map((r) => r.map((o) => o.id)),
      `seed ${seed}: option order changed on restore`,
    );

    // And the proof that this was not a no-op: rebuilding *would* have
    // produced something else. If this ever stops being true the test above
    // has become vacuous.
    const rebuilt = buildSitting(midSession, { seed, count: 10, trackId: TRACK });
    assert.notDeepEqual(
      rebuilt.questions.map((q) => q.id),
      sitting.questions.map((q) => q.id),
      `seed ${seed}: rebuilding no longer diverges, so this test proves nothing`,
    );

    // The three answered questions are still in the restored sitting, at the
    // positions the learner left them.
    for (let i = 0; i < 3; i++) {
      assert.equal(restored.questions[i].id, sitting.questions[i].id);
    }
  }
});

test("restoration survives an attempt history that would reorder everything", () => {
  // The extreme case: every question in the bank answered correctly, which
  // inverts the scorer's preferences completely.
  const storage = new MemoryStorage();
  const fresh = emptyProgress(TRACK);
  const { sitting, snapshot } = startSitting(777, 10, fresh);
  writeActiveSession(snapshot, storage);

  const saturated: UserProgress = {
    ...fresh,
    attempts: ALL.map((q) => attemptFor(q.id, true)),
  };
  const rebuilt = buildSitting(saturated, { seed: 777, count: 10, trackId: TRACK });
  assert.notDeepEqual(
    rebuilt.questions.map((q) => q.id),
    sitting.questions.map((q) => q.id),
  );

  const restored = sittingFromSnapshot(
    resumeActiveSession({ mode: "practice", seed: 777 }, storage)!,
  )!;
  assert.deepEqual(
    restored.questions.map((q) => q.id),
    sitting.questions.map((q) => q.id),
  );
});

/* ========================================================================
   Restoring a revealed question must not double-count
   ===================================================================== */

test("a revealed question's verdict is re-derived, not re-answered", () => {
  // The component derives wasCorrect with gradeAnswer over the restored option
  // ids. This pins that the derivation is correct for both outcomes, so the
  // restore path never needs to call recordAnswer — which would write a second
  // attempt for one answer every time someone refreshed.
  const { sitting, snapshot } = startSitting();
  const question = sitting.questions.find((q) => !isMultiSelect(q))!;
  const i = sitting.questions.indexOf(question);

  const right = sitting.options[i].find((o) =>
    question.correctOptionIds.includes(o.id),
  )!;
  const wrong = sitting.options[i].find(
    (o) => !question.correctOptionIds.includes(o.id),
  )!;

  for (const [picked, expected] of [
    [right.id, true],
    [wrong.id, false],
  ] as const) {
    const resumed = validateActiveSession({
      ...snapshot,
      index: i,
      selected: [picked],
      revealed: true,
    })!;
    assert.ok(resumed, "a revealed snapshot failed validation");
    const restored = sittingFromSnapshot(resumed)!;
    assert.equal(
      gradeAnswer(restored.questions[i], resumed.selected),
      expected,
    );
  }
});

/* ========================================================================
   Storage failure must never break the sitting
   ===================================================================== */

test("a storage that refuses to write does not throw", () => {
  const hostile: StorageLike = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("quota");
    },
    removeItem() {
      throw new Error("blocked");
    },
  };
  const { snapshot } = startSitting();
  assert.doesNotThrow(() => writeActiveSession(snapshot, hostile));
  assert.doesNotThrow(() => clearActiveSession(hostile));
  assert.equal(readActiveSession(hostile), null);
  assert.equal(resumeActiveSession({ mode: "practice", seed: 1 }, hostile), null);
});

test("no storage at all degrades to no persistence", () => {
  const { snapshot } = startSitting();
  assert.doesNotThrow(() => writeActiveSession(snapshot, null));
  assert.equal(readActiveSession(null), null);
  assert.equal(resumeActiveSession({ mode: "practice", seed: 1 }, null), null);
});
