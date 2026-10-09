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

test("every declared cue resolves to a local file or an explicit remote audio URL", () => {
  for (const [name, file] of Object.entries(CUES)) {
    if (/^https?:\/\//.test(file)) {
      assert.match(file, /^https:\/\//, name + " has a non-HTTPS remote audio URL");
      assert.match(file, /\.mp3(?:$|[?#])/, name + " has a remote URL that is not an MP3");
      continue;
    }

    assert.match(file, /^[a-z0-9-]+\.(mp3|m4a|ogg|wav)$/, name + " has an odd local filename");
    const onDisk = join(process.cwd(), "public", "sounds", file);
    assert.ok(existsSync(onDisk), 'cue "' + name + '" names ' + file + ', which is not in public/sounds/');
  }
});

/**
 * The audio the owner supplied must keep being the audio that plays.
 *
 * Four of the six result cues started life as `myinstants.com` URLs. Two of
 * them — the failure cue and the success cue — now have files in `public/`, and
 * because both export targets ship `public/` verbatim, those bytes are the ones
 * a learner hears. A hotlink is a different promise: it depends on someone
 * else's host, it can change under us, and nothing records a license for it.
 *
 * So the allowlist is explicit rather than a count. Adding a remote cue, or
 * quietly pointing a supplied cue back at a URL, fails here and names the cue.
 */
const CUES_ALLOWED_REMOTE = new Set(["keepGoing"]);

test("only an allowlisted cue may be remote; supplied audio stays local", () => {
  const remote = Object.entries(CUES)
    .filter(([, file]) => /^https?:\/\//.test(file))
    .map(([name]) => name);

  for (const name of remote) {
    assert.ok(
      CUES_ALLOWED_REMOTE.has(name),
      'cue "' + name + '" points at a third-party URL. If audio for it was ' +
        "supplied, commit the file under public/sounds/ and name it here; if a " +
        "hotlink is genuinely intended, add it to CUES_ALLOWED_REMOTE and say why.",
    );
  }
});

test("the two result cues the owner supplied are committed files", () => {
  for (const name of ["oof", "yay"] as const) {
    const file = CUES[name];
    assert.doesNotMatch(
      file,
      /^https?:\/\//,
      'cue "' + name + '" was supplied as a file and must not be hotlinked',
    );
    assert.ok(
      existsSync(join(process.cwd(), "public", "sounds", file)),
      'cue "' + name + '" names ' + file + ", which is not committed",
    );
  }
});
