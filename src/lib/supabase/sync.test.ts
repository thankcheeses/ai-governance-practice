import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadProgress } from "./sync";

/*
  Why this file exists.

  A signed-in user reported their progress vanishing on refresh. The mechanism
  was here: supabase-js signals failure by returning `{ data: null, error }`
  rather than throwing, and this module read `data ?? []`. A denied policy, an
  expired token or a dropped connection therefore produced a perfectly
  well-formed progress object describing a user who had done nothing — which
  the provider then persisted over the good copy in localStorage.

  The contract these tests pin: a failed read must fail loudly, so the caller
  can keep what it already has.
*/

/** A query builder that resolves to whatever the test asked for. */
function stubClient(
  responses: Record<string, { data?: unknown; error?: { message: string } | null }>,
): SupabaseClient {
  const build = (table: string) => {
    const result = responses[table] ?? { data: [], error: null };
    const thenable = {
      select: () => thenable,
      eq: () => thenable,
      order: () => thenable,
      limit: () => Promise.resolve(result),
      maybeSingle: () => Promise.resolve(result),
      then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
    };
    return thenable;
  };
  return { from: (table: string) => build(table) } as unknown as SupabaseClient;
}

const OK_PROFILE = {
  data: {
    active_track_id: "aigp-preparation",
    onboarding_completed_at: "2026-01-01T00:00:00.000Z",
    disclaimer_acked_at: "2026-01-01T00:00:00.000Z",
    daily_goal: 10,
    streak: 3,
    longest_streak: 5,
    last_study_date: "2026-01-01",
  },
  error: null,
};

const OK_ATTEMPT = {
  id: "a1",
  track_id: "aigp-preparation",
  question_id: "aigp-001",
  selected: "A",
  correct: true,
  response_time_ms: 1000,
  difficulty: "foundational",
  domain: "Foundations of AI Governance",
  confidence: null,
  mode: "practice",
  created_at: "2026-01-01T00:00:00.000Z",
};

test("a successful read maps every table into progress", async () => {
  const progress = await loadProgress(
    stubClient({
      profiles: OK_PROFILE,
      attempts: { data: [OK_ATTEMPT], error: null },
      review_cards: { data: [], error: null },
    }),
    "user-1",
  );
  assert.equal(progress.attempts.length, 1);
  assert.equal(progress.streak, 3);
  assert.equal(progress.onboardingCompletedAt, "2026-01-01T00:00:00.000Z");
});

test("a failed attempts read throws instead of reporting an empty history", async () => {
  // The exact shape that erased people's progress: the query "succeeded" as
  // far as the old code could tell, and produced a user with no attempts.
  await assert.rejects(
    () =>
      loadProgress(
        stubClient({
          profiles: OK_PROFILE,
          attempts: { data: null, error: { message: "permission denied" } },
          review_cards: { data: [], error: null },
        }),
        "user-1",
      ),
    /attempts/,
  );
});

test("a failed profile read throws instead of resetting onboarding", async () => {
  // Silently returning a null onboarding date sends a returning user back
  // through onboarding, which reads as "the app forgot me".
  await assert.rejects(
    () =>
      loadProgress(
        stubClient({
          profiles: { data: null, error: { message: "jwt expired" } },
          attempts: { data: [OK_ATTEMPT], error: null },
          review_cards: { data: [], error: null },
        }),
        "user-1",
      ),
    /profiles/,
  );
});

test("a failed review-card read throws rather than emptying the queue", async () => {
  await assert.rejects(
    () =>
      loadProgress(
        stubClient({
          profiles: OK_PROFILE,
          attempts: { data: [OK_ATTEMPT], error: null },
          review_cards: { data: null, error: { message: "relation missing" } },
        }),
        "user-1",
      ),
    /review_cards/,
  );
});

test("a genuinely empty account still loads, and is not an error", async () => {
  // The honest empty case has to stay distinguishable from a failure.
  const progress = await loadProgress(
    stubClient({
      profiles: { data: null, error: null },
      attempts: { data: [], error: null },
      review_cards: { data: [], error: null },
    }),
    "new-user",
  );
  assert.equal(progress.attempts.length, 0);
  assert.equal(progress.onboardingCompletedAt, null);
});
