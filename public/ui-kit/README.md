# 3D UI kit — reference set

A rendered set of buttons, frames, bars, shields and modular shapes in the
NHID-Clinical palette.

**Source:** Grok Imagine 3D render set, August 2026.
**Palette:** navy `#0F172A`, teal `#14B8A6`, soft cyan `#67E8F9`, metallic
silver accents.

---

## These are reference assets, not UI chrome

Nothing in this folder is wired into a React component, and nothing here should
be. The product's visual language is **OpenCode Terminal Mono** — monospace,
flat colour, 4px radius, restrained borders, "the tool is the interface". These
renders are the opposite of that by construction: glossy, bevelled, chromed.

Two concrete reasons to keep the separation, beyond taste:

1. **The palette does not match the product.** The app's surfaces are warm
   (`#201d1d` dark, `#f7f5f5` / `#fdfcfc` light) and its accent is Apple blue
   `#007AFF`. These assets are cool navy and teal. Dropping one into a screen
   puts two unrelated colour systems on it at once.
2. **The interactive components are real components.** Buttons, frames and bars
   here are pictures of buttons. `src/components/ui/button.tsx` renders a
   button that focuses, disables, and responds to a keyboard. An image cannot
   do any of that, and swapping one in would cost accessibility to gain gloss.

So: use them to look at, to compose a marketing image, or to brief a designer.
Do not import them into `src/components/ui/`.

## Where 3D treatment *is* appropriate

Splash and onboarding, empty states, store listing screenshots, marketing
pages, and a possible future "identity disclosure" visual aid. The two logo
treatments and the keyhole shield live in [`public/brand/`](../brand/) for
exactly those uses.

If a richer treatment is ever wanted inside the app, it should arrive as an
opt-in prop on a component with the flat treatment as the default — never as a
replacement for `BrandMark`.

## Contents

All files are WebP. The source set was 9.4 MB of JPEG/PNG; everything here
totals about 400 KB, because `public/` ships in both the web deployment and the
Capacitor native bundle — see "Weight" below.

### Shields — identity and domain marks

| File | What it shows |
|---|---|
| `shield-network-3d.webp` | Shield with a node-graph mark |
| `shield-data-3d.webp` | Shield with stacked data blocks |
| `shield-lock-document-3d.webp` | Shield with a padlocked document |
| `shield-lock-document-alt-3d.webp` | The same, alternate render |
| `shield-monitoring-3d.webp` | Shield with an eye / observability mark |

The medical shield with the keyhole — the strongest of the set — is in
`public/brand/shield-keyhole-3d.webp`.

### Buttons

| File | What it shows |
|---|---|
| `button-primary-teal-3d.webp` | Filled teal, silver rim |
| `button-primary-teal-alt-3d.webp` | The same, alternate render |
| `button-primary-teal-gradient-3d.webp` | Teal with a vertical gradient |
| `button-secondary-navy-3d.webp` | Navy fill, silver rim |
| `button-destructive-coral-3d.webp` | Navy with a coral rim |
| `button-destructive-glow-3d.webp` | Navy with a coral outer glow |

### Frames and bars

| File | What it shows |
|---|---|
| `frame-outline-teal-3d.webp` | Teal outline frame, empty fill |
| `frame-outline-teal-alt-3d.webp` | The same, alternate render |
| `frame-outline-teal-wide-3d.webp` | Wider variant |
| `frame-dialog-3d.webp` | Dialog frame with teal corner brackets |
| `frame-dialog-alt-3d.webp` | The same, alternate render |
| `bar-track-3d.webp` | Empty progress track with corner brackets |
| `bar-progress-teal-3d.webp` | Teal gradient progress fill |

### Other

| File | What it shows |
|---|---|
| `gauge-dial-3d.webp` | Circular gauge / dial |
| `tile-sync-3d.webp` | Rounded tile with sync arrows |
| `sheet-modular-shapes-1..4.webp` | Contact sheets of the full modular set |

## Weight

Everything under `public/` is copied into the static export that Capacitor
wraps, so an unpruned asset folder is paid for on every device install. For
scale: the whole export was 2.9 MB before this folder existed, and the raw
render set was 9.4 MB.

That is why these are WebP and sized for viewing rather than printing. If you
add to this folder, convert and downscale first, and delete anything that stops
being referenced — the same rule that already pruned the unused source icons
out of `visual-aids/`.
