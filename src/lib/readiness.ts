import { getTrackQuestions } from "@/content/registry";
import type { SittingScore } from "./results";

/**
 * Turns a scored sitting into a practice grade and a readiness statement.
 *
 * The whole point of this module is the second axis. Accuracy alone is not a
 * readiness signal: answering one question correctly is 100%, and a report
 * that prints "100% — you're in good shape" for it would be lying with true
 * arithmetic. So every verdict is a function of two things, accuracy *and* how
 * much evidence there is, and evidence can veto a good score but never rescue
 * a bad one.
 *
 * What this module must never do, and what the tests check it never does:
 * predict an outcome on the real certification exam. There is no model here
 * that could support such a claim and no data that could calibrate one. The
 * grade is a practice grade over this project's own questions, and the copy
 * says so every time it appears.
 */

/* ------------------------------------------------------------------ */
/* Grade                                                               */
/* ------------------------------------------------------------------ */

export type PracticeGrade = "A" | "B" | "C" | "D" | "F";

export interface GradeBand {
  grade: PracticeGrade;
  /** Lowest accuracy, inclusive, that earns this grade. */
  min: number;
  /** What the grade means, stated as practice performance and nothing more. */
  meaning: string;
}

/**
 * A conventional school scale, chosen because it is the one every reader
 * already knows and therefore the one least likely to be mistaken for a
 * certification body's scale. The report prints this table so the convention
 * is visible rather than implied.
 */
export const GRADE_BANDS: GradeBand[] = [
  { grade: "A", min: 90, meaning: "Strong practice performance" },
  { grade: "B", min: 80, meaning: "Generally strong; review recommended" },
  { grade: "C", min: 70, meaning: "Significant review recommended" },
  { grade: "D", min: 60, meaning: "Substantial gaps" },
  { grade: "F", min: 0, meaning: "Insufficient preparation demonstrated" },
];

export function gradeFor(accuracy: number): PracticeGrade {
  const pct = Math.max(0, Math.min(100, accuracy));
  return (GRADE_BANDS.find((b) => pct >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1])
    .grade;
}

/* ------------------------------------------------------------------ */
/* Evidence                                                            */
/* ------------------------------------------------------------------ */

export type EvidenceBand = "none" | "thin" | "partial" | "substantial" | "broad";

/**
 * Thresholds as a share of the bank rather than as counts, so they stay
 * meaningful as the bank grows. A sitting of 25 questions is a different kind
 * of evidence against 296 items than against 3,000.
 */
const EVIDENCE_THRESHOLDS: { band: EvidenceBand; minShare: number }[] = [
  { band: "broad", minShare: 0.3 },
  { band: "substantial", minShare: 0.15 },
  { band: "partial", minShare: 0.05 },
  { band: "thin", minShare: 0 },
];

export function evidenceBand(attempted: number, bankSize: number): EvidenceBand {
  if (attempted <= 0) return "none";
  if (bankSize <= 0) return "thin";
  const share = attempted / bankSize;
  return (
    EVIDENCE_THRESHOLDS.find((t) => share >= t.minShare)?.band ?? "thin"
  );
}

/* ------------------------------------------------------------------ */
/* Verdict                                                             */
/* ------------------------------------------------------------------ */

/**
 * Six states, each with its own illustration. They are deliberately named for
 * what the evidence shows rather than for how the learner should feel.
 */
export type ReadinessState =
  | "noEvidence"
  | "earlySignal"
  | "insufficient"
  | "developing"
  | "mixed"
  | "encouraging";

export interface Readiness {
  state: ReadinessState;
  grade: PracticeGrade;
  accuracy: number;
  evidence: EvidenceBand;
  attempted: number;
  answered: number;
  bankSize: number;
  /** Share of the bank this sitting drew on, 0–100. */
  coverage: number;
  /** How many of the four domains this sitting touched at all. */
  domainsTouched: number;
  /** One line under the grade. Never a prediction. */
  headline: string;
  /** Three to five sentences saying what the numbers do and do not support. */
  verdict: string;
  /** Concrete things to do next, in priority order. */
  nextSteps: string[];
}

/*
  The decision table.

  Read down: the first row whose condition holds wins. Evidence is checked
  before accuracy in every case, which is the rule that stops a 1-for-1 sitting
  reading as readiness. There is no row in which thin evidence produces an
  encouraging verdict, and a test asserts that by exhaustion rather than by
  inspection.
*/
function stateFor(grade: PracticeGrade, evidence: EvidenceBand): ReadinessState {
  if (evidence === "none") return "noEvidence";
  if (evidence === "thin") return "earlySignal";
  if (grade === "F" || grade === "D") return "insufficient";
  if (evidence === "partial") return "developing";
  if (grade === "C") return "developing";
  if (grade === "B") return "mixed";
  return "encouraging";
}

