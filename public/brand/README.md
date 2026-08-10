# Brand assets

The assets from the 3D render set that have a real use, kept apart from the
reference kit in [`../ui-kit/`](../ui-kit/) so the distinction is obvious.

**Source:** Grok Imagine 3D render set, August 2026.
**Palette:** navy `#0F172A`, teal `#14B8A6`, soft cyan `#67E8F9`, metallic
silver accents.

| File | Dimensions | Alpha | Use |
|---|---|---|---|
| `logo-nhid-clinical-mark-3d.webp` | 1200×1195 | **yes** | The geometric mark alone — the only file in the set that reads on light *and* dark. Wired to the splash route in #22. |
| `logo-nhid-clinical-wordmark-3d.webp` | 1400×466 | no — `#f6f6f6` | The original lockup as rendered. Fine on a near-white page. |
| `logo-nhid-clinical-wordmark-3d-alpha.webp` | 1400×466 | **yes** | The same lockup with the background removed. |
| `shield-keyhole-3d.webp` | 1200×1200 | no — `#ffffff` | Medical shield with keyhole, as rendered. |
| `shield-keyhole-3d-alpha.webp` | 1200×1200 | **yes** | The same shield with the background removed. |

## The alpha variants, and what they are actually good for

Only the mark came out of the render set with an alpha channel. The wordmark and
the shield were baked onto flat `#f6f6f6` and `#ffffff`, which is why neither
could be placed on a page without showing a hard rectangle. The `-alpha`
variants fix that. The originals are kept byte-identical beside them.

**They are light-ground assets.** Removing the background does not change the
art, and the art is dark navy. Measured against the app's own surfaces:

| Asset | on warm light `#f7f5f5` | on warm dark `#201d1d` |
|---|---|---|
| wordmark | median **6.56:1** | median **2.35:1** — 56% of the art below 3:1 |
| shield | median **7.88:1** | median **1.96:1** — 58% of the art below 3:1 |

So: use them on white, near-white, or any light marketing surface. On a dark
ground they are legible only as a silhouette. The mark is the exception — it
carries enough teal and pale blue to hold up on both, which is why it is the one
in the product.

### How the background was removed

Worth recording, because the obvious method is wrong. A global white colour key
punches holes in the shield: its chrome rim and specular highlights contain true
`#ffffff` *inside* the object. The background was instead found by **connected
flood fill from the image border**, so interior whites are unreachable and
survive.

Anti-aliased edge pixels were already blended with the old background
(`P = a·C + (1−a)·B`). Left at full alpha they keep that tint and read as a
bright fringe on a dark ground, so the edge band is unpremultiplied: the object
colour is estimated from opaque neighbours, alpha solved per pixel, and the
recovered colour written back instead of the blended one.

Verified after extraction: zero enclosed transparent pixels (no holes), and rim
luminance sits *between* the ground and the object on both themes rather than
above both, which is what a halo would look like.

## What these do not replace

`src/components/app/brand-mark.tsx` stays as it is. The flat SVG shield is the
mark used in the header, the sidebar and everywhere else the app identifies
itself, and it is the right one there: it inherits `currentColor`, scales
without a raster, weighs nothing, and belongs to the monospace, flat,
4px-radius system the product is built in.

Where a rendered treatment is used at all it is opt-in, and confined to the
splash. Everywhere the product *operates* rather than *presents* — including
empty states, which `README.md` §11 covers explicitly — keeps the flat mark.

## Weight

`public/` is copied wholesale into the static export that Capacitor wraps, so
everything here is paid for on every device install. This folder is 260 KB, of
which the two `-alpha` variants are 105 KB and have **no in-app consumer** —
they exist for store listings, marketing pages and documents.

That is a deliberate trade, not an oversight. If the install size ever matters
more than the convenience of keeping brand assets together, these two are the
first things to move out of `public/`.
