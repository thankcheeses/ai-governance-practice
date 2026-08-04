import type { Question, TrackId } from "@/content/types";
import { getTrackQuestions } from "@/content/registry";
import { AVAILABLE_LABS } from "@/content/labs";
import type { Tier } from "./types";

/**
 * Feature gating — the single place tier is interpreted.
 *
 * Rules for keeping it that way:
 *  - Components read booleans off `entitlements`, never compare tier strings.
 *  - Adding a gated feature means adding a field here, not an `if` in a page.
 *  - There is no payment integration; `tier` is a field on the profile and
 *    /upgrade explains what each plan covers.
 *
 * Plans are cumulative: lab ⊇ pro ⊇ free.
 */

export const FREE_QUESTION_LIMIT = 20;

export interface Entitlements {
  tier: Tier;
  /** How many questions of the track the learner may reach; null = all. */
  questionLimit: number | null;
  fullLibrary: boolean;
  spacedRepetition: boolean;
  reviewQueue: boolean;
  advancedAnalytics: boolean;
  /** Free practises across domains but cannot filter to one. */
  domainFiltering: boolean;
  /** Scenario questions carrying diagrams. */
  visualScenarios: boolean;
  /** Applied labs. True on the lab plan, but gated again on content existing. */
  labs: boolean;
}

const FREE: Omit<Entitlements, "tier"> = {
  questionLimit: FREE_QUESTION_LIMIT,
  fullLibrary: false,
  spacedRepetition: false,
  reviewQueue: false,
  advancedAnalytics: false,
  domainFiltering: false,
  visualScenarios: false,
  labs: false,
};

const PRO: Omit<Entitlements, "tier"> = {
  questionLimit: null,
  fullLibrary: true,
  spacedRepetition: true,
  reviewQueue: true,
  advancedAnalytics: true,
  domainFiltering: true,
  visualScenarios: true,
  labs: false,
};

const LAB: Omit<Entitlements, "tier"> = {
  ...PRO,
  labs: true,
};

export function entitlementsFor(tier: Tier): Entitlements {
  switch (tier) {
    case "lab":
      return { tier, ...LAB };
    case "pro":
      return { tier, ...PRO };
    default:
      return { tier: "free", ...FREE };
  }
}

/**
 * Whether a lab is actually openable. Entitlement alone is not enough — a lab
 * plan with no shipped content still has nothing to open, and this keeps that
 * truth in one expression rather than in a component.
 */
export function canOpenLabs(tier: Tier): boolean {
  return entitlementsFor(tier).labs && AVAILABLE_LABS.length > 0;
}

/**
 * The questions a tier may reach. Free gets the first N in track order, so the
 * free experience is a coherent run rather than a random sample.
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

/* ------------------------------------------------------------------ */
/* Plan presentation                                                   */
/* ------------------------------------------------------------------ */

export type PlanStatus = "available" | "planned";

export interface Plan {
  id: Tier;
  name: string;
  price: string;
  priceNote?: string;
  /** What the plan is for, in one line. */
  premise: string;
  features: string[];
  status: PlanStatus;
}

/**
 * Plans as presented on /upgrade.
 *
 * The value story is judgment training, not question volume — the copy says so
 * directly, because "more questions" is the wrong reason to upgrade and sets
 * the wrong expectation for what Lab will be.
 */
export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    premise: "Work real scenarios before deciding whether to go further.",
    features: [
      `${FREE_QUESTION_LIMIT} scenarios`,
      "Full rationale on every answer",
      "Key takeaway on every answer",
      "Basic progress tracking",
    ],
    status: "available",
  },
  {
    id: "pro",
    name: "AI Governance Pro",
    price: "$19–39",
    priceNote: "One-time unlock",
    premise: "The full track, with the review system that makes it stick.",
    features: [
      "Complete scenario library",
      "Adaptive review with SM-2 scheduling",
      "Advanced analytics and weak-domain analysis",
      "Visual learning aids",
      "Unlimited practice",
    ],
    status: "available",
  },
  {
    id: "lab",
    name: "Lab",
    price: "$99–299",
    priceNote: "Coming later",
    premise:
      "Applied simulations in the domains where governance decisions get hard.",
    features: [
      "Case studies and practitioner scenarios",
      "Decision trees and architecture walkthroughs",
      "Domain simulations",
      "Certificate of completion",
    ],
    status: "planned",
  },
];
