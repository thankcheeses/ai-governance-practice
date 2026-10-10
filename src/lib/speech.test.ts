import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_CHUNK,
  RATE_DEFAULT,
  RATE_MAX,
  RATE_MIN,
  RATE_STEPS,
  cancelSpeech,
  chunkForSpeech,
  isLocalVoice,
  clampRate,
  getRate,
  getVoiceURI,
  listVoices,
  pickVoice,
  setRate,
  setVoiceURI,
  speak,
  speechSupported,
} from "./speech";

/**
 * As with `sound.ts`, the property worth protecting is the silence: every path
 * that cannot speak must resolve to no sound and no exception. A reading aid
 * that throws on a study screen is worse than one that is quiet.
 *
 * There is no `window` here, which is also the static export's server-render
 * condition, so the no-window path is the one that ships first on every load.
 */

test("nothing throws and nothing speaks without a window", () => {
  assert.equal(typeof globalThis.window, "undefined");
  assert.equal(speechSupported(), false);
  assert.deepEqual(listVoices(), []);
  assert.equal(getRate(), RATE_DEFAULT);
  assert.equal(getVoiceURI(), null);
  assert.doesNotThrow(() => setRate(1.5));
  assert.doesNotThrow(() => setVoiceURI("x"));
  assert.doesNotThrow(() => cancelSpeech());
  assert.doesNotThrow(() => speak(["hello"]));
});

test("speak() with nothing sayable still reports done", () => {
  // The caller uses onDone only to put the button back. Not calling it would
  // leave a permanent "Stop" on a question that never started reading.
  let done = 0;
  speak([], { onDone: () => done++ });
  speak(["", "   ", "\n\t"], { onDone: () => done++ });
  assert.equal(done, 2, "an empty or whitespace-only queue must still resolve");
});

test("the rate is clamped to a range engines actually honor", () => {
  assert.equal(clampRate(0.1), RATE_MIN);
  assert.equal(clampRate(99), RATE_MAX);
  assert.equal(clampRate(1.25), 1.25);
  // Every non-finite rate is an upstream bug rather than an extreme request,
  // so all three resolve to the default instead of to an end of the range.
  // Speaking at NaN is a silent failure; speaking at 1x is a visible default.
  assert.equal(clampRate(Number.NaN), RATE_DEFAULT);
  assert.equal(clampRate(Number.POSITIVE_INFINITY), RATE_DEFAULT);
  assert.equal(clampRate(Number.NEGATIVE_INFINITY), RATE_DEFAULT);
});

test("every offered speed survives clamping unchanged", () => {
  // A step the control shows but the clamp rewrites would make the button
  // highlight one speed while the engine used another.
  for (const step of RATE_STEPS) {
    assert.equal(clampRate(step), step, `${step} is outside the clamp range`);
  }
  assert.ok(RATE_STEPS.includes(RATE_DEFAULT), "the default is not an offered step");
});

/** A voice is a plain record as far as `pickVoice` is concerned. */
function voice(name: string, lang: string, localService = true): SpeechSynthesisVoice {
  return {
    name,
    lang,
    voiceURI: `urn:${name}`,
    localService,
    default: false,
  } as SpeechSynthesisVoice;
}

const VOICES = [
  voice("Alex", "en-US"),
  voice("Daniel", "en-GB"),
  voice("Monica", "es-ES"),
  voice("Paulina", "es-MX"),
];

test("a stored voice wins over the language match", () => {
  const picked = pickVoice(VOICES, "urn:Monica", "en-US");
  assert.equal(picked?.name, "Monica", "an explicit choice was overridden");
});

test("a stored voice that is gone falls back to the language", () => {
  // Voices disappear: a user uninstalls one, or the preference moves to another
  // device. Falling back beats reading in silence or in the wrong language.
  const picked = pickVoice(VOICES, "urn:DeletedVoice", "es-ES");
  assert.equal(picked?.name, "Monica");
});

test("an exact language tag is preferred over the same base language", () => {
  assert.equal(pickVoice(VOICES, null, "en-GB")?.name, "Daniel");
  assert.equal(pickVoice(VOICES, null, "es-MX")?.name, "Paulina");
});

test("a base-language match is accepted when no exact tag exists", () => {
  // This is the translated-page case: the translator sets lang="es" with no
  // region, and any Spanish voice is the right answer.
  assert.equal(pickVoice(VOICES, null, "es")?.name, "Monica");
  assert.equal(pickVoice(VOICES, null, "en-AU")?.name, "Alex");
});

test("language matching ignores tag case", () => {
  assert.equal(pickVoice(VOICES, null, "EN-us")?.name, "Alex");
});

