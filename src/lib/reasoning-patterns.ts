import { getQuestion, getTrackQuestions } from "@/content/registry";
import type { DistractorType, TrackId } from "@/content/types";
import type { Attempt, UserProgress } from "./types";

/**
 * Cross-question reasoning patterns.
 *
 * The app can already tell a learner why one option was wrong (the distractor
 * note) and which competency is weak (the analytics bands). Neither can say
 * "you keep making the same kind of wrong turn across different questions",
 * which is the thing this module exists to find.
 *
 * Everything here is written against the evidence being thin, because it is.
 * Only 52 of 296 questions carry reasoning labels, and within those only 92 of
 * 156 wrong options are labelled — deliberately, since labelling a throwaway
 * option would teach the engine that every miss is diagnostic. A miss therefore
 * yields a usable observation only when the learner picked a labelled option,
 * which works out to roughly one observation per thirty questions answered.
 *
 * The consequence is that this returns null for most learners most of the time.
 * That is the intended behaviour and not a bug to tune away: the way to make it
 * speak more often is to label more questions, never to lower a threshold. A
 * confident sentence built on four data points is worse than silence, because a
 * learner will believe it and study the wrong thing.
 */

/* ----------------------------------------------------------- thresholds -- */

/**
 * Total usable observations before any pattern may be named. Below five,
 * "three of four" is the entire sample rather than a tendency within it.
 */
export const MIN_OBSERVATIONS = 5;

/**
 * Occurrences of the specific family being named. Matches the floor the rest of
 * the codebase already uses for accuracy claims (MIN_ATTEMPTS_FOR_SIGNAL in
 * lib/analytics.ts and lib/adaptive.ts); a pattern claim is stronger than an
 * accuracy claim, so it never goes below it.
 */
export const MIN_FOR_PATTERN = 3;

/*
 * There is deliberately no separate "minimum distinct questions" threshold.
 * Observations are deduplicated per question before counting, so a family's
 * occurrence count IS its distinct-question count — a second constant would read
 * like a second safeguard while testing the same number, and lowering either one
 * alone would change nothing. The deduplication is what makes MIN_FOR_PATTERN
 * mean "three different questions", and the invariant in detectPattern fails the
 * claim closed if that ever stops being true.
 */

/**
 * How many recent observations the pattern is computed over. At realistic
 * volumes this is all of them; the cap stops a learner's first week from
 * dominating the claim for ever.
 */
export const WINDOW = 40;

/**
 * A named family must occur at least once within this many most-recent
 * observations. Someone who made an error six sessions ago and has since stopped
 * should not be told they keep making it.
 */
export const RECENT_WINDOW = 10;

/** Occurrences the leader must exceed the runner-up by. A 4–3 split is noise. */
export const MIN_MARGIN = 2;

/** Share of usable observations the leader must hold. */
export const MIN_SHARE = 0.4;

/*
 * The emerging tier.
 *
 * The confirmed thresholds above need roughly 160 answered questions before
 * they can speak, which left the feature silent for nearly every learner. The
 * fix is a second, explicitly provisional state rather than a looser definition
 * of the first — a claim made on thin evidence should say so, not quietly lower
 * the bar behind the same wording.
 *
 * Measured against 200,000 simulated learners with no pattern at all, drawing
 * misses from the real label distribution, these thresholds fire 7.2% of the
 * time. The confirmed tier fires 9.2%. The emerging tier is narrower, not
 * looser: requiring a margin of two at only three observations forces the
 * runner-up to zero, so the third observation has to be a near miss or more of
 * the same family.
 */
export const EMERGING_MIN_OBSERVATIONS = 3;
export const EMERGING_MIN_FOR_PATTERN = 2;
export const EMERGING_MIN_MARGIN = 2;
export const EMERGING_MIN_SHARE = 0.5;

/* --------------------------------------------------------------- families -- */

