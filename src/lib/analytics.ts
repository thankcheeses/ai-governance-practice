import type { TrackId } from "@/content/types";
import { getQuestion, getTrackQuestions } from "@/content/registry";
import {
  DOMAIN_TITLES,
  domainOf,
  SUBDOMAINS,
  type DomainRoman,
  type SubdomainId,
} from "@/content/bok";
import type { Attempt, UserProgress } from "./types";

/**
 * Study analytics.
 *
 * A read-only calculation layer over attempts that already exist. Nothing here
 * writes, and nothing new is stored: an attempt's sub-domain is resolved from
 * its `questionId` through the content registry at read time. That matters for
 * more than tidiness — when a question is re-mapped during a future Body of
 * Knowledge revision, historical analytics correct themselves rather than
 * leaving stale sub-domains frozen in old rows.
 *
 * Every function is pure and takes progress as an argument, so the whole layer
 * is testable without a browser.
 */

/** Accuracy bands. The thresholds are the product's, not the authority's. */
export type Band = "strong" | "moderate" | "focus";

export const BAND_THRESHOLDS = { strong: 80, moderate: 60 } as const;

export function bandFor(accuracy: number): Band {
  if (accuracy >= BAND_THRESHOLDS.strong) return "strong";
  if (accuracy >= BAND_THRESHOLDS.moderate) return "moderate";
  return "focus";
}

export interface Slice {
  /** "I.A" for a sub-domain, or the domain name for a domain. */
  id: string;
  label: string;
  answered: number;
  correct: number;
  /** Whole percent. 0 when nothing has been answered — see `answered`. */
  accuracy: number;
  /** Questions in the bank for this slice, whether answered or not. */
  available: number;
  /** Distinct questions the learner has seen at least once. */
  seen: number;
  band: Band;
}

/**
 * Only count a slice as measured once there is enough evidence for the
 * percentage to mean something. One answer is not a 0% or a 100%.
 */
export const MIN_ATTEMPTS_FOR_SIGNAL = 3;

function summarise(
  id: string,
  label: string,
  attempts: Attempt[],
  available: number,
): Slice {
  const correct = attempts.filter((a) => a.correct).length;
  const accuracy = attempts.length
    ? Math.round((correct / attempts.length) * 100)
    : 0;
  return {
    id,
    label,
    answered: attempts.length,
    correct,
    accuracy,
    available,
    seen: new Set(attempts.map((a) => a.questionId)).size,
    band: bandFor(accuracy),
  };
}

/* ------------------------------------------------------------- overall -- */

export interface OverallStats {
  answered: number;
  correct: number;
  accuracy: number;
  /** Distinct questions seen, and how many exist. */
  seen: number;
  available: number;
  hasData: boolean;
}

export function overallStats(
  progress: UserProgress,
  trackId: TrackId = "aigp-preparation",
): OverallStats {
  const attempts = progress.attempts.filter((a) => a.trackId === trackId);
  const correct = attempts.filter((a) => a.correct).length;
  return {
    answered: attempts.length,
    correct,
    accuracy: attempts.length
      ? Math.round((correct / attempts.length) * 100)
      : 0,
    seen: new Set(attempts.map((a) => a.questionId)).size,
    available: getTrackQuestions(trackId).length,
    hasData: attempts.length > 0,
  };
}

/* -------------------------------------------------------------- slices -- */

export function domainSlices(
  progress: UserProgress,
  trackId: TrackId = "aigp-preparation",
): Slice[] {
  const questions = getTrackQuestions(trackId);
  const available = new Map<string, number>();
  for (const q of questions) {
    available.set(q.domain, (available.get(q.domain) ?? 0) + 1);
  }
  const attempts = progress.attempts.filter((a) => a.trackId === trackId);
  return Array.from(available.keys()).map((domain) =>
    summarise(
      domain,
      domain,
      attempts.filter((a) => a.domain === domain),
      available.get(domain) ?? 0,
    ),
  );
}

/**
 * Resolve an attempt's sub-domain through the registry. Returns undefined for
 * an attempt whose question no longer exists — content can be removed, and a
 * dangling id must not throw or silently land in the wrong bucket.
 */
export function subdomainOf(attempt: Attempt): string | undefined {
  return getQuestion(attempt.questionId)?.bokSubdomain;
}

export function subdomainSlices(
  progress: UserProgress,
  trackId: TrackId = "aigp-preparation",
): Slice[] {
  const questions = getTrackQuestions(trackId);
  const available = new Map<string, number>();
  for (const q of questions) {
    available.set(q.bokSubdomain, (available.get(q.bokSubdomain) ?? 0) + 1);
  }

  const byId = new Map<string, Attempt[]>();
  for (const attempt of progress.attempts) {
    if (attempt.trackId !== trackId) continue;
    const id = subdomainOf(attempt);
    if (!id) continue;
    byId.set(id, [...(byId.get(id) ?? []), attempt]);
  }

  // Ordered by the Body of Knowledge, not by score, so the shape of the
  // qualification stays legible even when the numbers move.
  return SUBDOMAINS.filter((s) => available.has(s.id)).map((s) =>
    summarise(s.id, s.competency, byId.get(s.id) ?? [], available.get(s.id) ?? 0),
  );
}

