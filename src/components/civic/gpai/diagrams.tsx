"use client";

/**
 * The GPAI module diagrams.
 *
 * Each module gets a diagram whose *shape carries its argument*, rather than a
 * generic row of dots. A ladder for graded levels, a graph for distributed
 * roles, a closed ring for a loop, a narrowing funnel for a sequence that
 * discards options as it goes. If the four were interchangeable they would be
 * decoration; they are not, so they aren't.
 *
 * **These are controls, not pictures.** Every stage is a real `<button>`, and
 * selecting one is how its explanation is read. That replaces a disclosure that
 * dumped all five explanations into a column underneath — the names appeared
 * twice, once as a drawing and once as a list, and the card grew tall enough to
 * bury the thing it was teaching. Because the nodes are ordinary buttons rather
 * than SVG shapes with click handlers, focus order, hit area and the pointer
 * cursor behave the way the rest of the app does.
 *
 * Only the connective tissue — rails, rules, the ring itself — is `aria-hidden`.
 * The labels are real text nodes, so they can be read by a screen reader,
 * selected, searched and translated.
 *
 * Built in HTML and SVG so they inherit theme tokens, scale without raster
 * artefacts, and cost no network request — which also means they still paint
 * offline, unlike an image would.
 */

import { cn } from "@/lib/utils";

/**
 * What every interactive diagram takes.
 *
 * `active` is a stage name rather than an index because the modules key their
 * copy by name; an index would silently point at the wrong stage the first time
 * someone reorders a list.
 */
export interface DiagramProps {
  labels: readonly string[];
  active: string;
  onSelect: (label: string) => void;
  /** Names the control group for assistive tech, e.g. "Oversight levels". */
  groupLabel: string;
}

/*
  The shared states for a selectable node.

  Selection is never carried by colour alone: the active node also gains a
  heavier border, a raised shadow and a weight change, and the detail panel
  below names the stage in text. `accent-subtle` is used for the active fill
  rather than `accent` because `--accent-foreground` is itself a dark orange in
  the light theme — an accent-on-accent pill would fail contrast.
*/
const NODE_BASE = cn(
  "relative inline-flex items-center justify-center whitespace-nowrap rounded-full border",
  "text-[0.6875rem] leading-none tracking-[0.01em]",
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-card"
);

const NODE_IDLE = cn(
  "border-border-strong/40 bg-secondary font-medium text-muted-foreground shadow-raised",
  "hover:-translate-y-px hover:border-accent/45 hover:text-foreground"
);

const NODE_ACTIVE = cn(
  "border-accent bg-accent-subtle font-semibold text-foreground shadow-accent"
);

function NodeButton({
  label,
  active,
  onSelect,
  className,
  style,
  children,
}: {
  label: string;
  active: boolean;
  onSelect: (label: string) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(label)}
      aria-pressed={active}
      style={style}
      className={cn(NODE_BASE, active ? NODE_ACTIVE : NODE_IDLE, className)}
    >
      {children ?? label}
    </button>
  );
}

/**
 * A ladder of blocks at increasing height — the shape for graded levels, where
 * the teaching point is that the tiers are ordered by degree rather than being
 * alternatives.
 *
 * The whole column is the control, bar and label together, so the hit target is
 * the full tier rather than a caption under it.
 */