test("no match means the engine default, not a wrong-language voice", () => {
  // Reading Japanese text aloud in an English voice is worse than letting the
  // platform decide, so this returns null rather than the first voice.
  assert.equal(pickVoice(VOICES, null, "ja-JP"), null);
  assert.equal(pickVoice([], null, "en-US"), null);
  assert.equal(pickVoice(VOICES, null, undefined), null);
});

test("an unset rate reads as the default, and a stored one is clamped on read", () => {
  const store = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };
  try {
    assert.equal(getRate(), RATE_DEFAULT);

    setRate(1.5);
    assert.equal(getRate(), 1.5);

    // Written out of range, it is clamped on the way in.
    setRate(50);
    assert.equal(getRate(), RATE_MAX);

    // Corrupted by hand, it is clamped on the way out.
    store.set("aigp.read.rate", "nonsense");
    assert.equal(getRate(), RATE_DEFAULT);

    setVoiceURI("urn:Alex");
    assert.equal(getVoiceURI(), "urn:Alex");
    setVoiceURI(null);
    assert.equal(getVoiceURI(), null, "null must clear the stored voice");
  } finally {
    delete (globalThis as { window?: unknown }).window;
  }
});

test("a storage that throws is the default, not an exception", () => {
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem() {
        throw new Error("blocked site data");
      },
      setItem() {
        throw new Error("blocked site data");
      },
      removeItem() {
        throw new Error("blocked site data");
      },
    },
  };
  try {
    assert.equal(getRate(), RATE_DEFAULT);
    assert.equal(getVoiceURI(), null);
    assert.doesNotThrow(() => setRate(2));
    assert.doesNotThrow(() => setVoiceURI("urn:Alex"));
  } finally {
    delete (globalThis as { window?: unknown }).window;
  }
});

test("a device with the API but no voices is handled, not assumed away", () => {
  // The exact state of a bare Linux container, and of a fresh Windows install
  // with no voice pack: speechSynthesis exists and getVoices() is empty. The
  // control has to disable itself rather than offer a button that does nothing.
  (globalThis as { window?: unknown }).window = {
    speechSynthesis: { getVoices: () => [], cancel() {}, speak() {} },
    SpeechSynthesisUtterance: function () {} as unknown,
    localStorage: { getItem: () => null, setItem() {} },
  };
  try {
    assert.equal(speechSupported(), true, "the API is present");
    assert.deepEqual(listVoices(), [], "but there is nothing to read with");
  } finally {
    delete (globalThis as { window?: unknown }).window;
  }
});

test("each part is queued as its own utterance, at the clamped rate", () => {
  /*
    Why this matters enough to assert: Chrome truncates a single long utterance
    at around fifteen seconds, and a scenario question runs well past that. One
    utterance per part is what keeps a long scenario from being cut off, and
    what makes Stop immediate.
  */
  const spoken: { text: string; rate: number }[] = [];
  let cancelled = 0;

  class FakeUtterance {
    text: string;
    rate = 1;
    lang = "";
    voice: SpeechSynthesisVoice | null = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  }

  (globalThis as { window?: unknown }).window = {
    SpeechSynthesisUtterance: FakeUtterance,
    speechSynthesis: {
      getVoices: () => [],
      cancel: () => void cancelled++,
      speak: (u: FakeUtterance) => {
        spoken.push({ text: u.text, rate: u.rate });
        u.onend?.();
      },
    },
    localStorage: { getItem: () => null, setItem() {} },
  };

  try {
    let done = 0;
    speak(["The stem.", "  Option A.  ", "", "Option B."], {
      rate: 99,
      onDone: () => done++,
    });

    assert.deepEqual(
      spoken.map((s) => s.text),
      ["The stem.", "Option A.", "Option B."],
      "parts must be queued separately, trimmed, with blanks dropped",
    );
    assert.ok(
      spoken.every((s) => s.rate === RATE_MAX),
      "an out-of-range rate reached the engine unclamped",
    );
    assert.equal(cancelled, 1, "speaking must replace the queue, not append to it");
    assert.equal(done, 1, "onDone must fire once for the queue, not once per part");
  } finally {
    delete (globalThis as { window?: unknown }).window;
  }
});

/*
  Chunking.

  This is the part that decides whether a learner hears a whole fact pattern or
  the first fifteen seconds of one. The longest scenario paragraph in the bank
  is 643 characters — about forty seconds of speech — so "one utterance per
  paragraph" was not enough on its own, and Chrome gives no error when it stops
  early.
*/

