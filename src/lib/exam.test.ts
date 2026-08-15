import assert from "node:assert/strict";
import { test } from "node:test";
import { getQuestion, getTrackQuestions } from "@/content/registry";
import { gradeAnswer, isMultiSelect } from "./grading";
import {
  DEFAULT_EXAM_DURATION_MS,
  DEFAULT_EXAM_QUESTIONS,
  type ExamSession,
  answerQuestion,
  createExamSession,
  formatRemaining,
  goToIndex,
  hasExpired,
  isAcceptingAnswers,
  remainingMs,
  scoreExam,
  sittingFromExam,
  submitExam,
  submitIfExpired,
  toggleFlag,
  unansweredIds,
} from "./exam";
import {
  EXAM_SESSION_KEY,
  type StorageLike,
  clearExamSession,
  readExamSession,
  resumeExamSession,
  validateExamSession,
  writeExamSession,
} from "./exam-storage";
import { buildSitting } from "./session";
import { emptyProgress, type Attempt, type UserProgress } from "./types";

/**
 * Exam mode.
 *
 * Three properties carry the whole feature, and each has its own section:
 *
 *   - a sitting, once started, is fixed — refresh restores it exactly;
 *   - the clock is wall-clock, so nothing the client does hands back time;
 *   - an exam and practice progress never touch each other.
 */

const TRACK = "aigp-preparation" as const;
const ALL = getTrackQuestions(TRACK);
const T0 = Date.parse("2026-03-01T09:00:00.000Z");

