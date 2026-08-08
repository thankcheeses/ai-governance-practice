import { getQuestion } from "@/content/registry";
import { DOMAIN_TITLES, type DomainRoman, domainOf } from "@/content/bok";
import type { OptionKey, PresentedOption, Question, TrackId } from "@/content/types";
import { gradeAnswer } from "./grading";
import { presentOptions, presentQuestions } from "./presentation";
import { selectQuestions } from "./adaptive";
import type { UserProgress } from "./types";

/**
 * Exam mode — a fixed sitting under a clock.
 *
 * Deliberately its own model rather than an option on practice. The two differ
 * in what they are *for*, and that difference shows up in the data:
 *
 *   - Practice adapts. It reads the attempt history to decide what to serve
 *     next, and every answer feeds analytics.
 *   - An exam must not adapt. The sitting is fixed the moment it starts, the
 *     clock runs against a wall-clock deadline rather than a render loop, and
 *     nothing about it touches practice progress — an exam is a measurement,
 *     and a measurement that alters what it measures is not one.
 *
 * So an exam writes to its own store, is scored from its own persisted state,
 * and never appends to `UserProgress`. Practice analytics are unchanged by
 * taking an exam, and an exam in flight is unchanged by taking practice.
 *
 * This is a study simulation over independently authored questions. It is not
 * a certification exam, does not reproduce one, and its score predicts nothing
 * about any real sitting.
 */

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D", "E"];

export const DEFAULT_EXAM_QUESTIONS = 100;
export const DEFAULT_EXAM_DURATION_MS = 3 * 60 * 60 * 1000;

/** Warn when the clock drops below this. */
export const EXAM_WARNING_MS = 15 * 60 * 1000;

export type SubmissionReason = "manual" | "expired";

export interface ExamSession {
  version: number;
  /** Unique per sitting, so two exams can never be confused for one. */
  examId: string;
  trackId: TrackId;
  seed: number;
  /** The sitting's composition. Authoritative — never re-derived. */
  questionIds: string[];
  /** Option ids in display order, one row per question. */
  optionIds: string[][];
  index: number;
  /** questionId -> chosen option ids. Absent means unanswered. */
  answers: Record<string, string[]>;
  /** Question ids the candidate marked to come back to. */
  flagged: string[];
  startedAt: string;
  /**
   * Absolute wall-clock deadline, ISO 8601.
   *
   * Stored as an instant rather than a remaining duration on purpose: a
   * counter decremented in React state stops when the tab sleeps, and would
   * hand back time the candidate did not have. Remaining time is always
   * derived as `deadline - now`.
   */
  deadline: string;
  durationMs: number;
  submittedAt: string | null;
  submittedReason: SubmissionReason | null;
}

/** Everything the exam screen renders, with nothing left to re-derive. */
export interface ExamSitting {
  questions: Question[];
  options: PresentedOption[][];
}

/* ------------------------------------------------------------------ */
/* Building a sitting                                                  */
/* ------------------------------------------------------------------ */

export function newExamId(): string {
  return `exam-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffff).toString(36)}`;
}

export interface ExamSpec {
  seed: number;
  count?: number;
  durationMs?: number;
  trackId: TrackId;
  /** Wall clock at creation; injectable so tests are not time-dependent. */
  now?: number;
}

/**
 * Compose a sitting and freeze it.
 *
 * Selection runs once, here, against an **empty** history rather than the
 * candidate's. An exam that pulled the questions someone answers worst would
 * measure their weak areas rather than their competence, and would give two
 * candidates different exams — neither of which is what a sitting is for.
 */
export function createExamSession(
  spec: ExamSpec,
): ExamSession {
  const count = spec.count ?? DEFAULT_EXAM_QUESTIONS;
  const durationMs = spec.durationMs ?? DEFAULT_EXAM_DURATION_MS;
  const now = spec.now ?? Date.now();

  const blank: UserProgress = {
    trackId: spec.trackId,
    onboardingCompletedAt: null,
    disclaimerAckedAt: null,
    dailyGoal: 0,
    streak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    attempts: [],
    reviewCards: {},
    updatedAt: new Date(now).toISOString(),
  };

  const questions = presentQuestions(
    selectQuestions(blank, { count, trackId: spec.trackId, seed: spec.seed }),
    spec.seed,
  );

  return {
    version: 1,
    examId: newExamId(),
    trackId: spec.trackId,
    seed: spec.seed,
    questionIds: questions.map((q) => q.id),
    optionIds: questions.map((q) => presentOptions(q, spec.seed).map((o) => o.id)),
    index: 0,
    answers: {},
    flagged: [],
    startedAt: new Date(now).toISOString(),
    deadline: new Date(now + durationMs).toISOString(),
    durationMs,
    submittedAt: null,
    submittedReason: null,
  };
}

/**
 * Rebuild the sitting from stored ids. A lookup, never a recomputation — the
 * same reasoning as practice: selection depends on inputs that move, so only
 * the stored composition can be authoritative.
 */
