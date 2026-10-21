# Mascot

The study coach on the flashcards: the product owner's own illustrated
character, supplied by them in October 2026. Used by
`src/components/app/mascot.tsx`.

| File | Size | Use |
|---|---|---|
| `mascot-think.webp` | 384×384 | Flashcard front — "say it before you flip" |
| `mascot-smile.webp` | 384×384 | Flashcard back, "Remember this", deck complete |
| `mascot-desk.webp` | 1200×675 | Deck-complete banner |
| `mascot-gate.webp` | 1200×675 | Nothing-due screen |

Converted from the supplied JPEG/PNG to WebP (portraits at quality 86, scenes
at 80) so the four together stay under 200 KB in the app bundle. Every use is
decorative (`alt=""`): the words next to her carry the meaning.