/**
 * Distractor types grouped into the error families a learner is told about.
 *
 * Eleven types is too many to detect over this little evidence, and several are
 * the same mistake wearing different clothes. The grouping is explicit rather
 * than derived so it can be argued with.
 *
 * `label` is what a learner reads. It is plain language on purpose: the taxonomy
 * keys are engine vocabulary and a learner should never have to know them.
 */
export type PatternFamily =
  | "actedEarly"
  | "underRatedRisk"
  | "overCorrected"
  | "rankedWrongRisk"
  | "wrongRule"
  | "wrongParty"
  | "missedFact"
  | "wrongPhase"
  | "commitmentAsRequirement"
  | "nearMiss";

interface FamilyDefinition {
  types: DistractorType[];
  /**
   * Whether this family may be named to a learner. A family that is counted but
   * never named still shapes the denominator, which keeps the reported fraction
   * honest.
   */
  nameable: boolean;
  /** What the learner reads. Never contains a taxonomy key. */
  label: string;
  /** The practice framing, used in the recommendation clause. */
  practice: string;
}

export const FAMILIES: Record<PatternFamily, FamilyDefinition> = {
  actedEarly: {
    types: ["premature_remediation", "technically_correct_but_premature"],
    nameable: true,
    label: "choosing a fix before the cause was established",
    practice: "establishing what is actually happening before acting on it",
  },
  underRatedRisk: {
    types: ["risk_underestimation"],
    nameable: true,
    label: "accepting a risk that needed addressing",
    practice: "judging how much exposure a decision leaves in place",
  },
  overCorrected: {
    types: ["risk_overreaction"],
    nameable: true,
    label: "reaching for a heavier response than the risk warranted",
    practice: "matching the size of a response to the size of the risk",
  },
  rankedWrongRisk: {
    types: ["secondary_risk_prioritized"],
    nameable: true,
    label: "addressing a real but secondary risk first",
    practice: "deciding which of several genuine risks comes first",
  },
  wrongRule: {
    types: ["wrong_governing_obligation"],
    nameable: true,
    label: "applying a rule that does not govern the situation",
    practice: "working out which obligation actually applies",
  },
  wrongParty: {
    types: ["wrong_accountable_party"],
    nameable: true,
    label: "putting the duty on the wrong party",
    practice: "working out who is answerable for what",
  },
  missedFact: {
    types: ["missed_material_fact"],
    nameable: true,
    label: "moving past a fact in the scenario that changed the answer",
    practice: "reading for the detail that decides the case",
  },
  wrongPhase: {
    types: ["lifecycle_confusion"],
    nameable: true,
    label: "placing an activity in the wrong phase of the life cycle",
    practice: "knowing which phase an activity belongs to",
  },
  commitmentAsRequirement: {
    types: ["legal_ethical_conflation"],
    nameable: true,
    label: "treating a voluntary commitment as a hard requirement, or the reverse",
    practice: "separating what is required from what is undertaken",
  },
  /*
   * Never named. It is the largest single label in the bank (20 of 92) and the
   * least actionable: "you picked something reasonable but incomplete" gives a
   * learner nothing to do differently, and on frequency alone it would win most
   * counts and crowd out a family that does. It is still counted, so the
   * denominator a learner sees matches the evidence actually examined.
   */
  nearMiss: {
    types: ["plausible_but_incomplete"],
    nameable: false,
    label: "near miss",
    practice: "",
  },
};

const FAMILY_OF = new Map<DistractorType, PatternFamily>();
for (const [family, definition] of Object.entries(FAMILIES)) {
  for (const type of definition.types) {
    FAMILY_OF.set(type, family as PatternFamily);
  }
}

/** The family a distractor type belongs to, or undefined if it is unmapped. */
export function familyOf(type: DistractorType): PatternFamily | undefined {
  return FAMILY_OF.get(type);
}

/* ----------------------------------------------------------- observation -- */

