import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

/**
 * The webfonts are served from this repository, and these tests are what keep
 * them that way.
 *
 * `next/font/google` fetched the font CSS from Google on every build, so a bad
 * response there failed the build — which is what took CI red on #95, on a
 * change that touched no typography at all. The fix is only a fix for as long
 * as nobody reintroduces the import, and reintroducing it would look like a
 * tidy-up: the `next/font` form is shorter and reads more idiomatically.
 */
const LAYOUT = "src/app/layout.tsx";
const FONT_CSS = "src/app/fonts.css";
const FONT_DIR = "src/app/fonts";

test("the layout does not fetch fonts at build time", () => {
  const source = readFileSync(LAYOUT, "utf8");
  // Matched on the import rather than the identifier: a comment may well
  // mention `next/font` while explaining why it is not used.
  assert.ok(
    !/from\s+["']next\/font\/google["']/.test(source),
    "layout.tsx imports next/font/google again — every build now depends on " +
      "fonts.googleapis.com answering, which is the failure this removed",
  );
  assert.match(
    source,
    /import\s+["']\.\/fonts\.css["']/,
    "the local font stylesheet is no longer imported",
  );
});

test("every face the stylesheet declares points at a committed file", () => {
  const css = readFileSync(FONT_CSS, "utf8");
  const urls = [...css.matchAll(/url\("\.\/fonts\/([^"]+)"\)/g)].map((m) => m[1]);
  assert.ok(urls.length > 0, "no font files are referenced at all");
  for (const file of new Set(urls)) {
    assert.ok(
      existsSync(`${FONT_DIR}/${file}`),
      `${file} is referenced but not committed`,
    );
  }
});

test("no committed font file is unreferenced", () => {
  // The generator rebuilds the directory from scratch, so a leftover file
  // means someone added or removed one by hand.
  const css = readFileSync(FONT_CSS, "utf8");
  for (const file of readdirSync(FONT_DIR)) {
    if (!file.endsWith(".woff2")) continue;
    assert.ok(
      css.includes(`./fonts/${file}`),
      `${file} is committed but nothing references it`,
    );
  }
});

test("the three families and their metric fallbacks are all declared", () => {
  const css = readFileSync(FONT_CSS, "utf8");
  for (const family of ["IBM Plex Serif", "IBM Plex Mono", "Inter"]) {
    assert.ok(css.includes(family), `${family} is missing`);
    /*
      The fallback faces carry the generated `size-adjust` and override
      metrics. They are what stop the swap from a system font reflowing the
      page, and a filter that matched the real families but not these dropped
      the serif's silently the first time this was generated — invisible in a
      diff, obvious on a slow connection.
    */
    assert.ok(
      css.includes(`${family} Fallback`),
      `${family} Fallback is missing, so the font swap will shift the layout`,
    );
  }
});

test("unicode-range subsetting survived the move", () => {
  /*
    Google serves each face pre-split by unicode range, so a browser fetches
    the Latin slice of one weight rather than a file carrying Cyrillic, Greek
    and Vietnamese it will never draw. Collapsing that would be a quiet
    regression in bytes-over-the-wire, so the ranges are asserted rather than
    assumed.
  */
  const css = readFileSync(FONT_CSS, "utf8");
  const ranges = (css.match(/unicode-range:/g) ?? []).length;
  assert.ok(
    ranges > 50,
    `only ${ranges} faces carry a unicode-range; the subsetting has been flattened`,
  );
});

test("the open font licences ship with the fonts", () => {
  // Both families are OFL, which requires the licence to travel with the
  // files. They were already being redistributed from the build output; this
  // is what makes that visible.
  for (const file of ["LICENSE-Inter.txt", "LICENSE-IBM-Plex.txt"]) {
    const path = `${FONT_DIR}/${file}`;
    assert.ok(existsSync(path), `${file} is missing`);
    assert.match(
      readFileSync(path, "utf8"),
      /SIL OPEN FONT LICENSE/i,
      `${file} does not contain the licence text`,
    );
  }
});

test("the font variables are declared where the stacks read them", () => {
  // They used to be minted by next/font and applied as a class on <html>.
  // With that gone, an undeclared variable would make every stack fall
  // straight through to the system font with nothing to show it had.
  const css = readFileSync("src/app/globals.css", "utf8");
  for (const name of ["--font-inter", "--font-plex-serif", "--font-plex-mono"]) {
    assert.match(
      css,
      new RegExp(`${name}:\\s*"`),
      `${name} is consumed but never declared`,
    );
  }
});
