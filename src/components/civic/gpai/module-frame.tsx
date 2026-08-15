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
        "flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-card sm:p-6",
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

      <div className="flex-1" />

      {/*
        The diagram labels every stage itself, so the compact mode does not
        list them again underneath — that was the same five words twice, once
        as a drawing and once as a row. Compact is still complete: the names
        are real selectable text inside the diagram. Expanding adds the
        explanation of each, which is the part that was genuinely hidden.
      */}
      {locked ? (
        <StageList stages={stages} />
      ) : (
        <>
          <div id={panelId} hidden={!open}>
            <StageList stages={stages} />
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            className={cn(
              "mt-4 inline-flex min-h-11 shrink-0 items-center self-start rounded-md px-3",
              "text-[0.875rem] font-medium",
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
 * Each stage with its explanation. An `<ol>` because the stages are ordered in
 * every module — that ordering is the teaching point, and a screen reader
 * should hear it as a sequence rather than a set.
 */
function StageList({ stages }: { stages: GpaiStage[] }) {
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
