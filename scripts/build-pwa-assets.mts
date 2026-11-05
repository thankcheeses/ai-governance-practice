/**
 * Rasterise the PWA icon set and the iOS launch images.
 *
 *   node scripts/build-pwa-assets.mjs
 *
 * Both sources are SVGs already in the repository and neither is redesigned
 * here: `src/app/icon.svg` is the rounded mark, `public/icon-maskable.svg` is
 * the full-bleed one whose art sits inside the maskable safe zone. This script
 * only changes resolution and, for the launch images, centres the mark on the
 * app's own background colour.
 *
 * ## Why PNGs at all, when two SVGs already ship
 *
 * The manifest listed `icon.svg` with `"sizes": "any"` and two WebPs, which is
 * enough for Chrome on Android and nothing else:
 *
 *  - **iOS ignores an SVG `apple-touch-icon` outright.** The link was emitted
 *    from `src/app/apple-icon.svg` and silently did nothing, so a home-screen
 *    install got a screenshot of the page instead of the mark. That is the one
 *    defect here a user would actually see, and it needs a PNG.
 *  - Windows, several Android launchers and most link-preview scrapers read the
 *    manifest but not SVG icons.
 *
 * So: PNG at every size a platform is documented to ask for, the SVGs kept for
 * the browsers that prefer them, and the WebPs left in place.
 *
 * ## iOS launch images
 *
 * Whether current iOS still needs `apple-touch-startup-image`, or now derives
 * a launch screen from the manifest's `background_color`, could not be verified
 * when this was written: Apple's page 404s and webkit.org is not reachable from
 * the build environment. So both are provided. That is not hedging for its own
 * sake — the failure mode is asymmetric. A device whose size is not listed gets
 * the same default blank screen it would get with no tags at all, so an
 * incomplete list cannot regress anything, while a matching one is a real
 * improvement. Portrait only, in light and dark; a landscape iPad launch falls
 * back to the manifest colour.
 *
 * ## sharp
 *
 * Already used by `scripts/build-store-assets.mjs` for the native app icons,
 * and resolved the same way: at runtime, so a missing install is a sentence
 * rather than a stack trace. The PNGs are the committed artifact; this script
 * is how they are reproduced.
 */
import { createRequire } from "node:module";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LAUNCH_BACKGROUNDS,
  LAUNCH_DEVICES,
  launchImageName,
  type LaunchScheme,
} from "@/lib/pwa-splash";

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error(
    "sharp is not installed. It is what scripts/build-store-assets.mjs uses " +
      "too — run `npm i sharp` and try again.",
  );
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ICON = resolve(root, "src/app/icon.svg");
const MASKABLE = resolve(root, "public/icon-maskable.svg");

/**
 * Every size a platform is documented to ask for, in one list.
 *
 * 48-512 covers Android, Chrome and the manifest's own requirements (192 and
 * 512 are the two Chrome demands for installability). 152, 167 and 180 are the
 * iPad, iPad Pro and iPhone touch icons. 256 and 384 are what Windows and some
 * launchers pick.
 */
const ICON_SIZES = [48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512];

/** Maskable needs only the two the manifest declares. */
const MASKABLE_SIZES = [192, 512];


await mkdir(resolve(root, "public/icons"), { recursive: true });
await mkdir(resolve(root, "public/splash"), { recursive: true });

const iconSvg = await readFile(ICON);
const maskableSvg = await readFile(MASKABLE);
const written = [];

async function png(svg, size, out) {
  const buf = await sharp(svg, { density: 384 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
  await writeFile(resolve(root, out), buf);
  written.push([out, buf.length]);
}

for (const size of ICON_SIZES) {
  await png(iconSvg, size, `public/icons/icon-${size}.png`);
}
for (const size of MASKABLE_SIZES) {
  await png(maskableSvg, size, `public/icons/maskable-${size}.png`);
}

/*
  The touch icon is cut from the full-bleed art, not the rounded one. iOS
  applies its own mask, so a source with transparent corners gets them filled
  black — the mark would sit in a dark square on a light home screen.
*/
await png(maskableSvg, 180, "public/icons/apple-touch-icon.png");

/*
  The launch image: the mark at a quarter of the shorter edge, centred on the
  app's background. Composited rather than scaled from one master so the mark
  is pixel-exact at every size instead of resampled twice.
*/
for (const device of LAUNCH_DEVICES) {
  const { w, h, r } = device;
  const pw = w * r;
  const ph = h * r;
  for (const [scheme, background] of Object.entries(LAUNCH_BACKGROUNDS)) {
    const mark = Math.round(Math.min(pw, ph) * 0.25);
    const markPng = await sharp(iconSvg, { density: 384 })
      .resize(mark, mark)
      .png()
      .toBuffer();
    const out = `public/splash/${launchImageName(device, scheme as LaunchScheme)}`;
    const buf = await sharp({
      create: { width: pw, height: ph, channels: 4, background },
    })
      .composite([{ input: markPng, gravity: "center" }])
      .png({ compressionLevel: 9, palette: true })
      .toBuffer();
    await writeFile(resolve(root, out), buf);
    written.push([out, buf.length]);
  }
}

const total = written.reduce((sum, [, bytes]) => sum + bytes, 0);
console.log(`${written.length} files, ${(total / 1024).toFixed(0)} KB total`);
console.log(`  icons:  ${ICON_SIZES.length} any + ${MASKABLE_SIZES.length} maskable + 1 apple-touch-icon`);
console.log(`  splash: ${LAUNCH_DEVICES.length} sizes x ${Object.keys(LAUNCH_BACKGROUNDS).length} schemes`);