/**
 * The four Body of Knowledge domains, aggregated from their sub-domains.
 *
 * Deliberately computed from `bokSubdomain` rather than from the track's own
 * domain field. The two do not correspond one to one — a scenario can be filed
 * where a learner expects to find it while testing a competency from elsewhere
 * — so building the parent from its children is the only way the drill-down
 * adds up.
 */
export function bokDomainSlices(
  progress: UserProgress,
  trackId: TrackId = "aigp-preparation",
): (Slice & { roman: DomainRoman })[] {
  const children = subdomainSlices(progress, trackId);
  return (Object.keys(DOMAIN_TITLES) as DomainRoman[])
    .map((roman) => {
      const mine = children.filter((c) => domainOf(c.id) === roman);
      const answered = mine.reduce((n, c) => n + c.answered, 0);
      const correct = mine.reduce((n, c) => n + c.correct, 0);
      const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
      return {
        roman,
        id: roman,
        label: DOMAIN_TITLES[roman],
        answered,
        correct,
        accuracy,
        available: mine.reduce((n, c) => n + c.available, 0),
        seen: mine.reduce((n, c) => n + c.seen, 0),
        band: bandFor(accuracy),
      };
    })
    .filter((d) => d.available > 0);
}

/** Sub-domains belonging to one domain, for the drill-down. */
export function subdomainsForDomain(
  slices: Slice[],
  domainRoman: string,
): Slice[] {
  return slices.filter((s) => s.id.split(".")[0] === domainRoman);
}

/* --------------------------------------------------------- focus areas -- */

export interface FocusArea extends Slice {
  recommendation: string;
}

/**
 * The sub-domains worth studying next: below the moderate band, with enough
 * attempts behind them to mean something, weakest first.
 *
 * A sub-domain nobody has answered is not a weakness — it is unmeasured, and
 * recommending it would be indistinguishable from recommending at random.
 */
export function focusAreas(
  progress: UserProgress,
  trackId: TrackId = "aigp-preparation",
  limit = 3,
): FocusArea[] {
  return subdomainSlices(progress, trackId)
    .filter(
      (s) => s.answered >= MIN_ATTEMPTS_FOR_SIGNAL && s.band !== "strong",
    )
    .sort((a, b) => a.accuracy - b.accuracy || b.answered - a.answered)
    .slice(0, limit)
    .map((s) => ({
      ...s,
      recommendation:
        SUBDOMAINS.find((d) => d.id === s.id)?.recommendation ??
        "Review this area of the Body of Knowledge.",
    }));
}

/** The single strongest measured sub-domain, or undefined if none qualifies. */
export function strongestArea(
  progress: UserProgress,
  trackId: TrackId = "aigp-preparation",
): Slice | undefined {
  return subdomainSlices(progress, trackId)
    .filter((s) => s.answered >= MIN_ATTEMPTS_FOR_SIGNAL)
    .sort((a, b) => b.accuracy - a.accuracy || b.answered - a.answered)[0];
}

/** The single weakest measured sub-domain, or undefined if none qualifies. */
export function weakestArea(
  progress: UserProgress,
  trackId: TrackId = "aigp-preparation",
): Slice | undefined {
  return subdomainSlices(progress, trackId)
    .filter((s) => s.answered >= MIN_ATTEMPTS_FOR_SIGNAL)
    .sort((a, b) => a.accuracy - b.accuracy || b.answered - a.answered)[0];
}

/**
 * Question ids for a focused session over the learner's weakest sub-domains.
 *
 * Unseen questions come first so a drill teaches rather than re-tests, then
 * previously missed ones. Returns an empty array when nothing qualifies, which
 * the caller must treat as "no drill available" rather than "drill everything".
 */
export function weakAreaQuestionIds(
  progress: UserProgress,
  trackId: TrackId = "aigp-preparation",
  count = 15,
): string[] {
  const focus = focusAreas(progress, trackId);
  if (!focus.length) return [];

  const wanted = new Set(focus.map((f) => f.id));
  const lastResult = new Map<string, boolean>();
  for (const a of progress.attempts) lastResult.set(a.questionId, a.correct);

  const pool = getTrackQuestions(trackId).filter((q) =>
    wanted.has(q.bokSubdomain),
  );
  const unseen = pool.filter((q) => !lastResult.has(q.id));
  const missed = pool.filter((q) => lastResult.get(q.id) === false);
  const rest = pool.filter((q) => lastResult.get(q.id) === true);

  return [...unseen, ...missed, ...rest].slice(0, count).map((q) => q.id);
}

export type { DomainRoman, SubdomainId };
