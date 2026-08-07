import {
  aigpDomains,
  aigpQuestions,
} from "./tracks/aigp-preparation";
import type { Difficulty, FrameworkTag, Question, Track, TrackId } from "./types";

/**
 * Track registry — the single place a new learning track is wired in.
 *
 * Only tracks with `status: "active"` are surfaced to users. Planned tracks are
 * declared here so routing, progress scoping, and analytics already understand
 * them, but they render nowhere until they have content. No placeholder pages.
 */

const TRACKS: Track[] = [
  {
    id: "aigp-preparation",
    name: "AIGP Preparation",
    summary:
      "Build practical governance judgment across AI foundations, laws and frameworks, development, and deployment.",
    /*
     * Version currency is the thing a study tool is easiest to be quietly
     * wrong about, so the structure this track was written against is named
     * explicitly, and the coverage claim is computed rather than asserted.
     *
     * Every question carries a `bokSubdomain` in the enrichment sidecar,
     * assigned by reading it against the published performance indicators.
     * `npm run check:bok` derives coverage from those tags and fails if any
     * sub-domain has no questions — so the sentence below cannot outlive the
     * fact it describes. See docs/bok-maintenance.md for the matrix.
     *
     * The three context* fields below move only when the check is genuinely
     * repeated, and only on one of the triggers in that document. There is no
     * review cadence here on purpose: the authority sets its own revision
     * schedule, and inventing a calendar would be a claim about someone
     * else's process.
     */
    context:
      "The four domains below follow the IAPP's AIGP Body of Knowledge, version 2.1 (effective 2 February 2026). Every one of its thirteen sub-domains has at least one scenario here, though the number per sub-domain does not mirror the exam's own weighting — the IAPP's published Body of Knowledge remains the authority on what the exam tests. Every scenario is original material written for this track. AIGP is a certification mark of the IAPP; this product is independent of the IAPP and is not affiliated with, endorsed by, or approved by it.",
    contextAuthority: "IAPP AIGP Body of Knowledge",
    contextVersion: "v2.1",
    contextReviewed: "2026-08-07",
    contextCoverage: "13/13 sub-domains",
    status: "active",
    domains: aigpDomains,
    questionCount: aigpQuestions.length,
  },
];

const QUESTIONS_BY_TRACK: Record<string, Question[]> = {
  "aigp-preparation": aigpQuestions,
};

export const ACTIVE_TRACKS = TRACKS.filter((t) => t.status === "active");

/** The track a learner is in today. Multi-track selection lands with track two. */
export const DEFAULT_TRACK_ID: TrackId = "aigp-preparation";

export function getTrack(trackId: TrackId = DEFAULT_TRACK_ID): Track {
  const track = TRACKS.find((t) => t.id === trackId);
  if (!track) throw new Error(`Unknown track: ${trackId}`);
  return track;
}

export function getTrackQuestions(trackId: TrackId = DEFAULT_TRACK_ID): Question[] {
  return QUESTIONS_BY_TRACK[trackId] ?? [];
}

/** Every question across active tracks, for lookups that are track-agnostic. */
export const ALL_QUESTIONS: Question[] = ACTIVE_TRACKS.flatMap((t) =>
  getTrackQuestions(t.id),
);

const BY_ID = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

export function getQuestion(id: string): Question | undefined {
  return BY_ID.get(id);
}

export function getQuestions(ids: readonly string[]): Question[] {
  return ids
    .map((id) => BY_ID.get(id))
    .filter((q): q is Question => Boolean(q));
}

export function questionsByDomain(
  domain: string,
  trackId: TrackId = DEFAULT_TRACK_ID,
): Question[] {
  return getTrackQuestions(trackId).filter((q) => q.domain === domain);
}

export function questionsByDifficulty(
  difficulty: Difficulty,
  trackId: TrackId = DEFAULT_TRACK_ID,
): Question[] {
  return getTrackQuestions(trackId).filter((q) => q.difficulty === difficulty);
}

export function questionsByFrameworkTag(
  tag: FrameworkTag,
  trackId: TrackId = DEFAULT_TRACK_ID,
): Question[] {
  return getTrackQuestions(trackId).filter((q) => q.frameworkTags.includes(tag));
}

/** Domain counts for the study picker, derived from content. */
export function domainBreakdown(
  trackId: TrackId = DEFAULT_TRACK_ID,
): { domain: string; count: number }[] {
  const questions = getTrackQuestions(trackId);
  const counts = new Map<string, number>();
  for (const q of questions) {
    counts.set(q.domain, (counts.get(q.domain) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([domain, count]) => ({
    domain,
    count,
  }));
}

/** Framework tags actually present in a track's content. */
export function frameworkTagsInTrack(
  trackId: TrackId = DEFAULT_TRACK_ID,
): FrameworkTag[] {
  return Array.from(
    new Set(getTrackQuestions(trackId).flatMap((q) => q.frameworkTags)),
  );
}
