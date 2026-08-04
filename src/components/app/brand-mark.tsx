import { cn } from "@/lib/utils";

/**
 * The NHID-Clinical mark — a shield with a verification check.
 *
 * Two treatments of the *same* geometry, so there is one brand shape:
 *
 *  - `flat`  (default) monochrome on a tinted plate. Used in chrome: header,
 *            sidebar, anywhere the mark is an identifier rather than a moment.
 *  - `glass` the 3D glass language: deep navy → teal → cyan gradient body,
 *            a specular sheen, inner highlight, and soft depth shadow.
 *            Reserved for brand moments — splash, empty states, upgrade.
 *
 * No new brand geometry is introduced here; `glass` is a surface treatment.
 */
export function BrandMark({
  variant = "flat",
  className,
}: {
  variant?: "flat" | "glass";
  className?: string;
}) {
  if (variant === "glass") return <GlassMark className={className} />;

  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-tint ring-1 ring-accent/25",
        className,
      )}
      aria-hidden
    >
      <ShieldPath className="h-[1.125rem] w-[1.125rem] text-primary" />
    </span>
  );
}

function GlassMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.125rem]",
        "brand-glass shadow-raised ring-1 ring-white/12",
        className,
      )}
      aria-hidden
    >
      {/* Specular sheen across the upper-left face. */}
      <span className="brand-glass-sheen pointer-events-none absolute inset-0" />
      {/* Inner top highlight, the edge-light that reads as glass thickness. */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40" />
      <ShieldPath className="relative h-1/2 w-1/2 text-white drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.35)]" />
    </span>
  );
}

/** Shared geometry — the single source of the mark's shape. */
function ShieldPath({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3 4.5 6.2v5.1c0 4.4 3 8.5 7.5 9.7 4.5-1.2 7.5-5.3 7.5-9.7V6.2L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m9 11.8 2.1 2.2L15 10"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
