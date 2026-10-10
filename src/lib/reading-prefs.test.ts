import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_PREFS,
  MOTION_KEY,
  READING_INIT_SCRIPT,
  SCALE_KEY,
  SPACING_KEY,
  TEXT_SCALES,
  normalizePrefs,
  readPrefs,
  scaleFor,
  writePrefs,
} from "./reading-prefs";

/**
 * These run under the node test runner, where there is no `window` and no
 * `document` — which is also the static export's server-render condition, so
 * the no-window path is the one that actually ships first on every page load.
 */

test("no window means the defaults, not a throw", () => {
  assert.equal(typeof globalThis.window, "undefined");
  assert.deepEqual(readPrefs(), DEFAULT_PREFS);
  assert.doesNotThrow(() => writePrefs({ textScale: "largest" }));
});

test("junk in storage degrades to the default rather than reaching CSS", () => {
  // Anyone can type into localStorage, and these values end up in an attribute
  // selector and a font-size declaration. A bad one must not get there.
  for (const bad of ["", "   ", "huge", "1.5", "../x", "<script>", null, undefined]) {
    const prefs = normalizePrefs({ textScale: bad as string, spacing: bad as string, motion: bad as string });
    assert.equal(prefs.textScale, "base", `textScale accepted ${JSON.stringify(bad)}`);
    assert.equal(prefs.spacing, "standard", `spacing accepted ${JSON.stringify(bad)}`);
    assert.equal(prefs.motion, "system", `motion accepted ${JSON.stringify(bad)}`);
  }
});

test("every declared scale round-trips through normalize", () => {
  for (const option of TEXT_SCALES) {
    assert.equal(normalizePrefs({ textScale: option.id }).textScale, option.id);
    assert.equal(scaleFor(option.id), option.scale);
  }
  assert.equal(normalizePrefs({ spacing: "wide" }).spacing, "wide");
  assert.equal(normalizePrefs({ motion: "reduced" }).motion, "reduced");
});

test("the default is the identity scale", () => {
  // The init script skips writing a font-size when the scale is 1, so a default
  // that was not 1 would silently never apply before first paint.
  assert.equal(scaleFor(DEFAULT_PREFS.textScale), 1);
});

/**
 * The pre-paint script duplicates the scale table as literals, because it runs
 * before any bundle exists and so cannot import `TEXT_SCALES`. That duplication
 * is the kind that rots: someone adds a size to the array, the control offers
 * it, and it silently fails to apply until the first paint is over.
 *
 * So the script's own map is parsed back out and compared to the array.
 */
test("the inline script's scale map matches TEXT_SCALES exactly", () => {
  const map = /var m=\{([^}]*)\}/.exec(READING_INIT_SCRIPT);
  assert.ok(map, "could not find the scale map in READING_INIT_SCRIPT");

  const fromScript = Object.fromEntries(
    map[1]!.split(",").map((pair) => {
      const [k, v] = pair.split(":");
      return [k!.trim(), Number(v)];
    }),
  );
  const fromSource = Object.fromEntries(TEXT_SCALES.map((t) => [t.id, t.scale]));

  assert.deepEqual(
    fromScript,
    fromSource,
    "READING_INIT_SCRIPT's scale map has drifted from TEXT_SCALES — a size the " +
      "control offers would not apply until after first paint",
  );
});

test("the inline script reads the same storage keys the module writes", () => {
  for (const key of [SCALE_KEY, SPACING_KEY, MOTION_KEY]) {
    assert.ok(
      READING_INIT_SCRIPT.includes(`'${key}'`),
      `READING_INIT_SCRIPT does not read ${key}, so that preference would be ` +
        "ignored until after first paint",
    );
  }
});

test("the inline script is self-contained and cannot throw", () => {
  // It runs before any bundle, so an import or a bare reference to anything
  // but the globals it guards would be a parse or reference error on every load.
  assert.doesNotMatch(READING_INIT_SCRIPT, /\bimport\b|\brequire\(/);
  assert.match(READING_INIT_SCRIPT, /^\(function\(\)\{try\{/, "not wrapped in a try");
  assert.match(READING_INIT_SCRIPT, /catch\(e\)\{\}\}\)\(\);$/, "does not swallow its own failure");
});

test("reading and writing work against a storage that throws", () => {
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem() {
        throw new Error("blocked site data");
      },
      setItem() {
        throw new Error("blocked site data");
      },
    },
  };
  try {
    assert.deepEqual(readPrefs(), DEFAULT_PREFS);
    // `writePrefs` also calls `applyPrefs`, which needs no document here.
    assert.doesNotThrow(() => writePrefs({ spacing: "wide" }));
  } finally {
    delete (globalThis as { window?: unknown }).window;
  }
});

test("stored values are read back, and a write merges rather than replaces", () => {
  const store = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
  };
  try {
    assert.deepEqual(readPrefs(), DEFAULT_PREFS);

    writePrefs({ textScale: "larger" });
    assert.equal(readPrefs().textScale, "larger");

    // Setting one preference must not reset the others.
    writePrefs({ motion: "reduced" });
    const after = readPrefs();
    assert.equal(after.textScale, "larger", "a motion write cleared the text scale");
    assert.equal(after.motion, "reduced");
    assert.equal(after.spacing, "standard");
  } finally {
    delete (globalThis as { window?: unknown }).window;
  }
});
