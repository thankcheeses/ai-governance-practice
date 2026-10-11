"use client";

import { BASE_PATH } from "./base-path";

/**
 * Sound cues.
 *
 * Result cues are enabled for new installs so the feedback is audible without
 * requiring setup. An explicit local preference of "0" still disables sound.
 *
 *
 * ## The files
 *
 * `CUES` maps each cue to one file under `public/sounds/`, and only to a file:
 * no cue is fetched from a third-party host, so the audio a learner hears is
 * the audio this repository ships. Every file came from the owner; nothing was
 * synthesized, and `yay.mp3` is the only one not committed byte-for-byte as
 * supplied — see `public/sounds/README.md` for exactly what was cut from it.
 *
 * A cue with no file resolves to silence rather than to a console error, so
 * naming one before its audio exists is safe. The verdicts between the two
 * extremes deliberately have no cue at all: a sound on every result is
 * nagging rather than informative, so only a failed sitting and a strong one
 * make a noise.
 *
 * ## Playback rules
 *
 * Browsers refuse audio that no gesture preceded. Every cue here fires after a
 * deliberate action — choosing an answer, finishing a session — so the gesture
 * exists, but a rejected `play()` is still caught and ignored: a blocked sound
 * must never surface as an error on a results screen.
 *
 * `correct` and `wrong` differ from the others in frequency rather than kind:
 * they fire on every graded answer, so they are played from the handler that
 * grades it rather than through `useCueOnce`, which is deliberately a
 * once-per-mount contract.
 *
 * Elements are cached per cue so a second play does not re-fetch, and each is
 * rewound before playing so a repeat actually sounds.
 */

/** Cue names, mapped to the file each one expects under `public/sounds/`. */
export const CUES = {
  /** A fresh sitting opens — practice, review or exam. Not on a resume. */
  begin: "begin.mp3",
  /** Every question right, at any sitting length. */
  flawless: "flawless-victory.mp3",
  /**
   * The sitting failed: grade D or F with enough answered for that to mean
   * something. Not a thin sitting — `earlySignal` never reaches this.
   */
  oof: "oof.mp3",
  /**
   * The sitting is the strongest verdict the readiness model will give: grade
   * A across a substantial or broader share of the bank.
   */
  yay: "yay.mp3",
  /**
   * A bonus review question is offered mid-practice.
   *
   * Announces an interruption rather than an outcome, which is why it exists
   * at all: the card appears between questions, and a learner heads-down in a
   * run needs to know the thing in front of them changed kind. Never fires in
   * an exam — the exam cannot reach this feature.
   */
  bonus: "bonus.mp3",
  /**
   * A control was activated — a button, a link, a tab.
   *
   * Different in kind from every other cue here: the rest mark an *outcome*,
   * fire once or twice a sitting, and say something. This one marks an *input*
   * and can fire dozens of times a minute, so it carries no information beyond
   * "that registered". That is why it has its own preference rather than
   * riding the one that governs the others — wanting a result cue and not
   * wanting a tick on every tap is an entirely reasonable combination, and
   * conflating them would make silencing the tick cost the verdict too.
   */
  click: "click.mp3",
  /** An answer was graded right, in practice or review. */
  correct: "answer-correct.mp3",
  /** An answer was graded wrong, in practice or review. */
  wrong: "answer-wrong.mp3",
} as const;

export type CueName = keyof typeof CUES;

const STORAGE_KEY = "aigp.sound.enabled";
const CLICK_KEY = "aigp.sound.clicks";

/**
 * Enabled by default for new installs. An explicit "0" preference disables
 * sound. Server rendering and unavailable storage still fail safely to silence.
 */
export function soundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // New installs get the requested result cues. An explicit off setting still wins.
    return stored !== "0";
  } catch {
    return false;
  }
}

export function setSoundEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    // A learner who cannot persist the preference still gets the session's
    // behavior; there is nothing useful to report here.
  }
}

/**
 * Whether the click tick is on. Independent of `soundEnabled`, and nested
 * under it: sound off means silent regardless, sound on still leaves this
 * switchable. Default on, matching the rest.
 */
export function clickSoundEnabled(): boolean {
  if (!soundEnabled()) return false;
  try {
    return window.localStorage.getItem(CLICK_KEY) !== "0";
  } catch {
    return false;
  }
}

export function setClickSoundEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLICK_KEY, on ? "1" : "0");
  } catch {
    // The session still gets the change.
  }
}

const cache = new Map<CueName, HTMLAudioElement>();

function element(cue: CueName): HTMLAudioElement | null {
  const existing = cache.get(cue);
  if (existing) return existing;
  try {
    const source = CUES[cue];
    const url = source.startsWith("http") ? source : `${BASE_PATH}/sounds/${source}`;
    const audio = new Audio(url);
    audio.preload = "none";
    cache.set(cue, audio);
    return audio;
  } catch {
    return null;
  }
}

/**
 * Play a cue, or do nothing.
 *
 * Every reason to stay silent is handled the same way — preference off, no
 * file, autoplay refused, no `Audio` at all — because from the learner's side
 * they are the same outcome and none of them is worth an error.
 */
export function play(cue: CueName): void {
  if (!soundEnabled()) return;
  const audio = element(cue);
  if (!audio) return;
  try {
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  } catch {
    // Ignored on purpose: see above.
  }
}
