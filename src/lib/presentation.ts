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
  return groupScenarioFamilies(shuffle(questions, seed));
}

/**
 * Pull questions sharing a fact pattern next to each other.
 *
 * Every scenario question is gradable on its own — the fact pattern travels
 * with each one — so this is not a correctness requirement. It is a reading
 * requirement: meeting three questions about the same 400-word scenario at
 * positions 2, 7 and 9 makes a learner re-read it three times, and breaks the
 * case-study rhythm the format exists to create.
 *
 * The family lands where its first member fell, so the shuffle still decides
 * position and the result stays a pure function of the seed. Within a family,
 * source order is restored: the questions were authored to be met in that
 * sequence, and none of them depends on another's answer.
 */
export function groupScenarioFamilies(
  questions: readonly Question[],
): Question[] {
  const out: Question[] = [];
  const placed = new Set<string>();

  for (const question of questions) {
    if (placed.has(question.id)) continue;

    if (!question.scenario) {
      out.push(question);
      placed.add(question.id);
      continue;
    }

    const family = questions
      .filter((q) => q.scenario?.id === question.scenario!.id)
      .sort((a, b) => a.id.localeCompare(b.id));
    for (const member of family) {
      out.push(member);
      placed.add(member.id);
    }
  }

  return out;
}
