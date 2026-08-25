/**
 * Shared low-relief treatments for instructional diagrams.
 * Matches Civic Studio dimensional marks — theme tokens only, no raster.
 */
import { cn } from "@/lib/utils";

export const RAISED =
  "shadow-[0_1px_2px_rgb(15_23_42/0.10),0_3px_8px_-2px_rgb(15_23_42/0.12),inset_0_1px_0_rgb(255_255_255/0.6)]";

export function DiagramShell({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-card sm:p-5",
        className,
      )}
    >
      <figcaption className="mb-3">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Visual
        </p>
        <p className="mt-1 text-[0.9375rem] font-medium text-foreground">{title}</p>
        <p className="measure mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </figcaption>
      {children}
    </figure>
  );
}

export function StageChip({
  label,
  active = false,
  done = false,
  onClick,
  index,
}: {
  label: string;
  active?: boolean;
  done?: boolean;
  onClick?: () => void;
  index?: number;
}) {
  const interactive = typeof onClick === "function";
  const Comp = interactive ? "button" : "span";
  return (
    <Comp
      type={interactive ? "button" : undefined}
      onClick={onClick}
      aria-current={active ? "step" : undefined}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5",
        "text-[0.75rem] font-medium transition-colors duration-[120ms]",
        interactive &&
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-accent bg-accent-tint text-accent-foreground ring-1 ring-inset ring-accent"
          : done
            ? "border-success/40 bg-success/15 text-foreground"
            : "border-border bg-secondary text-muted-foreground hover:border-border-strong hover:text-foreground",
        RAISED,
      )}
    >
      {typeof index === "number" ? (
        <span aria-hidden className="tabular-nums opacity-70">
          {index + 1}
        </span>
      ) : null}
      {label}
    </Comp>
  );
}

export function FlowArrow({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mx-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-border-strong",
        className,
      )}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
        <path
          d="M3 8h9M9 4.5 12.5 8 9 11.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
