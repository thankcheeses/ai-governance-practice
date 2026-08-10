import { BrandMark3D } from "@/components/app/brand-mark-3d";
import { cn } from "@/lib/utils";

/**
 * The AI Governance Practice mark — a shield with a verification check.
 *
 * Two sizes of the *same* geometry, so there is one brand shape:
 *
 *  - `flat`  (default) the bare mark, used in chrome: header, sidebar,
 *            anywhere it is an identifier sitting beside the wordmark.
 *  - `glass` the same mark at signage scale on the ink fill. Used for splash
 *            and empty states.
 *
 * The name `glass` is kept so callers do not change; the treatment is a flat
 * fill. Gradients and sheens are out of the system entirely.
 *
 * The flat mark used to sit on a bordered, shadowed plate. That plate is the
 * kind of chrome this system exists to refuse — "the tool is the interface" —
 * and at sidebar width it pushed the wordmark onto a second line. The mark now
 * draws directly on the surface.
 *
 * A third variant, `3d`, opts into the rendered NHID mark. It is used on the
 * splash route and nowhere else, and it falls back to `glass`. See
 * `brand-mark-3d.tsx` for why it is a separate module and why the interface
 * does not get one.
 */
export function BrandMark({
  variant = "flat",
  className,
}: {
  variant?: "flat" | "glass" | "3d";
  className?: string;
}) {
  if (variant === "3d") {
    return <BrandMark3D className={className} fallback={<GlassMark />} />;
  }
  if (variant === "glass") return <GlassMark className={className} />;

  return (
    <span
      className={cn("flex shrink-0 items-center justify-center", className)}
      aria-hidden
    >
      <ShieldPath className="h-[1.0625rem] w-[1.0625rem] text-accent-strong" />
    </span>
  );
}

function GlassMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-[var(--shadow-accent)]",
        className,
      )}
      aria-hidden
    >
      <ShieldPath className="h-1/2 w-1/2 text-primary-foreground" />
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