export function sittingFromExam(session: ExamSession): ExamSitting | null {
  const questions: Question[] = [];
  const options: PresentedOption[][] = [];

  for (let i = 0; i < session.questionIds.length; i++) {
    const question = getQuestion(session.questionIds[i]);
    if (!question) return null;
    const row = session.optionIds[i];
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
  return { questions, options };
}

/* ------------------------------------------------------------------ */
/* The clock                                                           */
/* ------------------------------------------------------------------ */

/** Milliseconds left, floored at zero. Derived, never stored. */
export function remainingMs(session: ExamSession, now = Date.now()): number {
  return Math.max(0, new Date(session.deadline).getTime() - now);
}

export function hasExpired(session: ExamSession, now = Date.now()): boolean {
  return remainingMs(session, now) === 0;
}

export function isSubmitted(session: ExamSession): boolean {
  return session.submittedAt !== null;
}

/** Whether the candidate may still change anything. */
export function isAcceptingAnswers(
  session: ExamSession,
  now = Date.now(),
): boolean {
  return !isSubmitted(session) && !hasExpired(session, now);
}

export function formatRemaining(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/* ------------------------------------------------------------------ */
/* Mutations — all pure, all returning a new session                   */
/* ------------------------------------------------------------------ */

export function answerQuestion(
  session: ExamSession,
  questionId: string,
  optionIds: string[],
  now = Date.now(),
): ExamSession {
  // A closed exam is closed. Enforced here rather than in the component so a
  // stray dispatch, a queued event, or a second tab cannot get around it.
  if (!isAcceptingAnswers(session, now)) return session;
  if (!session.questionIds.includes(questionId)) return session;
  return { ...session, answers: { ...session.answers, [questionId]: optionIds } };
}

export function toggleFlag(
  session: ExamSession,
  questionId: string,
  now = Date.now(),
): ExamSession {
  if (!isAcceptingAnswers(session, now)) return session;
  if (!session.questionIds.includes(questionId)) return session;
  const flagged = session.flagged.includes(questionId)
    ? session.flagged.filter((id) => id !== questionId)
    : [...session.flagged, questionId];
  return { ...session, flagged };
}

export function goToIndex(session: ExamSession, index: number): ExamSession {
  if (index < 0 || index >= session.questionIds.length) return session;
  return { ...session, index };
}

/**
 * Close the sitting.
 *
 * Idempotent: a second call returns the first submission untouched. Double
 * submission is otherwise easy to trigger — the deadline firing at the same
 * moment someone presses Submit, or a double-tap — and would move the
 * recorded time and reason under an already-final result.
 */
export function submitExam(
  session: ExamSession,
  reason: SubmissionReason,
  now = Date.now(),
): ExamSession {
  if (isSubmitted(session)) return session;
  return {
    ...session,
    submittedAt: new Date(now).toISOString(),
    submittedReason: reason,
  };
}

/** Close it if the clock has run out. Safe to call on every tick. */
export function submitIfExpired(
  session: ExamSession,
  now = Date.now(),
): ExamSession {
  if (isSubmitted(session) || !hasExpired(session, now)) return session;
  return submitExam(session, "expired", now);
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

export interface ExamSlice {
  key: string;
  label: string;
  correct: number;
  answered: number;
  total: number;
  accuracy: number;
}

export interface ExamResult {
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  /** Correct as a share of every question, not just those attempted. */
  percentage: number;
  byDomain: (ExamSlice & { roman: DomainRoman })[];
  bySubdomain: ExamSlice[];
  /** Question ids answered wrongly or left blank, in sitting order. */
  missedIds: string[];
  flaggedCount: number;
}

/**
 * Score from the persisted sitting.
 *
 * Derived at read time from the stored answers, exactly like practice
 * analytics — nothing is written at submission that could later disagree with
 * the questions themselves. An unanswered question counts against the score,
 * because leaving it blank is a choice with the same consequence as getting it
 * wrong.
 */
export function scoreExam(session: ExamSession): ExamResult {
  const bySub = new Map<string, ExamSlice>();
  const byDom = new Map<string, ExamSlice & { roman: DomainRoman }>();
  const missedIds: string[] = [];
  let correct = 0;
  let unanswered = 0;

  for (const questionId of session.questionIds) {
    const question = getQuestion(questionId);
    if (!question) continue;

    const chosen = session.answers[questionId];
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

    // A sub-domain outside the published four-domain structure has no domain to
    // roll up into. It still counts in the sub-domain breakdown and in the
    // total; it is simply left out of the domain view rather than inventing a
    // bucket for it.
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

  const finish = <T extends ExamSlice>(s: T): T => ({
    ...s,
    accuracy: s.total ? Math.round((s.correct / s.total) * 100) : 0,
  });

  const total = session.questionIds.length;
  return {
    total,
    correct,
    incorrect: total - correct - unanswered,
    unanswered,
    percentage: total ? Math.round((correct / total) * 100) : 0,
    byDomain: Array.from(byDom.values()).map(finish).sort((a, b) => a.roman.localeCompare(b.roman)),
    bySubdomain: Array.from(bySub.values()).map(finish).sort((a, b) => a.key.localeCompare(b.key)),
    missedIds,
    flaggedCount: session.flagged.length,
  };
}

/** Questions with no answer recorded, in sitting order. */
export function unansweredIds(session: ExamSession): string[] {
  return session.questionIds.filter((id) => {
    const a = session.answers[id];
    return !Array.isArray(a) || a.length === 0;
  });
}
