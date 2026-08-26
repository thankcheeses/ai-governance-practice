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

**It does not say:** the bank mirrors the exam's weighting. Coverage of all
thirteen sub-domains is required; proportional mirror of the exam blueprint
is not.

---

## Fields that carry the claim

| Field | Role |
|---|---|
| `context` | Prose the learner reads on the study page |
| `contextAuthority` | Named authority |
| `contextVersion` | Named version of that authority |
| `contextReviewed` | ISO 8601 date the check was actually performed |
| `contextCoverage` | Coverage summary (e.g. 13/13 sub-domains) |

`npm run check:bok` validates presence, date form, and that the prose names
the same version as `contextVersion`.

---

## What would falsify the claim

- The authority publishes a new Body of Knowledge version and this bank has
  not been re-mapped.
- A sub-domain has zero questions (coverage gap).
- `contextReviewed` is missing, malformed, or in the future.
- The prose and `contextVersion` disagree.

---

## When to re-check

Re-check on an event, not on a calendar of our own:

- the authority publishes a new Body of Knowledge version
- the authority changes the exam blueprint
- the domain structure changes materially
- content is added that claims coverage beyond what was checked

**Move `contextReviewed` only after the check has actually been repeated.**

---

## Procedure after a re-check

1. Re-read the published Body of Knowledge at the named version.
2. Confirm every sub-domain still has at least one scenario (`npm run check:bok`).
3. Update enrichment tags if performance indicators moved.
4. Update `context`, `contextVersion`, `contextAuthority` if the authority or
   version changed.
5. Update the table above, `contextCoverage`, and `contextReviewed`.
6. Run `npm run release:gate`.

---

## Coverage audit — completed 7 August 2026, recomputed 24 August 2026, date claim updated 25 August 2026

Structural coverage of all thirteen AIGP BoK v2.1 sub-domains was confirmed.
Per-domain counts are tracked in CI; gaps fail the gate. Proportional match to
exam weighting is intentionally not required.
