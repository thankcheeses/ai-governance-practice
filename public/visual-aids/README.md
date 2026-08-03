# Visual aid assets

Static diagrams referenced by `visualAid.src` in
`src/content/tracks/aigp-preparation/enrichment.ts`.

## Wired diagrams

| File | Question | Type |
| --- | --- | --- |
| `value-chain-responsibility-map.png` | 45 — foundation model responsibility | `responsibility-map` |
| `disclosure-before-phi-workflow.png` | 19 — disclosure before PHI | `workflow` |

Both are composed diagrams supplied by the product owner. Attaching another one
means adding a `visualAid` block to that question's entry in `enrichment.ts` and
dropping the file here — `questions.json` is never touched.

## `components/`

Individual icons the composed diagrams were assembled from. **Nothing in this
folder is referenced by the app.** They are kept as source pieces so future
diagrams can be assembled from a consistent set.

They are deliberately not wired to any question: a lone icon next to a question
is decoration, and the design rule is that a visual must explain sequence,
responsibility, architecture, decision flow, or failure points. Composing new
diagrams from these is an authoring decision, not an implementation one.
