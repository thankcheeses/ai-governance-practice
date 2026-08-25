<div align="center">

<img src="docs/assets/hero-governance-orbit.png" alt="AI Governance Practice — build practical judgment for responsible AI decisions. A glass shield orbited by four cards: Facts, Obligations, Risks, Action." width="100%" />

# AI Governance Practice

**Practice the judgment behind responsible AI decisions.**

A visual, scenario-based study aid for people who want to get better at turning
AI governance principles into practical action.

[![Try the live app](https://img.shields.io/badge/Try_the_live_app-1a2332?style=for-the-badge&logoColor=white)](https://thankcheeses.github.io/ai-governance-practice/)
&nbsp;
![296 original scenarios](https://img.shields.io/badge/296-original_scenarios-6b7fd7?style=for-the-badge)
&nbsp;
![No account required](https://img.shields.io/badge/no_account-required-4a9d7f?style=for-the-badge)

</div>

---

## What is this?

AI governance is not just knowing the vocabulary. It is knowing what to notice,
who is responsible, what could go wrong, and what to do next.

**AI Governance Practice** gives you realistic situations and asks you to make
the call. You choose an answer, see the reasoning, and build a repeatable way of
thinking that carries into real governance work.

|  |  |  |
| :---: | :---: | :---: |
| **296** | **4** | **0** |
| original scenarios | governance passes | accounts required to start |

---

## The four-pass method

Every scenario can be read through the same four passes. This keeps you from
jumping to a familiar framework before understanding the situation in front of
you.

| Pass | The question it asks |
| --- | --- |
| **01 · Facts** | What is actually happening? |
| **02 · Obligations** | What is required, and by whom? |
| **03 · Risks** | What could harm people or the organization? |
| **04 · Action** | What is the narrowest defensible next step? |

<details>
<summary><strong>How a single question actually plays out</strong></summary>

<br />

| Step | What you do |
| --- | --- |
| **01 · Notice** | Read the situation without jumping to a framework. |
| **02 · Reason** | Separate obligations from assumptions. |
| **03 · Choose** | Pick the narrowest defensible response. |
| **04 · Learn** | Review the rationale and carry the lesson forward. |

The app is intentionally calm and readable: one scenario, four answer choices,
clear feedback, and enough explanation to understand *why* an answer is
defensible. Progress begins in the browser, so you can start immediately
without signing up.

</details>

---

## What you can explore

The current track contains **296 original scenarios** across four areas:

| Track | What it gives you |
| --- | --- |
| **Foundations of AI Governance** | Shared vocabulary, roles, accountability, and governance structure. |
| **Laws, Standards, and Frameworks** | A way to distinguish obligations, standards, and voluntary guidance. |
| **Governing AI Development** | Design choices, evaluation, controls, and risk reduction. |
| **Governing AI Deployment and Use** | Oversight, transparency, incidents, monitoring, and impact. |

The content touches responsible AI, risk identification, accountability,
transparency, explainability, human oversight, fairness, monitoring, incidents,
lifecycle controls, and practical governance decisions. It is built for
judgment — not rote memorization.

---

## How it works as a product

Focused study sessions, domain practice, a review queue, progress tracking, and
a timed practice sitting. The motivational layer stays deliberately light: a
daily goal, a streak, and the satisfaction of getting better at the hard
questions.

> **Small loop. Better judgment. Repeat.**

The interface is mobile-first, works without an account, and keeps progress
locally on the device. Optional sign-in adds synchronization across devices.

---

## Run it locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. **No environment variables are required** for
the core study experience.

<details>
<summary><strong>Other commands</strong></summary>

<br />

```bash
npm run build          # server build — local preview only
npm run build:pages    # static export for GitHub Pages
npm run build:mobile   # static export for the Capacitor app
npm run check          # lint, typecheck, tests, and content checks
npm test               # unit tests
```

</details>

---

## Practice exam mode

Exam mode is an **independent timed simulation** over the same original
questions. It **samples** from the bank, so no two sittings are identical — it
is not a fixed form.

- Multi-select grades **all-or-nothing**; unanswered questions count as incorrect.
- Options are dealt fresh letters each sitting, and correctness is stored against
  option identity, so no answer can be memorised as a letter.
- The clock scales with length at a constant pace: 25 questions in 45 minutes,
  50 in 90, 100 in 180.

> [!NOTE]
> **That pace is this project's own choice.** It has not been verified against
> any official published figure and is not presented as one. Exam mode does not
> reproduce any certification exam and does not predict a result.

## Content quality

Question changes are governed by
[`docs/CONTENT-QUALITY-CONTRACT.md`](docs/CONTENT-QUALITY-CONTRACT.md) and
enforced by `npm run check:content`, which fails on missing metadata, broken
answer keys, degenerate multi-select, unlocatable sources, missing or stub
distractor notes, skewed answer positions, length bias, similarity, and stale
coverage documentation.

```bash
npm run check:content   # content invariants
npm run release:gate    # the above + lint, types, tests, both builds
```

## Deployment

The app is a static export — no server, no API routes, no middleware — so
GitHub Pages hosts all of it. Supabase is called straight from the browser, and
its Edge Functions are hosted by Supabase.

Pushing to `main` runs
[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml),
which builds and publishes.

- Set **Settings → Pages → Source** to **GitHub Actions** once.
- Optional `NEXT_PUBLIC_*` values go in **Settings → Secrets and variables →
  Actions → Variables** — *variables, not secrets*. Every `NEXT_PUBLIC_*` value
  is inlined into the browser bundle at build time, so none of them may hold a
  secret, and changing one needs a new workflow run to take effect.

Full notes, including the base-path rules a project site imposes, are in
[`docs/mobile-release.md`](docs/mobile-release.md).

---

## Original content

All questions, scenarios, rationales, and takeaways in this project are
**independently written** educational material. They are not copied from
certification examinations, proprietary question banks, or official training
resources.

The project discusses public frameworks, standards, and regulations — including
the NIST AI Risk Management Framework, the EU AI Act, and ISO/IEC 42001 — only
as subject matter for learning. Mentioning them does not imply affiliation,
endorsement, certification, or formal compliance.

> [!IMPORTANT]
> **Study-aid disclaimer.** This is a free supplemental study aid for
> professional development. It is not an official certification resource,
> course, training program, or substitute for primary preparation materials. It
> is not affiliated with or endorsed by any certification organization. It does
> not contain actual certification examination questions and does not guarantee
> examination success.

---

## Contributing

Found a bug? Have an accessibility improvement? Want to suggest an original
governance scenario? Open an issue and describe what you noticed.

> [!WARNING]
> Please do not submit recalled, copied, confidential, or proprietary
> examination material.

---

## Project status

The live product is available at
**[thankcheeses.github.io/ai-governance-practice](https://thankcheeses.github.io/ai-governance-practice/)**.
The repository is being actively shaped as a public portfolio project, with new
content and visual refinements added as the learning experience evolves.

---

<div align="center">

**Built to make governance judgment feel practiceable.**

[**Start a scenario →**](https://thankcheeses.github.io/ai-governance-practice/)

<br />

<sub>AI Governance Practice is an independent educational project.<br />
Framework and organization names belong to their respective owners.</sub>

</div>
