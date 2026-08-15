/**
 * The dimensional visual object family.
 *
 * Civic Studio replaces flat iconography with low-relief objects: a navy
 * rounded-square tile carrying an inset mark built from rings, apertures,
 * paths, nodes, layered discs, or shield geometry. Depth comes from a fine
 * border and a soft layered shadow, not from gradients or glass.
 *
 * Two rules govern every use, and they are the reason this is a component
 * rather than a folder of SVGs:
 *
 *  1. **No meaning lives in the object alone.** Every mark ships beside a text
 *     label. The SVG is `aria-hidden` by default and the label carries the
 *     accessible name, so a screen reader hears the word, not a description of
 *     a shape. Where a mark genuinely stands alone, pass `label` and it becomes
 *     an `img` role with that name.
 *  2. **The geometry is drawn, not fetched.** These are HTML/CSS/SVG, so they
 *     inherit theme tokens, scale without raster artefacts, and cost no
 *     network request — which also means they survive offline, unlike the
 *     `/brand/` rasters the service worker does not cache.
 */

import { cn } from "@/lib/utils";

export type MarkName =
  | "home"
  | "study"
  | "review"
  | "exam"
  | "progress"
  | "settings"
  | "brand"
  | "correct"
  | "incorrect"
  | "insight"
  | "gate"
  | "oversight"
  | "accountability"
  | "monitoring"
  | "decision";

export type MarkSize = "sm" | "md" | "lg" | "xl";

const SIZE: Record<
  MarkSize,
  { box: string; svg: string; radius: string; stroke: number }
> = {
  sm: { box: "h-7 w-7", svg: "h-4 w-4", radius: "rounded-[7px]", stroke: 2 },
  md: { box: "h-9 w-9", svg: "h-5 w-5", radius: "rounded-[10px]", stroke: 1.9 },
  lg: { box: "h-12 w-12", svg: "h-7 w-7", radius: "rounded-[14px]", stroke: 1.8 },
  xl: { box: "h-16 w-16", svg: "h-9 w-9", radius: "rounded-[18px]", stroke: 1.7 },
};

/*
  Each glyph is drawn on a 24×24 grid with a 1.75 stroke, so the whole family
  shares one optical weight. They are built from the vocabulary the design
  system names — rings, apertures, paths, nodes, notches, layered discs and
  shield geometry — rather than from a general-purpose pictogram set.
*/
function Glyph({ name }: { name: MarkName }) {
  switch (name) {
    case "home":
      // A plane with an aperture: the ground you return to.
      return (
        <>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
          <path d="M9.5 21v-6h5v6" />
        </>
      );
    case "study":
      // Layered planes — material stacked for working through.
      return (
        <>
          <path d="M12 3 3 7.5l9 4.5 9-4.5z" />
          <path d="M3 12.5 12 17l9-4.5" />
          <path d="M3 17 12 21.5 21 17" />
        </>
      );
    case "review":
      // A return path: an arc that comes back on itself.
      return (
        <>
          <path d="M4 12a8 8 0 1 1 2.5 5.8" />
          <path d="M4 18.5V13h5.5" />
        </>
      );
    case "exam":
      // A ring with a hand — bounded time.
      return (
        <>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2" />
          <path d="M9 2.5h6" />
        </>
      );
    case "progress":
      // Ascending nodes on a path.
      return (
        <>
          <path d="M4 20V4" />
          <path d="M4 20h16" />
          <path d="M8 16.5v-4M12.5 16.5v-8M17 16.5v-6" />
        </>
      );
    case "settings":
      // Concentric rings with notches — a control you turn.
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" />
        </>
      );
    case "brand":
      // Shield geometry with an inset aperture — the product mark.
      return (
        <>
          <path d="M12 2.5 4.5 5.8v6.4c0 4.6 3.1 8.1 7.5 9.3 4.4-1.2 7.5-4.7 7.5-9.3V5.8z" />
          <circle cx="12" cy="11" r="2.4" />
          <path d="M12 13.4V16" />
        </>
      );
    case "correct":
      // A closed ring with a confirmed path inside it.
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8 12.3l2.8 2.8L16 9.6" />
        </>
      );
    case "incorrect":
      // A closed ring with crossed paths — a decision that did not hold.
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </>
      );
    case "insight":
      // An aperture over layered planes — context beneath the surface.
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 11v5.5" />
          <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
        </>
      );
    case "gate":
      // A threshold: two posts and the line you cross.
      return (
        <>
          <path d="M5 4v16M19 4v16" />
          <path d="M5 12h14" />
          <circle cx="12" cy="12" r="2.2" />
        </>
      );
    case "oversight":
      // Three stacked planes at decreasing width — levels of control.
      return (
        <>
          <path d="M4 6.5h16M6.5 12h11M9 17.5h6" />
        </>
      );
    case "accountability":
      // A node with paths radiating to owners.
      return (
        <>
          <circle cx="12" cy="12" r="2.6" />
          <path d="M12 9.4V4M12 14.6V20M9.4 12H4M14.6 12H20" />
        </>
      );
    case "monitoring":
      // A closed loop with a node on it — signal returning to learning.
      return (
        <>
          <path d="M20 12a8 8 0 1 1-3.2-6.4" />
          <path d="M20 4.5V10h-5.5" />
          <circle cx="12" cy="12" r="1.8" />
        </>
      );
    case "decision":
      // A path branching at a node — facts to action.
      return (
        <>
          <path d="M4 12h5" />
          <circle cx="11.5" cy="12" r="2.5" />
          <path d="M14 12h6M20 12l-3-3M20 12l-3 3" />
        </>
      );
  }
}

