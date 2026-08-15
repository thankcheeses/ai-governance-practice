import { getQuestion } from "@/content/registry";
import { isMultiSelect } from "@/lib/grading";
import type { Question } from "@/content/types";

/**
 * The one question the public entry demonstrates.
 *
 * Fixed rather than random, for three reasons: a visitor and whoever sent them
 * should see the same thing, the option order must be identical on the server
 * and the client or React discards the markup and rehydrates, and a
 * deterministic sample is the only kind that can be reviewed before it is
 * shown to people who have not agreed to anything yet.
 *
 * `aigp-052` is single-select, sits in Foundations, and turns on
 * transparency in a resume-screening tool. Its three distractors are all
 * genuine responsible-AI principles rather than eliminable filler, and hiring
 * is legible to a visitor with no governance background — both of which matter
 * more here than in the bank generally, because this item has to teach
 * something to someone who arrived by accident.
 */
export const SAMPLE_QUESTION_ID = "aigp-052";

/**
 * A fixed seed, deliberately not `newSeed()`.
 *
 * `newSeed()` calls `Math.random`, which would deal a different option order
 * on the server than in the browser and produce a hydration mismatch on the
 * app's most public route.
 */
export const SAMPLE_SEED = 20260815;

/**
 * Resolve the sample, failing loudly in development if the bank has moved
 * underneath it.
 *
 * A retired id or an item that became multi-select would otherwise surface as
 * a blank landing page or a demo whose submit button never enables — both of
 * which are easy to ship and hard to notice. In production it returns
 * `undefined` and the caller falls back, because a missing sample is not worth
 * taking the front page down for.
 */
export function sampleQuestion(): Question | undefined {
  const question = getQuestion(SAMPLE_QUESTION_ID);

  if (process.env.NODE_ENV !== "production") {
    if (!question) {
      throw new Error(
        `Landing sample ${SAMPLE_QUESTION_ID} is not in the question bank. ` +
          `Pick another single-select item and update SAMPLE_QUESTION_ID.`,
      );
    }
    if (isMultiSelect(question)) {
      throw new Error(
        `Landing sample ${SAMPLE_QUESTION_ID} is multi-select. The demo is ` +
          `built for a single-select item; pick another one.`,
      );
    }
  }

  return question;
}
