import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ALL_QUESTIONS, getTrackQuestions } from "@/content/registry";
import { answerText, buildDeck, DECK_SIZE } from "@/lib/flashcards";
import { newReviewCard } from "@/lib/spaced-repetition";
import type { Attempt, UserProgress } from "@/lib/types";

const TODAY = "2026-10-12";

function emptyProgress(): UserProgress {
  return {
    trackId: "aigp-preparation",
    onboardingCompletedAt: `${TODAY}T00:00:00.000Z`,
    disclaimerAckedAt: `${TODAY}T00:00:00.000Z`,
    dailyGoal: 15,
    streak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    attempts: [],
    reviewCards: {},
    updatedAt: `${TODAY}T00:00:00.000Z`,
  };
}

function missed(questionId: string): Attempt {
  const question = ALL_QUESTIONS.find((q) => q.id === questionId)!;
  return {
    id: `${questionId}-1`,
    trackId: question.trackId,
    questionId,
    selected: [],
    correct: false,
    responseTimeMs: 0,
    difficulty: question.difficulty,
    domain: question.domain,
    confidence: null,
    createdAt: `${TODAY}T00:00:00.000Z`,
    mode: "practice",
  };
}

test("a fresh learner still gets a full deck", () => {
  // The queue is empty on day one. A flashcard mode that only dealt due cards
  // would show a new learner nothing at all, which is the opposite of what
  // flashcards are for.
  const deck = buildDeck(emptyProgress(), { seed: 7 });
  assert.equal(deck.length, DECK_SIZE);
  assert.ok(
    deck.every((c) => c.source === "new"),
    "nothing was attempted, so every card should read as new",
  );
});

test("due cards come first, in the review queue's order", () => {
  const progress = emptyProgress();
  const ids = getTrackQuestions("aigp-preparation")
    .slice(40, 43)
    .map((q) => q.id);
  progress.attempts = ids.map(missed);
  for (const id of ids) {
    progress.reviewCards[id] = newReviewCard(id, "aigp-preparation", TODAY);
  }

  const deck = buildDeck(progress, { seed: 7 });
  const front = deck.slice(0, ids.length);
  assert.deepEqual(
    front.map((c) => c.question.id).sort(),
    [...ids].sort(),
    "the missed questions are not at the front of the deck",
  );
  assert.ok(
    front.every((c) => c.source === "due"),
    "a card drawn from the review queue should say so",
  );
  assert.equal(deck.length, DECK_SIZE, "the deck was not filled out");
});

test("a question is never dealt twice in one deck", () => {
  const progress = emptyProgress();
  const ids = getTrackQuestions("aigp-preparation")
    .slice(0, 5)
    .map((q) => q.id);
  progress.attempts = ids.map(missed);
  for (const id of ids) {
    progress.reviewCards[id] = newReviewCard(id, "aigp-preparation", TODAY);
  }

  const deck = buildDeck(progress, { seed: 3 });
  const seen = new Set(deck.map((c) => c.question.id));
  assert.equal(seen.size, deck.length, "the same question appears twice");
});

test("the same seed deals the same deck", () => {
  // A deck that reshuffled on re-render would move the card out from under
  // whoever was reading it.
  const a = buildDeck(emptyProgress(), { seed: 99 });
  const b = buildDeck(emptyProgress(), { seed: 99 });
  assert.deepEqual(
    a.map((c) => c.question.id),
    b.map((c) => c.question.id),
  );
});

test("a card already scheduled carries its scheduling card", () => {
  const progress = emptyProgress();
  const id = getTrackQuestions("aigp-preparation")[12]!.id;
  progress.attempts = [missed(id)];
  progress.reviewCards[id] = newReviewCard(id, "aigp-preparation", TODAY);

  const dealt = buildDeck(progress, { seed: 1 }).find(
    (c) => c.question.id === id,
  );
  assert.ok(dealt, "the scheduled question was not dealt");
  assert.equal(
    dealt.card?.questionId,
    id,
    "without its card the rating buttons cannot show real intervals",
  );
});

test("the answer is the question's own correct option text", () => {
  const question = ALL_QUESTIONS[0]!;
  const text = answerText(question);
  assert.equal(text.length, question.correctOptionIds.length);
  for (const t of text) assert.ok(t.length > 0, "an answer came back empty");
});

test("every question in the bank can be turned into a card", () => {
  // The front is the stem and the back is the keyed option text. Both are
  // required fields, but a card with an empty face is a broken screen, so this
  // asserts it across the whole bank rather than trusting the type.
  for (const question of ALL_QUESTIONS) {
    assert.ok(question.question.trim().length > 0, `${question.id}: no stem`);
    assert.ok(
      question.keyTakeaway.trim().length > 0,
      `${question.id}: no key takeaway`,
    );
    assert.equal(
      answerText(question).length,
      question.correctOptionIds.length,
      `${question.id}: an answer option is missing its text`,
    );
  }
});

/**
 * The separation that makes self-grading honest.
 *
 * A flashcard grade is the learner's claim about themselves. Accuracy, and the
 * readiness band built on it, are measured from answers graded against a key.
 * If this mode ever recorded an attempt, an unmeasured number would enter a
 * measured series with nothing downstream able to tell them apart — so the
 * source is asserted, not just documented.
 */
test("flashcards move the schedule and never record an attempt", () => {
  const source = readFileSync("src/components/study/flashcards.tsx", "utf8");
  assert.match(source, /gradeReview\(/, "the schedule is never updated");
  assert.ok(
    !/recordAnswer/.test(source),
    "flashcards record an attempt — self-grades must not enter accuracy",
  );
});
