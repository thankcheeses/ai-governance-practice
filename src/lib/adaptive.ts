import type { Difficulty, Question, TrackId } from "@/content/types";
import { DIFFICULTY_RANK } from "@/content/types";
import { getTrackQuestions } from "@/content/registry";
import type { Attempt, DomainStat, UserProgress } from "./types";
import { daysBetween, shuffle, todayISO } from "./utils";

/**
 * Adaptive learning foundation.
 *
 * Intentionally simple for the MVP: track difficulty, track accuracy, identify
 * weak domains, and use those three signals to order the next questions. No
 * model, no personalisation service — just transparent scoring that a
 * practitioner could read and predict. The seams are here for more later.
 */

/* ------------------------------------------------------------------ */
/* Accuracy and domain performance                                     */
/* ------------------------------------------------------------------ */

export function overallAccuracy(attempts: Attempt[]): number {
  if (!attempts.length) return 0;
  return Math.round(
    (attempts.filter((a) => a.correct).length / attempts.length) * 100,
  );
}

/**
 * A question counts as mastered when the learner's most recent attempt on it
 * was correct. Using the latest attempt rather than any-ever-correct means
 * mastery can be lost, which is the honest reading.
 */
export function masteredQuestionIds(attempts: Attempt[]): Set<string> {
  const latest = new Map<string, Attempt>();
  for (const attempt of attempts) {
    latest.set(attempt.questionId, attempt);
  }
  return new Set(
    Array.from(latest.values())
      .filter((a) => a.correct)
      .map((a) => a.questionId),
  );
}

export function domainStats(
  progress: UserProgress,
  trackId: TrackId = "aigp-preparation",
): DomainStat[] {
  const questions = getTrackQuestions(trackId);
  const totals = new Map<string, number>();
  for (const q of questions) {
    totals.set(q.domain, (totals.get(q.domain) ?? 0) + 1);
  }

  const mastered = masteredQuestionIds(progress.attempts);
  const masteredByDomain = new Map<string, Set<string>>();
  for (const q of questions) {
    if (mastered.has(q.id)) {
      const set = masteredByDomain.get(q.domain) ?? new Set<string>();
      set.add(q.id);
      masteredByDomain.set(q.domain, set);
    }
  }

  return Array.from(totals.entries()).map(([domain, total]) => {
    const attempts = progress.attempts.filter((a) => a.domain === domain);
    const correct = attempts.filter((a) => a.correct).length;
    return {
      domain,
      answered: attempts.length,
      correct,
      accuracy: attempts.length
        ? Math.round((correct / attempts.length) * 100)
        : 0,
      mastered: masteredByDomain.get(domain)?.size ?? 0,
      total,
    };
  });
}

/** Domains with enough evidence and accuracy below the threshold. */
const MIN_ATTEMPTS_FOR_SIGNAL = 3;
const WEAK_THRESHOLD = 70;

export function weakDomains(
  progress: UserProgress,
  trackId: TrackId = "aigp-preparation",
): DomainStat[] {
  return domainStats(progress, trackId)
    .filter(
      (d) => d.answered >= MIN_ATTEMPTS_FOR_SIGNAL && d.accuracy < WEAK_THRESHOLD,
    )
    .sort((a, b) => a.accuracy - b.accuracy);
}

export function strongDomains(
  progress: UserProgress,
  trackId: TrackId = "aigp-preparation",
): DomainStat[] {
  return domainStats(progress, trackId)
    .filter((d) => d.answered >= MIN_ATTEMPTS_FOR_SIGNAL && d.accuracy >= 80)
    .sort((a, b) => b.accuracy - a.accuracy);
}

/** How many domains a focus session draws from at most. */
export const FOCUS_DOMAIN_LIMIT = 2;

/**
 * The domains a focus session should draw from: the weakest ones the learner
 * has answered enough of for the number to mean something.
 *
 * Deliberately returns nothing until there is evidence. A drill aimed at a
 * domain with two attempts behind it is guesswork dressed up as coaching, and
 * the surfaces that offer it hide themselves when this is empty.
 */
