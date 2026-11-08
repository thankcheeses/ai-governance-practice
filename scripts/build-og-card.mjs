/**
 * Render the social card to a PNG.
 *
 * `scripts/og-card.html` is the source of truth; this turns it into
 * `public/og-card.png`, which is what the Open Graph tag, the README and any
 * social post all point at. Keeping the render in a script rather than doing it
 * by hand means the wording and the counts can be edited in a diff and the
 * image regenerated, instead of the PNG drifting away from the text — which is
 * exactly how the README hero came to claim 296 questions against a bank of 350.
 *
 *   npm run build:og
 *
 * Rendered at 2x. 1200x630 is the Open Graph standard every major scraper crops
 * to; 2400x1260 keeps the same ratio and stays sharp on dense displays, well
 * inside the size limits the platforms set.
 *
 * ## Fonts
 *
 * Taken from the app's own build output, not the network. That is deliberate
 * twice over: the render needs no egress and cannot be broken by a proxy or an
 * outage, and the card is set in the exact font files the site serves, so it
 * provably matches the product rather than approximating it.
 *
 * The rules are lifted wholesale from the stylesheet next/font generates, with
 * their URLs re-pointed at the files on disk. Re-declaring the faces by hand
 * would drift; matching the files by name would break on any dependency bump,
 * because the filenames are content hashes.
 *
 * Run `npm run build` first if `.next` is cold. If the faces cannot be found
 * the render aborts rather than writing — a card that silently fell back to a
 * system serif is worse than no new card, because it ships looking nothing like
 * the product and nothing tells you.
 *
 * ## Playwright
 *
 * Deliberately NOT a dependency of this project. It is a large install carrying
 * a browser, and nothing else here needs it — adding it would slow every CI run
 * to regenerate one image that changes a few times a year. The committed PNG is
 * the artifact; this script is how it is reproduced.
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { statSync, readdirSync, readFileSync } from "node:fs";

/* Resolved at runtime so a missing Playwright is a sentence, not a stack trace. */
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
const SOURCE = resolve(HERE, "og-card.html");
const OUT = resolve(HERE, "..", "public", "og-card.png");
const OUT_GIF = resolve(HERE, "..", "public", "og-card.gif");
const NEXT_STATIC = resolve(HERE, "..", ".next", "static");

/*
  The animated card. One 4.8 s loop (the CSS timeline in og-card.html),
  sampled at 12 fps. 1x, not 2x: a GIF's size grows with every pixel of every
  frame, and the platforms that animate a preview show it at card size. Frame
  one is t=0, the same instant as the still, so a platform that shows only the
  first frame shows the finished card.
*/
const LOOP_MS = 4800;
const FPS = 12;

const WIDTH = 1200;
const HEIGHT = 630;
const SCALE = 2;

/** The app's own @font-face rules, re-pointed at the files on disk. */
function brandFontCss() {
  const cssDir = resolve(NEXT_STATIC, "css");
  const sheets = readdirSync(cssDir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(resolve(cssDir, f), "utf8"))
    .join("\n");

  const rules = (sheets.match(/@font-face\{[^}]*\}/g) ?? []).filter((r) =>
    /IBM Plex Serif|Inter/.test(r),
  );
  if (!rules.length) throw new Error("no IBM Plex Serif or Inter @font-face rules found");

  return rules
    .map((r) =>
      r
        // `swap` lets the first paint use a fallback, and a one-shot screenshot
        // can catch exactly that frame. `block` holds the text until the real
        // face is ready.
        .replace("font-display:swap", "font-display:block")
        /*
          The base path is optional in this match. A `build:pages` output
          carries it (`/ai-governance-practice/_next/...`) and a plain `build`
          does not, and a pattern that insisted on the bare form matched
          nothing against the former — surfacing as "brand fonts did not load",
          which points at the fonts rather than at the build you happen to have
          on disk. Either form resolves to the same file.
        */
        .replace(
          /url\((?:[^)]*?)?\/_next\/static\/(media\/[^)]+)\)/g,
          (_m, rel) => `url("file://${resolve(NEXT_STATIC, rel)}")`,
        ),
    )
    .join("\n");
}

let FONT_CSS;
try {
  FONT_CSS = brandFontCss();
} catch (err) {
  console.error(
    `Could not read the app's font CSS under ${NEXT_STATIC} (${err.message}). ` +
      "The card is set in the app's own fonts — run `npm run build` once and try again.",
  );
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: SCALE,
  });

  await page.goto(`file://${SOURCE}`, { waitUntil: "load" });
  // Injected after load rather than written into the HTML, because the paths
  // are machine-specific. The page reflows before the screenshot is taken.
  await page.addStyleTag({ content: FONT_CSS });
  await page.evaluate(() => document.fonts.ready);

  // `document.fonts.check` is the only reliable confirmation that the text is
  // being measured in the intended face rather than a fallback.
  const ok = await page.evaluate(() => ({
    plex: document.fonts.check('600 63px "IBM Plex Serif"'),
    inter: document.fonts.check("600 19px Inter"),
  }));
  if (!ok.plex || !ok.inter) {
    throw new Error(
      `brand fonts did not load (IBM Plex Serif: ${ok.plex}, Inter: ${ok.inter}) — ` +
        "refusing to write a card set in fallback faces",
    );
  }

  // Every animation paused and seeked, so each capture is an exact instant of
  // the timeline rather than whatever the clock happened to reach.
  const seek = (ms) =>
    page.evaluate((t) => {
      document.body.classList.add("frozen");
      for (const a of document.getAnimations()) a.currentTime = t;
    }, ms);

  await seek(0);
  await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  const kb = (statSync(OUT).size / 1024).toFixed(0);
  console.log(`wrote public/og-card.png  ${WIDTH * SCALE}x${HEIGHT * SCALE}  ${kb} KB`);

  // ---- animated GIF ----
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.error("sharp is not installed (it comes with next). Skipping og-card.gif.");
  }
  if (sharp) {
    const gifPage = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
    await gifPage.goto(`file://${SOURCE}`, { waitUntil: "load" });
    await gifPage.addStyleTag({ content: FONT_CSS });
    await gifPage.evaluate(() => document.fonts.ready);
    const frames = [];
    const count = Math.round((LOOP_MS / 1000) * FPS);
    for (let i = 0; i < count; i++) {
      await gifPage.evaluate((t) => {
        document.body.classList.add("frozen");
        for (const a of document.getAnimations()) a.currentTime = t;
      }, (i * LOOP_MS) / count);
      frames.push(await gifPage.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } }));
    }
    // The first frame holds a beat longer, so a viewer reads the card before
    // the passes start lighting up.
    const delay = frames.map((_, i) => (i === 0 ? 900 : Math.round(1000 / FPS)));
    await sharp(frames, { join: { animated: true } })
      .gif({ loop: 0, delay, effort: 10, dither: 0.6 })
      .toFile(OUT_GIF);
    const gkb = (statSync(OUT_GIF).size / 1024).toFixed(0);
    console.log(`wrote public/og-card.gif  ${WIDTH}x${HEIGHT}  ${frames.length} frames  ${gkb} KB`);
  }
} finally {
  await browser.close();
}
