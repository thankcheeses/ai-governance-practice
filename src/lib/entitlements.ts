import type { Question, TrackId } from "@/content/types";
import { getTrackQuestions } from "@/content/registry";
import type { Tier } from "./types";

/**
 * Feature gating.
 *
 * Gating is enforced in one place so the rest of the app never branches on
 * tier inline. There is no payment integration yet — `tier` is simply a field
 * on the profile, and /upgrade explains what Pro will unlock.
 */

export const FREE_QUESTION_LIMIT = 20;

export interface Entitlements {
  tier: Tier;
  /** How many questions of the track the learner may reach. */
  questionLimit: number | null;
  fullLibrary: boolean;
  spacedRepetition: boolean;
  reviewQueue: boolean;
  advancedAnalytics: boolean;
  /** Free tier practises across domains but cannot filter to one. */
  domainFiltering: boolean;
}

export function entitlementsFor(tier: Tier): Entitlements {
  if (tier === "pro") {
    return {
      tier,
      questionLimit: null,
      fullLibrary: true,
      spacedRepetition: true,
      reviewQueue: true,
      advancedAnalytics: true,
      domainFiltering: true,
    };
  }

  return {
    tier,
    questionLimit: FREE_QUESTION_LIMIT,
    fullLibrary: false,
    spacedRepetition: false,
    reviewQueue: false,
    advancedAnalytics: false,
    domainFiltering: false,
  };
}

/**
 * The questions a tier may reach. Free tier gets the first N in track order,
 * so the free experience is a coherent run rather than a random sample.
 */
export function availableQuestions(
  tier: Tier,
  trackId: TrackId = "aigp-preparation",
): Question[] {
  const all = getTrackQuestions(trackId);
  const limit = entitlementsFor(tier).questionLimit;
  return limit === null ? all : all.slice(0, limit);
}

export function isQuestionAvailable(
  tier: Tier,
  questionId: string,
  trackId: TrackId = "aigp-preparation",
): boolean {
  return availableQuestions(tier, trackId).some((q) => q.id === questionId);
}

export const PRO_FEATURES = [
  {
    title: "Full question library",
    body: "All 50 scenario-based questions across every domain, rather than the first 20.",
  },
  {
    title: "Full spaced repetition",
    body: "SM-2 scheduling across the whole library, so every item you miss comes back at the right interval.",
  },
  {
    title: "Review queue",
    body: "A prioritised daily queue built from missed questions, low-confidence answers, and due reviews.",
  },
  {
    title: "Advanced analytics",
    body: "Per-domain accuracy trends, mastery counts, and weak-domain identification.",
  },
  {
    title: "Domain practice",
    body: "Filter study sessions to a single domain to close a specific gap.",
  },
];
