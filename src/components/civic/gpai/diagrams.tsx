/**
 * The GPAI module diagrams.
 *
 * Each module gets a diagram whose *shape carries its argument*, rather than a
 * generic row of dots. A ladder for graded levels, a graph for distributed
 * roles, a closed ring for a loop, a narrowing funnel for a sequence that
 * discards options as it goes. If the four were interchangeable they would be
 * decoration; they are not, so they aren't.
 *
 * Every one is `aria-hidden`. The stage names are repeated as real text in the
 * module's own list directly beneath, so announcing the drawing would read the
 * same words twice — and the drawing is reinforcement, never the only copy.
 *
 * Built in HTML and SVG so they inherit theme tokens, scale without raster
 * artefacts, and cost no network request — which also means they still paint
 * offline, unlike an image would.
 */

import { cn } from "@/lib/utils";

/* Shared low-relief treatment, matching the dimensional marks. */
const RAISED =
  "shadow-[0_1px_2px_rgb(15_23_42/0.10),0_3px_8px_-2px_rgb(15_23_42/0.12),inset_0_1px_0_rgb(255_255_255/0.6)]";

/**
 * A ladder of blocks at increasing height — the shape for graded levels, where
 * the teaching point is that the tiers are ordered by degree rather than being
 * alternatives.
 */
export function LevelLadder({ labels }: { labels: readonly string[] }) {
  return (
    <div aria-hidden className="flex items-end justify-center gap-2 pt-2">
      {labels.map((label, i) => (
        <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
          <div
            className={cn(
              "w-full rounded-md border border-success/30",
              i === labels.length - 1 ? "bg-success/45" : "bg-success/25",
              RAISED,
            )}
            style={{ height: `${34 + i * 16}px` }}
          />
          <span className="text-[0.6875rem] leading-tight text-muted-foreground">
            {label}
          </span>
        </div>
      ))}
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
}: {
  centre: string;
  around: readonly string[];
}) {
  const top = around.slice(0, 1);
  const sides = around.slice(1, 3);
  const bottom = around.slice(3);

  return (
    <div aria-hidden className="flex flex-col items-center gap-1.5 py-1">
      {top.map((n) => (
        <Node key={n} label={n} />
      ))}
      <Rule />
      <div className="flex items-center gap-1.5">
        {sides[0] ? <Node label={sides[0]} /> : null}
        <Rule horizontal />
        <Node label={centre} strong />
        <Rule horizontal />
        {sides[1] ? <Node label={sides[1]} /> : null}
      </div>
      <Rule />
      {bottom.map((n) => (
        <Node key={n} label={n} />
      ))}
    </div>
  );
}

/**
 * A closed ring of nodes — the shape for a loop, where the argument is that
 * the last stage feeds the first. A row with an arrow tacked on the end would
 * undercut exactly that.
 */
export function LoopRing({ labels }: { labels: readonly string[] }) {
  const n = labels.length;
  const rx = 42;
  const ry = 30;

  return (
    <div aria-hidden className="relative mx-auto h-[124px] w-full max-w-[260px]">
      <svg viewBox="0 0 200 124" className="absolute inset-0 h-full w-full">
        <ellipse
          cx="100"
          cy="62"
          rx={rx + 26}
          ry={ry + 12}
          fill="none"
          stroke="var(--color-accent-subtle)"
          strokeWidth="2.5"
        />
      </svg>
      {labels.map((label, i) => {
        // Start at the top and go clockwise, so reading order matches the list.
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        const x = 50 + (Math.cos(angle) * (rx + 26) * 100) / 200;
        const y = 50 + (Math.sin(angle) * (ry + 12) * 100) / 124;
        return (
          <span
            key={label}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full",
              "border border-border-strong/30 bg-accent-subtle px-2.5 py-1",
              "text-[0.6875rem] font-medium text-foreground",
              RAISED,
            )}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {label}
          </span>
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
export function NarrowingStack({ labels }: { labels: readonly string[] }) {
  return (
    <div aria-hidden className="flex flex-col items-center gap-1 py-1">
      {labels.map((label, i) => (
        <div
          key={label}
          className={cn(
            "flex items-center justify-center rounded-md border border-border-strong/25 py-1.5",
            "text-[0.6875rem] font-medium text-foreground",
            i === labels.length - 1 ? "bg-accent-subtle" : "bg-secondary",
            RAISED,
          )}
          style={{ width: `${100 - i * 13}%` }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

/**
 * The gate rail: solid nodes on a track, the last one live.
 *
 * This is the reference's own treatment for the pre-launch gate — physical
 * beads on a rail rather than dots on a line — because the gate's argument is
 * that you pass *through* each one in order.
 */
export function GateRail({ labels }: { labels: readonly string[] }) {
  return (
    <div aria-hidden className="pt-1">
      <div className="relative flex items-center justify-between">
        <span className="absolute inset-x-4 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-border-strong/30" />
        {labels.map((label, i) => {
          const last = i === labels.length - 1;
          return (
            <span
              key={label}
              className={cn(
                "relative z-10 h-7 w-7 rounded-full border",
                last
                  ? "border-accent/40 bg-accent"
                  : "border-border-strong/30 bg-card",
                RAISED,
              )}
            />
          );
        })}
      </div>
      <div className="mt-2 flex items-start justify-between gap-1">
        {labels.map((label, i) => (
          <span
            key={label}
            className={cn(
              "flex-1 text-center text-[0.6875rem] leading-tight",
              i === labels.length - 1
                ? "font-medium text-accent-strong"
                : "text-muted-foreground",
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

function Node({ label, strong = false }: { label: string; strong?: boolean }) {
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium",
        strong
          ? "border-border-strong/30 bg-accent-subtle text-foreground"
          : "border-success/30 bg-success/25 text-foreground",
        RAISED,
      )}
    >
      {label}
    </span>
  );
}

function Rule({ horizontal = false }: { horizontal?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full bg-border-strong/30",
        horizontal ? "h-[2px] w-4" : "h-3 w-[2px]",
      )}
    />
  );
}
