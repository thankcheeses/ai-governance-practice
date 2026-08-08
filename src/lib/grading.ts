import type { Question } from "@/content/types";

/**
 * Answer grading.
 *
 * Extracted as pure functions with no React and no storage so the rule that
 * decides whether a learner was right can be tested directly. Everything that
 * records an answer routes through `gradeAnswer`; nothing compares option keys
 * by hand.
 *
 * Selections are option ids, never display letters: options are shuffled per
 * session, so a letter says where something landed on one screen and nothing
 * more.
 *
 * Multi-select is **all-or-nothing**. Selecting three of four correct options
 * scores the same as selecting none: wrong. That mirrors how the certification
 * exam treats multi-select — no partial credit — and, more importantly, it is
 * the honest reading of a question that asks which controls together address a
 * risk. A partly-correct set of controls is a gap, not a near miss.
 */

/** True when the question expects more than one option to be selected. */
export function isMultiSelect(question: Question): boolean {
  return question.correctOptionIds.length > 1;
}

/**
 * How many options the learner must choose. Shown in the prompt so the
 * requirement is stated before answering rather than discovered after.
 */
export function requiredSelections(question: Question): number {
  return question.correctOptionIds.length;
}

/**
 * All-or-nothing set equality. Order never matters; duplicates in the input
 * are ignored rather than treated as extra selections, because a double tap is
 * a UI event, not an answer.
 */
export function gradeAnswer(
  question: Question,
  selectedOptionIds: readonly string[],
): boolean {
  const chosen = new Set(selectedOptionIds);
  const expected = new Set(question.correctOptionIds);
  if (chosen.size !== expected.size) return false;
  for (const key of expected) {
    if (!chosen.has(key)) return false;
  }
  return true;
}

/**
 * Toggle one option within a selection, honouring the question's arity.
 *
 * Single-select replaces; multi-select adds or removes. Kept here rather than
 * in the component so selection behaviour and grading cannot drift apart.
 */
export function toggleSelection(
  question: Question,
  current: readonly string[],
  optionId: string,
): string[] {
  if (!isMultiSelect(question)) {
    return current.length === 1 && current[0] === optionId ? [] : [optionId];
  }
  return current.includes(optionId)
    ? current.filter((id) => id !== optionId)
    : [...current, optionId];
}

/** Canonical display order for a set of letters, e.g. ["C","A"] → "A, C". */
export function formatAnswer(keys: readonly string[]): string {
  return [...keys].sort().join(", ");
}

/**
 * Whether an answer is complete enough to submit.
 *
 * Multi-select requires exactly the stated number of choices. Letting someone
 * submit two when the prompt says three would guarantee a wrong answer under
 * all-or-nothing grading, which is a interface failure rather than a knowledge
 * one.
 */
export function canSubmit(
  question: Question,
  selected: readonly string[],
): boolean {
  return isMultiSelect(question)
    ? selected.length === requiredSelections(question)
    : selected.length === 1;
}
