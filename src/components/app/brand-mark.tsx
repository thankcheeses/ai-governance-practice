import { cn } from "@/lib/utils";

/**
 * The AI Governance Practice mark — a shield with a verification check.
 *
 * Two sizes of the *same* geometry, so there is one brand shape:
 *
 *  - `flat`  (default) the mark on a bordered plate. Used in chrome: header,
 *            sidebar, anywhere the mark is an identifier.
 *  - `glass` the same mark at signage scale, inverted — solid foreground fill,
 *            background-coloured mark. Used for splash and empty states.
 *
 * The name `glass` is kept so callers do not change; the treatment is flat.
 * Gradients, sheens and depth shadows are out of the system entirely.
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
        "flex h-8 w-8 shrink-0 items-center justify-center border border-border-strong bg-card",
        className,
      )}
      aria-hidden
    >
      <ShieldPath className="h-[1.125rem] w-[1.125rem] text-foreground" />
    </span>
  );
}

function GlassMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-16 w-16 shrink-0 items-center justify-center bg-foreground",
        className,
      )}
      aria-hidden
    >
      <ShieldPath className="h-1/2 w-1/2 text-background" />
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
