"use client";

import Image from "next/image";
import { useState } from "react";
import type { VisualAid as VisualAidData } from "@/content/types";
import { cn } from "@/lib/utils";

/**
 * Renders a question's optional diagram.
 *
 * Deliberate non-goals: this component never invents, substitutes, or
 * placeholders a diagram. If the asset is missing or fails to load it renders
 * nothing at all, so a question silently degrades to text rather than showing a
 * broken frame. Diagrams are supplied as static assets under /public.
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

  return (
    <figure className={cn("my-6", className)}>
      <div
        className={cn(
          "relative overflow-hidden border border-border bg-card shadow-[var(--shadow-card)]",
          "h-[180px] sm:h-[240px]",
        )}
      >
        <Image
          src={aid.src}
          alt={aid.alt}
          fill
          // Diagrams are line art on a light ground — contain preserves the
          // whole figure rather than cropping to fill.
          className="object-contain p-3"
          sizes="(max-width: 640px) 100vw, 720px"
          onError={() => setFailed(true)}
          unoptimized={aid.src.endsWith(".svg")}
        />
      </div>

      {aid.caption ? (
        <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {aid.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
