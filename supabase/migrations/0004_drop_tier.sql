-- Remove the plan tier. Everything in the app is free.
--
-- There are no paid plans, no billing integration, and nothing gated. A column
-- the client never reads and never writes is a trap: it invites a future reader
-- to assume gating exists somewhere. Dropping it makes the absence explicit.
--
-- Safe on a database that has already run 0001–0003: the constraint added by
-- 0002 is dropped with the column it constrains, and no other table references
-- it. Idempotent, so re-running the full script is harmless.

alter table public.profiles
  drop constraint if exists profiles_tier_check;

alter table public.profiles
  drop column if exists tier;
