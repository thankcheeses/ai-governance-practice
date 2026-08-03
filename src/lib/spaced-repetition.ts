import type { Question, TrackId } from "@/content/types";
import { getQuestion } from "@/content/registry";
import type {
  Attempt,
  Confidence,
  ReviewCard,
  ReviewGrade,
  UserProgress,
} from "./types";
import { addDays, daysBetween, todayISO } from "./utils";

/**
 * SM-2 spaced repetition.
 *
 * Deviations from textbook SM-2, chosen for professional exam prep:
 *  - Four grades instead of six, matching the Again/Hard/Good/Easy control set.
 *  - "Again" resets repetitions but only reduces the ease factor rather than
 *    restarting it, so one lapse does not erase an item's history.
 *  - Fixed early intervals make the first few reviews predictable, which
 *    matters when someone is studying against a date.
 */

export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;

const GRADE_QUALITY: Record<ReviewGrade, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

export function newReviewCard(
  questionId: string,
  trackId: TrackId,
  now = todayISO(),
): ReviewCard {
  return {
    questionId,
    trackId,
    repetitions: 0,
    easeFactor: DEFAULT_EASE,
    interval: 0,
    nextReviewDate: now,
    lastReviewedAt: now,
    lapses: 0,
  };
}

export function scheduleReview(
  card: ReviewCard,
  grade: ReviewGrade,
  now = todayISO(),
): ReviewCard {
  const quality = GRADE_QUALITY[grade];
  const easeDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  let easeFactor = Math.max(MIN_EASE, card.easeFactor + easeDelta);

  if (grade === "again") {
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
    return {
      ...card,
      repetitions: 0,
      easeFactor,
      interval: 1,
      nextReviewDate: addDays(now, 1),
      lastReviewedAt: now,
      lapses: card.lapses + 1,
    };
  }

  const repetitions = card.repetitions + 1;
  let interval: number;

  if (repetitions === 1) {
    interval = grade === "hard" ? 1 : grade === "good" ? 2 : 4;
  } else if (repetitions === 2) {
    interval = grade === "hard" ? 3 : grade === "good" ? 6 : 9;
  } else {
    const multiplier =
      grade === "hard" ? Math.max(1.2, easeFactor - 0.6) : easeFactor;
    interval = Math.round(card.interval * multiplier);
    if (grade === "easy") interval = Math.round(interval * 1.3);
  }

  interval = Math.max(1, Math.min(interval, 365));

  return {
    ...card,
    repetitions,
    easeFactor,
    interval,
    nextReviewDate: addDays(now, interval),
    lastReviewedAt: now,
  };
}

/** Interval each grade would produce, for labelling the rating buttons. */
export function gradePreview(card: ReviewCard, now = todayISO()) {
  const grades: ReviewGrade[] = ["again", "hard", "good", "easy"];
  return grades.map((grade) => {
    const next = scheduleReview(card, grade, now);
    return { grade, interval: next.interval, label: intervalLabel(next.interval) };
  });
}

export function intervalLabel(days: number) {
  if (days <= 1) return "1 day";
  if (days < 30) return `${days} days`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? "1 month" : `${months} months`;
  }
  return "1 year";
}

/* ------------------------------------------------------------------ */
/* Review queue                                                        */
/* ------------------------------------------------------------------ */

export type ReviewReason = "missed" | "low-confidence" | "due";

export interface ReviewItem {
  question: Question;
  card: ReviewCard | null;
  reason: ReviewReason;
  /** Lower sorts first. */
  priority: number;
  dueInDays: number;
}

const REASON_PRIORITY: Record<ReviewReason, number> = {
  missed: 0,
  "low-confidence": 1,
  due: 2,
};

const LOW_CONFIDENCE: Confidence[] = ["guessed", "unsure"];

/**
 * Builds the review queue, prioritising in the order the product calls for:
 * missed questions, then low-confidence answers, then everything else due.
 */
export function buildReviewQueue(
  progress: UserProgress,
  now = todayISO(),
): ReviewItem[] {
  const latestAttempt = new Map<string, Attempt>();
  for (const attempt of progress.attempts) {
    latestAttempt.set(attempt.questionId, attempt);
  }

  const items = new Map<string, ReviewItem>();

  const add = (
    questionId: string,
    reason: ReviewReason,
    card: ReviewCard | null,
  ) => {
    const question = getQuestion(questionId);
    if (!question) return;

    const existing = items.get(questionId);
    if (existing && REASON_PRIORITY[existing.reason] <= REASON_PRIORITY[reason]) {
      return;
    }

    const dueInDays = card ? -daysBetween(card.nextReviewDate, now) : 0;
    items.set(questionId, {
      question,
      card,
      reason,
      priority: REASON_PRIORITY[reason] * 1000 + dueInDays,
      dueInDays,
    });
  };

  // 1. Missed on the most recent attempt.
  for (const [questionId, attempt] of latestAttempt) {
    if (!attempt.correct) {
      add(questionId, "missed", progress.reviewCards[questionId] ?? null);
    }
  }

  // 2. Answered correctly but with low self-reported confidence.
  for (const [questionId, attempt] of latestAttempt) {
    if (attempt.correct && attempt.confidence && LOW_CONFIDENCE.includes(attempt.confidence)) {
      add(questionId, "low-confidence", progress.reviewCards[questionId] ?? null);
    }
  }

  // 3. Cards whose scheduled review date has arrived.
  for (const card of Object.values(progress.reviewCards)) {
    if (daysBetween(card.nextReviewDate, now) >= 0) {
      add(card.questionId, "due", card);
    }
  }

  return Array.from(items.values()).sort((a, b) => a.priority - b.priority);
}

export function dueCount(progress: UserProgress, now = todayISO()): number {
  return buildReviewQueue(progress, now).length;
}

/** Review load for the next `days` days, for the dashboard forecast. */
export function upcomingReviews(
  progress: UserProgress,
  days = 7,
  now = todayISO(),
): { date: string; count: number }[] {
  const buckets = new Map<string, number>();
  for (let i = 1; i <= days; i++) {
    buckets.set(addDays(now, i).slice(0, 10), 0);
  }
  for (const card of Object.values(progress.reviewCards)) {
    const key = card.nextReviewDate.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}