class MemoryStorage implements StorageLike {
  readonly data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

const start = (over: Partial<{ count: number; durationMs: number; seed: number; now: number }> = {}) =>
  createExamSession({
    seed: over.seed ?? 4242,
    count: over.count ?? 25,
    durationMs: over.durationMs ?? DEFAULT_EXAM_DURATION_MS,
    trackId: TRACK,
    now: over.now ?? T0,
  });

/* ========================================================================
   Composition
   ===================================================================== */

test("an exam is composed to the requested size with defaults available", () => {
  const s = start({ count: 25 });
  assert.equal(s.questionIds.length, 25);
  assert.equal(s.optionIds.length, 25);
  assert.equal(s.durationMs, DEFAULT_EXAM_DURATION_MS);
  assert.equal(new Set(s.questionIds).size, 25, "an exam repeated a question");
  assert.equal(DEFAULT_EXAM_QUESTIONS, 100);
});

test("a full-length exam can be composed from the bank", () => {
  const s = start({ count: DEFAULT_EXAM_QUESTIONS });
  assert.equal(s.questionIds.length, DEFAULT_EXAM_QUESTIONS);
  assert.equal(new Set(s.questionIds).size, DEFAULT_EXAM_QUESTIONS);
});

test("the deadline is the start plus the duration", () => {
  const s = start({ durationMs: 60_000, now: T0 });
  assert.equal(Date.parse(s.deadline) - Date.parse(s.startedAt), 60_000);
});

test("each sitting gets its own id", () => {
  assert.notEqual(start().examId, start().examId);
});

test("the same seed composes the same exam", () => {
  const a = start({ seed: 77 });
  const b = start({ seed: 77 });
  assert.deepEqual(a.questionIds, b.questionIds);
  assert.deepEqual(a.optionIds, b.optionIds);
});

/* ========================================================================
   Persistence — refresh restores the sitting exactly
   ===================================================================== */

test("refresh preserves the exact question sequence", () => {
  const storage = new MemoryStorage();
  const s = start();
  writeExamSession(s, storage);
  assert.deepEqual(resumeExamSession(storage)!.questionIds, s.questionIds);
});

test("refresh preserves the exact option order, letters included", () => {
  const storage = new MemoryStorage();
  const s = start();
  writeExamSession(s, storage);
  const before = sittingFromExam(s)!;
  const after = sittingFromExam(resumeExamSession(storage)!)!;
  assert.deepEqual(
    after.options.map((r) => r.map((o) => `${o.key}:${o.id}`)),
    before.options.map((r) => r.map((o) => `${o.key}:${o.id}`)),
  );
});

test("refresh preserves the current index", () => {
  const storage = new MemoryStorage();
  writeExamSession(goToIndex(start(), 17), storage);
  assert.equal(resumeExamSession(storage)!.index, 17);
});

test("refresh preserves selected answers", () => {
  const storage = new MemoryStorage();
  let s = start();
  const sitting = sittingFromExam(s)!;
  s = answerQuestion(s, sitting.questions[0].id, [sitting.options[0][2].id], T0);
  s = answerQuestion(s, sitting.questions[3].id, [sitting.options[3][0].id], T0);
  writeExamSession(s, storage);

  const back = resumeExamSession(storage)!;
  assert.deepEqual(back.answers, s.answers);
  assert.equal(Object.keys(back.answers).length, 2);
});

test("refresh preserves flags", () => {
  const storage = new MemoryStorage();
  let s = start();
  s = toggleFlag(s, s.questionIds[2], T0);
  s = toggleFlag(s, s.questionIds[9], T0);
  writeExamSession(s, storage);
  assert.deepEqual(resumeExamSession(storage)!.flagged, [
    s.questionIds[2],
    s.questionIds[9],
  ]);
});

test("refresh preserves the deadline", () => {
  const storage = new MemoryStorage();
  const s = start();
  writeExamSession(s, storage);
  assert.equal(resumeExamSession(storage)!.deadline, s.deadline);
});

test("refresh does not create a second exam attempt", () => {
  const storage = new MemoryStorage();
  const s = start();
  writeExamSession(s, storage);
  for (let reload = 0; reload < 5; reload++) {
    const back = resumeExamSession(storage)!;
    assert.equal(back.examId, s.examId, "a reload minted a new exam id");
    assert.equal(back.startedAt, s.startedAt);
    writeExamSession(back, storage);
  }
  assert.equal(storage.data.size, 1, "more than one exam record exists");
});

/* ========================================================================
   Persistence — bad state fails safely
   ===================================================================== */

test("corrupt state fails safely and clears itself", () => {
  for (const junk of ["not json", "null", "[]", "{}", '{"version":1}', "7"]) {
    const storage = new MemoryStorage();
    storage.setItem(EXAM_SESSION_KEY, junk);
    assert.equal(resumeExamSession(storage), null, `resumed from ${junk}`);
    assert.equal(storage.getItem(EXAM_SESSION_KEY), null, `kept ${junk}`);
  }
});

test("a tampered deadline fails safely", () => {
  // The single highest-value thing to forge: more time.
  const s = start({ durationMs: 60_000 });
  const stretched = {
    ...s,
    deadline: new Date(Date.parse(s.deadline) + 3_600_000).toISOString(),
  };
  assert.equal(
    validateExamSession(stretched),
    null,
    "a deadline inconsistent with start + duration was accepted",
  );
});

test("a mismatched question sequence fails safely", () => {
  const s = start();
  assert.equal(
    validateExamSession({ ...s, questionIds: [...s.questionIds.slice(1), "aigp-999"] }),
    null,
  );
  assert.equal(validateExamSession({ ...s, optionIds: s.optionIds.slice(1) }), null);

  const foreign = ALL.find((q) => q.id !== s.questionIds[0])!.options[0].id;
  const swapped = s.optionIds.map((r) => [...r]);
  swapped[0][0] = foreign;
  assert.equal(validateExamSession({ ...s, optionIds: swapped }), null);
});

test("an answer for a question outside the sitting fails safely", () => {
  const s = start({ count: 10 });
  const outside = ALL.find((q) => !s.questionIds.includes(q.id))!;
  assert.equal(
    validateExamSession({ ...s, answers: { [outside.id]: [outside.options[0].id] } }),
    null,
  );
  assert.equal(
    validateExamSession({ ...s, answers: { [s.questionIds[0]]: ["not-an-option"] } }),
    null,
  );
});

test("out-of-bounds index and unknown flags fail safely", () => {
  const s = start({ count: 10 });
  for (const index of [-1, 10, 99, 1.5]) {
    assert.equal(validateExamSession({ ...s, index }), null, `index ${index}`);
  }
  assert.equal(validateExamSession({ ...s, flagged: ["aigp-999"] }), null);
});

test("an inconsistent submission record fails safely", () => {
  const s = start();
  assert.equal(validateExamSession({ ...s, submittedReason: "manual" }), null);
  assert.equal(
    validateExamSession({ ...s, submittedAt: new Date(T0).toISOString(), submittedReason: null }),
    null,
  );
  assert.equal(
    validateExamSession({
      ...s,
      submittedAt: new Date(T0).toISOString(),
      submittedReason: "cheated",
    }),
    null,
  );
});

test("a storage that throws does not break the exam", () => {
  const hostile: StorageLike = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("quota"); },
    removeItem() { throw new Error("blocked"); },
  };
  const s = start();
  assert.doesNotThrow(() => writeExamSession(s, hostile));
  assert.doesNotThrow(() => clearExamSession(hostile));
  assert.equal(readExamSession(hostile), null);
  assert.equal(resumeExamSession(hostile), null);
});

