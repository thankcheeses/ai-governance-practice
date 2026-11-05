"use client";

import Image from "next/image";
import { useState } from "react";
import type { VisualAid as VisualAidData } from "@/content/types";
import { Diagram, hasDiagram } from "@/components/study/diagrams";
import { withBasePath } from "@/lib/base-path";
import { cn } from "@/lib/utils";

/**
 * Renders a question's optional diagram.
 *
 * Deliberate non-goals: this component never invents, substitutes, or
 * placeholders a diagram. If the asset is missing or fails to load it renders
 * nothing at all, so a question silently degrades to text rather than showing a
 * broken frame.
 *
 * A diagram arrives either as `figure` — drawn inline in `diagrams.tsx`, which
 * inherits the theme and cannot 404 — or as `src`, a static raster under
 * /public. An unknown `figure` name renders nothing rather than an empty frame,
 * the same contract as a missing asset.
 *
 * Height is capped so the diagram never pushes the answer choices off screen on
 * mobile — the question must stay answerable without hunting for the options.
 */
export function VisualAid({
  aid,
  className,
}: {
  aid: VisualAidData;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  const inline = aid.figure && hasDiagram(aid.figure) ? aid.figure : null;
  if (aid.figure && !inline) return null;

  return (
    <figure className={cn("my-6", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]",
          "h-[180px] sm:h-[240px]",
        )}
        // An inline figure carries its meaning in the content entry's `alt`,
        // announced below, so the drawing itself stays out of the tree.
        role={inline ? "img" : undefined}
        aria-label={inline ? aid.alt : undefined}
      >
        {inline ? (
          <div className="h-full w-full p-3">
            <Diagram name={inline} />
          </div>
        ) : (
        <Image
          /*
            Prefixed by hand. `next/image` does not apply `basePath` to a plain
            string src — the base path is read only by the server optimizer,
            which a static export does not run. Left bare, every diagram 404s
            on a project site, and this component's own fail-silent contract
            would hide that: the question would simply render without its
            figure and nothing would look broken.
          */
            src={withBasePath(aid.src!)}
            alt={aid.alt}
            fill
            // Diagrams are line art on a light ground — contain preserves the
            // whole figure rather than cropping to fill.
            className="object-contain p-3"
            sizes="(max-width: 640px) 100vw, 720px"
            onError={() => setFailed(true)}
            unoptimized={aid.src!.endsWith(".svg")}
          />
        )}
      </div>

      {aid.caption ? (
        <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {aid.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
