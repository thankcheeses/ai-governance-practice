"use client";

import { useId, useState } from "react";
import { DimensionalMark, type MarkName } from "../dimensional-mark";
import { cn } from "@/lib/utils";

/**
 * The shared chrome every GPAI teaching module sits in.
 *
 * The five modules differ in the shape they draw and the stages they name;
 * they do not differ in how they announce themselves, how they expand, or how
 * they behave for a keyboard or a screen reader. Putting that in one place is
 * what keeps them a family rather than five similar-looking cards.
 *
 * Two rules the design system sets, enforced here rather than per module:
 *
 *  - **Compact and expanded are both complete.** The compact mode is not a
 *    teaser with the meaning hidden behind a click; it names every stage in
 *    selectable text. Expanding adds explanation, not the point.
 *  - **The drawing is never the only copy.** Stage names are real text nodes
 *    in the DOM, not labels baked into a graphic, so they can be read by a
 *    screen reader, selected, searched, and translated.
 */
export interface GpaiStage {
  /** Short label shown on the path. */
  name: string;
  /** One line of explanation, revealed in the expanded mode. */
  detail: string;
}

export interface GpaiModuleProps {
  /** Render without the disclosure control, always expanded. */
  variant?: "compact" | "expanded";
  className?: string;
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
  /** The module's own geometry, drawn between the summary and the stage list. */
  diagram: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(variant === "expanded");
  const panelId = useId();
  const locked = variant === "expanded";

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-card sm:p-6",
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

      <div className="mt-5">{diagram}</div>

      {locked ? (
        <StageList stages={stages} expanded />
      ) : (
        <>
          <div id={panelId} hidden={!open}>
            <StageList stages={stages} expanded />
          </div>
          {!open ? <StageList stages={stages} expanded={false} /> : null}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            className={cn(
              "mt-4 inline-flex min-h-11 items-center rounded-md px-3 text-[0.875rem] font-medium",
              "text-accent-strong transition-colors duration-[120ms] hover:bg-secondary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            {open ? "Show less" : "What each stage means"}
          </button>
        </>
      )}
    </section>
  );
}

/**
 * Compact lists the stage names inline; expanded gives each one its
 * explanation. Both are `<ol>` because the stages are ordered in every module —
 * that ordering is the teaching point, and a screen reader should hear it.
 */
function StageList({
  stages,
  expanded,
}: {
  stages: GpaiStage[];
  expanded: boolean;
}) {
  if (!expanded) {
    return (
      <ol className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        {stages.map((s, i) => (
          <li key={s.name} className="flex items-center gap-2">
            <span className="text-[0.875rem] font-medium text-foreground">
              {s.name}
            </span>
            {i < stages.length - 1 ? (
              <span aria-hidden className="text-muted-foreground">
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="mt-4 space-y-3">
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

/* ---------------------------------------------------------- Geometry ------ */

/**
 * A horizontal path of nodes joined by connectors — the shape shared by the
 * gate, the decision frame, and the monitoring loop.
 *
 * `aria-hidden` throughout: every label it draws is repeated as real text in
 * the stage list above, so announcing the drawing would duplicate it.
 */
export function NodePath({
  count,
  tone = "accent",
  loop = false,
}: {
  count: number;
  tone?: "accent" | "insight" | "support";
  loop?: boolean;
}) {
  const fill =
    tone === "insight"
      ? "bg-insight"
      : tone === "support"
        ? "bg-success"
        : "bg-accent";

  return (
    <div aria-hidden className="flex items-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-1 items-center gap-1.5">
          <span
            className={cn(
              "h-3 w-3 shrink-0 rounded-full border border-border-strong/40 shadow-raised",
              fill,
            )}
          />
          {i < count - 1 ? (
            <span className="h-[2px] flex-1 rounded-full bg-border-strong/40" />
          ) : null}
        </div>
      ))}
      {loop ? (
        <span className="ml-1 shrink-0 text-[0.875rem] text-muted-foreground">↺</span>
      ) : null}
    </div>
  );
}

/**
 * Stacked planes at decreasing width — the shape for graded levels, where the
 * point is that each tier is narrower in scope than the one above it.
 */
export function LayeredPlanes({ count }: { count: number }) {
  return (
    <div aria-hidden className="flex flex-col items-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="h-2.5 rounded-full border border-border-strong/40 bg-accent shadow-raised"
          style={{ width: `${100 - i * 22}%`, opacity: 1 - i * 0.18 }}
        />
      ))}
    </div>
  );
}

/**
 * A central node with paths radiating to satellites — the shape for role
 * allocation, where the teaching point is that responsibility is distributed
 * from one accountable centre rather than sequenced.
 */
export function RadialNodes({ count }: { count: number }) {
  return (
    <div aria-hidden className="flex items-center justify-center gap-2 py-1">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <span className="h-[18px] w-[2px] rounded-full bg-border-strong/40" />
          <span className="h-3 w-3 rounded-full border border-border-strong/40 bg-accent shadow-raised" />
        </div>
      ))}
    </div>
  );
}
