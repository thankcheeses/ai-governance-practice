# Increment 2 — calibration tranche for review

**Status: proposed. Nothing in this document has been applied to `enrichment.ts`.**

52 questions labelled against the reasoning taxonomy added in Increment 1, with
92 distractor classifications across 10 of the 11 distractor types. Read it, disagree with it, and the corrections
go into the apply step.

---

## What this is, and what it is not

The original tranche is gone. `primaryDimension` occurs **zero times** in
`enrichment.ts` at every commit in this repository's history, `2cbbc43`
included, so the 51 labels described in the handoff never reached git. They
existed only in a working copy that no longer exists, and the script that
produced them was itself only ever committed as a stub. Nothing here is
recovered from that work.

This is a fresh pass over the actual source: all 296 questions were read —
stem, correct answer and key takeaway for every one, then the full option set,
rationale and distractor notes for the 52 selected. No keyword heuristic
assigned a label. Keyword rules were considered and rejected as the selection
mechanism: they find questions containing the word "obligation", not questions
*about* choosing between obligations, and the difference is the entire point.

### The test each label had to pass

> If a learner gets this question wrong, does this label tell us something
> useful about what they need to practise next?

A label that only restates the question's topic fails that test. `II.A` already
records that a question is about privacy law. The dimension has to record what
kind of *thinking* the item demands, which is why several items whose subdomain
is `II.A` are labelled `sequencing` or `material_facts` rather than
`governing_obligation`.

### Coverage

| Primary dimension | Count | Question ids |
| --- | --- | --- |
| `material_facts` | 7 | 090, 110, 124, 126, 142, 181, 231 |
| `governing_obligation` | 7 | 006, 046, 057, 093, 227, 241, 294 |
| `accountability` | 7 | 045, 054, 111, 141, 219, 245, 286 |
| `sequencing` | 7 | 008, 019, 020, 077, 109, 170, 174 |
| `lifecycle_stage` | 6 | 030, 034, 166, 173, 265, 277 |
| `legal_vs_ethical` | 6 | 007, 135, 152, 178, 193, 276 |
| `risk_prioritization` | 6 | 066, 119, 130, 131, 156, 164 |
| `proportionality` | 6 | 084, 136, 182, 192, 201, 249 |
| **Total** | **52** | |

Roughly even by design rather than by accident. An uneven tranche would make
the first pattern-detection experiments measure the tranche instead of the
learner.

### Distractor labelling rule

**Only the tempting wrong options are labelled.** Where a distractor is an
obvious throwaway, it gets nothing. Labelling every wrong option would inflate
the count and teach the engine that every miss is diagnostic, when most misses
on a weak distractor mean only that the learner was guessing.

---

## The tranche

Notation: `A*` marks the correct option. Distractor labels are given by source
letter, which normalization converts to option ids at load, exactly as
`distractorNotes` already does.

### material_facts — which fact in the scenario is decisive

**aigp-090** · II.A · applied — *facial templates are biometric*
Primary `material_facts`, secondary `governing_obligation`. The stem asks which
*characteristic of the data* changes the legal analysis; the whole item is a
sorting exercise over four facts, only one of which changes the category.
- `A` → `missed_material_fact` — collection in physical space is a real fact that changes notice mechanics, not category.
- `C` → `wrong_accountable_party` — who curates the watchlist is a controller question; the learner answered "who is responsible" when asked "what is this data".

**aigp-110** · III.A · applied — *device type as proxy*
Primary `material_facts`. Four features, one without a defensible causal link.
- `C` → `plausible_but_incomplete` — credit-history length genuinely correlates with age, but has a recognised risk rationale. The strongest near-miss in the item.

**aigp-124** · III.A · advanced — *prior interventions contaminate the label*
Primary `material_facts`, secondary `lifecycle_stage`.
- `C` → `missed_material_fact` — volume is a real data concern that does not repair a confounded label.

