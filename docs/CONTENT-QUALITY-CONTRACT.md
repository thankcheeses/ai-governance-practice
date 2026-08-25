# Content quality contract

This document is binding on anyone changing the question bank, including future
maintainers and any AI assistant asked to add questions.

It exists because every rule below was broken at least once in this project's
history, and each break survived review until something automated found it.

**Run `npm run check:content` before any content change is committed.**
`npm run release:gate` runs that plus lint, types, tests and both builds.

---

## 1. What this project is

An **independent** AI governance study resource. It is not affiliated with,
endorsed by, sponsored by, or representative of the IAPP or any other
certification body.

The following are permanently prohibited and are machine-checked where a
machine can check them:

| Prohibited | Why |
| --- | --- |
| Recalled or reproduced certification exam questions | The bank is original by construction. Importing recalled material would destroy that and expose the project. |
| Any claim to predict a certification result | The scoring here measures performance on this bank and nothing else. |
| Any implication of IAPP affiliation or endorsement | Untrue. |
| Describing exam mode as a replica of a real exam | It is an independent timed simulation over original questions. |
| Fabricated citations | A source that cannot be located is worse than no source. |
| Invented terminology presented as established | See §6. |

No question may be added **merely to increase the item count.** A question that
does not teach a distinct governance judgement does not belong in the bank
regardless of how many gaps it appears to fill.

---

## 2. Every question must carry

- a unique id
- question text
- at least three options, no two with identical text
- a correct answer whose ids all reference real options
- `domain` — one of the four track domains
- `bokSubdomain` — one of the thirteen BoK competencies
- `difficulty` — `foundational`, `applied` or `advanced`
- `rationale` — at least 80 characters, and it must actually justify the key
- `keyTakeaway` — the portable lesson, at least 40 characters
- `sources` — see §4
- `distractorNotes` — one per wrong option, see §5
- `tags`

Enforced by: `scripts/check-content.ts`.

---

## 3. Answer-key integrity

- Correct ids must reference options that exist.
- No duplicate option ids, no duplicate option text, no option listed correct twice.
- **No degenerate multi-select.** A multi-select where every option is correct
  is a free mark.
- Multi-select grades on **strict set equality** — all of the correct options and
  none of the others. Partial credit is never awarded.
- Unanswered questions score as incorrect.
- Multi-select items need at least four options.

Enforced by: `scripts/check-content.ts` and `src/lib/grading.ts` tests.

### Answer-position distribution

The application deals fresh letters every session and stores correctness against
option **identity**, so the letter in the source file never reaches a learner.
The stored distribution still matters, because the repository is public and the
bank is meant to be inspected.

At one point the stored keys were **B 69%, C 3%, D 0%** across 150 consecutive
questions. No learner was affected; any reviewer opening `questions.json` would
reasonably have concluded the keys were mechanically generated.

**No answer position may hold more than 40% or less than 12% of single-select
keys.**

---

## 4. Sources

Every source must name a real instrument a learner can go and read.

**Rejected:** `HIPAA Privacy Rule`, `FTC guidance`, `EU guidance`, `guidance on…`,
`industry best practice`, anything under 12 characters.

**Accepted:** `Health Insurance Portability and Accountability Act — business
associate contracts (45 CFR 164.504(e))`, `EU AI Act Art. 43 (conformity
assessment procedures)`, `NIST AI RMF (Manage 4.1: incident response)`.

Name the instrument **and** the part of it. If a more specific authoritative
instrument can be named than the one you reached for, name that one instead.

A source must support the rationale's actual claim. Do not cite a framework
that is merely adjacent to the topic.

---

## 5. Distractors

**Distractors must not be obviously wrong.** The standard is:

> plausible but inferior under the facts of the scenario

A distractor a candidate can eliminate without knowing any AI governance tests
alertness, not judgment, and inflates scores on a bank whose entire claim is
that it exercises judgment. Options such as "a marketing brochure" or "the
corporate travel and expenses policy" have appeared here and were removed.

Prefer distractors that are:

- correct answers to a slightly different question
- right actions taken at the wrong time
- real instruments applied to the wrong object
- the defensible-but-second-best option

### Distractor notes: the two-part standard

Each note should say, in order:

1. **what the distractor gets right** — the real concern, instrument or reasoning it reflects
2. **why it is still inferior** — premature, incomplete, addressed to the wrong party, or answering a different question

This is a core pedagogical principle. A learner who chose that option needs to
understand why it was tempting, not merely be told it was wrong.

Enforced by: a 45-character floor per note, and a **ratchet** on the share of
notes making a concessive move. The ratchet is a proxy — no regular expression
judges meaning — so it is used to stop the share falling, not to grade any
individual note.

---

## 6. Terminology

**Never present invented vocabulary as established industry terminology.**

A question in this bank once tested the definition of a "pre-data gate," a term
appearing in no published body of knowledge, standard or regulation. A candidate
who learned it acquired a word no examiner or practitioner would recognise.

If a concept is real but unnamed in the literature, describe it. Do not coin a
term and test it.

Internal or company-specific vocabulary must not appear in content or metadata.

---

## 7. Coverage

- All **thirteen** BoK competencies must remain represented.
- Domain percentages must be computed against the **whole bank** and sum to 100%.
  A previous version divided domain counts by the single-select count and
  reported shares summing to 116%.
- `docs/bok-maintenance.md` must record the current bank size. A stale count
  (it once said "82/82 questions mapped" against a bank of 296) fails the gate.

Coverage is compared against the blueprint by **share**, not by raw count,
because the bank is several times the size of the exam it is measured against.

Do **not** manipulate `bokSubdomain` assignments to move a percentage. Reassign
only when the question genuinely tests the other competency, or rewrite the
question so that it does.

---

## 8. Similarity

- No exact duplicates.
- No high stem overlap — `npm run check:originality` flags pairs for human review.
- **Conceptual duplicates matter more than string similarity.** `aigp-007` and
  `aigp-064` once both asked which standard is the certifiable AI management
  system, with different wording and different distractors. String similarity
  found nothing.

Before adding a question, ask what judgment it tests that no existing question
tests. If the answer is "the same one, in a different sector," rewrite it.

---

## 9. Metadata integrity

Enrichment lives in a sidecar keyed by question id. It must correspond to the
question it annotates:

- a distractor note must never attach to a correct option
- notes are authored by **letter** and converted to option **identity** at load,
  so any reordering of options must remap them in the same change
- `bokSubdomain`, `domain`, `difficulty` and `sources` must describe the
  question as it currently reads, not as it read before it was rewritten

---

## 10. Exam mode

Exam mode is an **independent timed practice simulation**. It must remain:

- randomised and seeded, with option order dealt per session
- correctness keyed to option identity, never to a letter
- strict all-or-nothing on multi-select
- scoring unanswered questions as incorrect
- resume-safe across a refresh
- explicit that it is not a replica of any certification exam

It **samples** from the bank. Do not describe it as a fixed form.

**The 180-minute default for the 100-question sitting is this project's own
assumption, not a published figure.** It has not been verified against any
official source and must not be presented as official. Timing scales with length
at a constant pace. If an authoritative published figure is ever obtained, update
the constant and say where the figure came from.

---

## 11. If you are an AI assistant reading this

You are subject to every rule above. In particular:

- Do not invent a source to satisfy the sources requirement. If you cannot name
  a real instrument and its section, say so and leave the question out.
- Do not invent terminology.
- Do not weaken a check in `scripts/check-content.ts` to make a change pass. If
  a check fires, the content is wrong until proven otherwise — that is what
  happened with nine sources the check rejected, and the check was right.
- Do not add questions to reach a number.
