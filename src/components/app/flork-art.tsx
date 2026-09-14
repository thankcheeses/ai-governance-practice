"use client";

import Image from "next/image";
import { useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { FLORK, type FlorkName } from "@/lib/flork";
import { cn } from "@/lib/utils";

/**
 * FLORK illustrations, used as a study mascot on empty and completion states.
 *
 * These are **third-party FLORK meme artwork**, supplied by the project owner
 * and committed exactly as supplied — not redrawn, regenerated, restyled or
 * substituted, and no generated approximation was produced at any stage. See
 * `public/flork/README.md` for per-file provenance and `docs/flork-licensing.md`
 * for the licensing position, which is the owner's to determine.
 *
 * Nothing here implies any relationship with the IAPP. The artwork is not an
 * IAPP asset, is not endorsed, sponsored or approved by the IAPP, and is not
 * official AIGP material. The product's existing IAPP disclaimer is untouched
 * and unrelated to this component.
 *
 * Two constraints shape the rendering, and both follow from the files
 * themselves rather than from taste:
 *
 * **The source files are JPEGs with no alpha channel.** Every one is black line
 * art on a white or near-white ground, and that ground is baked into the pixels.
 * There is no way to knock it out without re-encoding the image, which would
 * mean the served file is no longer the supplied file. So each illustration is
 * rendered on an explicit white plate in *both* themes. On the dark theme
 * (`--card` is `#211c17`) that plate is a deliberate white panel rather than an
 * accident; on the light theme (`--card` is the warmer `#fffbf6`) it is a
 * slightly cooler rectangle, which the border resolves into a framed
 * illustration instead of a mismatch. The alternatives were hiding the art in
 * dark mode, or inverting it in CSS — the first withholds it from half the
 * users, and the second changes how the artwork looks, which is the one thing
 * this component must not do.
 *
 * **Committed bytes are served bytes.** Both deploy targets set
 * `output: "export"`, which disables the image optimizer, so `next/image` hands
 * the file over untouched. That is the property that makes "exactly as supplied"
 * true at the browser and not merely in git.
 */

const SIZE = {
  sm: "w-16",
  md: "w-24",
  lg: "w-32",
  xl: "w-44",
} as const;

export function FlorkArt({
  name,
  size = "md",
  className,
}: {
  name: FlorkName;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  /*
    Fail silently, matching `VisualAid`. A mascot that 404s should leave the
    surface looking intentional rather than showing a broken-image frame beside
    a heading — the surrounding copy already carries the whole message, and the
    illustration is there to set a tone, not to deliver information.

    That silence is only safe because `flork.test.ts` asserts every catalogue
    entry resolves to a file that is still byte-identical to what was supplied.
    Without it, a missing asset would look exactly like a deliberate design.
  */
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  const asset = FLORK[name];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden",
        // White in both themes: the JPEG's own ground is white and has no
        // alpha, so matching it is what keeps the art looking placed rather
        // than pasted. See the module comment.
        "rounded-2xl border border-border bg-white shadow-[var(--shadow-card)]",
        SIZE[size],
        className,
      )}
    >
      <Image
        /*
          Prefixed by hand, for the reason `visual-aid.tsx` documents: a static
          export runs no server optimizer, so `next/image` never applies
          `basePath` to a plain string src, and every asset would 404 on the
          project site.
        */
        src={withBasePath(asset.src)}
        alt={asset.alt}
        width={asset.width}
        height={asset.height}
        className="h-auto w-full"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
