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
 * model, no personalization service — just transparent scoring that a
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
  /**
   * Makes selection reproducible. Supplied by the session so a refresh
   * restores the same sitting rather than dealing a fresh one; omit it and
   * the jitter falls back to Math.random.
   */
  seed?: number;
  /**
   * Turns off difficulty weighting entirely.
   *
   * Adaptive targeting is right for practice, where the point is to meet the
   * learner where they are. It is wrong for an exam, which should sample the
   * bank rather than aim at a level — and catastrophically wrong when the
   * caller supplies a blank history, because `targetDifficulty` reads that as
   * "foundational" and the difficulty term then outranks the jitter by enough
   * to sort the pool into strict tiers.
   */
  ignoreDifficulty?: boolean;
}

/**
 * Orders candidate questions by three transparent signals:
 *   - unseen questions first (coverage before repetition)
 *   - questions in weak domains pulled forward
 *   - difficulty proximity to the learner's current target level
 *
 * Recently answered-correct questions are pushed down so a session is not a
 * victory lap. A small jitter keeps consecutive sessions from being identical;
 * seeded, so "not identical between sessions" does not become "not identical
 * between renders of the same session".
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
  const weighDifficulty = !options.ignoreDifficulty;

  // Seeded when the caller supplies one, so the same session can be rebuilt.
  const jitter = seededJitter(options.seed);

  const scored = pool.map((question) => {
    let score = jitter(question.id) * 6;

    const previous = lastAttempt.get(question.id);
    if (!previous) score += 40;
    else if (previous.correct) score -= 25;
    else score += 20;

    if (weak.has(question.domain)) score += 18;

    if (weighDifficulty) {
      /*
        Worth stating the magnitudes, because they are the whole bug.

        This term is +15 / +8 / +1 as the gap widens, a 14-point spread, while
        the jitter above spans 0-6. The tiers therefore cannot interleave: a
        question one tier from the target can never outscore one at the target,
        whatever the jitter does. That is the intended behavior for an
        adaptive practice session and it is why an exam has to opt out rather
        than rely on randomness to mix the tiers.
      */
      const gap = Math.abs(DIFFICULTY_RANK[question.difficulty] - target);
      score += Math.max(0, 15 - gap * 7);
    }

    return { question, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, options.count)
    .map((s) => s.question);
}

/**
 * Per-question jitter. With a seed it is a pure function of the seed and the
 * question id, so the same session scores the same way every time it is built.
 */
function seededJitter(seed?: number): (questionId: string) => number {
  if (seed === undefined) return () => Math.random();
  return (questionId) => {
    let h = (2166136261 ^ seed) >>> 0;
    for (let i = 0; i < questionId.length; i++) {
      h ^= questionId.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    /*
      The avalanche step, and it is not a flourish.

      Question ids are sequential and were authored in batches, so ids that sit
      near each other in the bank tend to share a domain. FNV alone does not
      avalanche: close inputs produced close outputs, the ordering kept that
      structure, and whole id ranges rose or fell together. Measured over 300
      seeds on a 50-question exam, every domain's *mean* was correct while its
      *minimum* was zero — seed 83 dealt no Domain IV question at all, which
      under a fair draw is about a 4-in-10-million event.

      This is murmur3's finalizer, which exists for exactly this: scattering
      the bits so neighboring ids land nowhere near each other. Still a pure
      function of seed and id, so a refresh rebuilds the same sitting.
    */
    h ^= h >>> 16;
    h = Math.imul(h, 2246822507) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 3266489909) >>> 0;
    h ^= h >>> 16;
    return (h >>> 8) / 0x1000000;
  };
}

/** Shuffle helper re-exported for callers that want a plain random set. */
export function randomQuestions(pool: Question[], count: number): Question[] {
  return shuffle(pool).slice(0, count);
}