export interface Observation {
  questionId: string;
  family: PatternFamily;
  /** Ordering key. ISO 8601, so lexicographic comparison is chronological. */
  createdAt: string;
}

/**
 * Turn a learner's history into the observations a pattern may be built from.
 *
 * An observation is one miss on a labelled question where **exactly one** chosen
 * option carries a label. Multi-select items can fail with several labelled
 * options selected at once; those contribute nothing, because grading is
 * all-or-nothing and there is no way to tell which of two misunderstandings
 * drove the answer.
 *
 * Returns at most one observation per question — the most recent — so the review
 * queue showing a question repeatedly cannot inflate a count.
 */
export function observationsFrom(
  progress: UserProgress,
  trackId: TrackId = "aigp-preparation",
): Observation[] {
  const latest = new Map<string, Observation>();

  for (const attempt of progress.attempts) {
    if (attempt.trackId !== trackId) continue;
    if (attempt.correct) continue;

    const observation = observationOf(attempt);
    if (!observation) continue;

    const existing = latest.get(observation.questionId);
    if (!existing || existing.createdAt < observation.createdAt) {
      latest.set(observation.questionId, observation);
    }
  }

  return [...latest.values()].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
  );
}

function observationOf(attempt: Attempt): Observation | undefined {
  const question = getQuestion(attempt.questionId);
  // A question can be removed from the bank; a dangling attempt must not throw.
  const types = question?.reasoning?.distractorTypes;
  if (!types) return undefined;

  const families: PatternFamily[] = [];
  for (const optionId of attempt.selected) {
    const type = types[optionId];
    if (!type) continue;
    const family = familyOf(type);
    if (family) families.push(family);
  }

  // Exactly one, for the reason given on observationsFrom.
  if (families.length !== 1) return undefined;

  return {
    questionId: attempt.questionId,
    family: families[0],
    createdAt: attempt.createdAt,
  };
}

/* --------------------------------------------------------------- pattern -- */

/**
 * How much the evidence supports the claim.
 *
 * "confirmed" is not "high confidence" and is never described that way to a
 * learner: on simulated learners with no pattern at all it still fires 9.2% of
 * the time. It is a lead worth checking, and the copy says so. "emerging" is the
 * same kind of lead on thinner evidence, and says that too.
 */
export type PatternStrength = "confirmed" | "emerging";

export interface ReasoningPattern {
  family: PatternFamily;
  strength: PatternStrength;
  /** What the learner reads. */
  label: string;
  practice: string;
  /** Occurrences of this family within the window. */
  occurrences: number;
  /**
   * Usable observations the occurrences are drawn from. Always shown to the
   * learner alongside the claim — a pattern without its denominator reads as
   * more certain than the evidence supports.
   */
  observed: number;
  /** Questions the pattern was seen on, for targeted practice. */
  questionIds: string[];
}

interface Thresholds {
  minForPattern: number;
  minMargin: number;
  minShare: number;
}

const CONFIRMED: Thresholds = {
  minForPattern: MIN_FOR_PATTERN,
  minMargin: MIN_MARGIN,
  minShare: MIN_SHARE,
};

const EMERGING: Thresholds = {
  minForPattern: EMERGING_MIN_FOR_PATTERN,
  minMargin: EMERGING_MIN_MARGIN,
  minShare: EMERGING_MIN_SHARE,
};

/**
 * Apply one tier's thresholds to a window of observations.
 *
 * Both tiers run through this, so the rules they share — which families may be
 * named, the margin over the runner-up, the staleness gate, the deduplication
 * invariant — cannot drift apart as one tier is tuned.
 */
