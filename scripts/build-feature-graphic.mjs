/**
 * Render the Google Play feature graphic to a PNG.
 *
 *   npm run build:feature
 *
 * `scripts/feature-graphic.html` is the source of truth; this turns it into
 * `docs/store/feature-graphic.png`, which is the 1024 x 500 image Play shows at
 * the top of the listing. Same arrangement as the social card: the wording and
 * the counts are edited in a diff and the image regenerated, rather than the
 * PNG drifting away from the text.
 *
 * Rendered at 1x. Play's slot is exactly 1024 x 500 and it accepts no other
 * size, so there is no 2x to serve — unlike the Open Graph card, where the
 * platforms scale a larger image down.
 *
 * Fonts come from the app's own build output via scripts/lib/app-fonts.mjs, so
 * the graphic is set in the files the site serves. Run `npm run build` first if
 * `.next` is cold. If the faces cannot be found the render aborts rather than
 * writing: a graphic that silently fell back to a system serif ships looking
 * nothing like the product, and nothing tells you.
 *
 * Playwright is deliberately not a dependency of this project — see
 * scripts/build-og-card.mjs for that reasoning. The committed PNG is the
 * artifact; this script is how it is reproduced.
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdirSync, statSync } from "node:fs";
import { appFontCss } from "./lib/app-fonts.mjs";

const require = createRequire(import.meta.url);
let chromium;
for (const id of ["playwright", "/opt/node22/lib/node_modules/playwright"]) {
  try {
    ({ chromium } = require(id));
    break;
  } catch {
    // try the next location
  }
}
if (!chromium) {
  console.error(
    "Playwright is not installed. It is not a dependency of this project on " +
      "purpose — see the note above. Run `npm i -g playwright` and try again.",
  );
  process.exit(1);
}

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(HERE, "feature-graphic.html");
const OUT_DIR = resolve(HERE, "..", "docs", "store");
const OUT = resolve(OUT_DIR, "feature-graphic.png");

/** Play accepts exactly this size. */
const WIDTH = 1024;
const HEIGHT = 500;

let FONT_CSS;
try {
  FONT_CSS = appFontCss();
} catch (err) {
  console.error(
    `Could not read the app's font CSS (${err.message}). The graphic is set in ` +
      "the app's own fonts — run `npm run build` once and try again.",
  );
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });

  await page.goto(`file://${SOURCE}`, { waitUntil: "load" });
  // Injected after load rather than written into the HTML, because the paths
  // are machine-specific. The page reflows before the screenshot is taken.
  await page.addStyleTag({ content: FONT_CSS });
  await page.evaluate(() => document.fonts.ready);

  // `document.fonts.check` is the only reliable confirmation that the text is
  // being measured in the intended face rather than a fallback.
  const ok = await page.evaluate(() => ({
    plex: document.fonts.check('600 46px "IBM Plex Serif"'),
    inter: document.fonts.check("600 15px Inter"),
  }));
  if (!ok.plex || !ok.inter) {
    throw new Error(
      `brand fonts did not load (IBM Plex Serif: ${ok.plex}, Inter: ${ok.inter}) — ` +
        "refusing to write a graphic set in fallback faces",
    );
  }

  await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  const kb = (statSync(OUT).size / 1024).toFixed(0);
  console.log(`wrote docs/store/feature-graphic.png  ${WIDTH}x${HEIGHT}  ${kb} KB`);
} finally {
  await browser.close();
}
