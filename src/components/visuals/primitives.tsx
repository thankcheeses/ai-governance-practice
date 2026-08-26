/**
 * Shared treatments for instructional diagrams.
 * Civic Studio tokens only — no raster, no decorative gradients.
 */
import { cn } from "@/lib/utils";

export const RAISED =
  "shadow-[0_1px_2px_rgb(15_23_42/0.08),0_4px_12px_-2px_rgb(15_23_42/0.10),inset_0_1px_0_rgb(255_255_255/0.55)]";

/**
 * Editorial frame. No CMS-style \"VISUAL\" label.
 */
export function DiagramFrame({
  title,
  lede,
  children,
  className,
  wide = false,
}: {
  title?: string;
  lede?: string;
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <figure
      className={cn(
        "rounded-2xl border border-border/80 bg-card",
        "px-5 py-6 sm:px-7 sm:py-8",
        "shadow-[0_1px_2px_rgb(15_23_42/0.04),0_8px_24px_-8px_rgb(15_23_42/0.08)]",
        className,
      )}
    >
      {(title || lede) && (
        <figcaption className={cn("mb-6", !wide && "max-w-[42rem]")}>
          {title ? (
            <h3 className="font-serif text-[1.25rem] leading-snug tracking-[-0.01em] text-foreground sm:text-[1.375rem]">
              {title}
            </h3>
          ) : null}
          {lede ? (
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {lede}
            </p>
          ) : null}
        </figcaption>
      )}
      {children}
    </figure>
  );
}

/** Back-compat wrapper — strips the old \"Visual\" eyebrow path. */
export function DiagramShell(props: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DiagramFrame title={props.title} lede={props.description} className={props.className}>
      {props.children}
    </DiagramFrame>
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
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 py-1.5",
        "text-[0.75rem] font-medium tracking-wide transition-colors duration-[120ms]",
        interactive &&
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : done
            ? "border-border-strong/40 bg-secondary text-foreground"
            : "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground",
      )}
    >
      {typeof index === "number" ? (
        <span aria-hidden className="tabular-nums opacity-60">
          {index + 1}
        </span>
      ) : null}
      {label}
    </Comp>
  );
}

export function FlowArrow({
  className,
  direction = "right",
}: {
  className?: string;
  direction?: "right" | "down";
}) {
  if (direction === "down") {
    return (
      <span
        aria-hidden
        className={cn(
          "mx-auto flex h-5 w-4 items-center justify-center text-border-strong",
          className,
        )}
      >
        <svg viewBox="0 0 16 20" className="h-4 w-3.5" fill="none">
          <path
            d="M8 2v13M4 11.5 8 15.5 12 11.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "mx-0.5 inline-flex h-4 w-5 shrink-0 items-center justify-center text-border-strong",
        className,
      )}
    >
      <svg viewBox="0 0 20 16" className="h-3.5 w-4" fill="none">
        <path
          d="M2 8h13M11.5 4 15.5 8 11.5 12"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function FlowRule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("mx-auto h-6 w-px bg-border-strong/40", className)}
    />
  );
}
