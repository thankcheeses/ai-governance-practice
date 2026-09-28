import type { Attempt, Confidence } from "./types";

/**
 * Confidence calibration — the gap between how sure someone was and how right
 * they were.
 *
 * This is the highest-value thing the app could say and was not saying. Every
 * attempt already carries `confidence` and `responseTimeMs`; both have been
 * recorded on every answer and synced to Supabase since the beginning, and
 * neither was ever read for anything except ordering the review queue. The
 * expensive half — capturing the signal on every answer, in a schema that
 * survives a device change — was already built. This is the cheap half.
 *
 * ## Why calibration rather than accuracy
 *
 * Accuracy tells a learner what they already feel. Calibration tells them
 * something they cannot feel: that the questions they were *sure* about are
 * the ones they are getting wrong. Overconfidence is the failure mode that
 * survives a lot of practice, because it is invisible from the inside — a
 * confident wrong answer feels exactly like a confident right one.
 *
 * ## What this refuses to do
 *
 * It does not predict anything, it does not score the learner, and it says
 * nothing at all below a floor of evidence. The same discipline as
 * `reasoning-patterns.ts`: a confident sentence built on four data points is
 * the failure this is guarding against.
 */

/** Below this, calibration says nothing. */
export const MIN_ATTEMPTS = 12;

/** Per-bucket floor — a bucket under this is reported as not yet meaningful. */
export const MIN_PER_BUCKET = 4;

/**
 * How far accuracy must sit from the confidence level's implied accuracy
 * before it is called a gap.
 *
 * 20 points, because self-reported confidence on a three-point scale is a
 * coarse instrument and a 10-point gap is inside its noise.
 */
export const GAP_THRESHOLD = 20;

/**
 * What each confidence level implicitly claims.
 *
 * These are not thresholds a learner is held to — they are the reading of the
 * word. Someone who says "confident" is claiming they expect to be right most
 * of the time; someone who says "guessed" is claiming close to chance. The
 * comparison is between that claim and what happened.
 */
export const IMPLIED_ACCURACY: Record<Confidence, number> = {
  confident: 85,
  unsure: 60,
  guessed: 30,
};

export interface Bucket {
  confidence: Confidence;
  answered: number;
  correct: number;
  /** 0–100, or null when the bucket is below the floor. */
  accuracy: number | null;
  /** accuracy − implied, positive meaning better than claimed. Null if thin. */
  gap: number | null;
}

export type CalibrationVerdict =
  | "insufficient"
  | "calibrated"
  | "overconfident"
  | "underconfident";

export interface Calibration {
  verdict: CalibrationVerdict;
  buckets: Bucket[];
  /** Attempts that carried a confidence rating. */
  rated: number;
  /** Attempts with no rating — the reason a verdict may stay insufficient. */
  unrated: number;
  /** One plain sentence, or null when there is nothing honest to say. */
  headline: string | null;
}

const LEVELS: Confidence[] = ["confident", "unsure", "guessed"];

/**
 * Calibration over a set of attempts.
 *
 * Deduplicated by question, keeping the most recent attempt, for the same
 * reason the reasoning layer does it: `/review` re-serves the same question by
 * design, and without this a learner who reviews one item five times would see
 * that item's outcome five times over in their calibration.
 */
