"use client";

import { type RefObject, useLayoutEffect, useState } from "react";
import { animate, stagger } from "animejs";

/**
 * Motion that plays once, on arrival, and then gets out of the way.
 *
 * Two switches turn it off, and either one is enough: the operating system's
 * `prefers-reduced-motion`, and this app's own setting (Settings →
 * Accessibility), which writes `data-motion="reduced"` on <html>. The CSS rule
 * in globals.css cannot reach script-driven animation, so the check is made
 * here as well.
 *
 * Everything animated renders in its final state first. The script only plays
 * *from* an offset, so a hidden tab, a print, or a browser that never runs the
 * effect still shows complete content.
 */
export function motionAllowed(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  if (document.documentElement.getAttribute("data-motion") === "reduced") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The children matching `selector` arrive one after another whenever `key`
 * changes. For one list whose order matters — the answer choices — not as a
 * reflex on every section.
 */
export function useStaggerIn(
  ref: RefObject<HTMLElement | null>,
  key: string | number,
  selector: string,
) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !motionAllowed()) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (!items.length) return;
    const anim = animate(items, {
      opacity: [0, 1],
      y: [8, 0],
      duration: 300,
      delay: stagger(45),
      ease: "outExpo",
    });
    anim.then(() => anim.revert()).catch(() => {});
    return () => {
      anim.revert();
    };
  }, [ref, key, selector]);
}

/**
 * Counts up to `value` once, on mount. Returns `value` itself wherever motion
 * is off, on the server, and after the count finishes, so the real number is
 * what is rendered by default and what assistive tech reads.
 */
export function useCountUp(value: number, duration = 700): number {
  const [shown, setShown] = useState(value);
  useLayoutEffect(() => {
    if (!motionAllowed() || value <= 0) return;
    const state = { n: 0 };
    setShown(0);
    const anim = animate(state, {
      n: value,
      duration,
      ease: "outExpo",
      onUpdate: () => setShown(Math.round(state.n)),
      onComplete: () => setShown(value),
    });
    return () => {
      anim.cancel();
      setShown(value);
    };
  }, [value, duration]);
  return shown;
}
