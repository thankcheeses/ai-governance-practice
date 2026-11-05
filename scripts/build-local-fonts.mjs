/**
 * Lift the webfonts out of a build and into the repository.
 *
 *   npm run build && node scripts/build-local-fonts.mjs
 *
 * ## Why
 *
 * `next/font/google` downloads font CSS and `.woff2` files from Google at
 * build time. That makes every build depend on a third party being up: a
 * single bad response from `fonts.googleapis.com` fails the whole build with
 *
 *   An error occurred in `next/font`.
 *   TypeError: Cannot read properties of null (reading '1')
 *
 * That is the loader dereferencing null after a regex found nothing in what it
 * fetched. What the response actually contained was never captured, so the
 * cause is given here as the evidence rather than as a diagnosis: on PR #95
 * `build:pages` passed and `build:mobile`, running seconds later in the same
 * job against the same three families, failed here; `release:gate` passed
 * locally on that commit; and re-running the job with no code change went
 * green. That is consistent with a bad or throttled response from Google and
 * inconsistent with anything in the diff — enough to justify removing the
 * dependency, and not enough to claim what Google returned.
 *
 * `scripts/build-og-card.mjs` already refuses this dependency in as many
 * words: it reads the font files off disk so that "the render needs no egress
 * and cannot be broken by a proxy or an outage". This applies the same rule to
 * the build itself.
 *
 * ## Why it copies a build's output instead of downloading the fonts
 *
 * The obvious alternative is to fetch the upstream `.woff2` releases and
 * declare them by hand. That would change what ships: Google serves each face
 * pre-split into unicode-range subsets, so a browser downloads the Latin slice
 * of one weight rather than a file carrying Cyrillic, Greek and Vietnamese it
 * will never draw. Reproducing that by hand means re-subsetting the fonts,
 * which is a new build dependency and a new way to be subtly wrong.
 *
 * So this copies what the current build already produced — the same 57 files,
 * the same 81 `@font-face` rules, the same unicode ranges — and rewrites the
 * URLs to point at the copies. What ships is byte-for-byte what shipped
 * before. The `… Fallback` faces are carried over too: they hold the
 * `size-adjust` metrics that keep the swap from shifting the layout, and
 * dropping them would trade a build-time flake for a visible reflow.
 *
 * The files are emitted under `src/app/fonts/` and referenced relatively from
 * `src/app/fonts.css`, so webpack hashes them, emits them and prefixes the
 * base path exactly as it did when `next/font` owned them. Nothing here has to
 * know whether the app is served from a domain root or a repository sub-path.
 *
 * ## Licensing
 *
 * Both families are under the SIL Open Font License, which requires the
 * licence to travel with the files. `src/app/fonts/LICENSE-Inter.txt` and
 * `LICENSE-IBM-Plex.txt` are the upstream texts, taken from the projects
 * themselves; this script checks they are still there rather than writing
 * them, and clears only `.woff2` files so a run cannot delete them. The fonts
 * were already being redistributed from `_next/static/media` before this
 * change — committing the licences is what makes the obligation visible.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const NEXT_STATIC = resolve(HERE, "..", ".next", "static");
const OUT_DIR = resolve(HERE, "..", "src", "app", "fonts");
const OUT_CSS = resolve(HERE, "..", "src", "app", "fonts.css");

/** The families the app actually declares. */
const FAMILIES = ["IBM Plex Serif", "IBM Plex Mono", "Inter"];

const cssDir = resolve(NEXT_STATIC, "css");
let allCss;
try {
  allCss = readdirSync(cssDir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(resolve(cssDir, f), "utf8"))
    .join("\n");
} catch (err) {
  console.error(
    `Could not read ${cssDir} (${err.message}). This reads a completed ` +
      "build's output — run `npm run build` first.",
  );
  process.exit(1);
}

/*
  Matched on the family name with the quotes optional and a trailing
  " Fallback" allowed, because the generated CSS is inconsistent about both.
  A stricter `font-family:"IBM Plex Serif"` test silently dropped
  `"IBM Plex Serif Fallback"` — the size-adjust metrics for every heading in
  the app — while picking up the unquoted `Inter Fallback` beside it. The
  rules it drops are the ones that keep the font swap from reflowing the page,
  so losing them is invisible in a diff and obvious on a slow connection.
*/
const familyPattern = new RegExp(
  `font-family:"?(?:${FAMILIES.map((f) => f.replace(/ /g, "\\s")).join("|")})(?:\\sFallback)?"?[;}]`,
);
const rules = (allCss.match(/@font-face\{[^}]*\}/g) ?? []).filter((rule) =>
  familyPattern.test(rule),
);
if (!rules.length) {
  console.error(
    "No @font-face rules for the app's families were found. If the layout " +
      "already uses next/font/local, there is nothing to lift and this " +
      "script has done its job.",
  );
  process.exit(1);
}

