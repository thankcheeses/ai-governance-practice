"use client";

/**
 * Reading preferences: text size, text spacing, and motion.
 *
 * These are device preferences in `localStorage`, deliberately not account
 * settings. Someone who needs larger text needs it on the device they are
 * reading on, before and whether or not they ever sign in, and a preference
 * that only arrives after a sync is a preference that was not there when it
 * was needed.
 *
 * ## Why these three
 *
 * Each one exists because a specific barrier exists without it, and each maps
 * to a published success criterion rather than to a taste:
 *
 *  - **Text size** — WCAG 2.1 §1.4.4 (Resize Text). Browser zoom already
 *    satisfies the criterion, so this is not what makes the app conform; it is
 *    here because an in-page control is discoverable and browser zoom is not,
 *    and because zoom is per-site state a learner loses when they clear data.
 *  - **Text spacing** — WCAG 2.1 §1.4.12 (Text Spacing). The criterion is about
 *    surviving *imposed* spacing, and the wide setting applies exactly the
 *    values it names (line height 1.5×, letter spacing 0.12em, word spacing
 *    0.16em, paragraph spacing 2×), which turns the requirement into something
 *    a learner can switch on rather than something only a tester ever sees.
 *  - **Motion** — WCAG 2.1 §2.3.3 (Animation from Interactions). The app
 *    already honors `prefers-reduced-motion`; this is the in-app equivalent for
 *    someone who wants it here without changing their whole OS.
 *
 * Read-aloud speed and voice live in `speech.ts` with the rest of the speech
 * code rather than here.
 *
 * ## Why text size scales the root
 *
 * `font-size` on `:root` is the one lever that moves everything proportionally:
 * every size in this app is authored in `rem`, so type, padding and gaps grow
 * together and the result is a larger layout rather than big text crammed into
 * small boxes. It behaves like a narrower viewport, which the layout already
 * handles because it is built mobile-first.
 */

export const TEXT_SCALES = [
  { id: "base", label: "Default", scale: 1 },
  { id: "large", label: "Large", scale: 1.15 },
  { id: "larger", label: "Larger", scale: 1.3 },
  { id: "largest", label: "Largest", scale: 1.5 },
] as const;

export type TextScaleId = (typeof TEXT_SCALES)[number]["id"];
export type SpacingId = "standard" | "wide";
export type MotionId = "system" | "reduced";

export interface ReadingPrefs {
  textScale: TextScaleId;
  spacing: SpacingId;
  motion: MotionId;
}

export const DEFAULT_PREFS: ReadingPrefs = {
  textScale: "base",
  spacing: "standard",
  motion: "system",
};

export const SCALE_KEY = "aigp.read.scale";
export const SPACING_KEY = "aigp.read.spacing";
export const MOTION_KEY = "aigp.read.motion";

const SCALE_IDS = new Set<string>(TEXT_SCALES.map((t) => t.id));

/**
 * Coerce whatever is in storage into a usable preference set.
 *
 * Exported and pure so the parsing is tested directly. Storage is attacker-
 * adjacent in the sense that anyone can type into it, and a junk value must
 * degrade to the default rather than reach a CSS attribute selector or a
 * `font-size` declaration.
 */
export function normalizePrefs(raw: {
  textScale?: string | null;
  spacing?: string | null;
  motion?: string | null;
}): ReadingPrefs {
  return {
    textScale: SCALE_IDS.has(raw.textScale ?? "")
      ? (raw.textScale as TextScaleId)
      : DEFAULT_PREFS.textScale,
    spacing: raw.spacing === "wide" ? "wide" : "standard",
    motion: raw.motion === "reduced" ? "reduced" : "system",
  };
}

export function scaleFor(id: TextScaleId): number {
  return TEXT_SCALES.find((t) => t.id === id)?.scale ?? 1;
}

export function readPrefs(): ReadingPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    return normalizePrefs({
      textScale: window.localStorage.getItem(SCALE_KEY),
      spacing: window.localStorage.getItem(SPACING_KEY),
      motion: window.localStorage.getItem(MOTION_KEY),
    });
  } catch {
    return DEFAULT_PREFS;
  }
}

/**
 * Write the preferences onto `<html>`.
 *
 * Attributes rather than inline styles for spacing and motion, so the rules
 * live in the stylesheet where they can be read; an inline `font-size` for the
 * scale, because the value is numeric and a selector per step would mean
 * editing CSS to add a step.
 */
export function applyPrefs(prefs: ReadingPrefs): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const scale = scaleFor(prefs.textScale);
  root.style.fontSize = scale === 1 ? "" : `${scale * 100}%`;
  root.setAttribute("data-text-scale", prefs.textScale);
  root.setAttribute("data-text-spacing", prefs.spacing);
  root.setAttribute("data-motion", prefs.motion);
}

export function writePrefs(next: Partial<ReadingPrefs>): ReadingPrefs {
  const merged = { ...readPrefs(), ...next };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SCALE_KEY, merged.textScale);
      window.localStorage.setItem(SPACING_KEY, merged.spacing);
      window.localStorage.setItem(MOTION_KEY, merged.motion);
    } catch {
      // The session still gets the change; it just will not outlive the tab.
    }
  }
  applyPrefs(merged);
  return merged;
}

/**
 * Applied before first paint, for the same reason the theme is.
 *
 * A theme flash is unpleasant. A text-size flash is the person who set the
 * preference being shown, every single load, the size they already told the app
 * they cannot read — so this runs synchronously during parsing, from a plain
 * inline script, with the same reasoning as `THEME_INIT_SCRIPT` and the same
 * constraint that nothing paintable may precede it.
 *
 * Kept as a string of plain ES5-era syntax rather than built from the functions
 * above: it executes before any bundle exists, so it cannot import them, and it
 * must parse on anything that can parse the page at all. The defaults are
 * duplicated here as literals; `reading-prefs.test.ts` asserts the two copies
 * agree so the duplication cannot drift.
 */
export const READING_INIT_SCRIPT = `
(function(){try{
var r=document.documentElement;
var s=localStorage.getItem('${SCALE_KEY}');
var m={base:1,large:1.15,larger:1.3,largest:1.5};
if(s&&m[s]&&m[s]!==1){r.style.fontSize=(m[s]*100)+'%';r.setAttribute('data-text-scale',s);}
else{r.setAttribute('data-text-scale','base');}
r.setAttribute('data-text-spacing',localStorage.getItem('${SPACING_KEY}')==='wide'?'wide':'standard');
r.setAttribute('data-motion',localStorage.getItem('${MOTION_KEY}')==='reduced'?'reduced':'system');
}catch(e){}})();
`.trim();