/* ========================================================================
   Timer
   ===================================================================== */

test("remaining time derives from the absolute deadline", () => {
  const s = start({ durationMs: 3_600_000, now: T0 });
  assert.equal(remainingMs(s, T0), 3_600_000);
  assert.equal(remainingMs(s, T0 + 600_000), 3_000_000);
  assert.equal(remainingMs(s, T0 + 3_600_000), 0);
  assert.equal(remainingMs(s, T0 + 9_999_999), 0, "remaining went negative");
});

test("refresh does not reset the timer", () => {
  const storage = new MemoryStorage();
  const s = start({ durationMs: 3_600_000, now: T0 });
  writeExamSession(s, storage);

  // Two hours of wall clock pass, including a closed tab. Reload.
  const later = T0 + 2 * 3_600_000;
  const back = resumeExamSession(storage)!;
  assert.equal(back.deadline, s.deadline, "the deadline moved");
  assert.equal(remainingMs(back, later), 0, "a reload handed back time");
});

test("time already spent is not returned by reloading", () => {
  const storage = new MemoryStorage();
  const s = start({ durationMs: 3_600_000, now: T0 });
  writeExamSession(s, storage);
  const mid = T0 + 1_500_000;
  assert.equal(remainingMs(resumeExamSession(storage)!, mid), 3_600_000 - 1_500_000);
});

test("an expired deadline submits automatically, with the reason recorded", () => {
  const s = start({ durationMs: 1000, now: T0 });
  const before = submitIfExpired(s, T0 + 500);
  assert.equal(before.submittedAt, null, "submitted early");

  const after = submitIfExpired(s, T0 + 1001);
  assert.equal(after.submittedReason, "expired");
  assert.ok(after.submittedAt);
  assert.ok(hasExpired(after, T0 + 1001));
});

test("an expired exam accepts no further answers or flags", () => {
  const s = start({ durationMs: 1000, now: T0 });
  const expired = submitIfExpired(s, T0 + 2000);
  const qid = expired.questionIds[0];
  const optionId = getQuestion(qid)!.options[0].id;

  assert.equal(isAcceptingAnswers(expired, T0 + 2000), false);
  assert.deepEqual(answerQuestion(expired, qid, [optionId], T0 + 2000).answers, {});
  assert.deepEqual(toggleFlag(expired, qid, T0 + 2000).flagged, []);
});

test("answers are refused once the clock runs out even before submission", () => {
  // The deadline binds on its own; nothing has to have called submit yet.
  const s = start({ durationMs: 1000, now: T0 });
  const qid = s.questionIds[0];
  const optionId = getQuestion(qid)!.options[0].id;
  assert.deepEqual(answerQuestion(s, qid, [optionId], T0 + 5000).answers, {});
});

test("manual submission works and records its reason", () => {
  const s = submitExam(start(), "manual", T0 + 1000);
  assert.equal(s.submittedReason, "manual");
  assert.equal(s.submittedAt, new Date(T0 + 1000).toISOString());
  assert.equal(isAcceptingAnswers(s, T0 + 1000), false);
});

test("duplicate submission is prevented and cannot rewrite the first", () => {
  const first = submitExam(start(), "manual", T0 + 1000);
  const second = submitExam(first, "expired", T0 + 9_000_000);
  assert.equal(second.submittedAt, first.submittedAt);
  assert.equal(second.submittedReason, "manual");
  // Expiry arriving after a manual submission must not overwrite it either.
  assert.equal(submitIfExpired(first, T0 + 9_000_000).submittedReason, "manual");
});

test("the clock renders as a readable countdown", () => {
  assert.equal(formatRemaining(3 * 3600_000), "3:00:00");
  assert.equal(formatRemaining(65_000), "01:05");
  assert.equal(formatRemaining(0), "00:00");
});

/* ========================================================================
   Separation from practice
   ===================================================================== */