test("short text is one chunk and is normalized", () => {
  assert.deepEqual(chunkForSpeech("Hello there."), ["Hello there."]);
  assert.deepEqual(chunkForSpeech("  spaced\n\tout  "), ["spaced out"]);
  assert.deepEqual(chunkForSpeech(""), []);
  assert.deepEqual(chunkForSpeech("   \n  "), []);
});

test("no chunk exceeds the limit, for any real paragraph in the bank", async () => {
  const { getTrackQuestions } = await import("@/content/registry");
  const paragraphs = getTrackQuestions()
    .flatMap((q) => q.scenario?.body ?? [])
    .concat(getTrackQuestions().map((q) => q.question));

  assert.ok(paragraphs.length > 0, "no text found to check");

  let longestSource = 0;
  for (const text of paragraphs) {
    longestSource = Math.max(longestSource, text.length);
    for (const chunk of chunkForSpeech(text)) {
      assert.ok(
        chunk.length <= MAX_CHUNK,
        `a ${chunk.length}-character chunk would be truncated mid-sentence: ${chunk.slice(0, 80)}…`,
      );
    }
  }
  // Guards the guard: if the bank's longest text ever drops under the limit,
  // this test stops proving anything and should be re-pointed.
  assert.ok(
    longestSource > MAX_CHUNK,
    "no text in the bank is longer than MAX_CHUNK, so this test no longer exercises splitting",
  );
});

test("chunking loses no words", () => {
  const source =
    "A hospital deploys a triage model. The model was trained on data from a " +
    "different region, and nobody revalidated it; the clinical team was not " +
    "told. Who is accountable, and for what, under the deployer's obligations?";
  const words = chunkForSpeech(source, 60).join(" ").split(/\s+/);
  assert.deepEqual(
    words,
    source.split(/\s+/),
    "chunking must preserve every word, in order, exactly once",
  );
});

test("chunks break at sentence boundaries when they can", () => {
  const chunks = chunkForSpeech("One two three. Four five six. Seven eight nine.", 20);
  for (const c of chunks) {
    assert.match(c, /[.!?]$/, `"${c}" ends mid-sentence where a boundary was available`);
  }
});

test("a sentence longer than the limit still splits, at clauses then words", () => {
  const clausey = `${"alpha, ".repeat(40)}end.`;
  for (const c of chunkForSpeech(clausey, 50)) {
    assert.ok(c.length <= 50, `clause splitting produced a ${c.length}-character chunk`);
  }

  const noPunctuation = "word ".repeat(100).trim();
  for (const c of chunkForSpeech(noPunctuation, 50)) {
    assert.ok(c.length <= 50, `word splitting produced a ${c.length}-character chunk`);
  }
});

test("a single word longer than the limit is passed through, not severed", () => {
  // Mispronounced is recoverable; cut in half is not, and it would also be the
  // only path here that can produce text the learner never authored.
  const word = "A".repeat(300);
  assert.deepEqual(chunkForSpeech(word, 50), [word]);
});

test("speak() queues the chunks, not the raw parts", () => {
  const spoken: string[] = [];
  class FakeUtterance {
    text: string;
    rate = 1;
    lang = "";
    voice: SpeechSynthesisVoice | null = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  }
  (globalThis as { window?: unknown }).window = {
    SpeechSynthesisUtterance: FakeUtterance,
    speechSynthesis: {
      getVoices: () => [],
      cancel() {},
      speak: (u: FakeUtterance) => {
        spoken.push(u.text);
        u.onend?.();
      },
    },
    localStorage: { getItem: () => null, setItem() {} },
  };
  try {
    let done = 0;
    const long = `${"This is a sentence of some length. ".repeat(20)}`;
    speak([long], { onDone: () => done++ });

    assert.ok(spoken.length > 1, "a long part must be split across utterances");
    assert.ok(
      spoken.every((t) => t.length <= MAX_CHUNK),
      "an over-long utterance reached the engine and would be truncated",
    );
    assert.equal(done, 1, "onDone must fire once for the whole queue");
  } finally {
    delete (globalThis as { window?: unknown }).window;
  }
});

/*
  Where the voice runs.

  A network voice sends the text it reads to whoever supplies it, and the text
  here is the question a learner is working on. Chrome lists network voices
  beside on-device ones with nothing to distinguish them, so "whichever sorted
  first" was silently deciding where study text went. These pin the preference
  so that cannot come back.
*/

test("isLocalVoice treats only an explicit true as on-device", () => {
  // Guessing wrong toward "local" would mislabel text that does leave the
  // device; guessing wrong the other way only over-warns.
  assert.equal(isLocalVoice({ localService: true }), true);
  assert.equal(isLocalVoice({ localService: false }), false);
  assert.equal(isLocalVoice({}), false);
});