**aigp-126** · III.A · advanced — *a feature that settles 40 days late*
Primary `material_facts`.
- `A` → `plausible_but_incomplete` — overfitting explains degradation generally, not this specific retrospective/live gap.
- `D` → `missed_material_fact` — population shift ignores the 40-day fact the stem supplies.

**aigp-142** · III.C · advanced — *cancellations count caught errors*
Primary `material_facts`. What a metric is capable of seeing.
- `A` → `plausible_but_incomplete` — pilot length is a fair caution, weaker than a flaw in the metric itself.
- `C` → `missed_material_fact` — the 18% override rate belongs to a different system.

**aigp-181** · III.A · advanced — *one-directional override gap*
Primary `material_facts`.
- `C` → `missed_material_fact` — "objectively harder responses" ignores that the corrections run one way.

**aigp-231** · II.A · advanced — *identifiers removed ≠ anonymous*
Primary `material_facts`, secondary `governing_obligation`.
- `A` → `risk_overreaction` — "privacy law reaches all training data" sweeps in genuinely anonymous data.
- `D` → `wrong_governing_obligation` — invents a supervisory approval regime for anonymisation techniques.

### governing_obligation — which rule actually applies

**aigp-006** · II.A · applied — *PHI engages HIPAA*
Primary `governing_obligation`.
- `A` → `wrong_governing_obligation` — the EU AI Act may apply, but does not displace the sectoral health-privacy regime.
- `B` → `wrong_governing_obligation` — consumer protection reaches automated communications but is not written for PHI. *(Matches the approved decision for Q6 option B.)*

**aigp-046** · IV.C · applied — *business associate agreement*
Primary `governing_obligation`, secondary `accountability`.
- `C` → `wrong_governing_obligation` — an NDA restricts disclosure; it establishes no permitted uses, safeguards or breach duty.
- `D` → `plausible_but_incomplete` — a general processing addendum covers similar ground and lacks the specific required terms.

**aigp-057** · II.A · foundational — *purpose limitation*
Primary `governing_obligation`.
- `C` → `wrong_governing_obligation` — erasure is the right concept family, wrong member of it.

**aigp-093** · II.B · advanced — *product liability*
Primary `governing_obligation`.
- `A` → `wrong_governing_obligation` — consumer protection concerns the claims made, not the injury.
- `D` → `wrong_accountable_party` — employment law points at the employer; the defect sits with the maker.

**aigp-227** · II.A · applied — *training is a new purpose*
Primary `governing_obligation`.
- `B` → `wrong_governing_obligation` — invents a universal anonymise-before-training requirement.

**aigp-241** · II.B · applied — *sector rules apply unchanged*
Primary `governing_obligation`, secondary `legal_vs_ethical`.
- `C` → `wrong_accountable_party` — the burden of justification stays with the regulated firm.
- `D` → `wrong_governing_obligation` — treats AI-specific rules as substitutional rather than additional.

**aigp-294** · II.B · applied — *a licence to read is not a licence to train*
Primary `governing_obligation`.
- `D` → `wrong_governing_obligation` — base-model terms do not propagate to downstream output.

### accountability — who is answerable

**aigp-045** · I.B · advanced — *pre-training data sits with the provider*
Primary `accountability`.
- `B` → `wrong_accountable_party` — the deployer owns the member relationship and has no visibility into the base corpus.
- `C` → `wrong_accountable_party` — merges roles the regime separates precisely so duties attach where knowledge sits.

**aigp-054** · I.B · applied — *deployer duties attach to operating*
Primary `accountability`.
- `B` → `wrong_accountable_party` — developer duties attach to building or training.
- `D` → `wrong_governing_obligation` — role identified correctly, obligations denied. *(Matches the approved decision for Q54 option D.)*

**aigp-111** · I.C · applied — *scope change needs the authorising body*
Primary `accountability`.
- `A` → `wrong_accountable_party` — validating a use is not authorising it.
- `B` → `wrong_accountable_party` — a business approving its own scope extension removes the control.

