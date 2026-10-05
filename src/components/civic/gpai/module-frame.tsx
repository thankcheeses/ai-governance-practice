"use client";

import { useId, useState } from "react";
import { DimensionalMark, type MarkName } from "../dimensional-mark";
import { cn } from "@/lib/utils";

/**
 * The shared chrome every GPAI teaching module sits in.
 *
 * The five modules differ in the shape they draw and the stages they name;
 * they do not differ in how they announce themselves, how they reveal
 * explanation, or how they behave for a keyboard or a screen reader. Putting
 * that in one place is what keeps them a family rather than five similar-looking
 * cards.
 *
 * Two rules the design system sets, enforced here rather than per module:
 *
 *  - **The drawing is never the only copy.** Stage names are real text nodes in
 *    the DOM, not labels baked into a graphic, so they can be read by a screen
 *    reader, selected, searched, and translated.
 *  - **The diagram is the control.** Selecting a stage is how its explanation is
 *    read. This replaced a disclosure button that appended every explanation in
 *    a column underneath: the stage names then appeared twice, once as a drawing
 *    and once as a list, and a five-stage card ran past 900px tall — long enough
 *    that the diagram carrying the actual argument was off screen by the time
 *    you reached the text explaining it. One explanation at a time keeps the
 *    shape and its meaning on screen together, which is the whole point of
 *    drawing a shape.
 *
 * Nothing is hidden behind the interaction that was not already reachable: every
 * stage is a focusable button, the panel is a live region, and the explanations
 * are one keystroke apart rather than one scroll.
 */
export interface GpaiStage {
  /** Short label shown on the path. */
  name: string;
  /** One line of explanation, revealed when the stage is selected. */
  detail: string;
}

export interface GpaiModuleProps {
  /** Render the full stage list instead of the selectable panel. */
  variant?: "compact" | "expanded";
  className?: string;
}

/** What a module's diagram needs in order to be the card's control surface. */
export interface DiagramApi {
  active: string;
  select: (name: string) => void;
}

export function GpaiFrame({
  title,
  summary,
  mark,
  stages,
  variant = "compact",
  diagram,
  className,
}: {
  title: string;
  summary: string;
  mark: MarkName;
  stages: GpaiStage[];
  variant?: "compact" | "expanded";
  /** The module's own geometry, wired to the card's selection. */
  diagram: (api: DiagramApi) => React.ReactNode;
  className?: string;
}) {
  const [active, setActive] = useState(stages[0]!.name);
  const panelId = useId();
  const expanded = variant === "expanded";

  const index = Math.max(
    0,
    stages.findIndex((s) => s.name === active),
  );
  const current = stages[index]!;

  return (
    <section
      className={cn(
        // The hairline across the top edge is the one piece of ornament: it
        // catches the card's upper boundary in both themes, where a flat border
        // alone reads as a box rather than a surface.
        "relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card",
        "p-5 shadow-card transition-shadow duration-200 sm:p-6",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px",
        "before:bg-gradient-to-r before:from-transparent before:via-border-strong before:to-transparent",
        "hover:shadow-card-hover",
        className,
      )}
      aria-labelledby={`${panelId}-title`}
    >
      <div className="flex items-start gap-3.5">
        <DimensionalMark name={mark} size="md" />
        <div className="min-w-0 flex-1">
          <h3 id={`${panelId}-title`} className="text-[1.0625rem] text-foreground">
            {title}
          </h3>
          <p className="measure mt-1 text-[0.875rem] leading-relaxed text-muted-foreground">
            {summary}
          </p>
        </div>
      </div>

      {/*
        The diagram takes the slack and centres in it, rather than sitting tight
        under the summary with the leftover space dumped above the panel. The
        diagrams differ in height by design — a three-rung ladder is not a
        five-node ring — so in a two-up grid one card always has slack; centring
        spends it as breathing room on both sides instead of one gap, and the
        panels still line up along the bottom edge.

        `flex-col` rather than `items-center`: the ladder sizes its rungs with
        flex-1 and the narrowing stack sets each band as a percentage width, so
        a shrink-to-fit wrapper collapses both to the width of their longest
        label.
      */}
      <div className="mt-6 flex flex-1 flex-col justify-center">
        {diagram({ active, select: setActive })}
      </div>

      {expanded ? (
        <StageList stages={stages} />
      ) : (
        <div
          id={panelId}
          aria-live="polite"
          className={cn(
            "mt-6 min-h-[6.5rem] rounded-xl border border-border/80 bg-background/55 px-4 py-3.5",
          )}
        >
          <div className="flex items-baseline gap-2.5">
            <span
              aria-hidden
              className={cn(
                "inline-flex h-5 w-5 shrink-0 items-center justify-center self-start rounded-md",
                "border border-accent/35 bg-accent-subtle text-[0.6875rem] font-semibold text-accent-strong",
              )}
            >
              {index + 1}
            </span>
            <p className="min-w-0 flex-1 text-[0.9375rem] font-medium text-foreground">
              {current.name}
            </p>
            <span className="shrink-0 text-[0.6875rem] tabular-nums text-muted-foreground/80">
              {index + 1} / {stages.length}
            </span>
          </div>
          <p className="measure mt-1.5 text-[0.875rem] leading-relaxed text-muted-foreground">
            {current.detail}
          </p>
        </div>
      )}
    </section>
  );
}

/**
 * Each stage with its explanation. An `<ol>` because the stages are ordered in
 * every module — that ordering is the teaching point, and a screen reader
 * should hear it as a sequence rather than a set.
 */
function StageList({ stages }: { stages: GpaiStage[] }) {
  return (
    <ol className="mt-6 space-y-3">
      {stages.map((s, i) => (
        <li key={s.name} className="flex gap-3">
          <span
            aria-hidden
            className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-[0.75rem] font-semibold text-muted-foreground"
          >
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-[0.9375rem] font-medium text-foreground">{s.name}</p>
            <p className="measure text-[0.875rem] leading-relaxed text-muted-foreground">
              {s.detail}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
