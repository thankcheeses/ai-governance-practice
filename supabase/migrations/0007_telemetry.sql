-- ---------------------------------------------------------------------------
-- Product telemetry
--
-- Answers one question the project could not answer at all: is anyone using
-- this? It is deliberately NOT part of the learning system, and the separation
-- is structural rather than a matter of discipline.
--
-- Three rules shape everything below.
--
-- 1. A learner is never identified. There is no user_id column anywhere in
--    this schema and no foreign key to auth.users, so the two bodies of data
--    cannot be joined even by someone with full database access. A signed-in
--    learner and a signed-out one produce identical rows.
--
-- 2. Nobody reads raw events. There is no select policy on telemetry.events
--    for any role. The dashboard reads telemetry.daily, which is aggregated.
--    An inspectable per-event log is what turns an analytics system into a
--    surveillance system, and it is not built here because the useful metrics
--    are not yet known.
--
-- 3. The raw IP address is never stored. Geography is resolved to a country
--    and a first-level region inside the ingest function and the address is
--    discarded in the same invocation. There is no column to put it in.
--
-- Retention: raw events 90 days, rollups indefinitely.
-- ---------------------------------------------------------------------------

create schema if not exists telemetry;

-- ---------------------------------------------------------------------------
-- Raw events
-- ---------------------------------------------------------------------------
create table if not exists telemetry.events (
  id             bigint generated always as identity primary key,
  occurred_at    timestamptz not null default now(),

  -- Rotating, client-generated, and not a user id. Regenerated every 90 days
  -- so "returning visitor" stays answerable without building a durable
  -- identifier for a person.
  visitor_id     uuid        not null,
  -- One browsing session. Resets after 30 minutes of inactivity.
  session_id     uuid        not null,

  event          text        not null,
  -- Learning context, never learner identity.
  mode           text,
  domain         text,
  subdomain      text,
  correct        boolean,
  duration_ms    integer,

  -- Coarse geography, derived at the edge. Country is ISO-3166 alpha-2;
  -- region is a first-level subdivision and in practice only set for the US.
  country        text,
  region         text,

  device         text,
  os_family      text,
  browser_family text,
  referrer_kind  text,

  app_version    text,

  constraint events_event_vocab check (event in (
    'session_start',
    'page_view',
    'study_started',
    'study_completed',
    'question_answered',
    'review_started',
    'review_completed',
    'exam_started',
    'exam_completed',
    'exam_abandoned',
    'client_error',
    'api_error'
  )),
  constraint events_device_vocab check (
    device is null or device in ('mobile', 'tablet', 'desktop')
  ),
  constraint events_referrer_vocab check (
    referrer_kind is null or referrer_kind in
      ('direct', 'search', 'github', 'linkedin', 'x', 'other')
  ),
  -- Two-letter country codes only. A full IP or a place name here would mean
  -- the edge function stopped coarsening, and this is where that shows up.
  constraint events_country_shape check (
    country is null or country ~ '^[A-Z]{2}$'
  ),
  -- Bounds a hostile or buggy client. A negative duration is meaningless and a
  -- 24-hour one is a clock problem, not a session.
  constraint events_duration_sane check (
    duration_ms is null or (duration_ms >= 0 and duration_ms <= 86400000)
  )
);

create index if not exists events_occurred_at_idx on telemetry.events (occurred_at);
create index if not exists events_event_day_idx   on telemetry.events (event, occurred_at);
create index if not exists events_visitor_idx     on telemetry.events (visitor_id, occurred_at);

-- ---------------------------------------------------------------------------
-- Daily rollups — the only thing the dashboard reads
-- ---------------------------------------------------------------------------
create table if not exists telemetry.daily (
  day        date    not null,
  metric     text    not null,
  -- e.g. 'III.B' for a subdomain metric, 'US-CA' for geography, 'mobile' for
  -- device. Empty string rather than null so it can sit in a primary key.
  dimension  text    not null default '',
  value      numeric not null,
  primary key (day, metric, dimension)
);

-- ---------------------------------------------------------------------------
-- Who may read the dashboard
--
-- An explicit allowlist. The admin route is not protected by being hard to
-- guess: an unauthorised visitor loading /admin gets the same empty result as
-- an anonymous one, because the data is gated here rather than in the client.
-- ---------------------------------------------------------------------------
create table if not exists telemetry.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  granted_at timestamptz not null default now()
);

