# Approvals — 13 September 2026

## aigp-066 Option D — approved

Keep Option D labelled `risk_underestimation`, not `premature_remediation`.

D defers action for six months despite an identified risk of misrouting urgent
complaints. That is under-responding to a known risk, not acting too early.

This is the only Increment 2 label decision authorized on this date.

## Second tranche — not authorized

Do not apply the 12-question second-tranche labels until a separate approval
of `docs/second-tranche-candidate.md`.

`enrichment.ts` is unchanged.

## FLORK artwork — authorized, and now implemented

The owner authorized use of the exact uploaded FLORK image files in the
project. They are third-party meme artwork. The existing IAPP disclaimer is
unchanged. This is not an IAPP affiliation claim.

**Blocker — resolved 14 September 2026.** The files were not in
`/home/workdir/attachments`; they were in the originating session's own upload
directory. All twelve were located, verified, and committed to `public/flork/`
byte-for-byte, each with a recorded sha256 and a test that fails if any file is
re-encoded. No generated or substitute artwork was produced at any point.

See `docs/notes/flork-licensing.md`.

**Withdrawn — 4 October 2026.** The owner removed the artwork from the
project: "we are also getting rid of the flork shit". All twelve files,
`src/lib/flork.ts`, `src/components/app/flork-art.tsx`, `flork.test.ts` and
`docs/notes/flork-licensing.md` are deleted, and the five screens that used
them carry no illustration in their place.

The authorization above is kept rather than struck out, because it is the
record of a decision that was made and acted on. Nothing here is an
authorization to reinstate the artwork; that would need a fresh one.
