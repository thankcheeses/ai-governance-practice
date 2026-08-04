-- Seed the active track row.
--
-- Not optional. `profiles.active_track_id` defaults to 'aigp-preparation' and
-- carries a foreign key to `tracks`, and `handle_new_user()` inserts a profile
-- on every auth signup. With `tracks` empty the trigger raises
--
--   insert or update on table "profiles" violates foreign key constraint
--   "profiles_active_track_id_fkey"
--
-- and the signup fails outright, so no user can create an account. The same
-- foreign key exists on `attempts.track_id` and `review_cards.track_id`, so
-- progress sync fails for the same reason.
--
-- Values mirror src/content/registry.ts. `npm run seed` upserts the same row
-- along with question content, but seeding needs the service role key and is
-- optional; this row is not.

insert into public.tracks (id, name, summary, status, sort_order)
values (
  'aigp-preparation',
  'AIGP Preparation',
  'Build practical governance judgment across AI foundations, laws and frameworks, development, and deployment.',
  'active',
  0
)
on conflict (id) do update
  set name       = excluded.name,
      summary    = excluded.summary,
      status     = excluded.status,
      sort_order = excluded.sort_order;
