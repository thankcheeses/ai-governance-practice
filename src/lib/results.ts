import { DOMAIN_TITLES, type DomainRoman, domainOf } from "@/content/bok";
import { getQuestion } from "@/content/registry";
import type { TrackId } from "@/content/types";
import { gradeAnswer } from "./grading";

/**
 * The record of a finished sitting.
 *
 * Practice and exam sittings are governed differently while they are running —
 * one adapts and feeds analytics, the other is frozen under a clock — but once
 * they are over they produce the same thing: a set of questions, what was
 * chosen for each, and when it happened. That common shape is what this module
 * owns, so the results screen, the PDF and the email summary all read one
 * model instead of three.
 *
 * What is stored is facts, not conclusions. Scores, percentages and domain
 * breakdowns are derived at read time by `scoreSitting`, exactly as practice
 * analytics are, so a stored result can never drift out of agreement with the
 * questions it refers to. It also means the record stays small: the answers,
 * not the rendered report.
 *
 * Persistence lives in `results-storage.ts`. This module is pure.
 */

export type SittingMode = "practice" | "exam";

/** Why an exam closed. Practice sittings always finish by working through. */
export type CompletionReason = "completed" | "manual" | "expired";

export interface CompletedResult {
  version: number;
  mode: SittingMode;
  /**
   * Identifies the sitting this result came from — an exam id, or the practice
   * sitting's seed. Lets a results screen tell "the sitting I just finished"
   * from "some earlier one", and gives the PDF and email a reference to quote.
   */
  sittingId: string;
  trackId: TrackId;
  /** What the learner chose, e.g. "Mixed practice" or "Exam · 100 questions". */
  label: string;
  seed: number;
  /** Composition and order, exactly as they were on screen. */
  questionIds: string[];
  optionIds: string[][];
  /** questionId -> chosen option ids. Absent means unanswered. */
  answers: Record<string, string[]>;
  /** Question ids marked for review during an exam. Empty for practice. */
  flagged: string[];
  startedAt: string;
  completedAt: string;
  reason: CompletionReason;
  /** Exam only: the allowance and the deadline it produced. */
  durationMs: number | null;
  deadline: string | null;
}

export const RESULT_VERSION = 1;

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

export interface ResultSlice {
  key: string;
  label: string;
  correct: number;
  answered: number;
  total: number;
  accuracy: number;
}

export interface SittingScore {
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  /** Correct as a share of every question, not just those attempted. */
  percentage: number;
  byDomain: (ResultSlice & { roman: DomainRoman })[];
  bySubdomain: ResultSlice[];
  /** Question ids answered wrongly or left blank, in sitting order. */
  missedIds: string[];
  flaggedCount: number;
}

/** The minimum a sitting must expose to be scored. */
export interface ScorableSitting {
  questionIds: string[];
  answers: Record<string, string[]>;
  flagged?: string[];
}

/**
 * Score a sitting from its stored answers.
 *
 * An unanswered question counts against the score, because leaving it blank
 * has the same consequence for the candidate as getting it wrong. A question
 * that has since left the bank is skipped rather than counted, so an old
 * result degrades to a smaller honest report instead of a wrong one.
 */
export function scoreSitting(sitting: ScorableSitting): SittingScore {
  const bySub = new Map<string, ResultSlice>();
  const byDom = new Map<string, ResultSlice & { roman: DomainRoman }>();
  const missedIds: string[] = [];
  let counted = 0;
  let correct = 0;
  let unanswered = 0;

  for (const questionId of sitting.questionIds) {
    const question = getQuestion(questionId);
    if (!question) continue;
    counted += 1;

    const chosen = sitting.answers[questionId];
    const attempted = Array.isArray(chosen) && chosen.length > 0;
    const isRight = attempted && gradeAnswer(question, chosen);

    if (!attempted) unanswered += 1;
    if (isRight) correct += 1;
    else missedIds.push(questionId);

    const sub = question.bokSubdomain;
    const subSlice = bySub.get(sub) ?? {
      key: sub,
      label: sub,
      correct: 0,
      answered: 0,
      total: 0,
      accuracy: 0,
    };
    subSlice.total += 1;
    if (attempted) subSlice.answered += 1;
    if (isRight) subSlice.correct += 1;
    bySub.set(sub, subSlice);

    // A sub-domain outside the published four-domain structure has no domain
    // to roll up into. It still counts in the sub-domain breakdown and in the
    // total; it is left out of the domain view rather than inventing a bucket.
    const roman = domainOf(sub);
    if (!roman) continue;

    const domSlice = byDom.get(roman) ?? {
      key: roman,
      roman,
      label: DOMAIN_TITLES[roman],
      correct: 0,
      answered: 0,
      total: 0,
      accuracy: 0,
    };
    domSlice.total += 1;
    if (attempted) domSlice.answered += 1;
    if (isRight) domSlice.correct += 1;
    byDom.set(roman, domSlice);
  }

  const finish = <T extends ResultSlice>(s: T): T => ({
    ...s,
    accuracy: s.total ? Math.round((s.correct / s.total) * 100) : 0,
  });

  return {
    total: counted,
    correct,
    incorrect: counted - correct - unanswered,
    unanswered,
    percentage: counted ? Math.round((correct / counted) * 100) : 0,
    byDomain: Array.from(byDom.values())
      .map(finish)
      .sort((a, b) => a.roman.localeCompare(b.roman)),
    bySubdomain: Array.from(bySub.values())
      .map(finish)
      .sort((a, b) => a.key.localeCompare(b.key)),
    missedIds,
    flaggedCount: sitting.flagged?.length ?? 0,
  };
}

export function scoreResult(result: CompletedResult): SittingScore {
  return scoreSitting(result);
}

/* ------------------------------------------------------------------ */
/* Time                                                                */
/* ------------------------------------------------------------------ */

/** How long the sitting actually took, floored at zero. */
export function elapsedMs(result: CompletedResult): number {
  const start = new Date(result.startedAt).getTime();
  const end = new Date(result.completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, end - start);
}

/**
 * Time left on the clock when an exam was submitted. Null for practice, which
 * has no allowance, and floored at zero for an exam that ran out.
 */
export function timeRemainingAtFinish(result: CompletedResult): number | null {
  if (result.durationMs === null) return null;
  return Math.max(0, result.durationMs - elapsedMs(result));
}

/** `1h 04m 09s`, dropping leading units that are zero. */
export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  if (m > 0) return `${m}m ${pad(s)}s`;
  return `${s}s`;
}

/* ------------------------------------------------------------------ */
/* Study guidance                                                      */
/* ------------------------------------------------------------------ */

/** The weakest sub-domains with enough questions to say anything about. */
export function weakestSubdomains(
  score: SittingScore,
  limit = 3,
  minimum = 2,
): ResultSlice[] {
  return score.bySubdomain
    .filter((s) => s.total >= minimum)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}