export function assessCalibration(attempts: readonly Attempt[]): Calibration {
  const latest = new Map<string, Attempt>();
  for (const a of attempts) {
    const seen = latest.get(a.questionId);
    if (!seen || a.createdAt > seen.createdAt) latest.set(a.questionId, a);
  }
  const deduped = [...latest.values()];
  const ratedAttempts = deduped.filter((a) => a.confidence !== null);
  const rated = ratedAttempts.length;
  const unrated = deduped.length - rated;

  const buckets: Bucket[] = LEVELS.map((confidence) => {
    const inBucket = ratedAttempts.filter((a) => a.confidence === confidence);
    const correct = inBucket.filter((a) => a.correct).length;
    const enough = inBucket.length >= MIN_PER_BUCKET;
    const accuracy = enough ? Math.round((correct / inBucket.length) * 100) : null;
    return {
      confidence,
      answered: inBucket.length,
      correct,
      accuracy,
      gap: accuracy === null ? null : accuracy - IMPLIED_ACCURACY[confidence],
    };
  });

  if (rated < MIN_ATTEMPTS) {
    return { verdict: "insufficient", buckets, rated, unrated, headline: null };
  }

  /*
    The verdict keys off the "confident" bucket alone, deliberately.

    Being wrong when you said you guessed is not a calibration problem — it is
    what guessing is. The claim worth making is about the answers someone was
    sure of, because that is the one a learner cannot check for themselves and
    the one that costs marks on a real sitting.
  */
  const confident = buckets.find((b) => b.confidence === "confident")!;
  if (confident.accuracy === null) {
    return { verdict: "insufficient", buckets, rated, unrated, headline: null };
  }

  if (confident.gap !== null && confident.gap <= -GAP_THRESHOLD) {
    return {
      verdict: "overconfident",
      buckets,
      rated,
      unrated,
      headline: `You were right on ${confident.accuracy}% of the ${confident.answered} questions you marked confident. Worth slowing down on the ones that feel obvious.`,
    };
  }

  if (confident.gap !== null && confident.gap >= GAP_THRESHOLD) {
    return {
      verdict: "underconfident",
      buckets,
      rated,
      unrated,
      headline: `You were right on ${confident.accuracy}% of the ${confident.answered} questions you marked confident — you know this better than you think.`,
    };
  }

  return {
    verdict: "calibrated",
    buckets,
    rated,
    unrated,
    headline: `Your sense of what you know is tracking what you actually know, across ${rated} rated answers.`,
  };
}

/* ------------------------------------------------------------ miss type -- */

/**
 * Why a miss happened, as far as timing can tell.
 *
 * `responseTimeMs` has been recorded on every attempt since the beginning and
 * has never been read by anything. It separates the two kinds of wrong answer
 * that need opposite responses:
 *
 *  - a miss answered far faster than the learner's own norm is a *rushed*
 *    miss — they did not finish reading, or pattern-matched a keyword;
 *  - a miss answered at or above their norm is a *knowledge* miss — they
 *    engaged with it and still got it wrong.
 *
 * Telling someone to study harder when they are actually skimming is the wrong
 * advice, and it is the advice every question bank gives.
 *
 * Measured against the learner's *own* median rather than a fixed number of
 * seconds: reading speed varies enormously, and a fixed threshold would just
 * classify fast readers as careless.
 */
export type MissType = "rushed" | "considered" | "unknown";

/** A miss under this share of the learner's median counts as rushed. */
export const RUSHED_RATIO = 0.5;

/** Below this many timed attempts there is no personal norm to compare to. */
export const MIN_FOR_NORM = 10;

export function medianResponseMs(attempts: readonly Attempt[]): number | null {
  const times = attempts
    .map((a) => a.responseTimeMs)
    .filter((ms): ms is number => Number.isFinite(ms) && ms > 0)
    .sort((a, b) => a - b);
  if (times.length < MIN_FOR_NORM) return null;
  const mid = Math.floor(times.length / 2);
  return times.length % 2 ? times[mid] : Math.round((times[mid - 1] + times[mid]) / 2);
}

export function classifyMiss(
  attempt: Attempt,
  median: number | null,
): MissType {
  if (median === null) return "unknown";
  if (!Number.isFinite(attempt.responseTimeMs) || attempt.responseTimeMs <= 0) {
    return "unknown";
  }
  return attempt.responseTimeMs < median * RUSHED_RATIO ? "rushed" : "considered";
}

export interface MissBreakdown {
  rushed: number;
  considered: number;
  unknown: number;
  /** Null when there is no personal norm yet, or no misses to classify. */
  headline: string | null;
}

/**
 * How a learner's recent misses split between rushing and not knowing.
 *
 * Says nothing unless rushing is a substantial share — a couple of fast misses
 * is noise, and "you rushed 1 of 14" is not worth a sentence.
 */
export function missBreakdown(attempts: readonly Attempt[]): MissBreakdown {
  const median = medianResponseMs(attempts);
  const misses = attempts.filter((a) => !a.correct);
  const counts = { rushed: 0, considered: 0, unknown: 0 };
  for (const m of misses) counts[classifyMiss(m, median)]++;

  const classified = counts.rushed + counts.considered;
  const enough = classified >= MIN_FOR_NORM;
  const share = classified ? counts.rushed / classified : 0;

  return {
    ...counts,
    headline:
      enough && share >= 0.3
        ? `${counts.rushed} of your last ${classified} misses were answered in under half your usual time. That is a reading problem rather than a knowledge one.`
        : null,
  };
}
