# Second calibration tranche — candidate labels for review

**This is a candidate tranche, not approved content.** Nothing here is applied.
`enrichment.ts` is untouched, and no threshold, copy, taxonomy, deduplication,
evidence rule or UI behaviour changes. The only file this branch adds is this
document.

12 questions, four for each of the three families that cannot currently fire.

## Why these three families, and why twelve

The pattern layer names a family only when its occurrences span at least three
different questions. Three nameable families sit at two questions each, so they
are unreachable however often a learner makes the mistake:

| Family | Questions today | After this tranche |
| --- | --- | --- |
| `actedEarly` | 2 — `aigp-109`, `aigp-174` | 6 |
| `wrongPhase` | 2 — `aigp-030`, `aigp-277` | 6 |
| `commitmentAsRequirement` | 2 — `aigp-135`, `aigp-178` | 6 |

The other six nameable families are already well covered (6 to 13 questions
each) and are deliberately left alone. That is why this tranche is twelve
questions rather than another fifty: the measured gap is narrow and specific.

`actedEarly` matters most of the three. It is the family the `aigp-066` dispute
turns on — the recorded approval labelled option D `premature_remediation`, the
applied label is `risk_underestimation`, and that disagreement is still open.
Until `actedEarly` can fire, the app cannot tell a learner they keep reaching
for a fix before establishing a cause, which is the single most teachable
pattern in the taxonomy.

## How these twelve were chosen

Every candidate was read in full — stem, all options, correct answer and
rationale — from the 244 questions that carry no labels. Selection was on
whether the item genuinely exercises the reasoning the family names, not on
keyword matching, which finds questions containing a word rather than questions
about the judgement.

Only tempting distractors are proposed for labelling, as in the first tranche.
A throwaway option left unlabelled keeps the engine from learning that every
miss is diagnostic.

Letters are **source letters** as they appear in `questions.json`; the loader
converts them to option ids, so the shuffle cannot misattribute them. Every
letter below was verified against the bank programmatically — a label naming an
option a question does not have would vanish silently.

---

## `actedEarly` — a fix chosen before the cause was established

### `aigp-015` · IV.C · applied — *first action on a discovered disparity*
Correct: **C**. Primary `sequencing`, secondary `accountability`.

> An organization discovers that one of its deployed AI systems is producing
> systematically worse outcomes for a protected demographic group. What is
> typically the first governance action?

- `A` → `premature_remediation` — retraining on rebalanced data corrects a
  disparity whose cause is not yet known.
- `B` → `premature_remediation` — suspending the pathway withdraws a service on
  the strength of an unexplained number. The item's own rationale names this.
- `D` → `technically_correct_but_premature` — an independent audit is a real
  control and the wrong first move; it outsources a finding the organisation has
  not yet made itself.

The closest sibling to `aigp-109` in the bank, and the clearest single candidate
in the tranche.

### `aigp-021` · IV.C · advanced — *an undisclosed fourth-party subcontractor*
Correct: **B**. Primary `sequencing`, secondary `governing_obligation`.

- `A` → `wrong_accountable_party` — treating the vendor's contractual answerability
  as discharging the covered entity's own duty to know where the data went.
- `C` → `premature_remediation` — terminating immediately decides the remedy
  before establishing what the subcontractor received.
- `D` → `technically_correct_but_premature` — direct contracting may well be the
  answer, but not before anyone knows what is already held.

### `aigp-025` · IV.C · advanced — *a disclosure control that stopped firing*
Correct: **A**. Primary `sequencing`.

- `B` → `premature_remediation` — rolling back and deferring analysis restores
  the symptom and abandons the cause.
- `C` → `plausible_but_incomplete` — a compensating control helps and leaves the
  failed control unexplained.
- `D` → `risk_underestimation` — logging it for the vendor treats a failed
  transparency control as a defect to watch.

### `aigp-275` · IV.C · advanced · multi-select — *stable monitoring, tripled complaints*
Correct: **A, B**. Primary `material_facts`, secondary `risk_prioritization`.

- `C` → `risk_underestimation` — reassuring complainants asserts the conclusion
  the complaints are evidence against.
- `D` → `premature_remediation` — retraining "as a precaution while the cause is
  investigated" acts before the cause is known. The rationale says so directly.
- `E` → `premature_remediation` — as does moving the deferral threshold.

**Ambiguity note.** This is one of only four multi-select items in the tranche
pool, and `D` and `E` carry the same label. A learner who selects both
contributes *no* observation, because an attempt with two labelled selections is
discarded — there is no way to tell which misunderstanding drove it. The item
still yields an observation on the more common miss, one wrong option alongside
one right one. Flagged because it makes this the weakest of the four for
generating `actedEarly` evidence, and you may prefer a single-select replacement.

---

## `wrongPhase` — an activity placed in the wrong phase

### `aigp-005` · II.D · foundational — *which RMF function establishes culture*
Correct: **A**. Primary `lifecycle_stage`.

- `B` → `lifecycle_confusion` — Map establishes context, not accountability.
- `C` → `lifecycle_confusion` — Measure defines metrics and testing.
- `D` → `lifecycle_confusion` — Manage allocates and treats.

Structurally identical to `aigp-277`, which is already labelled `lifecycle_stage`.

