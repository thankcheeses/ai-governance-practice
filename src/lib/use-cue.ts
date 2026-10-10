"use client";

import { useEffect, useRef } from "react";
import { play, type CueName } from "./sound";

/**
 * Play a cue the first time a condition becomes true, and never again.
 *
 * The guard is a ref rather than a dependency list because the screens that
 * use this re-render freely — a results screen settles its record, a session
 * re-renders on every answer — and a cue is not a notification. Once per mount
 * is the contract.
 *
 * Mounting is also the point at which the condition is first checked, so a
 * screen that is already in the cue's state when it mounts still fires.
 *
 * A `null` cue is silence, and silence is a real choice rather than a missing
 * value: most readiness verdicts deliberately make no sound. Taking `null`
 * here lets a caller keep one exhaustive state-to-cue table instead of
 * wrapping every lookup in its own condition. It does not consume the
 * once-per-mount guard, so a screen whose cue resolves to `null` and then to a
 * real cue still fires.
 */
export function useCueOnce(cue: CueName | null, when: boolean): void {
  const played = useRef(false);
  useEffect(() => {
    if (!when || cue === null || played.current) return;
    played.current = true;
    play(cue);
  }, [cue, when]);
}
