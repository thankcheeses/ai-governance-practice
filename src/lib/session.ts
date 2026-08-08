import { getQuestion } from "@/content/registry";
import type {
  OptionKey,
  PresentedOption,
  Question,
  TrackId,
} from "@/content/types";
import type { ActiveSession } from "./active-session";
import { selectQuestions } from "./adaptive";
import { presentOptions, presentQuestions } from "./presentation";
import { type CompletedResult, RESULT_VERSION } from "./results";
import type { UserProgress } from "./types";

/**
 * Building a sitting, and putting one back.
 *
 * Two paths that must never be confused:
 *
 *   - **New sitting.** `selectQuestions` chooses which questions on
 *     pedagogical grounds — unseen first, weak domains pulled forward — and
 *     the seed fixes the order and every option shuffle.
 *   - **Existing sitting.** `sittingFromSnapshot` reads the composition back
 *     from what was stored. It does not select, and it does not shuffle.
 *
 * That split is the whole design. A seed alone cannot restore a sitting:
 * selection scores against the attempt history, and answering rewrites the
 * history, so re-deriving mid-sitting yields a different set of questions.
 * Restoration is therefore a lookup over stored ids, never a recomputation.
 *
 * `lib/active-session.ts` owns storage and validation; this module owns the
 * shape a session actually runs on.
 */

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D", "E"];

/** Everything a session needs to render, with nothing left to re-derive. */
export interface Sitting {
  seed: number;
  questions: Question[];
  /** Options in display order, one row per question, parallel to `questions`. */
  options: PresentedOption[][];
}

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

/* ------------------------------------------------------------------ */
/* New sittings                                                        */
/* ------------------------------------------------------------------ */

/** The questions for one sitting, in the order they will be met. */
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

/** Deal letters to a whole sitting's worth of questions. */
export function presentSitting(
  questions: readonly Question[],
  seed: number,
): Sitting {
  return {
    seed,
    questions: [...questions],
    options: questions.map((q) => presentOptions(q, seed)),
  };
}

/** A fresh sitting: select, order, and deal. */
export function buildSitting(
  progress: UserProgress,
  spec: SessionSpec,
): Sitting {
  return presentSitting(buildSessionQuestions(progress, spec), spec.seed);
}

/* ------------------------------------------------------------------ */
/* Restored sittings                                                   */
/* ------------------------------------------------------------------ */

/**
 * Rebuild a sitting from stored ids.
 *
 * The stored order wins over anything recomputable. If the shuffle algorithm
 * changed between the two page loads, or selection would now choose different
 * questions, the learner still gets back exactly the screen they left.
 *
 * Returns null if any id no longer resolves — the caller starts clean rather
 * than showing a partial sitting. The snapshot is expected to have been
 * validated already; this is the second line of defence, not the first.
 */
export function sittingFromSnapshot(session: ActiveSession): Sitting | null {
  return sittingFromComposition(
    session.questionIds,
    session.optionIds,
    session.seed,
  );
}

/**
 * Rebuild a sitting from stored ids alone.
 *
 * Shared by the in-flight snapshot and by a completed result, because both
 * store the same two facts — which questions, in which order, with options
 * dealt in which order — and both must put back exactly what was on screen
 * rather than anything re-derived from the seed.
 */
export function sittingFromComposition(
  questionIds: readonly string[],
  optionIds: readonly (readonly string[])[],
  seed: number,
): Sitting | null {
  const questions: Question[] = [];
  const options: PresentedOption[][] = [];

  for (let i = 0; i < questionIds.length; i++) {
    const question = getQuestion(questionIds[i]);
    if (!question) return null;

    const row = optionIds[i];
    if (!row || row.length !== question.options.length) return null;

    const dealt: PresentedOption[] = [];
    for (let k = 0; k < row.length; k++) {
      const option = question.options.find((o) => o.id === row[k]);
      if (!option) return null;
      dealt.push({ ...option, key: OPTION_KEYS[k] });
    }

    questions.push(question);
    options.push(dealt);
  }

  return { seed, questions, options };
}

/**
 * The durable record of a finished practice sitting.
 *
 * Built from the snapshot rather than from component state, so what is stored
 * is what was on screen: the same questions, in the same order, with the same
 * options dealt the same way. Everything a results screen shows — score,
 * domain breakdown, which questions were missed — is derived from it at read
 * time by `scoreSitting`, never frozen here.
 */
export function resultFromActiveSession(
  session: ActiveSession,
  completedAt = new Date().toISOString(),
): CompletedResult {
  return {
    version: RESULT_VERSION,
    mode: "practice",
    // The seed identifies the sitting: it is what the URL carries, so a
    // refresh can ask for the result of the sitting it was just looking at.
    sittingId: `practice-${session.seed}`,
    trackId: session.trackId,
    label: session.label,
    seed: session.seed,
    questionIds: [...session.questionIds],
    optionIds: session.optionIds.map((row) => [...row]),
    answers: { ...session.answers },
    // Flagging is an exam affordance; a practice sitting reveals and moves on.
    flagged: [],
    startedAt: session.startedAt,
    completedAt,
    reason: "completed",
    // Practice runs to no allowance, so there is no deadline to report.
    durationMs: null,
    deadline: null,
  };
}

/** The composition of a sitting, in the form the snapshot stores it. */
export function sittingComposition(sitting: Sitting): {
  questionIds: string[];
  optionIds: string[][];
} {
  return {
    questionIds: sitting.questions.map((q) => q.id),
    optionIds: sitting.options.map((row) => row.map((o) => o.id)),
  };
}
