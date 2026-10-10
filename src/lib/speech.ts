"use client";

/**
 * Read-aloud, built on the browser's own speech synthesis.
 *
 * ## Why the platform voice and not a hosted one
 *
 * A hosted text-to-speech service would sound better, and it cannot be used
 * here. Both deploy targets set `output: "export"` — there is no server, so a
 * request to a speech API would have to be made from the browser with the key
 * in it, and a key shipped to the browser is a published key. Pre-rendering
 * every question to audio instead would mean committing hundreds of clips that
 * go stale the moment a stem is edited, and it would still need the paid API to
 * produce them.
 *
 * `speechSynthesis` has none of those problems: no key, no request, no cost, no
 * per-question artifact, and it works offline. It also reads in whatever voices
 * the learner has already chosen to install, which is usually the voice they
 * are used to hearing on everything else.
 *
 * ## Reading what is on screen, not what is in the bank
 *
 * The caller passes the text it wants spoken, and the control that does the
 * calling reads it out of the rendered DOM rather than out of the question
 * record. That one choice is what makes translation work: when a learner runs
 * the page through their browser's translator, the DOM holds the translated
 * text, so read-aloud speaks the translation without this module knowing that
 * translation exists. Nothing here parses, stores or ships a translation.
 *
 * ## Why a queue of short chunks
 *
 * Chrome stops a long utterance partway through, at around fifteen seconds.
 * That is roughly 200 characters of speech, and it is not a hypothetical here:
 * the longest scenario paragraph in the bank is 643 characters, about forty
 * seconds, so a learner relying on read-aloud for a fact pattern would simply
 * lose most of it with no error and no indication anything was missing.
 *
 * So the caller's parts are split again, at sentence boundaries, into chunks no
 * longer than `MAX_CHUNK`, and each chunk is its own utterance. Splitting on
 * sentences rather than at a character count keeps the prosody intact — a
 * chunk that ends mid-clause is audibly wrong. Stopping also becomes immediate,
 * because `cancel()` drops the queue instead of waiting out a paragraph.
 *
 * ## Failure is silence
 *
 * Every path that cannot speak — no `speechSynthesis`, no installed voices, a
 * refused start, a locked-down iframe — resolves to no sound and no error,
 * exactly as `sound.ts` does. A reading aid that throws on a study screen is
 * worse than one that is quiet.
 */

export const RATE_MIN = 0.5;
export const RATE_MAX = 2;
export const RATE_DEFAULT = 1;
/** The speeds the control offers. Coarse on purpose: a slider invites fiddling. */
export const RATE_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

/**
 * The longest utterance to hand an engine at once.
 *
 * Chrome's cutoff is a duration (about fifteen seconds), not a length, so this
 * is a proxy: 200 characters is roughly ten seconds of speech at 1x, which
 * leaves headroom at the slowest rate the control offers. Erring short costs
 * nothing — the queue is seamless — while erring long silently truncates.
 */
export const MAX_CHUNK = 200;

const RATE_KEY = "aigp.read.rate";
const VOICE_KEY = "aigp.read.voice";

/**
 * Clamp to a rate the engines actually honor.
 *
 * The spec allows 0.1–10. Below about 0.5 the output slurs badly enough to be
 * useless, and above 2 it stops being comprehensible, so the range is narrowed
 * rather than passed through. A non-finite value is a bug upstream, not a
 * reason to speak at NaN, so it resolves to the default.
 */
export function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return RATE_DEFAULT;
  return Math.min(RATE_MAX, Math.max(RATE_MIN, rate));
}

export function getRate(): number {
  if (typeof window === "undefined") return RATE_DEFAULT;
  try {
    const stored = window.localStorage.getItem(RATE_KEY);
    return stored === null ? RATE_DEFAULT : clampRate(Number(stored));
  } catch {
    return RATE_DEFAULT;
  }
}

export function setRate(rate: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RATE_KEY, String(clampRate(rate)));
  } catch {
    // A learner who cannot persist the rate still gets this session's.
  }
}

/** The chosen voice's `voiceURI`, or null for the engine's default. */
export function getVoiceURI(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(VOICE_KEY);
  } catch {
    return null;
  }
}

export function setVoiceURI(uri: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (uri === null) window.localStorage.removeItem(VOICE_KEY);
    else window.localStorage.setItem(VOICE_KEY, uri);
  } catch {
    // As above.
  }
}

function synth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  try {
    return window.speechSynthesis ?? null;
  } catch {
    return null;
  }
}

/** Whether the API exists at all. Says nothing about installed voices. */
export function speechSupported(): boolean {
  return synth() !== null && typeof window.SpeechSynthesisUtterance === "function";
}

/**
 * The installed voices.
 *
 * Returns empty both when the API is missing and when the device genuinely has
 * no voices, because to a caller those are the same situation: nothing can be
 * read. Some engines populate this list asynchronously and return empty on the
 * first call, which is what `onVoicesChanged` is for.
 */
export function listVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  try {
    return s.getVoices();
  } catch {
    return [];
  }
}

/**
 * Subscribe to the voice list arriving.
 *
 * Chrome resolves `getVoices()` to an empty array on first call and fires
 * `voiceschanged` once the list is ready; Safari populates it synchronously and
 * may never fire. A caller therefore has to read once *and* subscribe, so this
 * returns an unsubscribe function and never assumes the event will come.
 */
