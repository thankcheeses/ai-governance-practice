import assert from "node:assert/strict";
import { test } from "node:test";
import { applyAttempt, applyReviewGrade } from "@/lib/progress-updates";
import type { Attempt, UserProgress } from "@/lib/types";

/**
 * Two writes in one tick must both survive.
 *
 * The bonus card mid-practice and the post-exam second look each record an
 * attempt and then immediately grade the review schedule. While both writes
 * were built from the same render-time snapshot, the second one carried a
 * `reviewCards` map and an `attempts` array from *before* the first, so
 * applying it discarded the attempt: the learner answered, the schedule moved,
 * and nothing recorded that they had answered at all. These tests pin the
 * composition that fixes it — each update is a function of the state it is
 * applied to, so feeding the first result into the second keeps both.
 */
const TODAY = "2026-10-11";
const NOW = "2026-10-11T12:00:00.000Z";

function baseProgress(): UserProgress {
  return {
    trackId: "aigp-preparation",
    onboardingCompletedAt: NOW,
    disclaimerAckedAt: NOW,
    dailyGoal: 15,
    streak: 1,
    longestStreak: 1,
    lastStudyDate: TODAY,
    attempts: [],
    reviewCards: {},
    updatedAt: NOW,
  };
}

function attemptFor(questionId: string, correct: boolean): Attempt {
  return {
    id: `${questionId}-1`,
    trackId: "aigp-preparation",
    questionId,
    selected: ["a"],
    correct,
    responseTimeMs: 0,
    difficulty: "applied",
    domain: "Foundations of AI Governance",
    confidence: null,
    createdAt: NOW,
    mode: "review",
  };
}

test("an attempt then a review grade keeps both", () => {
  const start = baseProgress();
  const recorded = applyAttempt(start, attemptFor("aigp-001", true), TODAY).next;
  const graded = applyReviewGrade(recorded, "aigp-001", "good", TODAY, NOW).next;

  assert.equal(
    graded.attempts.length,
    1,
    "grading the review schedule dropped the recorded attempt",
  );
  assert.equal(graded.attempts[0]?.questionId, "aigp-001");
  assert.ok(
    graded.reviewCards["aigp-001"],
    "the question was not scheduled for review",
  );
});

test("the same two writes from one shared snapshot would lose the attempt", () => {
  /*
    The bug, written down. Both writes derive from `start`, as they did when
    each read a ref assigned during render. The second one wins, and the
    attempt is gone — which is why the provider rebuilds on current state
    instead.
  */
  const start = baseProgress();
  applyAttempt(start, attemptFor("aigp-001", false), TODAY);
  const fromStaleSnapshot = applyReviewGrade(
    start,
    "aigp-001",
    "again",
    TODAY,
    NOW,
  ).next;

  assert.equal(
    fromStaleSnapshot.attempts.length,
    0,
    "this is the regression being guarded against — if a shared snapshot now " +
      "preserves the attempt, the composition in the provider is no longer " +
      "what keeps it",
  );
});

test("a missed question is queued for review, a correct one is not", () => {
  const missed = applyAttempt(
    baseProgress(),
    attemptFor("aigp-002", false),
    TODAY,
  );
  assert.equal(missed.queuedForReview, true);
  assert.ok(missed.card, "no card was returned to push upstream");

  const landed = applyAttempt(
    baseProgress(),
    attemptFor("aigp-003", true),
    TODAY,
  );
  assert.equal(landed.queuedForReview, false);
  assert.equal(landed.card, null);
});

test("a question already in the queue is not re-queued by a second miss", () => {
  const first = applyAttempt(
    baseProgress(),
    attemptFor("aigp-004", false),
    TODAY,
  );
  const second = applyAttempt(
    first.next,
    attemptFor("aigp-004", false),
    TODAY,
  );
  assert.equal(
    second.queuedForReview,
    false,
    "a second miss restarted the card's schedule from scratch",
  );
  assert.equal(second.next.attempts.length, 2);
});

test("grading a question that was never queued still schedules it", () => {
  // The second look reaches questions the exam missed, and an exam does not
  // necessarily leave a card behind for every one of them.
  const { next, card } = applyReviewGrade(
    baseProgress(),
    "aigp-005",
    "again",
    TODAY,
    NOW,
  );
  assert.ok(next.reviewCards["aigp-005"], "no card was created");
  assert.equal(card.questionId, "aigp-005");
});
