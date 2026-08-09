# Brand assets

The three assets from the 3D render set that have a real use, kept apart from
the reference kit in [`../ui-kit/`](../ui-kit/) so the distinction is obvious.

**Source:** Grok Imagine 3D render set, August 2026.
**Palette:** navy `#0F172A`, teal `#14B8A6`, soft cyan `#67E8F9`, metallic
silver accents.

| File | Dimensions | Use |
|---|---|---|
| `logo-nhid-clinical-wordmark-3d.webp` | 1400×466 | The NHID Clinical lockup — mark plus wordmark. Store listings, marketing pages, documents. |
| `logo-nhid-clinical-mark-3d.webp` | 1200×1195, **transparent** | The geometric mark alone. Splash, onboarding, empty states. The alpha channel is intact, so it composites cleanly on the warm light and warm dark surfaces both. |
| `shield-keyhole-3d.webp` | 1200×1200 | Medical shield with keyhole. The richest identity prop in the set — for marketing, store screenshots, or a future identity-disclosure visual aid. |

## What these do not replace

`src/components/app/brand-mark.tsx` stays as it is. The flat SVG shield is the
mark used in the header, the sidebar and everywhere else the app identifies
itself, and it is the right one there: it inherits `currentColor`, scales
without a raster, weighs nothing, and belongs to the monospace, flat, 4px-radius
system the product is built in.

These are for the places a product *presents* itself rather than operates —
a splash screen, a store listing, a slide. Using one as app chrome would put the
NHID navy-and-teal palette next to the product's warm surfaces and Apple-blue
accent, which are unrelated colour systems.

None of these files is currently referenced by any component. That is
deliberate; see [`../ui-kit/README.md`](../ui-kit/README.md) for the reasoning
and for the rule about opt-in props if a richer treatment is ever wanted
in-app.