export function onVoicesChanged(listener: () => void): () => void {
  const s = synth();
  if (!s || typeof s.addEventListener !== "function") return () => {};
  s.addEventListener("voiceschanged", listener);
  return () => {
    try {
      s.removeEventListener("voiceschanged", listener);
    } catch {
      // Teardown during unload; nothing to do.
    }
  };
}

/**
 * Pick the voice to speak with.
 *
 * Preference order: the learner's stored choice, then any voice whose language
 * matches the text's, then the engine default (null). The language fallback is
 * what makes a translated page sound right without the learner reconfiguring
 * anything — the control passes the `lang` it found on the rendered element,
 * so a page translated to Spanish asks for a Spanish voice.
 */
export function pickVoice(
  voices: SpeechSynthesisVoice[],
  storedURI: string | null,
  lang?: string,
): SpeechSynthesisVoice | null {
  if (storedURI) {
    const exact = voices.find((v) => v.voiceURI === storedURI);
    if (exact) return exact;
  }
  if (lang) {
    const tag = lang.toLowerCase();
    const base = tag.split("-")[0]!;
    return (
      voices.find((v) => v.lang.toLowerCase() === tag) ??
      voices.find((v) => v.lang.toLowerCase().split("-")[0] === base) ??
      null
    );
  }
  return null;
}

/**
 * Split text into utterance-sized chunks, preferring sentence boundaries.
 *
 * Three levels, each a fallback for the one before: sentences, then clause
 * punctuation, then whitespace. The last is a guard rather than an expectation
 * — a 200-character run with no punctuation is not English prose — but without
 * it a pathological input would return a chunk over the limit and be truncated,
 * which is the exact failure this function exists to prevent.
 *
 * Pure, and exported so the boundaries are tested directly rather than through
 * a speech engine that cannot be observed.
 */
export function chunkForSpeech(text: string, max: number = MAX_CHUNK): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length === 0) return [];
  if (clean.length <= max) return [clean];

  // Keep the terminator with its sentence; a chunk ending on a bare clause
  // reads as a question or a trailing-off, which is worse than a long chunk.
  const sentences = clean.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [clean];

  const out: string[] = [];
  let current = "";

  const flush = () => {
    const trimmed = current.trim();
    if (trimmed) out.push(trimmed);
    current = "";
  };

  for (const sentence of sentences) {
    for (const piece of splitLong(sentence, max)) {
      if (current.length + piece.length + 1 > max) flush();
      current = current ? `${current} ${piece.trim()}` : piece.trim();
    }
  }
  flush();
  return out;
}

/** One over-long sentence, broken at clause punctuation and then at spaces. */
function splitLong(sentence: string, max: number): string[] {
  const s = sentence.trim();
  if (s.length <= max) return [s];

  const byClause = s.match(/[^,;:]+[,;:]+\s*|[^,;:]+$/g) ?? [s];
  const out: string[] = [];

  for (const clause of byClause) {
    const c = clause.trim();
    if (!c) continue;
    if (c.length <= max) {
      out.push(c);
      continue;
    }
    // Last resort: pack whole words up to the limit. A single word longer than
    // `max` is passed through intact rather than cut mid-word — it will be
    // mispronounced either way, and a severed word is worse.
    let line = "";
    for (const word of c.split(" ")) {
      if (line && line.length + word.length + 1 > max) {
        out.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

export interface SpeakOptions {
  rate?: number;
  /** BCP 47 tag, normally read off the element the text came from. */
  lang?: string;
  voice?: SpeechSynthesisVoice | null;
  /** Fires once the whole queue has been spoken, not once per part. */
  onDone?: () => void;
}

/**
 * Speak a sequence of parts, replacing anything already queued.
 *
 * Cancelling first is deliberate: pressing read twice should restart rather
 * than append, and a stale queue from the previous question must never play
 * over the current one.
 */
export function speak(parts: readonly string[], options: SpeakOptions = {}): void {
  /*
    Every path that does not speak still reports done.

    The caller's only use for `onDone` is to put its button back, so a return
    that skips it leaves a permanent "Stop" on a question that never started
    reading. That is worth stating as a contract rather than relying on the
    control disabling itself first: this is the one failure here that is visible
    to a learner instead of merely silent, and `speech.test.ts` pins it.
  */
  const s = synth();
  if (!s || !speechSupported()) {
    options.onDone?.();
    return;
  }

  const text = parts.flatMap((p) => chunkForSpeech(p));
  if (text.length === 0) {
    options.onDone?.();
    return;
  }

  try {
    s.cancel();
  } catch {
    options.onDone?.();
    return;
  }

  const rate = clampRate(options.rate ?? getRate());

  try {
    text.forEach((part, i) => {
      const u = new window.SpeechSynthesisUtterance(part);
      u.rate = rate;
      if (options.lang) u.lang = options.lang;
      if (options.voice) u.voice = options.voice;
      if (i === text.length - 1) {
        // `onerror` counts as done: the caller's only use for this is to put
        // the button back, and a stuck "Stop" after a failed start is worse
        // than an early reset.
        u.onend = () => options.onDone?.();
        u.onerror = () => options.onDone?.();
      }
      s.speak(u);
    });
  } catch {
    options.onDone?.();
  }
}

export function cancelSpeech(): void {
  const s = synth();
  if (!s) return;
  try {
    s.cancel();
  } catch {
    // Nothing to stop.
  }
}
