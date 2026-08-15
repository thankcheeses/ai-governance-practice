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

Deliberately **not** a cadence of our own. An earlier version of this document
said no cadence was asserted by anyone; that was wrong, and the primary source
corrects it. The BoK states:

> Every year, the BoK is reviewed and, if necessary, updated. Changes are
> reflected in the annual exam updates and communicated to candidates at least
> 90 days before the new content appears in the exam.

So the authority reviews annually and gives **at least 90 days' notice** before
changed content reaches the exam. That notice window is the useful signal: it
means a new version is knowable in advance rather than discovered late. Watch
for the announcement; do not invent a calendar of our own, which would go stale
in whichever direction the real schedule differs.

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

## Coverage audit — completed 7 August 2026

Performed against the primary document (`AIGP Body of Knowledge v2.1`, approved
9 September 2025, effective 2 February 2026, supersedes 2.0.1). Every question
was read against the published performance indicators and assigned a
`bokSubdomain` in the enrichment sidecar. Coverage is therefore **computed from
the content**, not asserted here — `npm run check:bok` rebuilds this table and
fails if any sub-domain drops to zero.

**Result: 13/13 sub-domains covered, 82/82 questions mapped.**

| Sub-domain | Competency | Exam | Bank | |
| --- | --- | --- | --- | --- |
| I.A | Understand what AI is and why it needs governance | 4–6 | 9 | over |
| I.B | Establish and communicate organizational expectations | 5–7 | 5 | |
| I.C | Establish policies and procedures across the life cycle | 6–8 | 3 | **under** |
| II.A | How existing data privacy laws apply to AI | 4–6 | 4 | |
| II.B | How other existing laws apply to AI | 4–6 | 3 | **under** |
| II.C | Main elements of AI-specific laws | 6–8 | 5 | **under** |
| II.D | Main industry standards and tools | 3–5 | 5 | |
| III.A | Govern the designing and building of the AI system | 6–8 | 6 | |
| III.B | Govern data collection and use in training and testing | 6–8 | 8 | |
| III.C | Govern release, monitoring and maintenance | 8–10 | 6 | **under** |
| IV.A | Evaluate factors and risks relevant to deploying | 6–8 | 4 | **under** |
| IV.B | Perform key activities to assess the AI system | 5–7 | 6 | |
| IV.C | Govern the deployment and use of the AI system | 9–11 | 18 | over |

"Exam" is the blueprint's min/max question count per competency. A practice bank
is not obliged to mirror an exam, so these are proportional signals rather than
failures — but the shape is worth acting on. The bank (82) and the exam (~85)
are close enough in size that the comparison is meaningful.

**What the shape says.** IV.C carries 18 questions against a blueprint maximum
of 11, largely because the track's voice-AI scenarios cluster in deployment
governance. Five competencies sit below the blueprint minimum. Writing roughly
a dozen scenarios — three each for I.C and III.C, two each for II.B, II.C and
IV.A — would bring every competency into range without removing anything.

Questions were mapped by **what they test**, not by which of the four track
domains they are filed under. Several sit in one and test another: item 26
(model drift) is filed under Foundations but tests III.C; items 36, 40 and 46
are filed under Deployment but test the responsible-AI principles in I.A; item
47 (conformity assessment) is filed under Development but tests II.C. That is
not a defect — a scenario can teach one thing while living somewhere sensible
for a learner — but it is why coverage is computed from `bokSubdomain` rather
than inferred from the track's own domain field.

### Re-running the audit

1. Re-read the current BoK's performance indicators.
2. Re-assign `bokSubdomain` for any question whose best fit changed.
3. Tag any new questions.
4. `npm run check:bok` — it fails on an unmapped question, an unknown
   sub-domain id, or a sub-domain with no questions.
5. Update the table above, `contextCoverage`, and `contextReviewed`.

## Note on sourcing

The audit above was performed against the **primary document** — the published
AIGP Body of Knowledge PDF, supplied directly. Version, approval date, effective
date, superseded version, domain titles, competency statements, performance
indicators and blueprint numbers all come from it.

An earlier revision of this file recorded that the comparison rested on
secondary sources because the PDF was unreachable from the build environment.
That limitation no longer applies. The secondary sources turned out to be
correct on every checkable point — version 2.1, effective 2 February 2026,
superseding 2.0.1, four domains, thirteen sub-domains — but that was luck, not
method, and the primary document is what the table now reflects.

## Editorial review — `aigp-149` ↔ `aigp-289`

`npm run check:originality` flags this pair at 56% stem overlap and therefore
exits 1. It is a flag, not a verdict, so it needs a recorded human decision.

**Decision: they are the same item rewritten, not one competency approached from
two angles.** Both sit in *Laws, Standards, and Frameworks*, both ask what
relying on legitimate interests under GDPR requires, and both answer B. The
distractor sets map almost one to one:

| Role in the item | `aigp-149` | `aigp-289` |
| --- | --- | --- |
| consent | A. explicit consent first | C. opportunity to consent |
| **answer** | **B. balance and record it** | **B. documented balancing** |
| regulator | D. register with the supervisory authority | A. written approval from the supervisory authority |
| remaining | C. anonymise so the basis no longer applies | D. never used commercially |

Only one distractor differs in substance. A learner who acquires either gets the
other for nothing, and the pair inflates the apparent size of the Laws domain by
one.

**If one is retired or rewritten, retire `aigp-289`.** It is the weaker item
independently of the duplication: option D ("never used for any commercial
purpose whatsoever") is absolute-language a candidate can eliminate without
knowing any GDPR, and option A is transparently wrong. `aigp-149` is tighter,
and its "anonymise so the lawful basis no longer applies" distractor teaches
something real about the relationship between anonymisation and lawful basis.

**No content has been changed.** Both items remain in the bank and the check
still exits 1 on this pair. Rewriting a question to silence an originality
result is the failure mode the check exists to prevent, so the flag stays until
there is an editorial reason to act on it rather than a green-build reason.
