import { newReviewCard, scheduleReview } from "@/lib/spaced-repetition";
import type {
  Attempt,
  ReviewCard,
  ReviewGrade,
  UserProgress,
} from "@/lib/types";
import { daysBetween } from "@/lib/utils";

/**
 * The two state transitions progress has: an answer was recorded, and a review
 * card was graded.
 *
 * They live here, as pure functions of the previous state, because two of them
 * can happen in one tick. A bonus card mid-practice and the post-exam second
 * look both record an attempt and then immediately grade the review schedule,
 * and when each write was built from a snapshot taken at render time the second
 * one silently discarded the first — the attempt vanished, and with it the
 * question's standing as answered. Taking `prev` as an argument is what lets the
 * provider feed each one the result of the last.
 */
export function nextStreak(progress: UserProgress, today: string) {
  const { lastStudyDate } = progress;
  if (!lastStudyDate) {
    return {
      streak: 1,
      longestStreak: Math.max(1, progress.longestStreak),
      lastStudyDate: today,
    };
  }

  const gap = daysBetween(lastStudyDate, today);
  if (gap === 0) {
    return {
      streak: progress.streak,
      longestStreak: progress.longestStreak,
      lastStudyDate,
    };
  }

  const streak = gap === 1 ? progress.streak + 1 : 1;
  return {
    streak,
    longestStreak: Math.max(streak, progress.longestStreak),
    lastStudyDate: today,
  };
}

/** Append an attempt, queue the question for review if it was missed. */
export function applyAttempt(
  prev: UserProgress,
  attempt: Attempt,
  today: string,
): { next: UserProgress; queuedForReview: boolean; card: ReviewCard | null } {
  const reviewCards = { ...prev.reviewCards };
  const queuedForReview = !attempt.correct && !reviewCards[attempt.questionId];
  if (queuedForReview) {
    reviewCards[attempt.questionId] = newReviewCard(
      attempt.questionId,
      attempt.trackId,
      today,
    );
  }

  const streak = nextStreak(prev, today);

  return {
    next: {
      ...prev,
      attempts: [...prev.attempts, attempt],
      reviewCards,
      streak: streak.streak,
      longestStreak: streak.longestStreak,
      lastStudyDate: streak.lastStudyDate,
      updatedAt: attempt.createdAt,
    },
    queuedForReview,
    card: queuedForReview ? reviewCards[attempt.questionId] : null,
  };
}

/** Move one question's place in the spaced-repetition queue. */
export function applyReviewGrade(
  prev: UserProgress,
  questionId: string,
  grade: ReviewGrade,
  today: string,
  now: string,
): { next: UserProgress; card: ReviewCard } {
  const existing =
    prev.reviewCards[questionId] ?? newReviewCard(questionId, prev.trackId);
  const card = scheduleReview(existing, grade, today);

  return {
    next: {
      ...prev,
      reviewCards: { ...prev.reviewCards, [questionId]: card },
      updatedAt: now,
    },
    card,
  };
}
