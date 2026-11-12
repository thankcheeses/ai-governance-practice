-- Rename the active track's display name.
--
-- The track was shown as "AIGP Preparation". AIGP is a certification mark of
-- the IAPP, and this product is independent of the IAPP: it is not an official
-- preparation course and should not carry a name that reads like one. The
-- displayed name becomes "AI Governance Practitioner", matching
-- src/content/registry.ts.
--
-- Only `name` changes. The id stays 'aigp-preparation' on purpose: it is the
-- foreign key behind `profiles.active_track_id`, `attempts.track_id` and
-- `review_cards.track_id`, and the key progress is stored under on every
-- device. Renaming the id would orphan all of it.
--
-- 0003 is left as it was applied. Idempotent: running this twice sets the same
-- value twice.

update public.tracks
   set name = 'AI Governance Practitioner'
 where id = 'aigp-preparation';
