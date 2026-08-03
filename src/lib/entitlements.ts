import type { Question, TrackId } from "@/content/types";
import { getTrackQuestions } from "@/content/registry";
import type { Tier } from "./types";

/**
 * Feature gating.
 *
 * Gating lives in one module so nothing else branches on tier inline. There is
 * no payment integration — `tier` is a field on the profile and /upgrade
 * explains what each plan covers.
 *
 * Only Free and Pro are *enforceable* today, so only they exist in `Tier` and
 * in the database. Lab and Enterprise are described on the upgrade screen as
 * roadmap plans (see PLANS below) but are not modelled as runtime states —
 * inventing tiers with nothing to gate would be dead code.
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
  /** Free practises across domains but cannot filter to one. */
  domainFiltering: boolean;
  /** Scenario questions carrying diagrams are a Pro surface. */
  visualScenarios: boolean;
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
      visualScenarios: true,
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
    visualScenarios: false,
  };
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

export type PlanStatus = "current" | "available" | "planned";

export interface Plan {
  id: string;
  name: string;
  price: string;
  /** What the plan is for, in one line. */
  premise: string;
  features: string[];
  status: PlanStatus;
}

/**
 * Plans as presented on /upgrade.
 *
 * The value story is mental models and simulations, not question volume — the
 * copy is written to say that explicitly, because "more questions" is the wrong
 * reason to upgrade and sets the wrong expectation for Lab.
 */
export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    premise: "See how the scenarios work before committing.",
    features: [
      `First ${FREE_QUESTION_LIMIT} scenarios`,
      "Full rationale on every answer",
      "Key takeaway on every answer",
      "Basic progress tracking",
    ],
    status: "available",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19–39",
    premise: "Work the full track and retain what you learn.",
    features: [
      "Full scenario library",
      "SM-2 spaced repetition",
      "Prioritised review queue",
      "Domain analytics and weak-area detection",
      "Visual scenario questions",
    ],
    status: "available",
  },
  {
    id: "lab",
    name: "Lab",
    price: "$99–299",
    premise:
      "Applied simulations in the domains where governance decisions get hard.",
    features: [
      "Healthcare AI governance scenarios",
      "Voice AI governance scenarios",
      "Agent governance simulations",
      "Certificate of completion",
    ],
    status: "planned",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Contact us",
    premise: "Train a governance function, not one practitioner.",
    features: [
      "Team training programmes",
      "Organisation dashboards",
      "Cohort progress visibility",
      "Organisation-specific scenarios",
    ],
    status: "planned",
  },
];