export interface DimensionalMarkProps {
  name: MarkName;
  size?: MarkSize;
  /**
   * Only for a mark with no adjacent text. Leaving this unset is the common
   * case and the correct one: the neighbouring label is the accessible name.
   */
  label?: string;
  /** Periwinkle treatment for the current route or an active state. */
  active?: boolean;
  /** Semantic surface. `plain` drops the tile and draws the mark alone. */
  tone?: "ink" | "accent" | "insight" | "support" | "danger" | "plain";
  className?: string;
}

/*
  Low relief, built in three layers.

  A flat fill reads as a sticker; these have to read as small solid objects
  sitting on the page. Each tone therefore carries:

    1. a soft top-lit surface gradient, so the tile has a light source,
    2. an inset highlight along the top edge and an inset shade along the
       bottom, which is what actually produces the bevel, and
    3. a two-part drop shadow — a tight contact shadow plus a wider soft one.

  This is the one place gradients are permitted, and deliberately so: the
  design system rules them out on *surfaces* — no gradient backgrounds, no
  glass — while the dimensional objects are the thing it asks to have depth.
  The gradients here are tonal shading within a single hue, never a colour
  transition, so nothing reads as a gradient in the sense the system forbids.
*/
const RELIEF =
  "shadow-[0_1px_2px_rgb(15_23_42/0.16),0_4px_10px_-2px_rgb(15_23_42/0.18),inset_0_1px_0_rgb(255_255_255/0.14),inset_0_-1px_0_rgb(0_0_0/0.18)]";

const RELIEF_LIGHT =
  "shadow-[0_1px_2px_rgb(15_23_42/0.08),0_4px_10px_-2px_rgb(15_23_42/0.10),inset_0_1px_0_rgb(255_255_255/0.85),inset_0_-1px_0_rgb(15_23_42/0.07)]";

const TONE: Record<NonNullable<DimensionalMarkProps["tone"]>, string> = {
  ink: `text-primary-foreground border-transparent bg-primary bg-[radial-gradient(120%_100%_at_50%_0%,rgb(255_255_255/0.16),transparent_60%)] ${RELIEF}`,
  accent: `text-white border-transparent bg-accent bg-[radial-gradient(120%_100%_at_50%_0%,rgb(255_255_255/0.22),transparent_60%)] ${RELIEF}`,
  insight: `text-insight-foreground border-border bg-insight-tint bg-[radial-gradient(120%_100%_at_50%_0%,rgb(255_255_255/0.7),transparent_65%)] ${RELIEF_LIGHT}`,
  support: `text-success border-border bg-success-tint bg-[radial-gradient(120%_100%_at_50%_0%,rgb(255_255_255/0.7),transparent_65%)] ${RELIEF_LIGHT}`,
  danger: `text-destructive border-border bg-destructive-tint bg-[radial-gradient(120%_100%_at_50%_0%,rgb(255_255_255/0.7),transparent_65%)] ${RELIEF_LIGHT}`,
  plain: "bg-transparent text-current border-transparent",
};

export function DimensionalMark({
  name,
  size = "md",
  label,
  active = false,
  tone = "ink",
  className,
}: DimensionalMarkProps) {
  const dim = SIZE[size];
  const surface = active ? TONE.accent : TONE[tone];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border",
        dim.box,
        tone === "plain" ? "" : dim.radius,
        surface,
        className,
      )}
      // A mark that stands alone announces itself; one beside a label stays
      // silent so the label is not read twice.
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={dim.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={dim.svg}
      >
        <Glyph name={name} />
      </svg>
    </span>
  );
}
