import type { Difficulty, OptionKey, TrackId } from "@/content/types";

/**
 * User-progress domain model.
 *
 * Deliberately free of points, levels, and badges. The motivational surface is
 * a daily goal and a streak — the things a working professional actually uses
 * to keep a study habit — and nothing more.
 */

export type Confidence = "guessed" | "unsure" | "confident";

export interface Attempt {
  id: string;
  trackId: TrackId;
  questionId: string;
  selected: OptionKey;
  correct: boolean;
  responseTimeMs: number;
  difficulty: Difficulty;
  domain: string;
  /** Self-reported confidence, used to prioritise the review queue. */
  confidence: Confidence | null;
  createdAt: string;
  mode: StudyMode;
}

/** SM-2 scheduling state, one record per question. */
export interface ReviewCard {
  questionId: string;
  trackId: TrackId;
  repetitions: number;
  easeFactor: number;
  /** Days until the next review. */
  interval: number;
  nextReviewDate: string;
  lastReviewedAt: string;
  lapses: number;
}

export type ReviewGrade = "again" | "hard" | "good" | "easy";

export type StudyMode = "practice" | "domain" | "review";

export interface DomainStat {
  domain: string;
  answered: number;
  correct: number;
  accuracy: number;
  /** Unique questions answered correctly on the most recent attempt. */
  mastered: number;
  total: number;
}

/**
 * Plans. `lab` is a real runtime state so entitlement checks and the database
 * accept it today, but no Lab content exists yet — see content/labs.ts. A user
 * cannot reach it through the UI until a lab ships.
 */
export type Tier = "free" | "pro" | "lab";

export interface UserProgress {
  trackId: TrackId;
  tier: Tier;
  onboardingCompletedAt: string | null;
  disclaimerAckedAt: string | null;
  /** Questions the learner aims to answer each day. */
  dailyGoal: number;
  streak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  attempts: Attempt[];
  reviewCards: Record<string, ReviewCard>;
  updatedAt: string;
}

export const DEFAULT_DAILY_GOAL = 10;

export function emptyProgress(trackId: TrackId = "aigp-preparation"): UserProgress {
  return {
    trackId,
    tier: "free",
    onboardingCompletedAt: null,
    disclaimerAckedAt: null,
    dailyGoal: DEFAULT_DAILY_GOAL,
    streak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    attempts: [],
    reviewCards: {},
    updatedAt: new Date().toISOString(),
  };
}
