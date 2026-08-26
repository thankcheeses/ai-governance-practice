# Known issues

What is broken, what was broken and is now fixed, and what cannot be verified
from a development environment at all. Each entry carries the measurement that
justifies its status, so a later reader can re-run it rather than take this
document's word.

The rule this file exists to enforce: **a hypothesis is not a diagnosis.** Three
plausible explanations for the hydration error below were wrong, and each looked
right until it was measured.

---

## Fixed — intermittent React error #418 on reload

**Status:** fixed in `src/app/layout.tsx`. Kept here because the three failed
hypotheses are more useful than the fix.

### Symptom

`Minified React error #418` — *"Hydration failed because the server rendered
HTML didn't match the client"* — in the console on roughly a third of page
reloads of the production build. Recoverable: React regenerated the tree and the
page rendered correctly, so nothing was visibly wrong. It was still an
unexplained error on a public site, and an unexplained error trains everyone to
ignore the console.

### Why it took three attempts

It reproduces only on a **reload**, never on a cold first load. Every early
attempt to reproduce it used a fresh browser context per trial, which only ever
exercises the first load — so the first several measurements said the bug did
not exist.

| Harness | Result |
|---|---|
| Fresh context, single cold load, 6 routes | **0/42** |
| Fresh context, cold load, `next start` build | **0/24** |
| Fresh context, cold load, `next dev` | **0/8** |
| Load, wait for the worker to control the page, **then reload** | **reproduces** |

### The three hypotheses, and how each died

**1. The service worker's `skipWaiting`/`clients.claim`.** Removing them left
the rate unchanged (3/8). Reverted.

**2. The service worker serving the wrong route's document.** The offline
fallback returned the landing page's HTML for any uncached navigation, which for
a prerendered-per-route export is a whole-document mismatch. Gating it on
`navigator.onLine === false` did not change the rate (3/12). The decisive test
was to disable navigation interception entirely: the rate went **up**, to 6/12.
Refuted.

The stronger version of the same test: capture the document body of both the
first load and the reload on a failing trial and compare them. They were
**byte-identical** (32128/32128). The worker was never serving anything else.

**3. Client state written by the first visit** (progress, onboarding, theme)
diverging from the prerendered HTML. Killed by bisecting routes: `/terms/` — a
static legal page with no `AppGate`, no progress provider gating, no auth —
reproduced at **4/10**, the highest rate of any route measured.

### The actual cause

Diffing the pre-hydration DOM against the post-hydration DOM on a failing trial
pointed straight at `<head>`: every `<link rel="preload" as="font">` present
before hydration was **gone** afterwards, and the stylesheets and scripts had
been re-inserted in a different order.

React 19 treats `<head>` as a set of hoistable resources and reconciles that set
during hydration. The theme-init `<script>` was rendered as a child of `<head>`
in the root layout, so it took part in that reconciliation. On a warm reload the
browser's head no longer matches the one React expects — font preloads it has
already consumed are gone — and the reconciliation mismatches.

`suppressHydrationWarning` on `<html>` does not help: it applies to the element
it is set on, not to descendants.

### The fix, and the fix that looked right and was not

Move the script out of `<head>` and make it the first child of `<body>`.

`next/script` with `strategy="beforeInteractive"` is the obvious candidate and
is **wrong here**. In the App Router it does not inline the script; it emits a
`self.__next_s.push(...)` record that the Next runtime executes once the
framework bundle has loaded — after first paint. Measured: with it, a stored
dark theme still painted light on the first animation frame. A plain inline
`<script>` runs synchronously as the parser reaches it, before any paintable
element below it exists.

### Result

| Route | Before | After |
|---|---|---|
| `/terms/` | 4/10 | **0/12** |
| `/home/` | 5/10 | **0/12** |
| `/study/` | 3/10 | **0/12** |
| `/settings/` | 1/10 | **0/12** |
| `/` | 1/10 | **0/12** |

Both properties verified after the change: no hydration error across 60
worker-controlled reloads, and `data-theme` is `dark` at the first animation
frame with a dark preference stored, so the no-flash guarantee is intact.

### Reproducing it

The measurement harness is not in the repository — it is a dozen lines of
Playwright and belongs with the investigation, not the product. The shape that
matters:

1. Build the Pages target and serve `out/` under the base path.
2. Per trial: new browser context, load a route, wait for
   `navigator.serviceWorker.controller` to be non-null, **then** reload.
3. Count console errors and page errors matching `Minified React error #418`.

A fresh context per trial without the reload will report zero every time.

---

## Cannot be verified from this environment

These are not defects. They are claims this project cannot check from a
development container, listed so that nobody mistakes an unverified claim for a
verified one.

### The practice-exam clock — UNVERIFIED

`src/lib/exam.ts` sets a per-question pace and derives the sitting length from
it. **This is the project's own pacing choice, not an official figure.** The
IAPP's published exam duration could not be checked: the egress policy blocks
`iapp.org`. The exam screen says so in as many words rather than implying the
number is authoritative, and nothing in the product may present it as one.

### The Body of Knowledge weighting — PARTIALLY VERIFIED

Every question maps to one of the 13 AIGP BoK v2.1 competencies, and
`scripts/check-content.ts` fails the build if any competency is unmapped. What
cannot be verified here is whether the *proportions* match IAPP's published
blueprint weighting, for the same egress reason. The bank is balanced against
its own domain shares, which is a different and weaker claim.

### The live deployed site — UNVERIFIED

`github.io` is egress-blocked, so no measurement in this repository was taken
against the deployed page. Everything above was measured against a local server
serving the same `out/` directory the workflow uploads. That is the same bytes,
but it is not the same CDN, and it is not proof the live site renders.

### Content review by a second AIGP holder — NOT DONE

296 items, written and reviewed by one person. The release gate enforces
structure — sourcing, distractor quality, answer-position balance, length
bias — and structure is not accuracy. An item can satisfy every check and still
be wrong about the law. This is the largest open risk in the project and no
amount of further tooling closes it.

---

## Open, accepted

### `npm run check` exits non-zero on the originality flag

`scripts/check-originality.mjs` flags `aigp-149` ↔ `aigp-289` as near-duplicates.
They are: both ask what relying on legitimate interests under GDPR requires, and
both answer "documented balancing test". The flag is correct and is left red on
purpose — see `docs/bok-maintenance.md`. `npm run release:gate` does not depend
on it.