test("an on-device voice wins over a network voice in the same language", () => {
  const voices = [
    voice("Cloud Spanish", "es-ES", false),
    voice("Monica", "es-ES", true),
  ];
  assert.equal(pickVoice(voices, null, "es-ES")?.name, "Monica");
});

test("an on-device near-match beats a network exact match", () => {
  /*
    The deliberate part. A pt-BR voice on the device is a slightly worse accent
    than a network pt-PT voice; it is a much better default than shipping the
    learner's question text to a third party without asking. Accent loses.
  */
  const voices = [
    voice("Cloud Portuguese", "pt-PT", false),
    voice("Luciana", "pt-BR", true),
  ];
  assert.equal(pickVoice(voices, null, "pt-PT")?.name, "Luciana");
});

test("a network voice is still used when it is the only one for the language", () => {
  // Preferring on-device must not become a filter: for some languages a
  // network voice is the only voice there is, and silence would be worse.
  const voices = [voice("Alex", "en-US", true), voice("Cloud Korean", "ko-KR", false)];
  assert.equal(pickVoice(voices, null, "ko-KR")?.name, "Cloud Korean");
});

test("an explicit choice of a network voice is still honored", () => {
  // The learner chose it knowing what the picker says. Overriding that would
  // be a different kind of disrespect.
  const voices = [voice("Monica", "es-ES", true), voice("Cloud Spanish", "es-ES", false)];
  assert.equal(pickVoice(voices, "urn:Cloud Spanish", "es-ES")?.name, "Cloud Spanish");
});

test("no voice for the language still means the engine default", () => {
  const voices = [voice("Cloud Spanish", "es-ES", false)];
  assert.equal(pickVoice(voices, null, "ja-JP"), null);
});

/*
  The reading language from Settings, fed into voice selection.

  The rule it has to obey: the language of the *text* decides pronunciation,
  and the chosen language refines that target without ever replacing it. Get
  this backwards and someone who reads Spanish hears English words read by a
  Spanish voice — fluent-sounding nonsense, and strictly worse than having no
  preference, since they asked for better pronunciation and got worse.
*/

test("the chosen language never overrides the language of the text", () => {
  const voices = [voice("Alex", "en-US"), voice("Monica", "es-ES")];
  // Page still English, learner reads Spanish. English voice, every time.
  assert.equal(pickVoice(voices, null, "en-US", "es")?.name, "Alex");
});

test("a translated page uses the language it was translated into", () => {
  const voices = [voice("Alex", "en-US"), voice("Monica", "es-ES")];
  assert.equal(pickVoice(voices, null, "es", "es")?.name, "Monica");
  // Even when the learner's stored choice is something else entirely.
  assert.equal(pickVoice(voices, null, "es", "ko")?.name, "Monica");
});

test("the chosen language breaks a tie the page language leaves open", () => {
  /*
    The case this exists for. A translator sets a bare `lang="zh"`, which says
    Chinese without saying which script, and the device offers both. The
    learner already told us which they read.
  */
  const voices = [voice("Tingting", "zh-Hans"), voice("Meijia", "zh-TW")];
  assert.equal(pickVoice(voices, null, "zh", "zh-Hans")?.name, "Tingting");
});

test("a more specific page language is not thrown away for a vaguer preference", () => {
  // `lang` says pt-BR, the preference says pt. The page knows more.
  const voices = [voice("Luciana", "pt-BR"), voice("Joana", "pt-PT")];
  assert.equal(pickVoice(voices, null, "pt-BR", "pt")?.name, "Luciana");
});

test("an explicit voice choice still beats both", () => {
  const voices = [voice("Alex", "en-US"), voice("Monica", "es-ES")];
  assert.equal(pickVoice(voices, "urn:Monica", "en-US", "en")?.name, "Monica");
});

test("the preference is used when the page states no language at all", () => {
  const voices = [voice("Alex", "en-US"), voice("Monica", "es-ES")];
  assert.equal(pickVoice(voices, null, undefined, "es")?.name, "Monica");
  assert.equal(pickVoice(voices, null, undefined, null), null);
});

test("on-device still wins after the language is refined", () => {
  // The privacy preference must survive the new argument, not be bypassed by it.
  const voices = [voice("Cloud Chinese", "zh-Hans", false), voice("Tingting", "zh-Hans", true)];
  assert.equal(pickVoice(voices, null, "zh", "zh-Hans")?.name, "Tingting");
});