**aigp-141** · IV.A · advanced — *automation moves who must be named*
Primary `accountability`.
- `A` → `wrong_accountable_party` — assigns accountability by convenience rather than authority.
- `B` → `plausible_but_incomplete` — an identifier traces provenance; the requirement is a person.
- `D` → `risk_overreaction` — abandoning automation treats an evidencing problem as a prohibition.

**aigp-219** · I.B · advanced — *fine-tune and rebrand are provider acts*
Primary `accountability`.
- `B` → `wrong_accountable_party` — over-inclusive: ordinary use does not confer provider status.
- `D` → `wrong_accountable_party` — under-inclusive: treats rebranding as cosmetic.

**aigp-245** · II.C · applied · multi — *deployer vs provider duties*
Primary `accountability`.
- `C` → `wrong_accountable_party` — conformity assessment precedes market placement and is the provider's.
- `E` → `wrong_accountable_party` — post-market monitoring is established by the provider.

**aigp-286** · I.B · applied · multi — *what must have a name*
Primary `accountability`.
- `C` → `plausible_but_incomplete` — attendance is delegable and rotates without consequence.

### sequencing — order of operations

**aigp-008** · III.A · applied — *impact assessment before training*
Primary `sequencing`, secondary `lifecycle_stage`.
- `B` → `plausible_but_incomplete` — representativeness review speaks to fairness but not to the patient-safety half of the stem.
- `D` → `secondary_risk_prioritized` — a retention review addresses a real but different risk. *(Matches the approved decision for Q8 option D.)*

**aigp-019** · IV.C · advanced — *disclosure timing*
Primary `sequencing`.
- `C` → `secondary_risk_prioritized` — auditability is the organisation's problem, not the member's harm.
- `D` → `plausible_but_incomplete` — the closest competing answer: a real coverage gap, but weaker than the timing harm.

**aigp-020** · IV.C · advanced — *preventive control moved after the event*
Primary `sequencing`.
- `A` → `plausible_but_incomplete` — sampling power argues for auditing more, not for why an audit cannot substitute.
- `B` → `secondary_risk_prioritized` — retention exposure is a cost of the proposal, not the reason it fails.

**aigp-077** · IV.B · applied — *assess before you sign*
Primary `sequencing`.
- `A` → `secondary_risk_prioritized` — fee negotiation changes the price of the risk, not the understanding of it.

**aigp-109** · III.C · applied — *establish cause first*
Primary `sequencing`. The clearest `premature_remediation` item in the bank —
three distractors are all defensible responses to causes not yet established.
- `B` → `premature_remediation` — suspension before cause withdraws credit on an unexplained number.
- `C` → `premature_remediation` — notification obligations attach to findings, not signals.
- `D` → `premature_remediation` — retraining assumes the model is the cause.

**aigp-170** · III.A · applied — *purpose compatibility is a gate*
Primary `sequencing`, secondary `governing_obligation`.
- `A` → `plausible_but_incomplete` — volume matters once the use is permitted at all.

**aigp-174** · IV.B · advanced — *stop accrual before repairing*
Primary `sequencing`.
- `A` → `premature_remediation` — notification and redress follow once harm stops expanding.
- `C` → `premature_remediation` — retraining is the durable fix and takes time the affected do not have.
- `D` → `secondary_risk_prioritized` — contractual recovery affects no customer's experience.

### lifecycle_stage — which phase an activity belongs to

**aigp-030** · III.A · foundational — *design-phase activities*
Primary `lifecycle_stage`.
- `B` → `lifecycle_confusion` — monitoring thresholds feel like planning; they are set once normal behaviour can be characterised.

**aigp-034** · III.C · applied — *the interval between release gates*
Primary `lifecycle_stage`.
- `A` → `plausible_but_incomplete` — production-load failure is a symptom of the same gap.

