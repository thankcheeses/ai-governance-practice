import { getQuestion } from "@/content/registry";
import type { ExamSession, SubmissionReason } from "./exam";

/**
 * Where an exam sitting lives.
 *
 * `localStorage`, not `sessionStorage` — and that is the one place this
 * deliberately differs from practice. A practice sitting belongs to its tab and
 * abandoning it costs nothing. A three-hour exam does not: closing the tab by
 * accident two hours in must not destroy the attempt, so the sitting has to
 * outlive the tab.
 *
 * It is a separate key from `nhid-clinical:progress:v1` and from the practice
 * active-session key, and nothing here ever reads or writes either. That
 * separation is the point: an exam is a measurement, and it must not move the
 * analytics it is measuring against.
 */

export const EXAM_SESSION_KEY = "nhid-clinical:exam-session:v1";

const VERSION = 1;
const REASONS: SubmissionReason[] = ["manual", "expired"];

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function readRaw(storage: StorageLike | null): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(EXAM_SESSION_KEY);
  } catch {
    return null;
  }
}

export function writeExamSession(
  session: ExamSession,
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(EXAM_SESSION_KEY, JSON.stringify(session));
  } catch {
    // A failed write costs the candidate their recovery point. It must not
    // also cost them the answer they are in the middle of giving.
  }
}

export function clearExamSession(
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(EXAM_SESSION_KEY);
  } catch {
    /* nothing to do */
  }
}

export function readExamSession(
  storage: StorageLike | null = defaultStorage(),
): unknown {
  const raw = readRaw(storage);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

const isInt = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v);
const isStrArr = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === "string");
const isIso = (v: unknown): v is string =>
  typeof v === "string" && !Number.isNaN(Date.parse(v));

/**
 * Everything that must hold before a stored exam is put back on screen.
 *
 * Total, and unforgiving. A half-valid exam is worse than a discarded one: a
 * candidate answering a question they cannot see, or a deadline that has
 * quietly moved, produces a score nobody can stand behind. There is no partial
 * recovery and no migration.
 */
export function validateExamSession(raw: unknown): ExamSession | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const s = raw as Record<string, unknown>;

  if (s.version !== VERSION) return null;
  if (typeof s.examId !== "string" || !s.examId) return null;
  if (typeof s.trackId !== "string") return null;
  if (!isInt(s.seed) || (s.seed as number) < 0) return null;
  if (!isInt(s.durationMs) || (s.durationMs as number) <= 0) return null;
  if (!isIso(s.startedAt) || !isIso(s.deadline)) return null;

  // The deadline must be the start plus the stated duration. If they disagree,
  // one of them was tampered with or written by a different build, and there is
  // no honest way to pick a winner.
  const drift = Math.abs(
    Date.parse(s.deadline as string) -
      (Date.parse(s.startedAt as string) + (s.durationMs as number)),
  );
  if (drift > 1000) return null;

  // Composition.
  if (!isStrArr(s.questionIds) || s.questionIds.length === 0) return null;
  const questions = s.questionIds.map((id) => getQuestion(id));
  if (questions.some((q) => !q)) return null;
  if (questions.some((q) => q!.trackId !== s.trackId)) return null;

  if (!Array.isArray(s.optionIds) || s.optionIds.length !== s.questionIds.length) {
    return null;
  }
  for (let i = 0; i < s.optionIds.length; i++) {
    const row = s.optionIds[i];
    if (!isStrArr(row)) return null;
    const expected = questions[i]!.options.map((o) => o.id);
    if (row.length !== expected.length) return null;
    if (new Set(row).size !== row.length) return null;
    if (!row.every((id) => expected.includes(id))) return null;
  }

  // Position.
  if (!isInt(s.index) || s.index < 0 || s.index >= s.questionIds.length) {
    return null;
  }

  // Answers: every key a question in this sitting, every value an option of it.
  if (!s.answers || typeof s.answers !== "object" || Array.isArray(s.answers)) {
    return null;
  }
  const known = new Set(s.questionIds);
  for (const [questionId, chosen] of Object.entries(
    s.answers as Record<string, unknown>,
  )) {
    if (!known.has(questionId)) return null;
    if (!isStrArr(chosen)) return null;
    if (new Set(chosen).size !== chosen.length) return null;
    const options = getQuestion(questionId)!.options.map((o) => o.id);
    if (!chosen.every((id) => options.includes(id))) return null;
  }

  // Flags.
  if (!isStrArr(s.flagged)) return null;
  if (new Set(s.flagged).size !== s.flagged.length) return null;
  if (!s.flagged.every((id) => known.has(id))) return null;

  // Submission.
  if (s.submittedAt !== null && !isIso(s.submittedAt)) return null;
  if (s.submittedAt === null) {
    if (s.submittedReason !== null) return null;
  } else {
    if (
      typeof s.submittedReason !== "string" ||
      !REASONS.includes(s.submittedReason as SubmissionReason)
    ) {
      return null;
    }
  }

  return s as unknown as ExamSession;
}

/**
 * The stored exam, if there is a valid one. A value that fails validation is
 * cleared so a corrupt sitting cannot be re-read on every load forever.
 */
export function resumeExamSession(
  storage: StorageLike | null = defaultStorage(),
): ExamSession | null {
  if (readRaw(storage) === null) return null;
  const parsed = readExamSession(storage);
  const valid = parsed === null ? null : validateExamSession(parsed);
  if (valid) return valid;
  clearExamSession(storage);
  return null;
}
