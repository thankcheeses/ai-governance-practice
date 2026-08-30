#!/usr/bin/env python3
"""
Apply Increment 1 (schema) + Increment 2 (calibration tranche).

THIS SCRIPT IS NOT IMPLEMENTED. The working version was never committed.

What happened: the reasoning-metadata work was prepared in a working copy that
no longer exists. Three commits landed on main claiming to restore it —
4c64e31 (types.ts), 86db900 (index.ts) and d208ac7 (this file) — but the two
that mattered most did not carry their content. `enrichment.ts` was left as the
literal string `PLACEHOLDER_ENRICHMENT`, which broke the build on main, and
this file was left as a stub that printed a success line and exited zero.

Searching every commit in this repository finds zero occurrences of
`primaryDimension` in `enrichment.ts`. The 51 labelled items described in the
handoff have never existed here. They cannot be recovered from git, and this
script cannot regenerate them, because its own body was never committed either.

The schema itself survived and is intact:

  * `src/content/types.ts` defines `ReasoningDimension`, `DistractorType` and
    `ReasoningMeta`.
  * `src/content/tracks/aigp-preparation/index.ts` defines `normalizeReasoning`
    and `normalizeDistractorTypes`.
  * `reasoning` is optional at both the enrichment-entry and question level, so
    the bank builds and passes its gate with no item labelled.

So Increment 1 is done and Increment 2 has to be redone from the source
material. This file exits non-zero rather than printing a reassuring line,
because a stub that reports success is how the original breakage went
unnoticed.
"""

import sys


def main() -> int:
    sys.stderr.write(
        "apply-reasoning-tranche: not implemented.\n"
        "The working version of this script was never committed, and the 51\n"
        "labelled items it produced are not in this repository's history.\n"
        "Increment 2 must be redone from the source material.\n"
        "See the module docstring for what survived and what did not.\n"
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