**aigp-166** · IV.C · advanced — *explanation duty outlives the model*
Primary `lifecycle_stage`, secondary `governing_obligation`.
- `A` → `plausible_but_incomplete` — artifact archiving is standard and generally remembered.

**aigp-173** · II.C · applied — *classification expires when use changes*
Primary `lifecycle_stage`, secondary `risk_prioritization`.
- `B` → `risk_overreaction` — inflating every classification wastes assurance capacity.
- `C` → `plausible_but_incomplete` — an external assessor does not make a stale classification current.

**aigp-265** · III.C · applied · multi — *retirement runs both ways*
Primary `lifecycle_stage`.
- `D` → `wrong_governing_obligation` — wholesale deletion destroys the record the retained-explanation duty requires.

**aigp-277** · II.D · foundational — *Measure as distinct from Map*
Primary `lifecycle_stage`.
- `A` → `lifecycle_confusion` — context and cataloguing are Map.
- `D` → `lifecycle_confusion` — prioritising and closing risks is Manage.

### legal_vs_ethical — hard requirement vs commitment

**aigp-007** · II.C · advanced — *certificate vs conformity assessment*
Primary `legal_vs_ethical`, secondary `governing_obligation`.
- `A` → `wrong_governing_obligation` — the note calls it the most tempting and most costly mistake: a process certificate treated as a system determination.
- `D` → `plausible_but_incomplete` — dismissing the certificate entirely understates what it contributes.

**aigp-135** · IV.C · advanced — *is concentration a named harm*
Primary `legal_vs_ethical`.
- `C` → `legal_ethical_conflation` — treats industry practice as the standard rather than the organisation's own commitment.
- `D` → `plausible_but_incomplete` — implementation cost affects how, not whether.

**aigp-152** · I.C · applied — *"fair" needs an operable definition*
Primary `legal_vs_ethical`.
- `B` → `plausible_but_incomplete` — executive ownership assigns responsibility for something still unspecified.

**aigp-178** · I.C · advanced — *trade-off against stated risk appetite*
Primary `legal_vs_ethical`.
- `A` → `missed_material_fact` — complaint clustering is measured evidence too.
- `C` → `legal_ethical_conflation` — a blanket ethical priority replaces the judgement governance exists to make.

**aigp-193** · II.D · applied — *certification ≠ compliance*
Primary `legal_vs_ethical`.
- `A` → `wrong_accountable_party` — a certification body attests; it does not indemnify.
- `B` → `wrong_governing_obligation` — no jurisdiction treats certification as discharging substantive obligations.

**aigp-276** · II.D · foundational — *a framework mapping attests nothing*
Primary `legal_vs_ethical`.
- `B` → `wrong_governing_obligation` — self-assessment is not evidence of compliance.
- `D` → `wrong_accountable_party` — publishing a framework creates no liability for those who apply it.

### risk_prioritization — ranking risks and findings

**aigp-066** · III.A · advanced — *risk mitigation hierarchy*
Primary `risk_prioritization`, secondary `proportionality`.
- `B` → `plausible_but_incomplete` — documenting every risk equally withholds the judgement.
- `C` → `risk_overreaction` — escalating everything exhausts the attention it depends on.
- `D` → `risk_underestimation` — **conflicts with an approved decision; see Open questions.**

**aigp-119** · III.C · advanced — *rank by how a defect meets its control*
Primary `risk_prioritization`, secondary `material_facts`.
- `B` → `secondary_risk_prioritized` — the larger share, but the one the required check reliably surfaces.
- `C` → `risk_underestimation` — "all caught in one sample" read as a guarantee.
- `D` → `risk_overreaction` — a 6% grounding problem read as the model being unfit.

**aigp-130** · III.C · advanced — *severity read together with reachability*
Primary `risk_prioritization`.
- `A` → `secondary_risk_prioritized` — offensive output from contrived prompts is real but bounded by the effort to trigger it.

