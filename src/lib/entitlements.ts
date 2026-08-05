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

/**
 * Everything is unlocked while the beta runs.
 *
 * There is no billing integration, so tier gating cannot be lifted by paying —
 * it can only lock people out of a product they have no way to buy. Gating 62
 * of 82 scenarios behind an unpurchasable plan makes the app a demo rather than
 * a study tool.
 *
 * Set to false when a purchase path exists. Nothing else needs to change: the
 * tier plumbing, the entitlement fields, and the plan presentation all stay as
 * they are, so this is one line to reverse.
 */
export const BETA_ALL_ACCESS = true;

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
  // During the beta every tier resolves to full access. The tier itself is
  // still carried and still displayed, so flipping BETA_ALL_ACCESS off restores
  // gating without touching any caller.
  if (BETA_ALL_ACCESS) {
    const resolved: Tier = tier === "lab" || tier === "pro" ? tier : "free";
    return { tier: resolved, ...PRO };
  }

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
  /** Presentation id. Not a Tier — Enterprise has no tier until it ships. */
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  /** The entitlement tier this plan grants, where one exists. */
  tier?: Tier;
  /** What the plan is for, in one line. */
  premise: string;
  /** Features live today. Never list anything unbuilt here. */
  features: string[];
  /** Named but not yet built. Rendered as "coming soon" so nothing overclaims. */
  comingSoon?: string[];
  /** Shows the sales address. Only true for plans sold by conversation. */
  contactSales?: boolean;
  status: PlanStatus;
}

/**
 * Plans as presented on /upgrade.
 *
 * Two rules, both load-bearing for store review:
 *  - `features` lists only what is built and reachable today. Anything named
 *    but unbuilt goes in `comingSoon` and renders as such.
 *  - No plan implies a purchase is possible. Billing is not wired, and the
 *    screen says so rather than showing a checkout that cannot complete.
 */
export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    tier: "free",
    premise: "Work real scenarios before deciding whether to go further.",
    features: [
      `${FREE_QUESTION_LIMIT} governance scenarios`,
      "Basic learning tracks",
      "Full rationale on every answer",
      "Key takeaway on every answer",
      "Personal progress tracking",
    ],
    status: "available",
  },
  {
    id: "professional",
    name: "Professional",
    price: "$19",
    // Billing is not implemented. The plan is marked planned so the card reads
    // "Coming soon" rather than implying it can be bought today — an app store
    // will reject a paid tier that cannot actually be purchased.
    priceNote: "per month at launch",
    tier: "pro",
    premise: "The full library, with the review system that makes it stick.",
    features: [
      "Full scenario library",
      "Progress analytics and weak-domain breakdown",
      "Governance assessments across every domain",
      "Adaptive review scheduling",
      "Visual scenario diagrams",
      "Practice by domain",
    ],
    status: "planned",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Contact sales",
    premise: "Roll governance training out across a team and see where it lands.",
    contactSales: true,
    features: [],
    comingSoon: [
      "Team access and seat management",
      "Administrator controls",
      "Team reporting and completion tracking",
      "Consolidated billing",
    ],
    status: "planned",
  },
];
