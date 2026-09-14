# FLORK artwork — licensing note

**Status: a note for the owner, not a blocker.** The assets are implemented and
shipping. Nothing here is a request to remove, replace, or regenerate them, and
no alternative artwork has been produced or proposed. The owner has authorised
their use and that decision is recorded, not relitigated.

## What was decided

The twelve images are third-party FLORK meme artwork. The owner has stated that
this is understood, that the memes are being used intentionally as visual and
educational content, and that no claim of IAPP ownership, endorsement,
sponsorship, or affiliation is being made. The existing IAPP disclaimer is
unchanged.

Implementation followed that decision exactly: the supplied files are committed
byte-for-byte, with `public/flork/README.md` recording each file's sha256 against
the upload it came from.

## The open question, stated once

FLORK is a recognised character with an identifiable creator, and the twelve
files are that character's artwork rather than generic clip art. Meme circulation
is not itself a licence, so redistribution rights are not established by the fact
that the images are widely shared. This repository is public and the site is
published to GitHub Pages, which means the files are redistributed from a
public origin under this project's name.

That is the whole of the concern. It bears on **redistribution rights**, not on
IAPP affiliation — those are separate questions and the second one is already
settled by the disclaimer and by this note.

## What would settle it

Any one of these, at the owner's discretion and on the owner's timetable:

- the artwork's licence terms, if it carries one that permits redistribution;
- permission from the rights holder;
- a determination that the use qualifies under an applicable exception, which is
  a legal judgement rather than a technical one.

## If the position ever changes

Removal is a two-line operation and needs no redesign: delete `public/flork/` and
the placements that reference `FlorkArt`. Each placement is additive markup on a
surface that rendered fine before it, so every one of them degrades to its prior
state. `FlorkArt` also fails silently if an asset is missing, so a partial
removal cannot leave broken image frames on a page.

Recorded 13 September 2026.
