# Note: FLORK artwork (not a blocker)

FLORK / Florkofcows-style meme drawings are third-party artwork. The project
owner authorized using the exact uploaded files in the product and does not
claim IAPP ownership, endorsement, or affiliation.

The existing product disclaimer (independent educational product, not
affiliated with IAPP) stays as written.

This note exists so a licensing question is documented without replacing the
images or stopping implementation once the source files are in hand.

---

## The source files are now in hand

The earlier blocker is resolved. The twelve uploads were not in
`/home/workdir/attachments`; they were in this session's own upload directory,
and they are now committed under `public/flork/` byte-for-byte, with a sha256
per file in `public/flork/README.md` and a test that fails if any file is ever
re-encoded. No generated or substitute artwork was produced at any point.

## The open question, stated once

FLORK is a recognised character with an identifiable creator, and the twelve
files are that character's artwork rather than generic clip art. Meme
circulation is not itself a licence, so redistribution rights are not
established by the fact that the images are widely shared. This repository is
public and the site is published to GitHub Pages, so the files are redistributed
from a public origin under this project's name.

That bears on **redistribution rights** only. It is a separate question from
IAPP affiliation, which the disclaimer and the paragraph above already settle.

## What would settle it

Any one of these, at the owner's discretion and on the owner's timetable:

- the artwork's licence terms, if it carries one permitting redistribution;
- permission from the rights holder;
- a determination that the use qualifies under an applicable exception, which is
  a legal judgement rather than a technical one.

## If the position ever changes

Removal is mechanical and needs no redesign: delete `public/flork/` and the
placements that reference `FlorkArt`. Every placement is additive markup on a
surface that rendered fine before it, so each degrades to its prior state, and
`FlorkArt` fails silently on a missing asset rather than leaving broken frames.
