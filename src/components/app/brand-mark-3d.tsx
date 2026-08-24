"use client";

import Image from "next/image";
import { useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { cn } from "@/lib/utils";

/**
 * The rendered NHID mark, for the splash route only.
 *
 * This is the opt-in escape hatch documented in `public/ui-kit/README.md`: a
 * richer treatment arrives as a variant with the flat mark as the default, never
 * as a replacement for it. The flat and `glass` treatments in `brand-mark.tsx`
 * are untouched, and this module is deliberately separate so that stays true —
 * it carries the `"use client"` boundary and the `useState` that the rest of the
 * mark does not need.
 *
 * Why only the splash: the app's own visual language is flat, monospace and
 * warm-neutral, and README §11 rules out decorative art inside the interface.
 * The splash is the one surface whose job is to present the product rather than
 * operate it — the same reasoning that already allows a navy/teal gradient in
 * `public/icon.svg` at the OS boundary while banning one in-app.
 *
 * On error this degrades to the flat-filled mark rather than to nothing. That
 * differs from `VisualAid`, which renders nothing when a diagram is missing: a
 * diagram is supplementary, but the splash would otherwise be a bare tagline.
 */
export function BrandMark3D({
  fallback,
  className,
}: {
  /** Rendered if the asset fails to load. */
  fallback: React.ReactNode;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;

  return (
    <span
      className={cn("relative block h-24 w-24 shrink-0", className)}
      aria-hidden
    >
      <Image
        // Prefixed by hand for the same reason as the diagrams: `next/image`
        // leaves a string src untouched when the optimizer is not running.
        src={withBasePath("/brand/logo-nhid-clinical-mark-3d.webp")}
        alt=""
        fill
        // The source render is 1200x1195 with a real alpha channel, so it
        // composites straight onto the warm surfaces without a plate behind it.
        className="object-contain"
        sizes="96px"
        // This is the splash's LCP element.
        priority
        onError={() => setFailed(true)}
      />
    </span>
  );
}
