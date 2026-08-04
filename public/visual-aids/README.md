# Visual aid assets

Static diagrams referenced by `visualAid.src` in
`src/content/tracks/aigp-preparation/enrichment.ts`.

## Wired diagrams

| File | Question | Type |
| --- | --- | --- |
| `value-chain-responsibility-map.webp` | 45 — foundation model responsibility | `responsibility-map` |
| `disclosure-before-phi-workflow.webp` | 19 — disclosure before PHI | `workflow` |

Both are composed diagrams supplied by the product owner, stored as WebP at
quality 92. Attaching another one means adding a `visualAid` block to that
question's entry in `enrichment.ts` and dropping the file here —
`questions.json` is never touched.

Everything in `public/` ships inside the native app bundle, so keep this folder
to assets a question actually references. The eleven source icons the two
diagrams were assembled from were removed in the release-hardening pass: they
totalled 3.6 MB, nothing imported them, and they were padding every install.
The originals are in the repository history and in the product owner's source
files if a future diagram needs them.

A lone icon is not a visual aid. The rule is that a diagram must explain
sequence, responsibility, architecture, decision flow, or failure points —
composing one is an authoring decision, not an implementation one.
