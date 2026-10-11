import { buildReviewQueue, type ReviewItem } from "./spaced-repetition";
import type { UserProgress } from "./types";
import { shuffle, todayISO } from "./utils";

/**
 * Bonus review questions, interleaved into a practice run.
 *
 * A learner gets a question wrong, it enters the review queue, and then it sits
 * there until they deliberately open `/review`. This drops a few of those back
 * in front of them mid-practice instead, framed as a second look rather than as
 * part of the run — the point being to find out whether the thing they missed
 * has actually landed since.
 *
 * ## Where this is allowed to appear, and where it is not
 *
 * Practice only. Never in a timed exam, and never in a review session.
 *
 * The exam is a simulation of a sitting with a clock on it; interrupting that
 * with a freebie would destroy the one thing exam mode is for. That constraint
 * is structural rather than a flag to remember — the exam renders `ExamRunner`,
 * which has no path to this module at all — and `bonus-review.test.ts` asserts
 * the separation stays.
 *
 * A review session is already nothing but review questions, so interleaving
 * more would be a tautology.
 *
 * ## Why the slots are seeded, not random
 *
 * They are drawn from the sitting's own seed, so the same sitting always places
 * its bonuses in the same gaps. That is not a style preference: a study session
 * is persisted and resumed across refreshes, and `Math.random()` here would
 * re-roll on every restore — a learner who refreshed would get a different
 * number of bonuses than one who did not, and the same sitting would behave
 * differently each time it came back. Seeded means a resume is the same run.
 *
 * ## What a bonus does and does not affect
 *
 * It does **not** count toward the sitting. Not the question count, not the
 * score, not the accuracy the readiness verdict is computed from. A ten
 * question practice run has to stay a ten question practice run, because
 * `assessReadiness` reads that score and its evidence band off the number
 * attempted — quietly folding review items into it would mean the grade
 * describes a different set of questions than the one the screen said it did.
 *
 * It does update the spaced-repetition schedule and record an attempt, because
 * that is the entire point: answering a missed question correctly should move
 * it along and stop it reading as missed.
 */

/** A bonus is offered after every this-many graded answers. */
export const BONUS_AFTER_EVERY = 4;

/**
 * Ceiling per sitting, regardless of length or how much is due.
 *
 * A learner with forty overdue cards opening a forty question practice run
 * should not be handed ten interruptions. Past about three the interleave
 * stops reading as a bonus and starts reading as a different, worse session
 * than the one they chose, and the honest place to work a large backlog is the
 * review queue itself.
 */
export const MAX_BONUS_PER_SITTING = 3;

/**
 * Which questions a bonus follows, as zero-based indices into the sitting.
 *
 * Returned sorted, deduplicated, and never including the final question —
 * a bonus after the last answer would land between the run and its results
 * screen, which is the one moment the learner is owed an uninterrupted
 * transition.
 */
export function bonusSlots(
  seed: number,
  total: number,
  cadence: number = BONUS_AFTER_EVERY,
  max: number = MAX_BONUS_PER_SITTING,
): number[] {
  if (total <= cadence || cadence < 1 || max < 1) return [];

  /*
    Candidates are the ends of each cadence-sized block rather than every
    position, which keeps the gaps roughly even — the alternative, picking
    freely from all indices, clusters two bonuses back to back often enough to
    feel broken. Shuffling the blocks and taking `max` of them is what makes
    *which* blocks get used unpredictable while the spacing stays sane.
  */
  const candidates: number[] = [];
  for (let i = cadence - 1; i < total - 1; i += cadence) candidates.push(i);
  if (candidates.length === 0) return [];

  return shuffle(candidates, seed)
    .slice(0, Math.min(max, candidates.length))
    .sort((a, b) => a - b);
}

/**
 * The review item to offer, or null when there is nothing worth offering.
 *
 * Takes the head of the existing review queue, which already sorts missed
 * questions ahead of low-confidence ones ahead of merely due ones — so a bonus
 * is always the most worth revisiting thing available, not a random card.
 *
 * `exclude` carries both the sitting's own question ids and anything already
 * offered this run. Showing a learner a question they are about to meet
 * normally, or have just seen, would make the feature feel broken in the two
 * most obvious ways.
 */
export function pickBonus(
  progress: UserProgress,
  exclude: Iterable<string>,
  now: string = todayISO(),
): ReviewItem | null {
  const skip = new Set(exclude);
  const queue = buildReviewQueue(progress, now);
  return queue.find((item) => !skip.has(item.question.id)) ?? null;
}
