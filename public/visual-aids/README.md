# Visual aid assets

Static diagrams referenced by `visualAid.src` in
`src/content/tracks/aigp-preparation/enrichment.ts`.

## Wired diagrams

| File | Question | Type |
| --- | --- | --- |
| `value-chain-responsibility-map.webp` | 45 — foundation model responsibility | `responsibility-map` |

Supplied by the product owner, stored as WebP at quality 92. Attaching another
one means adding a `visualAid` block with a `src` to that question's entry in
`enrichment.ts` and dropping the file here — `questions.json` is never touched.

## Not wired

`disclosure-before-phi-workflow.webp` is unreferenced. This table previously
listed it against question 19; nothing in `src/` ever pointed at it, so question
19 rendered without a figure while the table claimed otherwise.

It was not re-attached, for two reasons. It is a rendered, cool-palette
illustration, and the root `README.md` "Visual language" rule 2 keeps that
treatment off surfaces the product is operated on — a question screen is one.
More importantly it argues the wrong thing: it depicts a *missing* disclosure,
while question 19 turns on a disclosure that arrives *late*. Question 19 now
uses the inline `disclosure-timing` figure, which draws the same disclosure at
two positions on one sequence.

The file is kept because it stays usable for marketing and store listings, where
rendered treatments are allowed. If it is ever retired, delete it here and drop
this section.

## Inline figures

Diagrams drawn in `src/components/study/diagrams.tsx` are referenced by
`visualAid.figure` rather than `src`. They cost no network request, cannot 404,
and inherit the theme. Prefer one unless the figure genuinely has to be a
raster.

Everything in `public/` ships inside the native app bundle, so keep this folder
to assets a question actually references. The eleven source icons the two
diagrams were assembled from were removed in the release-hardening pass: they
totalled 3.6 MB, nothing imported them, and they were padding every install.
The originals are in the repository history and in the product owner's source
files if a future diagram needs them.

A lone icon is not a visual aid. The rule is that a diagram must explain
sequence, responsibility, architecture, decision flow, or failure points —
composing one is an authoring decision, not an implementation one.