/*
  Only the `.woff2` files are cleared, not the directory. A face dropped
  upstream should not linger as a file nothing references, but the licence
  texts beside them are not generated — they are the upstream OFL, committed
  once — and wiping the directory would delete them on every run.
*/
mkdirSync(OUT_DIR, { recursive: true });
for (const file of readdirSync(OUT_DIR)) {
  if (file.endsWith(".woff2")) rmSync(resolve(OUT_DIR, file));
}

/**
 * The name `next/font` gave a file, with any hash a later build appended
 * stripped back off.
 *
 * Webpack re-hashes an asset it emits, so a build made *from* these committed
 * files names them `X-s.<hash>.woff2`. Harvesting that output verbatim baked
 * the hash into the committed name, and the next run appended another —
 * renaming all 57 files every time and making the diff unreadable. It took
 * three runs here before anyone noticed, which is the argument for
 * normalising rather than for being careful.
 *
 * Every trailing hex segment is stripped, not just one, so a name that has
 * already accumulated several collapses back to the original. That makes a
 * re-run idempotent: same bytes, same names, identical `fonts.css`, whether
 * the build it read came from `next/font` or from these files.
 */
function stableName(file) {
  return file.replace(/^(.*?-s(?:\.p)?)(?:\.[0-9a-f]{6,10})+\.woff2$/, "$1.woff2");
}

const copied = new Set();
const rewritten = rules.map((rule) =>
  // The base path is optional: a `build:pages` output carries it, a plain
  // `build` does not, and both name the same file.
  rule.replace(/url\((?:[^)]*?)?\/_next\/static\/media\/([^)]+)\)/g, (_m, file) => {
    const name = stableName(file);
    if (!copied.has(name)) {
      copyFileSync(resolve(NEXT_STATIC, "media", file), resolve(OUT_DIR, name));
      copied.add(name);
    }
    return `url("./fonts/${name}")`;
  }),
);

/*
  The licences are not regenerated, only checked for. The OFL requires them to
  travel with the font files, and a run that quietly produced fonts with no
  licence beside them would be the kind of omission nobody notices.
*/
for (const [family, file] of [
  ["Inter", "LICENSE-Inter.txt"],
  ["IBM Plex", "LICENSE-IBM-Plex.txt"],
]) {
  if (!existsSync(resolve(OUT_DIR, file))) {
    console.warn(
      `! ${family}: ${file} is missing from src/app/fonts/. The SIL Open Font ` +
        "License requires it to ship with the files — restore it before committing.",
    );
  }
}

/*
  No preload hints are emitted, and that is a known gap rather than an
  oversight.

  `next/font` emitted `<link rel="preload">` for the eleven subsets whose
  names carry `-s.p.`, and plain `@font-face` CSS gets none, so those faces
  are now discovered only once the stylesheet has parsed. Measured: the
  pre-change build emits eleven `as="font"` preloads, this one emits zero.

  Restoring them needs a URL that webpack has hashed, and the obvious route —
  importing the files so webpack resolves them — does not build: `next/font`
  was what taught webpack about `.woff2`, and with it gone there is no loader
  for a bare font import. The two ways out both reach past this change: add a
  webpack asset rule (which `next dev` may not honour, depending on the
  bundler), or move the stylesheet and the files into `public/` and reference
  stable unhashed URLs from both the preload and the CSS. Either is a change
  to how CSS is delivered, which is more than removing a build-time fetch, so
  it is left for a decision of its own.
*/

const header = `/*
 * The app's webfonts, served from this repository.
 *
 * GENERATED by scripts/build-local-fonts.mjs. Do not edit by hand: it is a
 * verbatim copy of what \`next/font/google\` produced, with the URLs
 * re-pointed at the committed files, so that a build no longer depends on
 * Google being reachable. Re-run the script after changing which weights or
 * styles the app uses.
 *
 * ${rewritten.length} faces, ${copied.size} files. Both families are under the SIL Open Font
 * License; see the LICENSE-*.txt files in ./fonts/.
 */
`;

writeFileSync(OUT_CSS, `${header}\n${rewritten.join("\n")}\n`);
console.log(
  `${rewritten.length} @font-face rules, ${copied.size} files -> src/app/fonts/`,
);
