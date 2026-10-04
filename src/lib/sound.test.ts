import assert from "node:assert/strict";
import { test } from "node:test";
import { CUES, play, setSoundEnabled, soundEnabled } from "./sound";

/**
 * Sound stays off unless it was deliberately turned on.
 *
 * The property worth protecting is the silence, not the noise: every path that
 * cannot establish an explicit opt-in has to resolve to off, and no path may
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

test("an unset preference reads as off, and only \"1\" turns it on", () => {
  const store = new Map<string, string>();
  const fake = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
  };
  (globalThis as { window?: unknown }).window = fake;
  try {
    assert.equal(soundEnabled(), false, "unset must read as off");

    setSoundEnabled(true);
    assert.equal(soundEnabled(), true);

    setSoundEnabled(false);
    assert.equal(soundEnabled(), false);

    // A stray value is not an opt-in.
    store.set("aigp.sound.enabled", "true");
    assert.equal(soundEnabled(), false);
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

test("every declared cue names a real audio file", () => {
  for (const [name, file] of Object.entries(CUES)) {
    assert.match(file, /^[a-z0-9-]+\.(mp3|m4a|ogg|wav)$/, `${name} has an odd filename`);
  }
});