**aigp-131** · III.C · applied — *order review by consequence*
Primary `risk_prioritization`.
- `B` → `plausible_but_incomplete` — staleness is a useful trigger that treats trivial and critical alike.
- `D` → `secondary_risk_prioritized` — internal dependency measures reach inside, not harm outside.

**aigp-156** · III.C · applied — *report the rare costly class separately*
Primary `risk_prioritization`.
- `A` → `risk_underestimation` — overall accuracy is dominated by the common case.
- `B` → `plausible_but_incomplete` — a larger test set makes a misleading average more precise.

**aigp-164** · IV.A · applied — *order by reversibility*
Primary `risk_prioritization`, secondary `sequencing`. **Ambiguous; see Open questions.**
- `A` → `secondary_risk_prioritized` — licence exposure accrues but is remediable.

### proportionality — matching response to risk

**aigp-084** · I.B · applied — *structure scaled to the organisation*
Primary `proportionality`.
- `A` → `plausible_but_incomplete` — the failure is the weight of the structure, not the mechanism.

**aigp-136** · IV.A · applied — *assurance proportionate to accountability*
Primary `proportionality`, secondary `accountability`. The cleanest
three-distractor spread in the tranche: under, over, and misassigned.
- `A` → `wrong_accountable_party` — contractual responsibility does not transfer accountability for outcomes.
- `B` → `risk_underestimation` — human review catches individual errors, not systematic difference in who is flagged.
- `D` → `risk_overreaction` — withheld analysis is common and manageable.

**aigp-182** · II.C · applied — *governance scales with consequence*
Primary `proportionality`.
- `B` → `risk_underestimation` — identical technology in a higher-stakes use read as an identical question.
- `C` → `wrong_accountable_party` — raising stakes does not transfer accountability to the vendor.
- Option `D` is deliberately left unlabelled — see Open questions.

**aigp-192** · II.C · applied — *what is the worst outcome for the person*
Primary `proportionality`, secondary `risk_prioritization`.
- `A` → `risk_overreaction` — pricing effects matter; a discretionary discount is not an adverse action.
- `B` → `risk_overreaction` — if processing personal data sufficed, the heightened category would swallow the ordinary one.

**aigp-201** · IV.A · applied — *size oversight by reversibility*
Primary `proportionality`.
- `B` → `risk_underestimation` — accuracy affects how often oversight catches something, not how much is warranted.

**aigp-249** · II.C · advanced — *common core, then layer*
Primary `proportionality`.
- `A` → `risk_underestimation` — building to the floor guarantees rework.
- `D` → `risk_overreaction` — the strictest regime everywhere spends effort where nothing requires it.

---

## Resolved decisions — applied

These six were open when the tranche was proposed. Each is now settled and
reflected in `enrichment.ts`. The reasoning is kept rather than deleted, because
a label that was argued over is worth revisiting when learner data arrives.

### 1. `aigp-066` option D — recorded approval overridden

The handoff records **Q66 option D → `premature_remediation`** as explicitly
approved. That label is wrong, and `risk_underestimation` is applied instead.

> **D.** A decision deferred until six months of production data shows how often
> misrouting truly occurs.
>
> *note:* Waiting six months for production data means accepting the risk by
> default while the evidence accumulates from real misroutings.

The option defers action; `premature_remediation` describes acting too early.
The two are opposites, and the option's own note says the learner who picks it
has accepted a risk rather than moved too fast.

Either the approval attached to a different option letter in the lost tranche,
or the reviewer read the option differently — the two cannot be distinguished
from what survived, and the lost labels were never in git to check against. The
override is recorded here rather than silently taken, so anyone reading the
history sees an approval was set aside and why.

### 2. `aigp-164` — `risk_prioritization`, with `sequencing` secondary

The stem asks which risk to address **FIRST**, which reads as sequencing; the
takeaway is "order by reversibility", which is a prioritisation rule. Applied as
`risk_prioritization` primary: the item tests *how to rank*, and the ordering is
the output rather than the skill.

