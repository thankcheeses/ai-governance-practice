import {
  DOMAIN_BLUEPRINT,
  DOMAIN_TITLES,
  domainOf,
  type DomainRoman,
} from "@/content/bok";
import { getTrackQuestions } from "@/content/registry";
import type { TrackId } from "@/content/types";

/**
 * Apportioning a practice drill to the published exam blueprint.
 *
 * The blueprint publishes a *range* of question counts per domain, not a
 * percentage and not a single number. Two things follow, and both are the whole
 * reason this module exists rather than a few lines inline:
 *
 * A drill of 25 questions cannot be "the blueprint" — the blueprint describes
 * an exam of 77 to 93. What it can be is a drill whose *shape* matches: the
 * same relative emphasis between domains. That means reducing each published
 * range to one number, and the honest reduction is the midpoint, labelled as a
 * midpoint wherever a learner or reader might otherwise read it as published.
 *
 * And the bank is finite. Asking for eight questions from a domain that has six
 * unseen ones left is a real situation, and the answer is to say so rather than
 * quietly repeat questions or quietly hand back a different shape. Every
 * function here reports shortfall as data, not as an exception.
 *
 * This does not correct any imbalance in the bank. The bank's own distribution
 * is close to the blueprint already; what this offers is sampling *to* the
 * published ranges, which is a different and smaller claim.
 */

const ROMANS: DomainRoman[] = ["I", "II", "III", "IV"];

/** Midpoint of a published range. Derived here, never stored as a weight. */
export function midpointOf(roman: DomainRoman): number {
  const { min, max } = DOMAIN_BLUEPRINT[roman];
  return (min + max) / 2;
}

export interface DomainAllocation {
  roman: DomainRoman;
  title: string;
  /** Questions this drill wants from the domain. */
  target: number;
  /** Questions the bank can actually supply. */
  available: number;
  /** What the drill will really contain — min(target, available). */
  allocated: number;
  /** target - allocated, zero when the bank can satisfy the request. */
  shortfall: number;
  published: { min: number; max: number };
}

export interface BlueprintPlan {
  requested: number;
  /** Sum of `allocated`, which is short of `requested` when the bank runs out. */
  total: number;
  allocations: DomainAllocation[];
  /** Question ids to draw from, grouped by domain, in blueprint order. */
  idsByDomain: Record<DomainRoman, string[]>;
  /** True when any domain could not be filled. */
  short: boolean;
}

/**
 * Questions belonging to each Body of Knowledge domain.
 *
 * Keyed off `bokSubdomain` rather than the track's own `domain` field, matching
 * how analytics builds its domain rollup: an item can be filed under one domain
 * while testing a competency from another, and the sub-domain is the assignment
 * that was made deliberately.
 */
export function questionsByDomain(
  trackId: TrackId = "aigp-preparation",
): Record<DomainRoman, string[]> {
  const out: Record<DomainRoman, string[]> = { I: [], II: [], III: [], IV: [] };
  for (const q of getTrackQuestions(trackId)) {
    const roman = domainOf(q.bokSubdomain);
    if (roman) out[roman].push(q.id);
  }
  return out;
}

/**
 * Apportion `requested` questions across the four domains.
 *
 * Largest-remainder rounding, so the parts sum to exactly the request rather
 * than to 24 or 26 after four independent roundings. Where two domains have the
 * same remainder — III and IV share a published range, so this is the normal
 * case rather than a tie-break curiosity — blueprint order decides, which keeps
 * the result stable between runs instead of depending on sort order.
 */
export function planDrill(
  requested: number,
  trackId: TrackId = "aigp-preparation",
): BlueprintPlan {
  const idsByDomain = questionsByDomain(trackId);
  const weights = ROMANS.map(midpointOf);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const exact = ROMANS.map((_, i) => (weights[i] / totalWeight) * requested);
  const floors = exact.map(Math.floor);
  let remainder = requested - floors.reduce((a, b) => a + b, 0);

  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  const targets = [...floors];
  for (const { i } of order) {
    if (remainder <= 0) break;
    targets[i]++;
    remainder--;
  }

  const allocations: DomainAllocation[] = ROMANS.map((roman, i) => {
    const available = idsByDomain[roman].length;
    const target = targets[i];
    const allocated = Math.min(target, available);
    return {
      roman,
      title: DOMAIN_TITLES[roman],
      target,
      available,
      allocated,
      shortfall: target - allocated,
      published: DOMAIN_BLUEPRINT[roman],
    };
  });

  return {
    requested,
    total: allocations.reduce((n, a) => n + a.allocated, 0),
    allocations,
    idsByDomain,
    short: allocations.some((a) => a.shortfall > 0),
  };
}

/**
 * A short statement of any shortfall, or null when the bank satisfied the plan.
 *
 * Deliberately terse. The only place this reaches a learner is the session
 * label, which is rendered with `truncate` — a full sentence would be cut off
 * mid-clause and the shortfall would go unsaid, which is the precise outcome
 * stating it is meant to prevent. So it reports the numbers and the domains and
 * nothing else.
 *
 * Returned rather than thrown: a drill three questions short is still a useful
 * drill. The learner is owed the fact, not an error.
 */
export function shortfallNote(plan: BlueprintPlan): string | null {
  const short = plan.allocations.filter((a) => a.shortfall > 0);
  if (!short.length) return null;
  const romans = short.map((a) => a.roman);
  const where =
    romans.length === 1
      ? romans[0]
      : `${romans.slice(0, -1).join(", ")} and ${romans[romans.length - 1]}`;
  const noun = romans.length === 1 ? "Domain" : "Domains";
  return `${plan.total} of ${plan.requested} — bank short in ${noun} ${where}`;
}
