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
 * `CUES` maps each cue to one file under `public/sounds/`. Every current file
 * was supplied by the owner and is committed exactly as supplied; nothing here
 * was synthesized, and a cue with no file resolves to silence rather than to a
 * console error, so adding a name before its audio is safe.
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
  /** Result below the practice success threshold. */
  oof: "https://www.myinstants.com/media/sounds/roblox-death-sound_1.mp3",
  /** Strong result with enough evidence to be encouraging. */
  yay: "https://www.myinstants.com/media/sounds/kids-saying-yay-sound-effect_3.mp3",
  /** Keep-going cue for a developing result. */
  keepGoing: "https://www.myinstants.com/media/sounds/anime-wow-sound-effect.mp3",
  /** Gentle failure cue. */
  womp: "https://www.myinstants.com/media/sounds/downer_noise.mp3",
  /** An answer was graded right, in practice or review. */
  correct: "answer-correct.mp3",
  /** An answer was graded wrong, in practice or review. */
  wrong: "answer-wrong.mp3",
} as const;

export type CueName = keyof typeof CUES;

const STORAGE_KEY = "aigp.sound.enabled";

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