export function LevelLadder({
  labels,
  active,
  onSelect,
  groupLabel,
}: DiagramProps) {
  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="flex items-end justify-center gap-2.5"
    >
      {labels.map((label, i) => {
        const on = label === active;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            aria-pressed={on}
            className={cn(
              "group/tier flex flex-1 flex-col items-center gap-2 rounded-lg px-1 pt-1",
              "transition-transform duration-150 ease-out hover:-translate-y-px",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "w-full rounded-md border transition-colors duration-150",
                on
                  ? "border-accent bg-gradient-to-t from-accent-subtle to-accent-tint shadow-accent"
                  : cn(
                      "border-success/30 bg-gradient-to-t from-success/30 to-success/15 shadow-raised",
                      "group-hover/tier:border-accent/45"
                    )
              )}
              style={{ height: `${34 + i * 16}px` }}
            />
            <span
              className={cn(
                "text-[0.6875rem] leading-tight transition-colors duration-150",
                on
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground"
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * A centre node with satellites — the shape for distributed responsibility.
 * The point is that the roles surround one accountable centre; a linear path
 * would say the opposite.
 */
export function RoleGraph({
  centre,
  around,
  active,
  onSelect,
  groupLabel,
}: {
  centre: string;
  around: readonly string[];
} & Omit<DiagramProps, "labels">) {
  const top = around.slice(0, 1);
  const sides = around.slice(1, 3);
  const bottom = around.slice(3);

  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="flex flex-col items-center gap-1.5"
    >
      {top.map((n) => (
        <NodeButton
          key={n}
          label={n}
          active={n === active}
          onSelect={onSelect}
          className="px-3 py-1.5"
        />
      ))}
      <Rule />
      <div className="flex items-center gap-1.5">
        {sides[0] ? (
          <NodeButton
            label={sides[0]}
            active={sides[0] === active}
            onSelect={onSelect}
            className="px-3 py-1.5"
          />
        ) : null}
        <Rule horizontal />
        {/*
          The centre is drawn heavier than its satellites even when another node
          is selected: "one accountable owner" is the diagram's claim, and
          letting selection flatten that would undercut the lesson.
        */}
        <NodeButton
          label={centre}
          active={centre === active}
          onSelect={onSelect}
          className={cn(
            "px-3.5 py-2",
            centre !== active &&
              "border-border-strong/60 bg-accent-tint text-foreground"
          )}
        />
        <Rule horizontal />
        {sides[1] ? (
          <NodeButton
            label={sides[1]}
            active={sides[1] === active}
            onSelect={onSelect}
            className="px-3 py-1.5"
          />
        ) : null}
      </div>
      <Rule />
      {bottom.map((n) => (
        <NodeButton
          key={n}
          label={n}
          active={n === active}
          onSelect={onSelect}
          className="px-3 py-1.5"
        />
      ))}
    </div>
  );
}

/**
 * A closed ring of nodes — the shape for a loop, where the argument is that
 * the last stage feeds the first. A row with an arrow tacked on the end would
 * undercut exactly that.
 */
export function LoopRing({
  labels,
  active,
  onSelect,
  groupLabel,
}: DiagramProps) {
  const n = labels.length;
  /*
    Radii as percentages of the container rather than viewBox units, so the
    ring and the nodes stay on the same curve at every card width. An earlier
    version put the nodes on a fixed 68px radius inside a 300px box, which
    pinned five pills into the middle 45% of the card: they collided, and the
    ring showed through the gaps as a wobble rather than reading as a circle.
  */
  const RX = 38;
  const RY = 34;

  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="relative mx-auto h-[184px] w-full max-w-[360px]"
    >
      {/*
        Drawn as a border rather than an SVG ellipse so it inherits the theme
        token directly and cannot be distorted by viewBox scaling. The nodes are
        opaque and sit centred on the curve, so the ring passes behind them —
        beads on a loop.
      */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-accent-subtle"
        style={{ width: `${RX * 2}%`, height: `${RY * 2}%` }}
      />
      {labels.map((label, i) => {
        // Start at the top and go clockwise, so reading order matches the order
        // the stages are taught in.
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        return (
          <NodeButton
            key={label}
            label={label}
            active={label === active}
            onSelect={onSelect}
            className="absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1.5"
            style={{
              left: `${50 + Math.cos(angle) * RX}%`,
              top: `${50 + Math.sin(angle) * RY}%`,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * A narrowing stack — the shape for a sequence that discards as it goes. Each
 * band is narrower than the one above because that is the claim: you finish
 * with fewer defensible options than you started with.
 */
export function NarrowingStack({
  labels,
  active,
  onSelect,
  groupLabel,
}: DiagramProps) {
  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="flex flex-col items-center gap-1.5"
    >
      {labels.map((label, i) => {
        const on = label === active;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            aria-pressed={on}
            style={{ width: `${100 - i * 11}%` }}
            className={cn(
              "flex items-center justify-center rounded-md border py-2",
              "text-[0.6875rem] leading-none transition-all duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              on
                ? "border-accent bg-accent-subtle font-semibold text-foreground shadow-accent"
                : cn(
                    "border-border-strong/30 font-medium text-muted-foreground shadow-raised",
                    "hover:-translate-y-px hover:border-accent/45 hover:text-foreground",
                    i === labels.length - 1 ? "bg-accent-tint" : "bg-secondary"
                  )
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The gate rail: solid nodes on a track, the last one live.
 *
 * This is the reference's own treatment for the pre-launch gate — physical
 * beads on a rail rather than dots on a line — because the gate's argument is
 * that you pass *through* each one in order.
 *
 * Still static: it is used on its own beside the current-focus panel rather
 * than inside a teaching module, so there is no explanation for a click to
 * reveal.
 */
export function GateRail({
  labels,
  orientation = "horizontal",
}: {
  labels: readonly string[];
  /**
   * `vertical` runs the rail top to bottom with each label beside its bead.
   *
   * The horizontal rail cannot carry these labels in a side panel, and no
   * amount of CSS makes it: five beads across ~390px give each label about
   * 78px, and "Accountability" is a single 14-character word, so it has no
   * break opportunity. Shrinking it until it fits was tried and ends in
   * illegible 10px type that still collides with "Controls"; letting it wrap
   * ends in "Accou / ntabili / ty". Turning the rail is the fix, because
   * vertical gives the label the panel's full width and the sequence reads
   * top-to-bottom just as well as left-to-right.
   */
  orientation?: "horizontal" | "vertical";
}) {
  if (orientation === "vertical") {
    return (
      <ol aria-hidden className="relative flex flex-col gap-3.5 py-1">
        {/* The track, inset so it starts and ends inside the first and last bead. */}
        <span className="absolute left-[13px] top-3 bottom-3 w-[3px] -translate-x-1/2 rounded-full bg-border-strong/30" />
        {labels.map((label, i) => {
          const last = i === labels.length - 1;
          return (
            <li key={label} className="relative flex items-center gap-3">
              <span
                className={cn(
                  "z-10 h-[26px] w-[26px] shrink-0 rounded-full border shadow-raised",
                  last
                    ? "border-accent/40 bg-accent"
                    : "border-border-strong/30 bg-card"
                )}
              />
              <span
                className={cn(
                  "text-[0.8125rem] leading-tight",
                  last
                    ? "font-medium text-accent-strong"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div
      aria-hidden
      className="pt-1"
      style={{ ["--gate-cols" as string]: labels.length }}
    >
      {/*
        Beads and labels share one grid rather than being two independently
        justified flex rows, so each label sits exactly under its own bead at
        any width instead of depending on equal text widths.
      */}
      <div className="relative grid items-center [grid-template-columns:repeat(var(--gate-cols),minmax(0,1fr))]">
        <span className="absolute inset-x-[10%] top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-border-strong/30" />
        {labels.map((label, i) => {
          const last = i === labels.length - 1;
          return (
            <span key={label} className="flex justify-center">
              <span
                className={cn(
                  "relative z-10 h-7 w-7 rounded-full border shadow-raised",
                  last
                    ? "border-accent/40 bg-accent"
                    : "border-border-strong/30 bg-card"
                )}
              />
            </span>
          );
        })}
      </div>
      <div className="mt-2 grid items-start gap-x-1 [grid-template-columns:repeat(var(--gate-cols),minmax(0,1fr))]">
        {labels.map((label, i) => (
          <span
            key={label}
            className={cn(
              "text-center text-[0.6875rem] leading-[1.2]",
              i === labels.length - 1
                ? "font-medium text-accent-strong"
                : "text-muted-foreground"
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ internals -- */

/** The connective tissue between role nodes. Decoration, so hidden. */
function Rule({ horizontal = false }: { horizontal?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "rounded-full bg-border-strong/30",
        horizontal ? "h-[2px] w-4" : "h-3 w-[2px]"
      )}
    />
  );
}
