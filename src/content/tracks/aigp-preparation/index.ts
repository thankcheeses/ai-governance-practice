import type {
  OptionKey,
  Question,
  QuestionOption,
  RawQuestion,
} from "@/content/types";
import raw from "./questions.json";
import { AIGP_ENRICHMENT } from "./enrichment";

const TRACK_ID = "aigp-preparation" as const;

/** Source content authored 2025; enrichment layer added at integration. */
const CREATED_DATE = "2025-01-01T00:00:00.000Z";
const UPDATED_DATE = "2025-01-01T00:00:00.000Z";

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D", "E"];

/**
 * Source options are prefixed with their letter ("A. Some text"). Strip the
 * prefix so the UI owns presentation, and key each option by position so
 * scoring never depends on the label surviving a render.
 */
function normalizeOptions(options: string[]): QuestionOption[] {
  return options.map((text, i) => ({
    key: OPTION_KEYS[i],
    text: text.replace(/^\s*[A-E][.)]\s*/, "").trim(),
  }));
}

/**
 * "A" for single-select, "A,C,D" for multi-select. Parsed here so the source
 * file keeps one readable convention and the rest of the app only ever sees a
 * normalised array.
 */
function normalizeCorrect(correct: string): OptionKey[] {
  return correct
    .split(",")
    .map((k) => k.trim().toUpperCase())
    .filter(Boolean) as OptionKey[];
}

function normalize(item: RawQuestion): Question {
  const enrichment = AIGP_ENRICHMENT[item.id];
  if (!enrichment) {
    throw new Error(
      `Missing enrichment metadata for aigp-preparation question ${item.id}`,
    );
  }

  return {
    id: `aigp-${String(item.id).padStart(3, "0")}`,
    trackId: TRACK_ID,
    domain: item.domain,
    difficulty: enrichment.difficulty,
    question: item.question,
    options: normalizeOptions(item.options),
    correctAnswers: normalizeCorrect(item.correct),
    rationale: item.rationale,
    keyTakeaway: enrichment.keyTakeaway,
    // Omitted entirely when no diagram is supplied, so `visualAid` is either
    // a complete aid or absent — never a half-populated object.
    ...(enrichment.visualAid ? { visualAid: enrichment.visualAid } : {}),
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
