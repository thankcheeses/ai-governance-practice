/**
 * The app's own @font-face rules, re-pointed at the files on disk.
 *
 * Shared by every script that renders a brand image with Playwright
 * (`build-og-card.mjs`, `build-feature-graphic.mjs`). It was duplicated between
 * two of them, which was tolerable; a third copy was not, because the font
 * pipeline is exactly the thing that has already drifted once and three places
 * to fix is how it drifts again.
 *
 * Taken from the build output rather than the network. That is deliberate
 * twice over: the render needs no egress and cannot be broken by a proxy or an
 * outage, and the image is set in the exact font files the site serves, so it
 * provably matches the product rather than approximating it.
 *
 * The rules are lifted wholesale from the stylesheet the build generates, with
 * their URLs re-pointed at the files on disk. Re-declaring the faces by hand
 * would drift; matching the files by name would break on any dependency bump,
 * because the filenames are content hashes.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
export const NEXT_STATIC = resolve(HERE, "..", "..", ".next", "static");

/**
 * @param {string[]} families - family names to keep, e.g. ["IBM Plex Serif", "Inter"]
 * @returns {string} CSS safe to inject into a page about to be screenshotted
 */
export function appFontCss(families = ["IBM Plex Serif", "Inter"]) {
  const cssDir = resolve(NEXT_STATIC, "css");
  const allCss = readdirSync(cssDir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(resolve(cssDir, f), "utf8"))
    .join("\n");

  const wanted = new RegExp(families.join("|"));
  const rules = (allCss.match(/@font-face\{[^}]*\}/g) ?? []).filter((r) => wanted.test(r));
  if (!rules.length) {
    throw new Error(`no ${families.join(" or ")} @font-face rules found`);
  }

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
