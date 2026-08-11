/**
 * Rasterises the existing brand mark in `public/icon.svg` into the source
 * assets `@capacitor/assets` expects, then hands off to that generator.
 *
 * Nothing here designs anything. Every variant reuses the same gradient stops,
 * shield path, and check path already in the SVG; the only per-variant changes
 * are the corner radius, which surface the mark sits on, and how much of the
 * frame it occupies. Re-run it whenever `public/icon.svg` changes:
 *
 *   node scripts/build-store-assets.mjs && npx capacitor-assets generate
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

// Kept in sync with public/icon.svg and the --background tokens in globals.css.
const BODY_GRADIENT = `
  <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0F172A"/>
    <stop offset="55%" stop-color="#115E59"/>
    <stop offset="100%" stop-color="#0E7490"/>
  </linearGradient>
  <linearGradient id="sheen" x1="0.1" y1="0" x2="0.7" y2="1">
    <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.28"/>
    <stop offset="42%" stop-color="#FFFFFF" stop-opacity="0.05"/>
    <stop offset="70%" stop-color="#FFFFFF" stop-opacity="0"/>
  </linearGradient>`;

const MARK = `
  <path d="M256 118 140 167.4v78.8c0 68 46.4 131.4 116 149.8 69.6-18.4 116-81.8 116-149.8v-78.8L256 118Z"
        fill="none" stroke="#FFFFFF" stroke-width="24" stroke-linejoin="round"/>
  <path d="m210 252 34 36 62-64" fill="none" stroke="#FFFFFF" stroke-width="28"
        stroke-linecap="round" stroke-linejoin="round"/>`;

const LIGHT_BG = "#f7f5f5"; // --background, light
const DARK_BG = "#201d1d"; // --background, dark

/** Full-bleed square icon. Both stores apply their own corner mask. */
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>${BODY_GRADIENT}</defs>
  <rect width="512" height="512" fill="url(#body)"/>
  <rect width="512" height="512" fill="url(#sheen)"/>
  ${MARK}
</svg>`;

/** Android adaptive background layer: the gradient body, no mark. */
const iconBackground = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>${BODY_GRADIENT}</defs>
  <rect width="512" height="512" fill="url(#body)"/>
  <rect width="512" height="512" fill="url(#sheen)"/>
</svg>`;

/**
 * Android adaptive foreground: the mark alone on transparency. The outer ~27%
 * of an adaptive icon can be cropped by the launcher mask, so the mark is
 * scaled to 62% and centred to stay inside the safe zone.
 */
const iconForeground = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <g transform="translate(256 256) scale(0.62) translate(-256 -256)">${MARK}</g>
</svg>`;

/** Splash: mark centred on the themed app background, matching capacitor.config.ts. */
const splash = (bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${bg}"/>
  <g transform="translate(256 256) scale(0.30) translate(-256 -256)">
    <defs>${BODY_GRADIENT}</defs>
    <rect width="512" height="512" rx="116" fill="url(#body)"/>
    <rect width="512" height="512" rx="116" fill="url(#sheen)"/>
    ${MARK}
  </g>
</svg>`;

const targets = [
  ["assets/icon.png", icon, 1024],
  ["assets/icon-background.png", iconBackground, 1024],
  ["assets/icon-foreground.png", iconForeground, 1024],
  ["assets/splash.png", splash(LIGHT_BG), 2732],
  ["assets/splash-dark.png", splash(DARK_BG), 2732],
];

await mkdir("assets", { recursive: true });

for (const [path, svg, size] of targets) {
  const png = await sharp(Buffer.from(svg), { density: 400 })
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(path, png);
  console.log(`${path.padEnd(32)} ${size}x${size}  ${(png.length / 1024) | 0} KB`);
}
