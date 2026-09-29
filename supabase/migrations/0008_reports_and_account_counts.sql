-- ---------------------------------------------------------------------------
-- 0008: issue reports, and account counts without an account roster
--
-- Two things the admin dashboard could not answer.
--
-- 1. "Has anyone reported a problem?" — there was no way to report one. No
--    form, no table, no inbox. A learner who hit a broken question had
--    nowhere to say so.
--
-- 2. "Is anyone actually signed up?" — `public.profiles` is readable only by
--    its own owner (`auth.uid() = id`), so not even an operator could count
--    the rows.
--
-- What this migration deliberately does NOT add is a way to see WHO. There is
-- no roster, no per-person view, and no query anywhere below that returns one
-- row per human being. Counts are counts.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- public.reports: what someone tells us is wrong
--
-- Lives in `public` rather than `telemetry` on purpose. The telemetry schema
-- carries a documented promise — no learner identity, never joined to
-- auth.users — and a free-text report with an optional reply address is
-- exactly the kind of thing that would quietly falsify it. Application data
-- belongs with application data.
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),

  kind        text not null
                check (kind in ('bug', 'content', 'accessibility', 'other')),

  -- Bounds are enforced here and not only in the client, because the client is
  -- not the thing that protects the table. The lower bound exists because a
  -- two-character report costs a round trip and tells nobody anything.
  body        text not null
                check (length(btrim(body)) between 10 and 4000),

  /*
    Optional, and self-supplied.

    No `user_id` column, and the app does not attach one even when the reporter
    is signed in. Studying needs no account here, so reporting must not either,
    and a report that silently carried an identity would make "tell us what
    broke" a different transaction from the one the person agreed to. Someone
    who wants an answer can type an address; someone who does not stays
    unknown. The shape check is a sanity check, not validation — an address is
    proven by replying to it, never by a regex.
  */
  contact     text
                check (contact is null
                       or (length(contact) between 3 and 320 and contact like '%_@_%')),

  -- Which screen they were on. Path only: a full URL can carry a query string,
  -- and a query string is where identifiers end up.
  page        text check (page is null or length(page) <= 200),

  status      text not null default 'new'
                check (status in ('new', 'acknowledged', 'closed')),

  created_at  timestamptz not null default now()
);

create index if not exists reports_triage_idx
  on public.reports (status, created_at desc);

alter table public.reports enable row level security;

/*
  Anyone may file one. That is the point: the people most likely to find a
  broken question are the ones who never made an account.

  This is an open write, and worth naming as such: nothing here rate-limits a
  script. The brakes are the column constraints and the fact that no row is
  ever rendered to the public. If spam does appear, the fix is to move the
  insert behind the existing `collect` Edge Function, which already has an
  origin allowlist — not to close the door on anonymous reporters.
*/
drop policy if exists "reports_insert_anyone" on public.reports;
create policy "reports_insert_anyone" on public.reports
  for insert to anon, authenticated with check (true);

-- Reading is admin-only, and reuses the membership table telemetry already
-- defines rather than inventing a second notion of "admin".
drop policy if exists "reports_select_admin" on public.reports;
create policy "reports_select_admin" on public.reports
  for select to authenticated using (
    exists (select 1 from telemetry.admins a where a.user_id = auth.uid())
  );

-- Triage only. There is deliberately no delete policy: a report someone took
-- the trouble to file is closed, not erased.
drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin" on public.reports
  for update to authenticated using (
    exists (select 1 from telemetry.admins a where a.user_id = auth.uid())
  ) with check (
    exists (select 1 from telemetry.admins a where a.user_id = auth.uid())
  );

/*
  Stated explicitly, though `0001_init.sql` leaves the public tables to
  Supabase's default privileges.

  A policy only narrows what a grant already allows, so a missing grant fails
  as "permission denied for table reports" at the moment a learner presses
  Send — the one path nobody exercises before deploying. Naming the four
  privileges costs two lines and mirrors the policies above exactly: insert for
  anyone, read and triage for signed-in accounts (which RLS then narrows to
  admins). No delete to anybody.
*/
grant insert on public.reports to anon, authenticated;
grant select, update on public.reports to authenticated;

comment on table public.reports is
  'Problem reports from learners. Open to anonymous inserts, readable only by telemetry.admins. Carries no user_id — any contact address is self-supplied.';

-- ---------------------------------------------------------------------------
-- telemetry.account_counts(): how many, never who
-- ---------------------------------------------------------------------------
create or replace function telemetry.account_counts()
returns table (
  total       bigint,
  new_7d      bigint,
  new_30d     bigint,
  active_7d   bigint,
  active_30d  bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  /*
    `security definer` is what lets this read public.profiles without granting
    any account the right to read its rows — so the admin check has to happen
    INSIDE the function. Without these four lines this is an open door to the
    profiles table, which is the whole reason the function returns aggregates
    and not a set of rows.

    A non-admin gets zero rows rather than an error, matching how a denial
    already reads everywhere else here: the caller cannot tell "not allowed"
    from "nothing recorded", and the dashboard says so in as many words
    instead of showing a confident zero.
  */
  if not exists (
    select 1 from telemetry.admins a where a.user_id = auth.uid()
  ) then
    return;
  end if;

  return query
  select
    count(*)::bigint,
    count(*) filter (where p.created_at >= now() - interval '7 days')::bigint,
    count(*) filter (where p.created_at >= now() - interval '30 days')::bigint,
    count(*) filter (where p.last_study_date >= current_date - 7)::bigint,
    count(*) filter (where p.last_study_date >= current_date - 30)::bigint
  from public.profiles p;
end;
$$;

comment on function telemetry.account_counts() is
  'Aggregate counts of registered accounts for admins. Returns exactly one row of totals and never per-account data; no rows at all to a non-admin.';

-- Signing in is a precondition for being an admin, so `anon` has no business
-- calling this at all.
revoke all on function telemetry.account_counts() from public;
revoke all on function telemetry.account_counts() from anon;
grant execute on function telemetry.account_counts() to authenticated;