The same tension resolves the other way in `aigp-109` and `aigp-174`, both
labelled `sequencing`, because there the wrong answers fail by acting out of
order rather than by mis-ranking severity. This is a judgement, not a rule —
if pattern data later shows learners miss 164 the way they miss 109, swap it.

### 3. `aigp-182` option D — left unlabelled

> **D.** Teacher overrides must be removed to keep scoring consistent across
> schools.

A remediation that attacks the wrong thing and destroys the control that
surfaced the problem. `premature_remediation` implies acting before diagnosis;
`risk_overreaction` implies excessive caution, which is the reverse. Neither
fits, so the option carries no label.

Forcing it would have taught the engine a pattern that is not there. If this
shape recurs across the bank it argues for a taxonomy addition — a bigger
decision than this tranche, and one that should be driven by several examples
rather than this one.

### 4. `aigp-007` — `legal_vs_ethical`, with the other two certificate items

Applied as `legal_vs_ethical` alongside 193 and 276. The item distinguishes a
voluntary certificate from a legal conformity obligation, which is a
requirement-versus-commitment distinction. `governing_obligation` was arguable,
since the error concerns which instrument discharges which duty. The three
certificate items move together or not at all.

### 5. `lifecycle_stage` — kept as one dimension

`aigp-030`, `034`, `166` and `265` concern the *product* lifecycle; `aigp-277`
concerns the NIST AI RMF's *functions* — Map, Measure, Manage, Govern. Both are
"which phase does this belong to" reasoning and both use `lifecycle_confusion`
distractors, so they stay one dimension.

Splitting them on a hunch would double a dimension before any evidence that
learners miss the two kinds differently. Revisit only if that evidence appears;
`aigp-277` is the only item here that would move.

### 6. Q5, Q49 and Q98 — deferred to a second tranche

Three of the seven approved distractor decisions concern questions outside this
tranche: **Q5 option B**, **Q49 option B**, **Q98 option D**. They are not
adopted here. The tranche was selected on instructional quality, and
reverse-engineering it to house surviving fragments of a lost review produces a
set that measures neither the learner nor the taxonomy.

Of the four approvals that are here, **Q6 B**, **Q54 D** and **Q8 D** are
adopted as approved and independently check out against the option text.
**Q66 D** is the override above.

---

## What is applied, and what is still not

Applied: `reasoning` blocks on 52 of the 296 enrichment entries — 52 primary
dimensions, 15 secondary, 92 distractor labels across 10 of the 11 distractor
types. Insertions only; no existing line was changed.

Still deliberately absent:

- **No Increment 3.** No pattern detection, no targeted practice, no
  question-level reasoning observation in feedback. The labels are inert data
  until that is built.
- **No UI, scoring, progress, readiness, adaptive, review or persistence
  change**, and no PDF change of any kind.
- **No user-facing exposure of the taxonomy.** `material_facts` and
  `governing_obligation` are engine vocabulary. Nothing implies a learner should
  ever read those strings.
- **No widening of the tranche.** The remaining 244 questions carry no
  `reasoning` block, and `src/content/reasoning-labels.test.ts` fails if that
  count moves, so widening cannot happen by accident.

## What protects the labels

`src/content/reasoning-labels.test.ts` runs against the real bank rather than a
fixture, because the thing being protected is the content. It fails when:

- the tranche size moves off 52, or the bank off 296
- a label names an option letter the question does not have — the letter-to-id
  conversion is silent on failure, so such a label would simply vanish
- a distractor type sits on a **correct** option, which would teach the engine
  that choosing the right answer is a reasoning error
- a labelled question has a dimension but no per-option labels
- a value falls outside the taxonomy, or a secondary repeats the primary
- the tranche stops being 6–7 questions per dimension

The first two failure modes were mutation-tested: both assertions were confirmed
to fail on a deliberately broken label before being relied on.
