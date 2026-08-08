import { getQuestion } from "@/content/registry";
import {
  type CompletedResult,
  type CompletionReason,
  RESULT_VERSION,
  type SittingMode,
} from "./results";

/**
 * Where finished sittings are kept.
 *
 * `localStorage`, not `sessionStorage`: a result is something the learner has
 * earned and may want to come back to, print, or send to themselves. It has to
 * outlive the tab that produced it, which is the opposite of the in-flight
 * practice sitting in `active-session.ts`.
 *
 * One slot per mode, under a single key. Finishing an exam must not erase the
 * practice sitting someone completed this morning, and the two results screens
 * each need to survive a refresh independently. A third, fourth and fifth key
 * would give the same behaviour with more to keep consistent.
 *
 * Deliberately separate from `nhid-clinical:progress:v1`. Progress is the
 * durable record of what has been learned across every sitting; this is a
 * report about one of them, and the two have different lifetimes.
 */

export const RESULTS_KEY = "nhid-clinical:results:v1";

const MODES: SittingMode[] = ["practice", "exam"];
const REASONS: CompletionReason[] = ["completed", "manual", "expired"];

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Kept per mode so the two results screens cannot evict each other. */
export type StoredResults = Partial<Record<SittingMode, CompletedResult>>;

function defaultStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === "string");
const isIsoDate = (v: unknown): v is string =>
  typeof v === "string" && Number.isFinite(new Date(v).getTime());

/**
 * Everything that must hold before a stored result is shown as fact.
 *
 * Total, and with no migration path: a result is a claim about how someone
 * performed, so a half-understood one is worse than none. Anything that fails
 * is discarded and the learner sees the ordinary "no result" state rather than
 * a report assembled from fragments.
 */
export function validateResult(raw: unknown): CompletedResult | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  if (r.version !== RESULT_VERSION) return null;
  if (typeof r.mode !== "string" || !MODES.includes(r.mode as SittingMode)) {
    return null;
  }
  if (typeof r.reason !== "string" || !REASONS.includes(r.reason as CompletionReason)) {
    return null;
  }
  if (typeof r.sittingId !== "string" || !r.sittingId) return null;
  if (typeof r.trackId !== "string") return null;
  if (typeof r.label !== "string") return null;
  if (typeof r.seed !== "number" || !Number.isFinite(r.seed)) return null;
  if (!isIsoDate(r.startedAt) || !isIsoDate(r.completedAt)) return null;
  if (new Date(r.completedAt).getTime() < new Date(r.startedAt).getTime()) {
    return null;
  }

  // Exam-only fields travel together: an allowance implies a deadline.
  if (r.durationMs !== null) {
    if (typeof r.durationMs !== "number" || r.durationMs <= 0) return null;
    if (!isIsoDate(r.deadline)) return null;
  } else if (r.deadline !== null) {
    return null;
  }

  // Composition. A question that has left the bank invalidates the whole
  // record rather than silently shrinking the denominator behind a score.
  if (!isStringArray(r.questionIds) || r.questionIds.length === 0) return null;
  const questions = r.questionIds.map((id) => getQuestion(id));
  if (questions.some((q) => !q)) return null;
  if (new Set(r.questionIds).size !== r.questionIds.length) return null;

  // Option order: one row per question, each a permutation of that question's
  // own options — the order the learner actually saw, which the review screen
  // and the PDF both reproduce.
  if (!Array.isArray(r.optionIds) || r.optionIds.length !== r.questionIds.length) {
    return null;
  }
  for (let i = 0; i < r.optionIds.length; i++) {
    const row = r.optionIds[i];
    if (!isStringArray(row)) return null;
    const expected = questions[i]!.options.map((o) => o.id);
    if (row.length !== expected.length) return null;
    if (new Set(row).size !== row.length) return null;
    if (!row.every((id) => expected.includes(id))) return null;
  }

  // Answers must belong to questions in this sitting, and options to their
  // own question.
  if (!r.answers || typeof r.answers !== "object" || Array.isArray(r.answers)) {
    return null;
  }
  const ids = new Set(r.questionIds);
  for (const [questionId, chosen] of Object.entries(
    r.answers as Record<string, unknown>,
  )) {
    if (!ids.has(questionId)) return null;
    if (!isStringArray(chosen)) return null;
    if (new Set(chosen).size !== chosen.length) return null;
    const question = questions[r.questionIds.indexOf(questionId)]!;
    const own = question.options.map((o) => o.id);
    if (!chosen.every((id) => own.includes(id))) return null;
  }

  if (!isStringArray(r.flagged)) return null;
  if (new Set(r.flagged).size !== r.flagged.length) return null;
  if (!r.flagged.every((id) => ids.has(id))) return null;

  return r as unknown as CompletedResult;
}

/* ------------------------------------------------------------------ */
/* Read and write                                                      */
/* ------------------------------------------------------------------ */

function readRaw(storage: StorageLike | null): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(RESULTS_KEY);
  } catch {
    return null;
  }
}

/** Every valid stored result, keyed by mode. Invalid entries are dropped. */
export function readResults(
  storage: StorageLike | null = defaultStorage(),
): StoredResults {
  const raw = readRaw(storage);
  if (raw === null) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    clearResults(storage);
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    clearResults(storage);
    return {};
  }

  const bag = parsed as Record<string, unknown>;
  const out: StoredResults = {};
  let recovered = 0;
  for (const mode of MODES) {
    const valid = validateResult(bag[mode]);
    if (valid && valid.mode === mode) {
      out[mode] = valid;
      recovered += 1;
    }
  }

  // Something was stored but none of it survived: clear the slot so a corrupt
  // value is not re-parsed on every load for the rest of the install's life.
  if (recovered === 0) clearResults(storage);
  return out;
}

export function readResult(
  mode: SittingMode,
  storage: StorageLike | null = defaultStorage(),
): CompletedResult | null {
  return readResults(storage)[mode] ?? null;
}

/** Store a result in its mode's slot, leaving the other mode's alone. */
export function writeResult(
  result: CompletedResult,
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  const next: StoredResults = { ...readResults(storage), [result.mode]: result };
  try {
    storage.setItem(RESULTS_KEY, JSON.stringify(next));
  } catch {
    // Quota or private mode. The result is still on screen for this visit;
    // only the ability to come back to it after a refresh is lost.
  }
}

export function clearResult(
  mode: SittingMode,
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  const next = readResults(storage);
  delete next[mode];
  try {
    if (Object.keys(next).length === 0) storage.removeItem(RESULTS_KEY);
    else storage.setItem(RESULTS_KEY, JSON.stringify(next));
  } catch {
    /* nothing to do */
  }
}

export function clearResults(
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(RESULTS_KEY);
  } catch {
    /* nothing to do */
  }
}
