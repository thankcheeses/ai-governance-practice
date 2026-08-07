import type { SupabaseClient } from "@supabase/supabase-js";
import type { Difficulty, OptionKey, TrackId } from "@/content/types";
import {
  emptyProgress,
  type Attempt,
  type Confidence,
  type ReviewCard,
  type StudyMode,
  type UserProgress,
} from "@/lib/types";

/**
 * Mapping between the client's UserProgress shape and the Supabase tables.
 * Kept in one module so no component or store ever touches column names.
 */

interface AttemptRow {
  id: string;
  track_id: string;
  question_id: string;
  selected: string;
  correct: boolean;
  response_time_ms: number;
  difficulty: string;
  domain: string;
  confidence: string | null;
  mode: string;
  created_at: string;
}

interface ReviewCardRow {
  question_id: string;
  track_id: string;
  repetitions: number;
  ease_factor: number | string;
  interval_days: number;
  next_review_date: string;
  last_reviewed_at: string;
  lapses: number;
}

export async function loadProgress(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserProgress> {
  const [profile, attempts, cards] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("attempts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(5000),
    supabase.from("review_cards").select("*").eq("user_id", userId),
  ]);

  const base = emptyProgress();
  const p = profile.data;

  const mappedAttempts: Attempt[] = ((attempts.data ?? []) as AttemptRow[]).map(
    (row) => ({
      id: row.id,
      trackId: row.track_id as TrackId,
      questionId: row.question_id,
      selected: row.selected.split(",").filter(Boolean) as OptionKey[],
      correct: row.correct,
      responseTimeMs: row.response_time_ms,
      difficulty: row.difficulty as Difficulty,
      domain: row.domain,
      confidence: (row.confidence as Confidence | null) ?? null,
      createdAt: row.created_at,
      mode: row.mode as StudyMode,
    }),
  );

  const reviewCards: Record<string, ReviewCard> = {};
  for (const row of (cards.data ?? []) as ReviewCardRow[]) {
    reviewCards[row.question_id] = {
      questionId: row.question_id,
      trackId: row.track_id as TrackId,
      repetitions: row.repetitions,
      easeFactor: Number(row.ease_factor),
      interval: row.interval_days,
      nextReviewDate: new Date(row.next_review_date).toISOString(),
      lastReviewedAt: row.last_reviewed_at,
      lapses: row.lapses,
    };
  }

  return {
    ...base,
    trackId: (p?.active_track_id ?? base.trackId) as TrackId,
    onboardingCompletedAt: p?.onboarding_completed_at ?? null,
    disclaimerAckedAt: p?.disclaimer_acked_at ?? null,
    dailyGoal: p?.daily_goal ?? base.dailyGoal,
    streak: p?.streak ?? 0,
    longestStreak: p?.longest_streak ?? 0,
    lastStudyDate: p?.last_study_date
      ? new Date(p.last_study_date).toISOString()
      : null,
    attempts: mappedAttempts,
    reviewCards,
    updatedAt: new Date().toISOString(),
  };
}

export async function pushProfile(
  supabase: SupabaseClient,
  userId: string,
  progress: UserProgress,
  email?: string | null,
) {
  await supabase.from("profiles").upsert(
    {
      id: userId,
      email: email ?? undefined,
      active_track_id: progress.trackId,
      daily_goal: progress.dailyGoal,
      streak: progress.streak,
      longest_streak: progress.longestStreak,
      last_study_date: progress.lastStudyDate
        ? progress.lastStudyDate.slice(0, 10)
        : null,
      onboarding_completed_at: progress.onboardingCompletedAt,
      disclaimer_acked_at: progress.disclaimerAckedAt,
    },
    { onConflict: "id" },
  );
}

export async function pushAttempt(
  supabase: SupabaseClient,
  userId: string,
  attempt: Attempt,
) {
  await supabase.from("attempts").insert({
    user_id: userId,
    track_id: attempt.trackId,
    question_id: attempt.questionId,
    selected: attempt.selected.join(","),
    correct: attempt.correct,
    response_time_ms: Math.round(attempt.responseTimeMs),
    difficulty: attempt.difficulty,
    domain: attempt.domain,
    confidence: attempt.confidence,
    mode: attempt.mode,
    created_at: attempt.createdAt,
  });
}

export async function pushReviewCard(
  supabase: SupabaseClient,
  userId: string,
  card: ReviewCard,
) {
  await supabase.from("review_cards").upsert(
    {
      user_id: userId,
      question_id: card.questionId,
      track_id: card.trackId,
      repetitions: card.repetitions,
      ease_factor: card.easeFactor,
      interval_days: card.interval,
      next_review_date: card.nextReviewDate.slice(0, 10),
      last_reviewed_at: card.lastReviewedAt,
      lapses: card.lapses,
    },
    { onConflict: "user_id,question_id" },
  );
}