alter table telemetry.events enable row level security;
alter table telemetry.daily  enable row level security;
alter table telemetry.admins enable row level security;

-- events: NO policy of any kind.
--
-- With RLS on and no policy, every non-service role is denied everything —
-- including select. Ingest happens inside the collect Edge Function using the
-- service role, which bypasses RLS. This is deliberate and is the single most
-- important line in the file: the raw event log is unreadable from the
-- browser, by anyone, including an admin.

drop policy if exists "daily_admin_read" on telemetry.daily;
create policy "daily_admin_read" on telemetry.daily
  for select using (
    exists (select 1 from telemetry.admins a where a.user_id = auth.uid())
  );

drop policy if exists "admins_self_read" on telemetry.admins;
create policy "admins_self_read" on telemetry.admins
  for select using (user_id = auth.uid());

-- The anon and authenticated roles need to reach the schema at all before the
-- policy above can let them read the rollups.
grant usage on schema telemetry to anon, authenticated;
grant select on telemetry.daily  to authenticated;
grant select on telemetry.admins to authenticated;

-- Explicitly withhold the raw log from both browser roles, so a future
-- "grant all on all tables" cannot quietly expose it.
revoke all on telemetry.events from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Rollup + retention
--
-- Run nightly. Written as a function so it can be scheduled with pg_cron or
-- called manually, and so the retention window lives next to the aggregation
-- that has to happen before anything is deleted.
-- ---------------------------------------------------------------------------
create or replace function telemetry.roll_up(target date default (current_date - 1))
returns void
language plpgsql
security definer
set search_path = telemetry, public
as $$
begin
  delete from telemetry.daily where day = target;

  insert into telemetry.daily (day, metric, dimension, value)
  -- Distinct visitors, sessions, and the raw event counts that make up the
  -- overview. count(distinct visitor_id) is what "active users" means here:
  -- a rotating id, so it is an approximation and is labelled as one.
  select target, 'dau', '', count(distinct visitor_id)
    from telemetry.events where occurred_at::date = target
  union all
  select target, 'sessions', '', count(distinct session_id)
    from telemetry.events where occurred_at::date = target
  union all
  select target, 'events', event, count(*)
    from telemetry.events where occurred_at::date = target
    group by event
  union all
  select target, 'device', coalesce(device, 'unknown'), count(distinct session_id)
    from telemetry.events where occurred_at::date = target
    group by coalesce(device, 'unknown')
  union all
  select target, 'referrer', coalesce(referrer_kind, 'unknown'), count(distinct session_id)
    from telemetry.events where occurred_at::date = target and event = 'session_start'
    group by coalesce(referrer_kind, 'unknown')
  union all
  -- Geography. Country on its own, and country-region for the US only, which
  -- is the only place the region column is populated.
  select target, 'country', coalesce(country, 'unknown'), count(distinct visitor_id)
    from telemetry.events where occurred_at::date = target
    group by coalesce(country, 'unknown')
  union all
  select target, 'region', country || '-' || region, count(distinct visitor_id)
    from telemetry.events
    where occurred_at::date = target and country is not null and region is not null
    group by country, region
  union all
  -- Accuracy by domain and sub-domain, as answered/correct pairs so the
  -- dashboard divides rather than storing a rounded percentage.
  select target, 'answered_domain', domain, count(*)
    from telemetry.events
    where occurred_at::date = target and event = 'question_answered' and domain is not null
    group by domain
  union all
  select target, 'correct_domain', domain, count(*) filter (where correct)
    from telemetry.events
    where occurred_at::date = target and event = 'question_answered' and domain is not null
    group by domain
  union all
  select target, 'answered_subdomain', subdomain, count(*)
    from telemetry.events
    where occurred_at::date = target and event = 'question_answered' and subdomain is not null
    group by subdomain
  union all
  select target, 'correct_subdomain', subdomain, count(*) filter (where correct)
    from telemetry.events
    where occurred_at::date = target and event = 'question_answered' and subdomain is not null
    group by subdomain;

  -- Retention. Deleting only after the rollup for that day exists is what
  -- makes the 90-day window safe to shorten later.
  delete from telemetry.events
   where occurred_at < now() - interval '90 days';
end;
$$;

revoke all on function telemetry.roll_up(date) from anon, authenticated;

comment on schema telemetry is
  'Product usage telemetry. Contains no learner identity and no IP addresses, and is never joined to public.attempts or auth.users.';
