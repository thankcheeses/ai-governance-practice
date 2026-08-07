-- Widen `attempts.selected` to hold a set of option keys.
--
-- Multi-select items are graded all-or-nothing, so the answer a learner gave
-- is a set, not a letter. The column stays `text` and stores the keys
-- comma-joined in canonical order ("A,C,D") — the same convention the source
-- content and the published answer keys use, which keeps the stored value
-- readable in a SQL console.
--
-- The old constraint allowed only a single letter A-D. The new one allows one
-- or more of A-E, so single-select rows written before this migration remain
-- valid and need no rewrite.

alter table public.attempts
  drop constraint if exists attempts_selected_check;

alter table public.attempts
  add constraint attempts_selected_check
  check (selected ~ '^[A-E](,[A-E])*$');
