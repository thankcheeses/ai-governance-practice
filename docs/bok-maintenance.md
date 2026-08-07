# Body of Knowledge maintenance

The study page tells a learner:

> Checked against the published Body of Knowledge: 7 August 2026 ·
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
control. A date that promised future alignment would be a claim we cannot keep.

Three fields in `src/content/registry.ts` carry it:

| Field | Meaning |
| --- | --- |
| `contextAuthority` | The document that defines what the exam covers |
| `contextVersion` | That document's version, as the authority labels it |
| `contextReviewed` | ISO 8601 date the check was actually performed |

They are separate fields rather than one sentence so that a script can check
them. `npm run check:bok` validates that they are present and well-formed, that
the date is real and not in the future, that the prose a learner reads names the
same version the field does, and that the structural claim matches the content.
It reports the assertion's age but never fails on age — see below.

---

## What is claimed today

**Claimed:** domain-level alignment. The track's four domains map one-to-one
onto the four published domain titles of AIGP BoK v2.1.

| This track | IAPP BoK v2.1 |
| --- | --- |
| Foundations of AI Governance | I — Understanding the Foundations of AI Governance |
| Laws, Standards, and Frameworks | II — Understanding How Laws, Standards and Frameworks Apply to AI |
| Governing AI Development | III — Understanding How to Govern AI Development |
| Governing AI Deployment and Use | IV — Understanding How to Govern AI Deployment and Use |

**Not claimed:** sub-domain coverage. v2.1 divides those four domains into
thirteen sub-domains. The question bank has not been audited against them, so
the study page says alignment is at domain level and names the IAPP's published
Body of Knowledge as the authority on what the exam tests.

These are materially different claims. Do not let the second one drift into the
copy without doing the audit below.

---

## Re-check triggers

Re-check is **event-triggered, not calendar-triggered**:

- the authority publishes a new Body of Knowledge version
- the authority changes the exam blueprint
- the domain structure changes materially
- content is added that would claim coverage beyond what was last checked

Deliberately **not** "annually" or any other fixed cadence. The IAPP sets its
own revision schedule; inventing a calendar on our side would be an assertion
about someone else's process, and would go stale in whichever direction the real
schedule differs. If a periodic glance is wanted, treat it as a prompt to look
for a trigger — not as a review that licenses moving the date.

**Move `contextReviewed` only after the check has actually been repeated.**
Bumping it because time passed is the one failure this whole mechanism exists to
prevent.

---

## Procedure: re-checking domain alignment

1. Download the current Body of Knowledge from the authority. It is a free
   download from iapp.org; the exam blueprint is published alongside it.
2. Compare its domain titles to `aigpDomains` in
   `src/content/tracks/aigp-preparation/`.
3. If the structure still matches, update `contextVersion` and
   `contextReviewed`, and update the version named in the `context` sentence.
4. If it does not match, the domain names in content need to change before the
   date moves. The date must never describe a check that failed.
5. Run `npm run check:bok`.

---

## Procedure: the sub-domain coverage audit

This is what would justify the stronger claim. It has not been done.

Build a traceability matrix from BoK sub-domain to question id:

| BoK v2.1 | Questions | Coverage |
| --- | --- | --- |
| I.A | … | |
| I.B | … | |
| … | | |
| IV.C | … | |

Then:

- **Every sub-domain with at least one question** → coverage can be claimed at
  sub-domain level, and the study copy can say so.
- **Any sub-domain with none** → either write scenarios for it, or keep the
  weaker claim. Softening the wording to fit a gap is the wrong direction; the
  gap is the finding.
- **Any question mapping to a topic the current version removed** → mark it, and
  decide whether it stays as general governance material or comes out. v2.1
  removed at least one topic relative to v2.0.1.

Record the matrix in this file when it is done, with the date it was done. Only
then change the study copy, and add a `contextCoverage` field rather than
overloading the existing three.

---

## Note on sourcing

The domain-title comparison recorded above was made against secondary sources.
The authority's own PDF was unreachable from the environment the check ran in
(egress policy), so it has not been read directly. Anyone repeating this check
should read the primary document and, if it disagrees with the table above,
correct the table and treat the discrepancy as the finding.
