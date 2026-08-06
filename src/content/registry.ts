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
    context:
      "The four domains below follow the subject areas the IAPP publishes for the AIGP certification, so study here maps onto the ground that exam covers. Every scenario is original material written for this track. AIGP is a certification mark of the IAPP; this product is independent of the IAPP and is not affiliated with, endorsed by, or approved by it.",
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
