import { getQuestion } from "@/content/registry";
import type { TrackId } from "@/content/types";
import type { Confidence, StudyMode } from "./types";

/**
 * The sitting currently in front of the learner.
 *
 * Separate from `nhid-clinical:progress:v1` on purpose, and separate again
 * from attempts and analytics. Progress is the durable record of what someone
 * has learned; this is the disposable record of where they are right now. They
 * have different lifetimes, different failure modes, and different privacy
 * weight, so they do not share a key.
 *
 * `sessionStorage`, not `localStorage`: a sitting belongs to the tab it was
 * started in. Closing the tab abandons it, which is the honest reading — and
 * it means two tabs cannot fight over one sitting.
 *
 * ---------------------------------------------------------------------------
 * Why the composition is stored, not just the seed
 *
 * A seed makes the *shuffle* reproducible. It cannot make the *selection*
 * reproducible, because selection scores candidates against the attempt
 * history — unseen +40, previously-correct -25, previously-wrong +20 — and
 * answering rewrites that history. Measured over ten seeds, reloading three
 * questions into a ten-question sitting reproduced the sitting 0 times, kept
 * 7 of 10 questions, and dropped all three already answered.
 *
 * So the question ids and the option ids are what is stored, and they are
 * authoritative on restore. Reconstruction is a lookup. It never re-runs
 * selection, and it never re-runs the shuffle.
 */

export const ACTIVE_SESSION_KEY = "nhid-clinical:active-session:v1";

/** Bumped when the shape changes; a mismatch is discarded, never migrated. */
const VERSION = 1;

const CONFIDENCES: Confidence[] = ["guessed", "unsure", "confident"];
const MODES: StudyMode[] = ["practice", "domain", "review"];

export interface ActiveSession {
  version: number;
  seed: number;
  trackId: TrackId;
  mode: StudyMode;
  label: string;
  withScheduling: boolean;
  exitHref: string;
  /** The sitting's composition and order. Authoritative on restore. */
  questionIds: string[];
  /** Option ids in display order, one row per question, parallel to the above. */
  optionIds: string[][];
  index: number;
  /** Option ids, never letters. */
  selected: string[];
  revealed: boolean;
  confidence: Confidence | null;
  correctCount: number;
  queuedCount: number;
  updatedAt: string;
}

/** What the caller is asking to resume. A mismatch means "start clean". */
export interface ResumeExpectation {
  mode: StudyMode;
  /** When given, a snapshot with a different seed is a different sitting. */
  seed?: number;
}

/* ------------------------------------------------------------------ */
/* Storage access                                                      */
/* ------------------------------------------------------------------ */

/**
 * Storage is injected so this module can be tested without a DOM, and so a
 * browser that refuses sessionStorage (private mode, blocked cookies) degrades
 * to "no persistence" rather than throwing on first render.
 */
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function writeActiveSession(
  session: ActiveSession,
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch {
    // A full or unavailable quota costs the learner their place on refresh.
    // It must not cost them the answer they are in the middle of giving.
  }
}

export function clearActiveSession(
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    /* nothing to do */
  }
}

/**
 * The stored text, before any parsing.
 *
 * Kept separate from parsing so "nothing is stored" and "something unparseable
 * is stored" stay distinguishable — collapsing them means garbage is read as
 * absence and never cleared, so it is re-read on every load forever.
 */
function readRaw(storage: StorageLike | null): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(ACTIVE_SESSION_KEY);
  } catch {
    return null;
  }
}

/** The raw stored value, parsed but not validated. */
export function readActiveSession(
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
const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === "string");

/**
 * Everything that must be true before a stored sitting is put back on screen.
 *
 * Deliberately total: a snapshot written by an older build, edited by hand, or
 * pointing at a question that has since been removed must fail here rather
 * than surface as a half-rendered session. There is no partial recovery and no
 * migration — the cost of a wrong restore is a learner answering a question
 * they cannot see, and the cost of discarding is one fresh sitting.
 */
export function validateActiveSession(
  raw: unknown,
  expected?: ResumeExpectation,
): ActiveSession | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const s = raw as Record<string, unknown>;

  if (s.version !== VERSION) return null;

  if (!isInt(s.seed) || (s.seed as number) < 0) return null;
  if (typeof s.trackId !== "string") return null;
  if (typeof s.mode !== "string" || !MODES.includes(s.mode as StudyMode)) {
    return null;
  }
  if (typeof s.label !== "string") return null;
  if (typeof s.withScheduling !== "boolean") return null;
  if (typeof s.exitHref !== "string") return null;
  if (typeof s.updatedAt !== "string") return null;

  // The requested sitting must be the stored one.
  if (expected) {
    if (s.mode !== expected.mode) return null;
    if (expected.seed !== undefined && s.seed !== expected.seed) return null;
  }

  // Composition.
  if (!isStringArray(s.questionIds) || s.questionIds.length === 0) return null;
  const questions = s.questionIds.map((id) => getQuestion(id));
  if (questions.some((q) => !q)) return null;
  if (questions.some((q) => q!.trackId !== s.trackId)) return null;

  // Option order: one row per question, each row a permutation of that
  // question's own options. A row that has drifted from the content means the
  // question was edited under the learner; the sitting is no longer the one
  // they started.
  if (!Array.isArray(s.optionIds)) return null;
  if (s.optionIds.length !== s.questionIds.length) return null;
  for (let i = 0; i < s.optionIds.length; i++) {
    const row = s.optionIds[i];
    if (!isStringArray(row)) return null;
    const expectedIds = questions[i]!.options.map((o) => o.id);
    if (row.length !== expectedIds.length) return null;
    if (new Set(row).size !== row.length) return null;
    if (!row.every((id) => expectedIds.includes(id))) return null;
  }

  // Position.
  if (!isInt(s.index) || s.index < 0 || s.index >= s.questionIds.length) {
    return null;
  }

  // In-flight answer. Selections must belong to the question being shown.
  if (!isStringArray(s.selected)) return null;
  const current = questions[s.index]!;
  const currentIds = current.options.map((o) => o.id);
  if (new Set(s.selected).size !== s.selected.length) return null;
  if (!s.selected.every((id) => currentIds.includes(id))) return null;

  if (typeof s.revealed !== "boolean") return null;
  if (
    s.confidence !== null &&
    (typeof s.confidence !== "string" ||
      !CONFIDENCES.includes(s.confidence as Confidence))
  ) {
    return null;
  }

  // Tallies.
  const total = s.questionIds.length;
  if (!isInt(s.correctCount) || s.correctCount < 0 || s.correctCount > total) {
    return null;
  }
  if (!isInt(s.queuedCount) || s.queuedCount < 0 || s.queuedCount > total) {
    return null;
  }

  return s as unknown as ActiveSession;
}

/**
 * The stored sitting, if there is a valid one matching what the caller wants.
 * Anything else clears the slot so a corrupt value cannot be re-read forever.
 */
export function resumeActiveSession(
  expected: ResumeExpectation,
  storage: StorageLike | null = defaultStorage(),
): ActiveSession | null {
  // Nothing stored at all: there is no slot to clean up.
  if (readRaw(storage) === null) return null;

  const parsed = readActiveSession(storage);
  const valid = parsed === null ? null : validateActiveSession(parsed, expected);
  if (valid) return valid;

  // Only discard when the value is unusable, not when it simply belongs to a
  // different sitting — a review sitting must not wipe a practice one.
  // Unparseable text is unusable by definition.
  if (parsed === null || validateActiveSession(parsed) === null) {
    clearActiveSession(storage);
  }
  return null;
}
