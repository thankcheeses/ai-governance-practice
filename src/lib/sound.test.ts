import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { CUES, play, setSoundEnabled, soundEnabled } from "./sound";

/**
 * Sound is enabled by default for a new install.
 *
 * The property worth protecting is the silence, not the noise: every path that
 * cannot establish a safe audio path must not throw, and an explicit opt-out
 * throw. A results screen that raises because an audio file is missing is a
 * far worse outcome than one that is quiet.
 *
 * These run under the node test runner, where there is no `window` — which is
 * also the static export's server-render condition, so the no-window path is
 * the one that actually ships first on every page load.
 */

test("sound is off when there is no window", () => {
  assert.equal(typeof globalThis.window, "undefined");
  assert.equal(soundEnabled(), false);
});

test("reading, writing and playing never throw without a window", () => {
  assert.doesNotThrow(() => setSoundEnabled(true));
  assert.doesNotThrow(() => play("flawless"));
  // Still off: the write had nowhere to go, and it must not report otherwise.
  assert.equal(soundEnabled(), false);
});

test("an unset preference reads as on, and only \"0\" turns it off", () => {
  const store = new Map<string, string>();
  const fake = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
  };
  (globalThis as { window?: unknown }).window = fake;
  try {
    assert.equal(soundEnabled(), true, "unset must read as on");

    setSoundEnabled(false);
    assert.equal(soundEnabled(), false);

    setSoundEnabled(true);
    assert.equal(soundEnabled(), true);

    // A stray value is not an explicit opt-out.
    store.set("aigp.sound.enabled", "true");
    assert.equal(soundEnabled(), true);
  } finally {
    delete (globalThis as { window?: unknown }).window;
  }
});

test("a storage that throws is silence, not an exception", () => {
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem() { throw new Error("blocked site data"); },
      setItem() { throw new Error("blocked site data"); },
    },
  };
  try {
    assert.doesNotThrow(() => setSoundEnabled(true));
    assert.equal(soundEnabled(), false);
    assert.doesNotThrow(() => play("flawless"));
  } finally {
    delete (globalThis as { window?: unknown }).window;
  }
});

test("every declared cue is a committed file, and no cue is remote", () => {
  for (const [name, file] of Object.entries(CUES)) {
    assert.doesNotMatch(
      file,
      /^[a-z]+:\/\//i,
      'cue "' + name + '" points at ' + file + ". Cues are files in " +
        "public/sounds/, which both export targets ship verbatim, so the audio " +
        "a learner hears is the audio this repository ships. A remote cue " +
        "depends on a third-party host staying up and serving the same bytes, " +
        "with no license recorded either way. Commit the file instead.",
    );
    assert.match(file, /^[a-z0-9-]+\.(mp3|m4a|ogg|wav)$/, name + " has an odd local filename");
    const onDisk = join(process.cwd(), "public", "sounds", file);
    assert.ok(existsSync(onDisk), 'cue "' + name + '" names ' + file + ', which is not in public/sounds/');
  }
});

/**
 * The two result cues are the ones the owner supplied for this purpose, so
 * they are named explicitly rather than left to the loop above. Renaming a cue
 * is a rename; dropping the audio out from under one is a regression, and the
 * loop alone would not notice if `oof` quietly stopped existing.
 */
test("the two result cues the owner supplied are present", () => {
  for (const name of ["oof", "yay"] as const) {
    assert.ok(
      existsSync(join(process.cwd(), "public", "sounds", CUES[name])),
      'cue "' + name + '" names ' + CUES[name] + ", which is not committed",
    );
  }
});
