-- Add the `lab` plan to the tier constraint.
--
-- Separate migration rather than an edit to 0001 so deployed databases can move
-- forward without a reset. Existing rows are unaffected: the default stays
-- 'free' and no data is rewritten.
--
-- No Lab content exists yet (see src/content/labs.ts). This makes the tier a
-- valid stored value ahead of that, so entitlement checks and the profile sync
-- do not need changing again when the first lab ships.

alter table public.profiles
  drop constraint if exists profiles_tier_check;

alter table public.profiles
  add constraint profiles_tier_check
  check (tier in ('free', 'pro', 'lab'));