const HEADLINES: Record<ReadinessState, string> = {
  noEvidence: "There is nothing to grade yet.",
  earlySignal: "Early signal only - too little practice to draw a conclusion.",
  insufficient: "On this sitting, the material is not there yet.",
  developing: "Meaningful progress, and clearly more to do.",
  mixed: "A solid sitting with real gaps still showing.",
  encouraging: "A strong sitting across a meaningful share of the bank.",
};

const VERDICTS: Record<ReadinessState, string> = {
  noEvidence:
    "No questions were answered, so there is no performance to interpret. " +
    "Readiness cannot be assessed from an empty sitting, and a grade of 0% " +
    "here means \"unmeasured\" rather than \"wrong\". Open a session and work " +
    "through some questions, then generate this report again.",
  earlySignal:
    "Too few questions were answered for the percentage above to mean much. " +
    "A small sample swings hard on a couple of lucky or unlucky items, so " +
    "treat this as a first look rather than a measurement. Keep practising " +
    "until a good deal more of the bank has been seen before reading anything " +
    "into the score.",
  insufficient:
    "The accuracy on this sitting is low enough that the underlying material " +
    "needs work, not just revision. That is useful information rather than a " +
    "verdict on you: the misses below name exactly which competencies to go " +
    "back to. Work through the rationales for every question marked incorrect, " +
    "then repeat those areas before sitting a longer practice run.",
  developing:
    "This is real progress and it is not finished. The score is high enough " +
    "to show the concepts are landing and low enough that the weaker domains " +
    "would cost you. Concentrate on the areas flagged below rather than " +
    "practising evenly across everything, and widen coverage of the bank " +
    "before treating any score as settled.",
  mixed:
    "A good sitting. The remaining errors are concentrated rather than spread " +
    "evenly, which usually means specific competencies rather than general " +
    "unfamiliarity - the breakdown below shows which. Clear those, and keep " +
    "reading the authoritative source material alongside this tool.",
  encouraging:
    "Strong performance across enough of the bank for the number to carry " +
    "weight. Keep reviewing the weaker domains listed below, and continue " +
    "working from current official candidate materials: this tool is one " +
    "practice input among several and cannot tell you how a real examination " +
    "would go.",
};

/**
 * Steps are assembled rather than looked up, so they name the actual weak
 * areas when there are any and stay silent when the data cannot support the
 * claim.
 */
function stepsFor(state: ReadinessState, weakLabels: string[], r: Omit<Readiness, "headline" | "verdict" | "nextSteps">): string[] {
  const steps: string[] = [];

  if (state === "noEvidence") {
    steps.push("Start a practice session and answer at least a few questions.");
    steps.push("Generate this report again once there is something to measure.");
    return steps;
  }

  if (weakLabels.length) {
    steps.push(`Review the weakest competencies first: ${weakLabels.join("; ")}.`);
  } else {
    steps.push(
      "No single competency stands out as weakest in this sitting - there is " +
        "not enough data to single one out.",
    );
  }

  steps.push("Re-read the rationale for every question marked incorrect or unanswered.");

  if (r.evidence === "thin" || r.evidence === "partial") {
    const seen = Math.round(r.coverage);
    steps.push(
      `Widen coverage: this sitting drew on ${seen}% of the ${r.bankSize}-question bank.`,
    );
  }
  if (r.domainsTouched < 4) {
    steps.push(
      `Practise the domains this sitting did not reach - ${r.domainsTouched} of 4 were covered.`,
    );
  }

  steps.push(
    "Work from current official candidate materials alongside this tool, not instead of them.",
  );
  return steps;
}

/**
 * Assess a scored sitting.
 *
 * `bankSize` is injected with a default so the calculation stays pure and a
 * test can pin it, rather than moving as the question bank grows.
 */
export function assessReadiness(
  score: SittingScore,
  bankSize: number = getTrackQuestions().length,
  weakLabels: string[] = [],
): Readiness {
  const attempted = Math.max(0, score.total - score.unanswered);
  const evidence = evidenceBand(attempted, bankSize);
  const accuracy = score.percentage;
  const grade = gradeFor(accuracy);
  const state = stateFor(grade, evidence);
  const domainsTouched = score.byDomain.filter((d) => d.total > 0).length;

  const base = {
    state,
    grade,
    accuracy,
    evidence,
    attempted,
    answered: attempted,
    bankSize,
    coverage: bankSize > 0 ? (score.total / bankSize) * 100 : 0,
    domainsTouched,
  };

  return {
    ...base,
    headline: HEADLINES[state],
    verdict: VERDICTS[state],
    nextSteps: stepsFor(state, weakLabels, base),
  };
}