### `aigp-147` · II.D · foundational — *mapping versus measuring*
Correct: **C**. Primary `lifecycle_stage`.

- `A` → `lifecycle_confusion` — selecting metrics is measurement.
- `B` → `lifecycle_confusion` — running an evaluation is measurement.
- `D` → `lifecycle_confusion` — deciding what to do with a risk is management.

The item's rationale names each misplacement explicitly, which is why all three
distractors are labelled rather than only the most tempting.

### `aigp-098` · III.A · advanced — *setting thresholds after training*
Correct: **C**. Primary `lifecycle_stage`, secondary `proportionality`.

- `A` → `risk_overreaction` — replacing accuracy outright with a single fairness
  metric overcorrects.
- `B` → `secondary_risk_prioritized` — optimising the threshold for review
  workload ranks a real but secondary concern first.
- `D` → `lifecycle_confusion` — deferring metric choice until after training
  moves a design-phase decision downstream, which is the whole point of the item.

### `aigp-010` · I.C · applied — *documentation frozen at release*
Correct: **B**. Primary `lifecycle_stage`.

- `A` → `risk_overreaction` — rewriting from scratch every quarter.
- `C` → `lifecycle_confusion` — treating documentation as a release artefact
  rather than something the lifecycle keeps true.
- `D` → `plausible_but_incomplete` — restricting upkeep to high-risk models is a
  defensible triage that still leaves the rest misleading.

**Ambiguity note.** Two of these four (`aigp-005`, `aigp-147`) are framework-
structure items about NIST RMF functions rather than product-lifecycle phases.
That is the same split flagged in the first tranche under open question 5, where
`lifecycle_stage` was kept as one dimension. This tranche follows that decision
rather than reopening it, but it does concentrate the family: after this, four of
six `wrongPhase` questions are RMF-function items. If you would rather the family
mean product phases only, `aigp-098` and `aigp-010` are the two to keep and two
different candidates are needed.

---

## `commitmentAsRequirement` — a commitment read as a requirement, or the reverse

### `aigp-194` · II.D · foundational — *what "voluntary and outcome-based" means*
Correct: **A**. Primary `legal_vs_ethical`.

- `B` → `plausible_but_incomplete` — adopting only the unresourced parts abandons
  the outcomes while looking like adoption.
- `C` → `legal_ethical_conflation` — reading "voluntary" as carrying no weight
  with regulators or counterparties.
- `D` → `legal_ethical_conflation` — reading it as applying only to the
  unregulated.

### `aigp-250` · II.D · foundational — *NIST AI RMF against ISO/IEC 42001*
Correct: **D**. Primary `legal_vs_ethical`, secondary `governing_obligation`.

- `A` → `legal_ethical_conflation` — attributing legal force to a standard.
  Both instruments are voluntary; the difference is certifiability.
- `B` → `plausible_but_incomplete` — a real distinction drawn in the wrong place.
- `C` → `plausible_but_incomplete` — likewise.

### `aigp-049` · I.C · foundational — *AI governance against existing obligations*
Correct: **A**. Primary `legal_vs_ethical`, secondary `governing_obligation`.

- `B` → `wrong_governing_obligation` — treating AI governance as superseding
  privacy, security and civil-rights law.
- `C` → `wrong_governing_obligation` — limiting existing obligations to systems
  processing personal data.
- `D` → `legal_ethical_conflation` — treating governance as voluntary until
  AI-specific rules arrive.

### `aigp-187` · I.C · applied — *what makes a policy operative*
Correct: **B**. Primary `legal_vs_ethical`, secondary `accountability`.

- `A` → `plausible_but_incomplete` — a broad definition settles scope, not effect.
- `C` → `legal_ethical_conflation` — mistaking a statement of commitment for a
  control. This is the conflation running the *other* direction from the rest of
  the family, which is deliberate coverage.
- `D` → `plausible_but_incomplete` — a list of applicable regulations is a
  register, not a gate.

---

## What this tranche would do to the balance

The first tranche was even by design — 7/7/7/7/6/6/6/6 across the eight
dimensions — so that early pattern experiments measured the learner rather than
the tranche. These twelve are not even: they add roughly four each to
`sequencing`, `lifecycle_stage` and `legal_vs_ethical`.

That is a deliberate and, I think, acceptable skew, for one reason: detection
runs on **distractor families**, not on primary dimensions. The dimension is
instructional metadata; the family is what a learner is told about. The skew
would matter if anything keyed off dimension balance, and nothing does.

It is recorded here rather than buried because the first tranche's evenness was
argued for explicitly, and this departs from it.

## What it would not do

It does not make the three families common. After this they sit at six questions
each, against 13 for the best-covered families, so `actedEarly` will still fire
less often than `wrongRule`. Six is the threshold for "can fire reliably", not
for parity.

## After review

If approved, the apply step converts the corrected table into `reasoning` blocks
on these 12 entries, keyed by source letter, through
`scripts/apply-reasoning-tranche.mjs` — the same single path the first tranche
used, which reproduces `enrichment.ts` byte-for-byte from the reviewed document.
`src/content/reasoning-labels.test.ts` asserts the tranche size, so applying
these requires updating that assertion from 52 to 64 in the same change, which is
the intended tripwire rather than an obstacle.

Nothing is applied until you say so.
