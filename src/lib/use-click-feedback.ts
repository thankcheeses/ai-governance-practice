"use client";

import { useEffect } from "react";
import { clickSoundEnabled, play } from "./sound";

/**
 * A short tick when a control is activated.
 *
 * ## One listener, not a prop on every button
 *
 * This is a single delegated listener on `document`, mounted once by the app
 * shell. The alternative — an `onClick` wrapper threaded through every button,
 * link and tab in the app — would be dozens of call sites, each one a chance
 * to forget, and it would make "does this control tick?" a property of whoever
 * wrote that control rather than a property of the app. Delegation inverts the
 * default: everything ticks, and the exceptions are declared.
 *
 * ## Why `click` rather than `pointerdown`
 *
 * `pointerdown` feels marginally more immediate and is the wrong event. It
 * fires when a touch lands, including the touch that turns out to be the start
 * of a scroll, so a learner scrolling a long scenario would hear a tick for a
 * tap they never made. `click` fires on actual activation — and, importantly,
 * it fires for keyboard activation too, so pressing Enter or Space on a focused
 * button gets the same feedback a mouse does. For a feature whose whole job is
 * confirming "that registered", leaving keyboard users out would be the wrong
 * half to serve.
 *
 * ## What is excluded, and why each one
 *
 * - **Answer options.** They already play `correct` or `wrong` the instant they
 *   are tapped, because choosing an answer submits it. A tick plus a verdict
 *   two milliseconds apart is noise, and the verdict is the part that matters.
 * - **The sound and click switches themselves.** Turning the tick off should
 *   not tick. Turning it on, on the other hand, should — that is the only
 *   confirmation the control can give — so the exclusion lives on the switch
 *   that is being turned off, handled by reading the preference after the
 *   toggle rather than before.
 * - **Anything marked `data-no-click-sound`.** The escape hatch, so a future
 *   control can opt out where it sits instead of by editing this file.
 *
 * ## Failure is silence
 *
 * `play` already swallows every reason it cannot sound — preference off, file
 * missing, autoplay refused. Nothing here adds a path that can throw into an
 * event handler attached to the whole document.
 */

/** What counts as a control. Deliberately narrow: real, activatable things. */
const CONTROLS = [
  "button",
  "a[href]",
  "summary",
  '[role="button"]',
  '[role="tab"]',
  '[role="switch"]',
  '[role="radio"]',
  '[role="checkbox"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
].join(",");

export function useClickFeedback(): void {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const control = target.closest<HTMLElement>(CONTROLS);
      if (!control) return;

      // A disabled control did nothing; saying it did would be a small lie.
      if (control.hasAttribute("disabled") || control.getAttribute("aria-disabled") === "true") {
        return;
      }

      // `closest` so a wrapper can mute everything inside it in one place.
      if (control.closest("[data-no-click-sound]")) return;

      // Read the preference at activation rather than at mount: the switch
      // that changes it is itself a control, and the value must be the one in
      // force now, not the one that was in force when the app loaded.
      if (!clickSoundEnabled()) return;

      play("click");
    };

    // Capture phase, so a handler that calls `stopPropagation` — the answer
    // buttons do not, but a future menu might — cannot silently swallow the
    // feedback for a control the learner genuinely activated.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
}
