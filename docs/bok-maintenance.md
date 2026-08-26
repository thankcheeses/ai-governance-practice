# Body of Knowledge maintenance

The study page tells a learner:

> Checked against the published Body of Knowledge: 25 August 2026 ·
> IAPP AIGP Body of Knowledge v2.1

This document is what makes that sentence an auditable claim rather than
decoration. It defines exactly what the claim asserts, what would falsify it,
when to re-check, and what a stronger claim would require.

---

## What the assertion says, and what it does not

**It says:** this content was checked against that named authority, at that
named version, on that date.

**It does not say:** the content will remain aligned after that date.
Alignment is a property of the authority's next revision, which is outside our
control. The date is a boundary, not a warranty.

See the full procedure and coverage matrix in the repository file
`docs/bok-maintenance.md` on the release branch for the complete audit
record, including subdomain counts and re-check triggers.

**Move `contextReviewed` only after the check has actually been repeated.**

---

## Coverage audit — completed 7 August 2026, recomputed 24 August 2026, date claim updated 25 August 2026

Structural coverage of all thirteen AIGP BoK v2.1 sub-domains was confirmed.
Per-domain counts are tracked in CI; gaps fail the gate. Proportional match to
exam weighting is intentionally not required.

The authoritative full matrix, field definitions, and falsification criteria
remain in this document as maintained with the product. The study page
`contextReviewed` field is the live claim date shown to learners.
