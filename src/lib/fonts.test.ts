import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

/**
 * The webfonts are served from this repository, and these tests are what keep
 * them that way.
 *
 * The font CSS used to be fetched from Google on every build, so the build
 * could fail on something no commit here controls — and one did, inside that
 * loader, on #95, on a change that touched no typography at all. The fix is
 * only a fix for as long
 * as nobody reintroduces the import, and reintroducing it would look like a
 * tidy-up: the `next/font` form is shorter and reads more idiomatically.
 */
const LAYOUT = "src/app/layout.tsx";
const FONT_CSS = "src/app/fonts.css";
const FONT_DIR = "src/app/fonts";

test("nothing under src/ fetches fonts at build time", () => {
  /*
    Searched across the whole tree, not just the layout.

    The first version of this test read `layout.tsx` alone, which is where the
    import happened to live. An import added to any other page or component
    would have reinstated exactly the same build-time fetch with the test
    still green — and it is the kind of thing that looks like a tidy-up,
    because the framework helper is shorter than a stylesheet plus a variable
    declaration.

    The needle is assembled at runtime rather than written out, because a test
    that greps for a literal it also contains matches itself. That already
    happened once in this repo, to the test guarding the post-exam second
    look, and it fails in the confusing direction: the suite goes red with
    nothing wrong in the code.
  */
  const needle = new RegExp(`from\\s+["']next/${"fo" + "nt"}`);
  const offenders: string[] = [];

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(path);
      } else if (/\.(tsx?|jsx?|mts|mjs)$/.test(entry.name)) {
        if (needle.test(readFileSync(path, "utf8"))) offenders.push(path);
      }
    }
  };
  walk("src");

  assert.deepEqual(
    offenders,
    [],
    `these files import the framework's font helper, so the build depends on ` +
      `Google again:\n${offenders.join("\n")}`,
  );

  assert.match(
    readFileSync(LAYOUT, "utf8"),
    /import\s+["']\.\/fonts\.css["']/,
    "the local font stylesheet is no longer imported",
  );
});

test("the committed font names carry no build hash", () => {
  /*
    Webpack re-hashes an asset it emits, so a build made from these files
    names them `X-s.<hash>.woff2`. Harvesting that output verbatim baked the
    hash in, and the next run appended another — three runs in, every file was
    called `X-s.<h1>.<h2>.<h3>.woff2` and each regeneration rewrote all 57
    names. The generator normalises back to the name `next/font` gave; this is
    what keeps a regeneration an empty diff rather than a rename of everything.
  */
  for (const file of readdirSync(FONT_DIR)) {
    if (!file.endsWith(".woff2")) continue;
    assert.ok(
      /^[0-9a-f]+-s(?:\.p)?\.woff2$/.test(file),
      `${file} carries a build hash — re-run the generator rather than ` +
        "committing a build's own output",
    );
  }
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