test("exam state does not contaminate practice storage", () => {
  const storage = new MemoryStorage();
  const PROGRESS = "nhid-clinical:progress:v1";
  const ACTIVE = "nhid-clinical:active-session:v1";
  storage.setItem(PROGRESS, JSON.stringify(emptyProgress(TRACK)));
  storage.setItem(ACTIVE, JSON.stringify({ version: 1 }));
  const snapshot = [storage.getItem(PROGRESS), storage.getItem(ACTIVE)];

  writeExamSession(start(), storage);
  resumeExamSession(storage);
  clearExamSession(storage);

  assert.deepEqual([storage.getItem(PROGRESS), storage.getItem(ACTIVE)], snapshot);
  assert.deepEqual([...storage.data.keys()].sort(), [ACTIVE, PROGRESS]);
});

test("an exam carries no practice fields", () => {
  const s = start();
  for (const key of ["attempts", "reviewCards", "streak", "dailyGoal", "lastStudyDate"]) {
    assert.equal(key in s, false, `exam session carries ${key}`);
  }
});

test("practice history does not reorder an active exam", () => {
  /*
    The property that makes an exam an exam. Practice selection is adaptive, so
    a candidate who has been drilling would otherwise get a different paper —
    and their paper would change under them as they answered.
  */
  const storage = new MemoryStorage();
  const s = start({ seed: 909 });
  writeExamSession(s, storage);

  const attemptFor = (questionId: string, correct: boolean): Attempt => {
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
      createdAt: new Date(T0).toISOString(),
    } as Attempt;
  };
  const busy: UserProgress = {
    ...emptyProgress(TRACK),
    attempts: ALL.map((q, i) => attemptFor(q.id, i % 3 !== 0)),
  };

  // A practice sitting built from that history diverges — proving the history
  // is doing something — while the stored exam is untouched.
  const practice = buildSitting(busy, { seed: 909, count: 25, trackId: TRACK });
  assert.notDeepEqual(
    practice.questions.map((q) => q.id),
    s.questionIds,
    "practice selection no longer depends on history; this test proves nothing",
  );
  assert.deepEqual(resumeExamSession(storage)!.questionIds, s.questionIds);
});

test("an exam is composed identically whatever the candidate has practiced", () => {
  // Composition ignores progress entirely, so two candidates with the same
  // seed sit the same paper.
  const a = createExamSession({ seed: 55, count: 20, trackId: TRACK, now: T0 });
  const b = createExamSession({ seed: 55, count: 20, trackId: TRACK, now: T0 + 10_000 });
  assert.deepEqual(a.questionIds, b.questionIds);
});

test("finishing an exam writes nothing to practice progress", () => {
  const storage = new MemoryStorage();
  const PROGRESS = "nhid-clinical:progress:v1";
  storage.setItem(PROGRESS, JSON.stringify(emptyProgress(TRACK)));
  const before = storage.getItem(PROGRESS);

  let s = start({ count: 10 });
  const sitting = sittingFromExam(s)!;
  for (let i = 0; i < 10; i++) {
    s = answerQuestion(s, sitting.questions[i].id, [sitting.options[i][0].id], T0);
  }
  s = submitExam(s, "manual", T0 + 5000);
  writeExamSession(s, storage);
  scoreExam(s);

  assert.equal(storage.getItem(PROGRESS), before, "scoring an exam altered progress");
});

/* ========================================================================
   Scoring
   ===================================================================== */

test("a perfect exam scores 100 with nothing missed", () => {
  let s = start({ count: 20 });
  const sitting = sittingFromExam(s)!;
  sitting.questions.forEach((q, i) => {
    const right = sitting.options[i]
      .filter((o) => q.correctOptionIds.includes(o.id))
      .map((o) => o.id);
    s = answerQuestion(s, q.id, right, T0);
  });
  const r = scoreExam(s);
  assert.equal(r.correct, 20);
  assert.equal(r.incorrect, 0);
  assert.equal(r.unanswered, 0);
  assert.equal(r.percentage, 100);
  assert.deepEqual(r.missedIds, []);
});

test("unanswered questions count against the score and are listed as missed", () => {
  let s = start({ count: 10 });
  const sitting = sittingFromExam(s)!;
  // Answer the first five correctly, leave the rest blank.
  for (let i = 0; i < 5; i++) {
    const q = sitting.questions[i];
    s = answerQuestion(
      s,
      q.id,
      sitting.options[i].filter((o) => q.correctOptionIds.includes(o.id)).map((o) => o.id),
      T0,
    );
  }
  const r = scoreExam(s);
  assert.equal(r.correct, 5);
  assert.equal(r.unanswered, 5);
  assert.equal(r.incorrect, 0);
  assert.equal(r.percentage, 50);
  assert.equal(r.missedIds.length, 5);
  assert.deepEqual(unansweredIds(s), s.questionIds.slice(5));
});