export function focusDomains(
  progress: UserProgress,
  trackId: TrackId = "aigp-preparation",
  limit: number = FOCUS_DOMAIN_LIMIT,
): DomainStat[] {
  return weakDomains(progress, trackId).slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Difficulty targeting                                                */
/* ------------------------------------------------------------------ */

/**
 * Target difficulty follows recent accuracy. Kept as a pure function of the
 * attempt history so it is reproducible and needs no stored counters.
 */
export function targetDifficulty(attempts: Attempt[]): Difficulty {
  const recent = attempts.slice(-10);
  if (recent.length < 5) return "foundational";
  const accuracy = overallAccuracy(recent);
  if (accuracy >= 85) return "advanced";
  if (accuracy >= 65) return "applied";
  return "foundational";
}

/* ------------------------------------------------------------------ */
/* Daily activity                                                      */
/* ------------------------------------------------------------------ */

export function attemptsToday(progress: UserProgress, now = todayISO()): Attempt[] {
  return progress.attempts.filter(
    (a) => daysBetween(a.createdAt, now) === 0,
  );
}

export interface TodaySummary {
  answered: number;
  correct: number;
  goal: number;
  goalMet: boolean;
  progressPct: number;
}

export function todaySummary(progress: UserProgress): TodaySummary {
  const today = attemptsToday(progress);
  const answered = today.length;
  const goal = progress.dailyGoal;
  return {
    answered,
    correct: today.filter((a) => a.correct).length,
    goal,
    goalMet: answered >= goal,
    progressPct: Math.min(100, Math.round((answered / Math.max(1, goal)) * 100)),
  };
}

/* ------------------------------------------------------------------ */
/* Question selection                                                  */
/* ------------------------------------------------------------------ */

export interface SelectionOptions {
  count: number;
  trackId?: TrackId;
  /** One domain, or several — a focus session draws from the weakest few. */
  domain?: string | string[];
  /** Restrict to an explicit set, used by the review queue. */
  only?: string[];
}

/**
 * Orders candidate questions by three transparent signals:
 *   - unseen questions first (coverage before repetition)
 *   - questions in weak domains pulled forward
 *   - difficulty proximity to the learner's current target level
 *
 * Recently answered-correct questions are pushed down so a session is not a
 * victory lap. A small jitter keeps consecutive sessions from being identical.
 */
export function selectQuestions(
  progress: UserProgress,
  options: SelectionOptions,
): Question[] {
  const trackId = options.trackId ?? progress.trackId;
  let pool = getTrackQuestions(trackId);

  if (options.only) {
    const allowed = new Set(options.only);
    pool = pool.filter((q) => allowed.has(q.id));
  }
  if (options.domain) {
    const wanted = new Set(
      Array.isArray(options.domain) ? options.domain : [options.domain],
    );
    pool = pool.filter((q) => wanted.has(q.domain));
  }
  if (!pool.length) return [];

  const lastAttempt = new Map<string, Attempt>();
  for (const attempt of progress.attempts) {
    lastAttempt.set(attempt.questionId, attempt);
  }

  const weak = new Set(weakDomains(progress, trackId).map((d) => d.domain));
  const target = DIFFICULTY_RANK[targetDifficulty(progress.attempts)];

  const scored = pool.map((question) => {
    let score = Math.random() * 6;

    const previous = lastAttempt.get(question.id);
    if (!previous) score += 40;
    else if (previous.correct) score -= 25;
    else score += 20;

    if (weak.has(question.domain)) score += 18;

    const gap = Math.abs(DIFFICULTY_RANK[question.difficulty] - target);
    score += Math.max(0, 15 - gap * 7);

    return { question, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, options.count)
    .map((s) => s.question);
}

/** Shuffle helper re-exported for callers that want a plain random set. */
export function randomQuestions(pool: Question[], count: number): Question[] {
  return shuffle(pool).slice(0, count);
}
