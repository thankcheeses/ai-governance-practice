import type { OptionKey, PresentedOption, Question } from "@/content/types";
import { shuffle } from "./utils";

/**
 * Session presentation.
 *
 * Content stores what an option *is*; this decides where it appears. Options
 * are dealt fresh letters every session, so a learner cannot memorise "the
 * answer to that one is C" — the second time they meet the question it may be
 * A. Correctness never moves, because it is recorded against option identity.
 *
 * Everything here is seeded and pure. The same seed yields the same
 * presentation, which is what makes a session survivable across a refresh and
 * what makes the behaviour testable rather than merely plausible.
 */

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D", "E"];

/** A stable 32-bit hash, so a question's shuffle depends on its own id too. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * A session seed. Random by default; the caller persists it (in the URL) so a
 * refresh reproduces the same session rather than dealing a new one.
 */
export function newSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

export function parseSeed(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n >>> 0 : undefined;
}

/**
 * Deal display letters to a question's options for one session.
 *
 * Derived from the session seed combined with the question id, so two
 * questions in the same session shuffle differently while the whole session
 * stays reproducible from a single number.
 */
export function presentOptions(
  question: Question,
  seed: number,
): PresentedOption[] {
  const order = shuffle(question.options, (seed ^ hash(question.id)) >>> 0);
  return order.map((option, i) => ({ ...option, key: OPTION_KEYS[i] }));
}

/** The letters the correct options were dealt, for display after answering. */
export function correctKeys(
  presented: readonly PresentedOption[],
  question: Question,
): OptionKey[] {
  return presented
    .filter((o) => question.correctOptionIds.includes(o.id))
    .map((o) => o.key);
}

/** Look up the letter an option was dealt. */
export function keyForOption(
  presented: readonly PresentedOption[],
  optionId: string,
): OptionKey | undefined {
  return presented.find((o) => o.id === optionId)?.key;
}

/**
 * Order questions for a session.
 *
 * `selectQuestions` has already chosen *which* questions on pedagogical
 * grounds — unseen first, weak domains pulled forward. This only decides the
 * order they are met in, so two sessions over the same material do not run in
 * the same sequence.
 */
export function presentQuestions(
  questions: readonly Question[],
  seed: number,
): Question[] {
  return shuffle(questions, seed);
}
