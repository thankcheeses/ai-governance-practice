/**
 * Civic Studio presentation surfaces.
 *
 * Every component here takes data and callbacks and returns markup. None of
 * them read progress, grade an answer, schedule a review, touch storage, or
 * call Supabase — that logic stays in the providers and route helpers it
 * already lives in. Keeping the boundary strict is what makes the redesign
 * reversible: the visual layer can be replaced again without disturbing
 * anything that decides what a learner sees next.
 */

import { cn } from "@/lib/utils";
import { DimensionalMark, type MarkName } from "./dimensional-mark";

/* ------------------------------------------------------------ Headings --- */

/**
 * Editorial display heading with an optional supporting line.
 *
 * The serif is set on `h1`–`h3` globally, so this component's job is rhythm
 * and the eyebrow/lede relationship rather than font selection.
 */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  level = 2,
  align = "start",
  className,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  level?: 1 | 2 | 3;
  align?: "start" | "center";
  className?: string;
}) {
  const Tag = `h${level}` as "h1" | "h2" | "h3";
  const size =
    level === 1
      ? "text-[1.75rem] sm:text-[2.125rem]"
      : level === 2
        ? "text-[1.375rem] sm:text-[1.625rem]"
        : "text-[1.125rem] sm:text-[1.25rem]";

  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {eyebrow ? (
        <p className="mb-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <Tag className={cn(size, "text-foreground")}>{title}</Tag>
      {lede ? (
        <p
          className={cn(
            "measure mt-2.5 text-[0.9375rem] leading-relaxed text-muted-foreground",
            align === "center" && "mx-auto",
          )}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- Cards --- */

/**
 * The standard Civic card: 18px radius, fine border, soft layered shadow.
 *
 * `emphasis="focus"` is the dominant surface on a screen — the one thing the
 * learner should act on. It is deliberately not a colour-only distinction: it
 * carries a periwinkle edge *and* more internal space, so it still reads as
 * primary in greyscale.
 */
export function FocusCard({
  emphasis = "default",
  as: Tag = "section",
  className,
  children,
}: {
  emphasis?: "default" | "focus" | "quiet";
  as?: "section" | "div" | "article" | "li";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "rounded-xl border bg-card text-card-foreground",
        emphasis === "focus"
          ? "border-l-[3px] border-l-accent border-border p-6 shadow-card sm:p-7"
          : emphasis === "quiet"
            ? "border-border/70 p-5 shadow-none"
            : "border-border p-5 shadow-card sm:p-6",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * Apricot teaching block — "why this matters", context, and caution.
 *
 * Apricot is the insight colour, not a universal warning colour: the design
 * system says so explicitly. A genuine destructive warning uses
 * `StatusSurface tone="danger"`, which is a different surface with different
 * wording, so the two are never confused.
 */
export function InsightPanel({
  title,
  mark = "insight",
  className,
  children,
}: {
  title: string;
  mark?: MarkName;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <aside
      className={cn(
        "rounded-xl border border-border bg-insight-tint p-5 shadow-card sm:p-6",
        className,
      )}
    >
      <div className="mb-2.5 flex items-center gap-3">
        <DimensionalMark name={mark} size="sm" tone="insight" />
        <h3 className="text-[1rem] text-insight-foreground">{title}</h3>
      </div>
      <div className="measure text-[0.9375rem] leading-relaxed text-foreground/90">
        {children}
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------ Controls --- */

/**
 * The Civic button: a tactile surface with a short functional press.
 *
 * Motion is 120ms and translate-only, and it is dropped entirely under
 * `prefers-reduced-motion` by the global rule in `globals.css`. Minimum height
 * is 44px on every variant because that is the touch target the design system
 * requires, and a smaller "compact" variant would immediately be used where it
 * should not be.
 */
export function TactileButton({
  variant = "primary",
  fullWidth = false,
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  fullWidth?: boolean;
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5",
        "font-sans text-[0.9375rem] font-medium transition-all duration-[120ms]",
        "active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variant === "primary" &&
          "bg-primary text-primary-foreground shadow-raised hover:bg-primary-strong",
        variant === "secondary" &&
          "border border-border-strong bg-card text-foreground shadow-raised hover:bg-secondary",
        variant === "quiet" &&
          "text-muted-foreground hover:bg-secondary hover:text-foreground",
        variant === "danger" &&
          "bg-destructive text-destructive-foreground shadow-raised hover:opacity-90",
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A premium selectable surface for answer options.
 *
 * The correctness signal is never colour alone: a selected, revealed option
 * carries a dimensional correct/incorrect mark and a text label as well as the
 * tint. That is what keeps the study flow usable in greyscale and for a
 * colour-blind learner, and it is a requirement rather than a nicety.
 *
 * The element is a real `button` with `aria-pressed`, so keyboard behaviour,
 * focus, and screen-reader state come from the platform rather than from
 * anything reimplemented here.
 */
export function SelectSurface({
  selected = false,
  state = "idle",
  marker,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  state?: "idle" | "correct" | "incorrect" | "missed";
  /** The option key — "A", "B" — shown in the leading node. */
  marker?: string;
}) {
  const revealed = state !== "idle";

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3.5 rounded-lg border p-4 text-left",
        "transition-all duration-[120ms] active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        !revealed && selected && "border-accent bg-accent-tint shadow-card",
        !revealed &&
          !selected &&
          "border-border bg-card shadow-raised hover:border-border-strong hover:bg-secondary/50",
        state === "correct" && "border-success bg-success-tint shadow-card",
        state === "incorrect" && "border-destructive bg-destructive-tint shadow-card",
        state === "missed" && "border-success/50 bg-success-tint/50",
        revealed && "cursor-default",
        className,
      )}
      {...props}
    >
      {marker ? (
        <span
          aria-hidden
          className={cn(
            "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
            "border text-[0.8125rem] font-semibold",
            selected || revealed
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border bg-secondary text-muted-foreground",
          )}
        >
          {marker}
        </span>
      ) : null}

      <span className="min-w-0 flex-1 text-[0.9375rem] leading-relaxed">
        {children}
      </span>

      {state === "correct" ? (
        <DimensionalMark name="correct" size="sm" tone="support" label="Correct" />
      ) : state === "incorrect" ? (
        <DimensionalMark
          name="incorrect"
          size="sm"
          tone="danger"
          label="Incorrect"
        />
      ) : state === "missed" ? (
        <DimensionalMark
          name="correct"
          size="sm"
          tone="support"
          label="The correct answer"
        />
      ) : null}
    </button>
  );
}

/* -------------------------------------------------------------- Status --- */

/**
 * A labelled state surface. The label is mandatory — colour never carries the
 * meaning on its own, which is why `tone` alone cannot be passed without one.
 */
export function StatusSurface({
  tone = "neutral",
  label,
  detail,
  mark,
  className,
}: {
  tone?: "neutral" | "accent" | "support" | "insight" | "danger";
  label: string;
  detail?: string;
  mark?: MarkName;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3.5",
        tone === "neutral" && "border-border bg-secondary/60",
        tone === "accent" && "border-accent/30 bg-accent-tint",
        tone === "support" && "border-success/30 bg-success-tint",
        tone === "insight" && "border-border bg-insight-tint",
        tone === "danger" && "border-destructive/30 bg-destructive-tint",
        className,
      )}
    >
      {mark ? (
        <DimensionalMark
          name={mark}
          size="sm"
          tone={
            tone === "support"
              ? "support"
              : tone === "danger"
                ? "danger"
                : tone === "insight"
                  ? "insight"
                  : tone === "accent"
                    ? "accent"
                    : "ink"
          }
        />
      ) : null}
      <div className="min-w-0">
        <p className="text-[0.875rem] font-medium text-foreground">{label}</p>
        {detail ? (
          <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * A dimensional dial for a 0–100 reading.
 *
 * Drawn as a single stroked arc rather than a chart: the design system rules
 * out a generic chart wall, and one number with its label is what the learner
 * actually reads. The value is exposed through `role="meter"` so it is
 * available without seeing the arc at all, and the caption repeats it as text
 * so the reading never depends on the drawing.
 */
export function ConfidenceDial({
  value,
  label,
  caption,
  size = 132,
  className,
}: {
  value: number;
  label: string;
  caption?: string;
  size?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  // Three-quarter sweep, rotated to open at the bottom.
  const sweep = 0.75;
  const arc = circumference * sweep;
  const filled = arc * (clamped / 100);

  return (
    <figure className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 132 132"
          className="h-full w-full -rotate-[135deg]"
          aria-hidden
        >
          <circle
            cx="66"
            cy="66"
            r={radius}
            fill="none"
            stroke="var(--color-secondary)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circumference}`}
          />
          <circle
            cx="66"
            cy="66"
            r={radius}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
          />
        </svg>
        <div
          role="meter"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span className="font-sans text-[1.875rem] font-semibold tabular-nums text-foreground">
            {clamped}
            <span className="text-[1.125rem] text-muted-foreground">%</span>
          </span>
        </div>
      </div>
      <figcaption className="mt-1 text-center">
        <p className="text-[0.875rem] font-medium text-foreground">{label}</p>
        {caption ? (
          <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
            {caption}
          </p>
        ) : null}
      </figcaption>
    </figure>
  );
}

/**
 * A dimensional progress path — the replacement for a generic bar.
 *
 * Steps are discrete nodes on a line, which suits the things this app measures
 * (questions answered against a goal, stages of a gate) better than a
 * continuous fill does. The reading is given as text beside it, so the nodes
 * are reinforcement rather than the only source.
 */
export function ProgressPath({
  completed,
  total,
  label,
  className,
}: {
  completed: number;
  total: number;
  label: string;
  className?: string;
}) {
  const safeTotal = Math.max(1, Math.round(total));
  const done = Math.max(0, Math.min(safeTotal, Math.round(completed)));
  // Beyond a dozen nodes the path stops reading as steps and starts reading as
  // noise, so longer goals fall back to a single continuous track.
  const asNodes = safeTotal <= 12;

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[0.875rem] font-medium text-foreground">{label}</span>
        <span className="text-[0.875rem] tabular-nums text-muted-foreground">
          {done} of {safeTotal}
        </span>
      </div>
      {asNodes ? (
        <div aria-hidden className="flex items-center gap-1.5">
          {Array.from({ length: safeTotal }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-2.5 flex-1 rounded-full border",
                i < done
                  ? "border-transparent bg-accent shadow-raised"
                  : "border-border bg-secondary",
              )}
            />
          ))}
        </div>
      ) : (
        <div
          aria-hidden
          className="h-2.5 overflow-hidden rounded-full border border-border bg-secondary"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${(done / safeTotal) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