test("wrong answers are incorrect rather than unanswered", () => {
  let s = start({ count: 5 });
  const sitting = sittingFromExam(s)!;
  sitting.questions.forEach((q, i) => {
    const wrong = sitting.options[i].find((o) => !q.correctOptionIds.includes(o.id))!;
    s = answerQuestion(s, q.id, [wrong.id], T0);
  });
  const r = scoreExam(s);
  assert.equal(r.correct, 0);
  assert.equal(r.incorrect, 5);
  assert.equal(r.unanswered, 0);
});

test("multi-select is scored all-or-nothing in an exam too", () => {
  const multi = ALL.find(isMultiSelect)!;
  let s = start({ count: 40 });
  if (!s.questionIds.includes(multi.id)) {
    // Compose a sitting that definitely contains it.
    s = { ...s, questionIds: [multi.id], optionIds: [multi.options.map((o) => o.id)], index: 0 };
  }
  const sitting = sittingFromExam(s)!;
  const i = sitting.questions.findIndex((q) => q.id === multi.id);
  const right = sitting.options[i]
    .filter((o) => multi.correctOptionIds.includes(o.id))
    .map((o) => o.id);

  const partial = answerQuestion(s, multi.id, right.slice(1), T0);
  assert.equal(gradeAnswer(multi, right.slice(1)), false);
  assert.ok(scoreExam(partial).missedIds.includes(multi.id));

  const full = answerQuestion(s, multi.id, right, T0);
  assert.ok(!scoreExam(full).missedIds.includes(multi.id));
});

test("the breakdown adds up to the sitting", () => {
  const s = start({ count: 40 });
  const r = scoreExam(s);
  assert.equal(
    r.byDomain.reduce((n, d) => n + d.total, 0),
    40,
    "domain totals do not sum to the exam",
  );
  assert.equal(
    r.bySubdomain.reduce((n, d) => n + d.total, 0),
    40,
    "sub-domain totals do not sum to the exam",
  );
  assert.equal(r.correct + r.incorrect + r.unanswered, r.total);
  for (const d of r.byDomain) assert.ok(["I", "II", "III", "IV"].includes(d.roman));
});

test("scoring is derived, so it never disagrees with the questions", () => {
  // Nothing about correctness is stored at submission; the same session scores
  // the same way every time it is read.
  let s = start({ count: 15 });
  const sitting = sittingFromExam(s)!;
  sitting.questions.forEach((q, i) => {
    s = answerQuestion(s, q.id, [sitting.options[i][1].id], T0);
  });
  s = submitExam(s, "manual", T0 + 1000);
  assert.deepEqual(scoreExam(s), scoreExam(s));
  const roundTripped = JSON.parse(JSON.stringify(s)) as ExamSession;
  assert.deepEqual(scoreExam(roundTripped), scoreExam(s));
});

/* ========================================================================
   Navigation
   ===================================================================== */

test("navigation stays inside the sitting", () => {
  const s = start({ count: 10 });
  assert.equal(goToIndex(s, 5).index, 5);
  assert.equal(goToIndex(s, -1).index, 0, "moved before the first question");
  assert.equal(goToIndex(s, 10).index, 0, "moved past the last question");
});

test("flagging toggles and survives submission as a record", () => {
  let s = start({ count: 10 });
  const qid = s.questionIds[3];
  s = toggleFlag(s, qid, T0);
  assert.deepEqual(s.flagged, [qid]);
  s = toggleFlag(s, qid, T0);
  assert.deepEqual(s.flagged, []);

  s = toggleFlag(s, qid, T0);
  s = submitExam(s, "manual", T0 + 100);
  assert.equal(scoreExam(s).flaggedCount, 1);
});

test("answering the same question twice replaces rather than accumulates", () => {
  let s = start({ count: 5 });
  const q = getQuestion(s.questionIds[0])!;
  s = answerQuestion(s, q.id, [q.options[0].id], T0);
  s = answerQuestion(s, q.id, [q.options[1].id], T0);
  assert.deepEqual(s.answers[q.id], [q.options[1].id]);
});
