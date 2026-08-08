import type {
  OptionKey,
  Question,
  QuestionOption,
  RawQuestion,
  RawScenario,
  Scenario,
} from "@/content/types";
import raw from "./questions.json";
import rawScenarios from "./scenarios.json";
import { AIGP_ENRICHMENT } from "./enrichment";

const TRACK_ID = "aigp-preparation" as const;

/** Source content authored 2025; enrichment layer added at integration. */
const CREATED_DATE = "2025-01-01T00:00:00.000Z";
const UPDATED_DATE = "2025-01-01T00:00:00.000Z";

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D", "E"];

function optionId(questionId: string, index: number): string {
  return `${questionId}-o${index + 1}`;
}

/**
 * Source options are prefixed with their letter ("A. Some text"). Strip the
 * prefix so the UI owns presentation, and give each option an identity tied to
 * its source position — the letter it is eventually shown under is decided per
 * session and is not part of the content.
 */
function normalizeOptions(
  questionId: string,
  options: string[],
): QuestionOption[] {
  return options.map((text, i) => ({
    id: optionId(questionId, i),
    text: text.replace(/^\s*[A-E][.)]\s*/, "").trim(),
  }));
}

/**
 * "A" for single-select, "A,C,D" for multi-select. Parsed here so the source
 * file keeps one readable convention and the rest of the app only ever sees a
 * normalised array.
 */
function normalizeCorrect(questionId: string, correct: string): string[] {
  return correct
    .split(",")
    .map((k) => OPTION_KEYS.indexOf(k.trim().toUpperCase() as OptionKey))
    .filter((i) => i >= 0)
    .map((i) => optionId(questionId, i));
}

/**
 * Fact patterns, by id. Several questions share one, so it is resolved once
 * here and attached by reference — the same object, not a copy per question.
 */
const SCENARIOS = new Map<string, Scenario>(
  (rawScenarios as RawScenario[]).map((s) => [s.id, s]),
);

export const aigpScenarios: Scenario[] = rawScenarios as RawScenario[];

/**
 * Distractor notes are authored against source letters, the same convention
 * `correct` uses, and converted to option ids here. Keying them by letter in
 * the file keeps the content readable; keying them by id in the app means the
 * per-session shuffle can never misattribute a note to the wrong option.
 */
function normalizeDistractorNotes(
  questionId: string,
  notes: Partial<Record<OptionKey, string>> | undefined,
): Record<string, string> | undefined {
  if (!notes) return undefined;
  const out: Record<string, string> = {};
  for (const [key, text] of Object.entries(notes)) {
    const index = OPTION_KEYS.indexOf(key as OptionKey);
    if (index >= 0 && text) out[optionId(questionId, index)] = text;
  }
  return Object.keys(out).length ? out : undefined;
}

function normalize(item: RawQuestion): Question {
  const id = `aigp-${String(item.id).padStart(3, "0")}`;
  const enrichment = AIGP_ENRICHMENT[item.id];
  if (!enrichment) {
    throw new Error(
      `Missing enrichment metadata for aigp-preparation question ${item.id}`,
    );
  }

  // A dangling scenario reference would render a question stripped of the facts
  // it depends on, which is worse than failing the build.
  const scenario = item.scenarioId ? SCENARIOS.get(item.scenarioId) : undefined;
  if (item.scenarioId && !scenario) {
    throw new Error(
      `Question ${item.id} references unknown scenario ${item.scenarioId}`,
    );
  }

  const distractorNotes = normalizeDistractorNotes(
    id,
    enrichment.distractorNotes,
  );

  return {
    id,
    trackId: TRACK_ID,
    domain: item.domain,
    difficulty: enrichment.difficulty,
    question: item.question,
    options: normalizeOptions(id, item.options),
    correctOptionIds: normalizeCorrect(id, item.correct),
    rationale: item.rationale,
    keyTakeaway: enrichment.keyTakeaway,
    // Omitted entirely when no diagram is supplied, so `visualAid` is either
    // a complete aid or absent — never a half-populated object.
    ...(enrichment.visualAid ? { visualAid: enrichment.visualAid } : {}),
    ...(scenario ? { scenario } : {}),
    ...(distractorNotes ? { distractorNotes } : {}),
    ...(enrichment.sources ? { sources: enrichment.sources } : {}),
    frameworkTags: enrichment.frameworkTags,
    bokSubdomain: enrichment.bokSubdomain,
    tags: item.tags ?? [],
    createdDate: CREATED_DATE,
    updatedDate: UPDATED_DATE,
  };
}

export const aigpQuestions: Question[] = (raw as RawQuestion[]).map(normalize);

/** Domains are derived from the content itself — never hardcoded. */
export const aigpDomains: string[] = Array.from(
  new Set(aigpQuestions.map((q) => q.domain)),
);
