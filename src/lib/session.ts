import type { Question, TrackId } from "@/content/types";
import { selectQuestions } from "./adaptive";
import { presentQuestions } from "./presentation";
import type { UserProgress } from "./types";

/**
 * Building a sitting.
 *
 * Two steps that must stay together, because testing them apart proves less
 * than it looks like it does:
 *
 *   1. `selectQuestions` chooses *which* questions on pedagogical grounds —
 *      unseen first, weak domains pulled forward, difficulty near the
 *      learner's current level.
 *   2. `presentQuestions` chooses the order they are met in.
 *
 * Both take the session seed. That is the whole contract: **the same seed and
 * the same progress always yield the same sitting**, so a reload rebuilds what
 * the learner was already looking at rather than dealing something new.
 *
 * ---------------------------------------------------------------------------
 * The part of that sentence that matters: *and the same progress*.
 *
 * Selection scores every candidate against the attempt history — unseen
 * questions get a large bonus, previously-correct ones a penalty. Answering
 * changes that history. So a reload after answering rebuilds from a different
 * history and can produce a different set: measured at 7 of 10 questions
 * retained, and none of the three already answered still present, across ten
 * seeds (see session.test.ts).
 *
 * The seed is therefore necessary but not sufficient for refresh recovery. The
 * missing half is persisting the chosen question ids for the session's
 * lifetime, so a rebuild is a lookup rather than a re-selection. That is a
 * deliberate gap here, not an oversight: practice mode tolerates it, exam mode
 * cannot, and exam mode is where session persistence is being designed in.
 */

export interface SessionSpec {
  /** Drives both which questions are chosen and the order they appear in. */
  seed: number;
  count: number;
  trackId: TrackId;
  /** One domain, or several — a focus session draws from the weakest few. */
  domain?: string | string[];
  /** Restrict to an explicit set, used by the review queue and drills. */
  only?: string[];
}

/**
 * The questions for one sitting, in the order they will be met.
 *
 * Option order is dealt separately, per question, by `presentOptions` — from
 * the same seed, so the whole sitting reconstructs from a single number.
 */
export function buildSessionQuestions(
  progress: UserProgress,
  spec: SessionSpec,
): Question[] {
  const selected = selectQuestions(progress, {
    count: spec.count,
    trackId: spec.trackId,
    ...(spec.only ? { only: spec.only } : {}),
    ...(spec.domain ? { domain: spec.domain } : {}),
    seed: spec.seed,
  });
  return presentQuestions(selected, spec.seed);
}
