-- AI Governance Practice — initial schema
--
-- Design notes
-- ------------
-- 1. Track-scoped by construction. Every content and progress row carries a
--    track_id, so adding a learning track requires no schema change: seed new
--    rows into `questions` with a new track_id and register it in the app.
-- 2. Questions are stored with first-class columns for the fields the app
--    filters on (track, domain, difficulty) plus a jsonb `content` blob for
--    the full normalized object. Filtering stays indexable; the shape stays
--    flexible as tracks evolve.
-- 3. Every per-user table is protected by row level security. A user can only
--    ever read or write their own rows.
-- 4. All content is original educational material. See the in-app disclaimer.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- tracks: learning tracks. Only `active` tracks are surfaced in the app.
-- ---------------------------------------------------------------------------
create table if not exists public.tracks (
  id          text primary key,
  name        text not null,
  summary     text not null,
  status      text not null default 'planned'
                check (status in ('active', 'planned')),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- questions: reference content, synced by the seed script
-- ---------------------------------------------------------------------------
create table if not exists public.questions (
  id              text primary key,
  track_id        text not null references public.tracks (id) on delete cascade,
  domain          text not null,
  difficulty      text not null
                    check (difficulty in ('foundational', 'applied', 'advanced')),
  question        text not null,
  options         jsonb not null,
  correct_answer  text not null check (correct_answer in ('A', 'B', 'C', 'D')),
  rationale       text not null,
  key_takeaway    text not null,
  framework_tags  text[] not null default '{}',
  tags            text[] not null default '{}',
  -- Ordering within a track; also drives the free-tier question window.
  position        integer not null default 0,
  created_date    timestamptz not null default now(),
  updated_date    timestamptz not null default now()
);

create index if not exists questions_track_idx on public.questions (track_id, position);
create index if not exists questions_domain_idx on public.questions (track_id, domain);
create index if not exists questions_difficulty_idx on public.questions (track_id, difficulty);

-- ---------------------------------------------------------------------------
-- profiles: application user record, keyed to auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                       uuid primary key references auth.users (id) on delete cascade,
  email                    text,
  display_name             text,
  active_track_id          text not null default 'aigp-preparation'
                             references public.tracks (id),
  -- Feature gating only. No payment integration yet.
  tier                     text not null default 'free' check (tier in ('free', 'pro')),
  daily_goal               integer not null default 10 check (daily_goal between 1 and 100),
  streak                   integer not null default 0 check (streak >= 0),
  longest_streak           integer not null default 0 check (longest_streak >= 0),
  last_study_date          date,
  theme                    text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  onboarding_completed_at  timestamptz,
  disclaimer_acked_at      timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- attempts: one row per answered question
-- ---------------------------------------------------------------------------
create table if not exists public.attempts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  track_id          text not null references public.tracks (id) on delete cascade,
  question_id       text not null,
  selected          text not null check (selected in ('A', 'B', 'C', 'D')),
  correct           boolean not null,
  response_time_ms  integer not null default 0 check (response_time_ms >= 0),
  difficulty        text not null
                      check (difficulty in ('foundational', 'applied', 'advanced')),
  domain            text not null,
  -- Self-reported, used to prioritise the review queue. Nullable: the learner
  -- is never forced to rate an answer.
  confidence        text check (confidence in ('guessed', 'unsure', 'confident')),
  mode              text not null check (mode in ('practice', 'domain', 'review')),
  created_at        timestamptz not null default now()
);

create index if not exists attempts_user_created_idx
  on public.attempts (user_id, created_at desc);
create index if not exists attempts_user_question_idx
  on public.attempts (user_id, question_id);
create index if not exists attempts_user_domain_idx
  on public.attempts (user_id, track_id, domain);

-- ---------------------------------------------------------------------------
-- review_cards: SM-2 scheduling state, one row per user + question
-- ---------------------------------------------------------------------------
create table if not exists public.review_cards (
  user_id           uuid not null references auth.users (id) on delete cascade,
  question_id       text not null,
  track_id          text not null references public.tracks (id) on delete cascade,
  repetitions       integer not null default 0 check (repetitions >= 0),
  ease_factor       numeric(4,2) not null default 2.50 check (ease_factor >= 1.30),
  interval_days     integer not null default 0 check (interval_days >= 0),
  next_review_date  date not null default current_date,
  last_reviewed_at  timestamptz not null default now(),
  lapses            integer not null default 0 check (lapses >= 0),
  primary key (user_id, question_id)
);

create index if not exists review_cards_due_idx
  on public.review_cards (user_id, next_review_date);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.tracks       enable row level security;
alter table public.questions    enable row level security;
alter table public.profiles     enable row level security;
alter table public.attempts     enable row level security;
alter table public.review_cards enable row level security;

-- Content is public read-only. Writes go through the seed script using the
-- service role key, which bypasses RLS.
drop policy if exists "tracks_public_read" on public.tracks;
create policy "tracks_public_read" on public.tracks for select using (true);

drop policy if exists "questions_public_read" on public.questions;
create policy "questions_public_read" on public.questions for select using (true);

-- Profiles: own row only.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Progress tables: own rows only.
drop policy if exists "attempts_all_own" on public.attempts;
create policy "attempts_all_own" on public.attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "review_cards_all_own" on public.review_cards;
create policy "review_cards_all_own" on public.review_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Auto-provision a profile when a user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists tracks_touch_updated_at on public.tracks;
create trigger tracks_touch_updated_at
  before update on public.tracks
  for each row execute function public.touch_updated_at();
