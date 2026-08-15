-- Remove the upper bound on the daily goal.
--
-- The product has no view on how much practice is too much, and the client
-- stopped capping the goal some time ago — Settings offers presets but accepts
-- any number from 1 up. The database did not follow, and still refused
-- anything above 100.
--
-- That mismatch was worse than it looks. `pushProfile` upserts the profile as
-- a single row, so a goal of 200 did not merely fail to save: the whole upsert
-- was rejected by this constraint, taking `streak`, `last_study_date`,
-- `active_track_id` and `onboarding_completed_at` down with it. The call does
-- not inspect its result, so nothing surfaced — a signed-in learner would have
-- silently stopped syncing their profile entirely, and would have found their
-- streak and track reverting on any other device.
--
-- The floor stays. A goal of zero would divide by zero in the Home progress
-- ring, and a negative goal is not a goal.
--
-- Safe on a database that has already run 0001–0005, and idempotent: dropping
-- a constraint that is already gone is a no-op, and no existing row can
-- violate the replacement, since every value the old check allowed is also
-- allowed by the new one.

alter table public.profiles
  drop constraint if exists profiles_daily_goal_check;

alter table public.profiles
  add constraint profiles_daily_goal_check
  check (daily_goal >= 1);