function evaluate(
  window: Observation[],
  thresholds: Thresholds,
  strength: PatternStrength,
): ReasoningPattern | null {
  const counts = new Map<PatternFamily, Observation[]>();
  for (const observation of window) {
    counts.set(observation.family, [
      ...(counts.get(observation.family) ?? []),
      observation,
    ]);
  }

  // Only nameable families compete. Unnameable ones stay in `window`, and so
  // stay in the denominator.
  const ranked = [...counts.entries()]
    .filter(([family]) => FAMILIES[family].nameable)
    .sort((a, b) => b[1].length - a[1].length);

  const leader = ranked[0];
  if (!leader) return null;

  const [family, observations] = leader;
  const runnerUp = ranked[1]?.[1].length ?? 0;

  if (observations.length < thresholds.minForPattern) return null;
  if (observations.length - runnerUp < thresholds.minMargin) return null;
  if (observations.length / window.length < thresholds.minShare) return null;

  /*
   * Invariant, not a threshold: deduplication should already guarantee one
   * observation per question, which is what lets the occurrence count stand for
   * "this many different questions". If that ever breaks — the review queue
   * feeding the same question through, say — fail the claim closed rather than
   * reporting a pattern built from one question answered repeatedly.
   */
  const questionIds = [...new Set(observations.map((o) => o.questionId))];
  if (questionIds.length !== observations.length) return null;

  // Staleness: the pattern must still be live, not something outgrown.
  const recent = new Set(
    window.slice(-RECENT_WINDOW).map((o) => `${o.questionId}:${o.createdAt}`),
  );
  const stillHappening = observations.some((o) =>
    recent.has(`${o.questionId}:${o.createdAt}`),
  );
  if (!stillHappening) return null;

  return {
    family,
    strength,
    label: FAMILIES[family].label,
    practice: FAMILIES[family].practice,
    occurrences: observations.length,
    observed: window.length,
    questionIds,
  };
}

/**
 * The one reasoning pattern worth telling a learner about, or null.
 *
 * Two tiers, and silence. Null is still the common answer and is never dressed
 * up: there is deliberately no "not enough data yet" state for a surface to
 * render, because a progress meter toward an insight is a prompt to answer more
 * questions rather than a teaching device.
 *
 * The tiers do not overlap. Emerging is evaluated **only** at three or four
 * observations; from five upward the confirmed thresholds govern alone. That
 * boundary is deliberate — without it, a confirmed claim that failed on five
 * observations would fall through and be restated as an emerging one on exactly
 * the same evidence, which is how a rejected claim gets laundered into a weaker
 * one rather than dropped.
 *
 * A consequence, accepted knowingly: a learner can see an emerging signal at
 * four observations and nothing at five, because the signal dissolved. The copy
 * for the emerging tier says it may not hold up, so that reads as the early
 * signal doing its job rather than the feature breaking.
 */
export function detectPattern(
  progress: UserProgress,
  trackId: TrackId = "aigp-preparation",
): ReasoningPattern | null {
  const all = observationsFrom(progress, trackId);
  const window = all.slice(-WINDOW);

  if (window.length >= MIN_OBSERVATIONS) {
    return evaluate(window, CONFIRMED, "confirmed");
  }
  if (window.length >= EMERGING_MIN_OBSERVATIONS) {
    return evaluate(window, EMERGING, "emerging");
  }
  return null;
}

/**
 * Questions available to practise a family, for the targeted-practice link.
 *
 * Drawn from the whole labelled bank rather than only the questions the learner
 * has already missed, so practice is not a re-run of the same items. Selection
 * itself stays with lib/adaptive's selectQuestions, via SelectionOptions.only.
 */
export function questionIdsForFamily(
  family: PatternFamily,
  trackId: TrackId = "aigp-preparation",
): string[] {
  const wanted = new Set<DistractorType>(FAMILIES[family].types);
  const ids: string[] = [];

  for (const question of getTrackQuestions(trackId)) {
    const types = question.reasoning?.distractorTypes;
    if (!types) continue;
    if (Object.values(types).some((t) => t && wanted.has(t))) {
      ids.push(question.id);
    }
  }

  return ids;
}
