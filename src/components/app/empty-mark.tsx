import { cn } from "@/lib/utils";

/**
 * Line marks for empty and zero states.
 *
 * Why these exist: a surface with nothing on it reads as broken unless
 * something says otherwise. The copy says it, but only after the reader has
 * spent a beat deciding whether the screen failed. The mark answers that
 * question before the sentence is read, which is the job README "Visual
 * language" rule 1 asks every graphic to earn its place with.
 *
 * Why line art and not a render: these sit on surfaces the product is
 * *operated* on, so rule 2 applies — flat strokes in `currentColor`, inheriting
 * the surface they land on and surviving both themes without a second asset.
 * The rendered treatments in `public/ui-kit/` are briefing material and stay
 * out of here.
 *
 * Each mark is drawn to say what is absent rather than to illustrate the
 * feature in general: `chart` is an axis with no plot on it, `cleared` is an
 * emptied tray, `deck` is an unopened stack. A generic trophy or a shrug would
 * decorate without informing, and would not ship under rule 1.
 *
 * Decorative by default — the adjacent heading already carries the meaning for
 * a screen reader, so these are `aria-hidden` unless given a `title`.
 */

type Stroke = string | { d: string; dash?: string };

const MARKS: Record<string, readonly Stroke[]> = {
  /**
   * An axis and an empty plot area. For "no data yet".
   *
   * Deliberately no bars: a bar *is* a datum, so drawing three of them on a
   * card that says nothing has been recorded contradicts the copy. What the
   * mark shows is the frame waiting to be filled — solid axes, a dashed
   * baseline where a series would land.
   */
  chart: [
    "M10 9v27h28",
    { d: "M13 29h23", dash: "2 3" },
    { d: "M13 21h23", dash: "2 3" },
  ],
  /** An emptied tray, lid open, nothing left in it. For "nothing due". */
  cleared: [
    "M9 25h8l2 4h8l2-4h8",
    "M9 25l4-13h18l4 13v9a3 3 0 01-3 3H12a3 3 0 01-3-3z",
    "M19 8l4 4 4-4",
  ],
  /** An unopened stack of cards. For "nothing started". */
  deck: [
    "M13 16h20a3 3 0 013 3v15a3 3 0 01-3 3H13a3 3 0 01-3-3V19a3 3 0 013-3z",
    "M15 12h18M17 8h14",
    "M18 25h10M18 30h7",
  ],
  /** A route whose next step has not been taken. For "pick a track". */
  path: [
    "M10 36c6 0 6-9 12-9s6-9 12-9",
    "M10 36h.01",
    { d: "M34 18a3 3 0 100-6 3 3 0 000 6z", dash: "2 2.5" },
    "M22 27h.01",
  ],
};

export type EmptyMarkName = keyof typeof MARKS;

export function EmptyMark({
  name,
  className,
  title,
}: {
  name: EmptyMarkName;
  className?: string;
  /** Supply only when the mark is the sole carrier of the meaning. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 46 46"
      className={cn("h-12 w-12 text-accent/45", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {MARKS[name].map((stroke) => {
        const { d, dash } = typeof stroke === "string" ? { d: stroke, dash: undefined } : stroke;
        return <path key={d} d={d} strokeDasharray={dash} />;
      })}
    </svg>
  );
}
