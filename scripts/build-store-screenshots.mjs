/**
 * Capture the store listing screenshots from the real app.
 *
 *   npm run build:screenshots
 *
 * The set in docs/store/screenshots/ is what gets uploaded to Google Play and
 * App Store Connect. Google requires that screenshots represent the actual app,
 * which is a rule about the product and not about pixels: the set these replace
 * showed the app branded "Judgment Labs", in a palette the app has not used for
 * months, advertising a "Review queue — Available on Pro" against a build that
 * has no Pro tier and no purchase code at all. Uploading that would have
 * misdescribed the product on the day the listing went live.
 *
 * None of that was anyone being careless. It is what happens when the only way
 * to refresh a listing asset is to remember to do it by hand. This script is
 * the fix: run it after any visual change and the listing follows the app.
 *
 * ## Prerequisites
 *
 *   npm run build:mobile                       # the no-base-path export
 *   cd out && python3 -m http.server 8111      # or any static server
 *
 * It drives the real exported app rather than rendering components in
 * isolation, so what lands in the file is what a person on a phone sees,
 * including the nav bar, the safe-area padding and the live question bank.
 *
 * ## Sizes
 *
 * 1080x1920 is the Play phone screenshot size; 1290x2796 is the iPhone 6.7"
 * size App Store Connect asks for. Both are reached with a realistic CSS
 * viewport at deviceScaleFactor 3 rather than by scaling an image up, so text
 * is rendered at the density it ships at instead of being interpolated.
 *
 * Playwright is deliberately not a dependency of this project — same reasoning
 * as scripts/build-og-card.mjs. The committed PNGs are the artifact.
 */
import { createRequire } from "node:module";
import { mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

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
const OUT = resolve(HERE, "..", "docs", "store", "screenshots");
const BASE = process.env.STORE_SHOT_BASE || "http://127.0.0.1:8111";

/** The two sizes the stores ask for, as a CSS viewport times a pixel ratio. */
const DEVICES = [
  { tag: "android-phone", w: 360, h: 640, dsf: 3 }, // 1080 x 1920, Google Play
  { tag: "ios-6.7", w: 430, h: 932, dsf: 3 }, //        1290 x 2796, iPhone 6.7"
];

async function reachable() {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}

if (!(await reachable())) {
  console.error(
    `Nothing is serving ${BASE}.\n` +
      "  npm run build:mobile\n" +
      "  cd out && python3 -m http.server 8111",
  );
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) {
  if (f.endsWith(".png")) unlinkSync(resolve(OUT, f));
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox"],
});

let written = 0;
try {
  for (const d of DEVICES) {
    const ctx = await browser.newContext({
      viewport: { width: d.w, height: d.h },
      deviceScaleFactor: d.dsf,
    });
    const page = await ctx.newPage();

    /** The first-visit tour covers every screen until it is dismissed. */
    const skipTour = async () => {
      for (let i = 0; i < 6; i++) {
        const skip = page.getByRole("button", { name: /^Skip$/ });
        if ((await skip.count()) && (await skip.first().isVisible())) {
          await skip.first().click();
          await page.waitForTimeout(250);
          return;
        }
        await page.waitForTimeout(150);
      }
    };

    const shot = async (n, name) => {
      await page.waitForTimeout(500);
      const file = `${d.tag}-${String(n).padStart(2, "0")}-${name}.png`;
      await page.screenshot({ path: resolve(OUT, file) });
      console.log(`  ${file}`);
      written += 1;
    };

    // The app routes to onboarding until it is finished, so finish it.
    await page.goto(`${BASE}/onboarding/`, { waitUntil: "networkidle" });
    for (let i = 0; i < 8; i++) {
      const next = page.getByRole("button", {
        name: /Continue|Get started|Start|Finish|Done/i,
      });
      if ((await next.count()) && (await next.first().isVisible())) {
        await next.first().click();
        await page.waitForTimeout(350);
      } else break;
    }

    await page.goto(`${BASE}/home/`, { waitUntil: "networkidle" });
    await skipTour();
    await shot(1, "home");

    await page.goto(`${BASE}/study/`, { waitUntil: "networkidle" });
    await skipTour();
    await shot(2, "study");

    /*
      A real scenario, then the rationale. The rationale is the product's whole
      claim — every option explained, not just the right one — so a listing
      without it sells a generic quiz app.
    */
    await page.goto(`${BASE}/study/session/?count=10`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    await skipTour();
    await shot(3, "question");

    const options = page.locator('[role="radio"]');
    if (await options.count()) {
      await options.first().click().catch(() => {});
      await page.waitForTimeout(1100);
      // A one-off coaching hint, not part of the product.
      const gotIt = page.getByRole("button", { name: /^Got it$/ });
      if ((await gotIt.count()) && (await gotIt.first().isVisible())) {
        await gotIt.first().click().catch(() => {});
        await page.waitForTimeout(500);
      }
      const why = page.getByText(/Why|Rationale|Correct|Incorrect/i).first();
      if (await why.count()) await why.scrollIntoViewIfNeeded().catch(() => {});
      await shot(4, "rationale");
    } else {
      console.warn("  ! no [role=radio] options found — skipped the rationale shot");
    }

    await page.goto(`${BASE}/dashboard/`, { waitUntil: "networkidle" });
    await skipTour();
    await shot(5, "progress");

    await page.goto(`${BASE}/settings/`, { waitUntil: "networkidle" });
    await skipTour();
    const legend = page.getByText("Colour scheme", { exact: true });
    if (await legend.count()) {
      await legend.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
    }
    await shot(6, "appearance");

    await ctx.close();
  }
} finally {
  await browser.close();
}

const expected = DEVICES.length * 6;
console.log(`\nwrote ${written} screenshots to docs/store/screenshots/`);
if (written < expected) {
  console.error(`expected ${expected}; a screen did not render as expected`);
  process.exit(1);
}
