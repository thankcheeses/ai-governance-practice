import type { Slice } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * How a track's questions are distributed across its domains.
 *
 * Onboarding already says "350 questions across 4 domains", which tells a
 * newcomer the size but not the shape — and the domains are not evenly
 * weighted. Two of them carry more than half the bank between them, which is
 * worth knowing before deciding where to start. That is the job this earns its
 * place with (README "Visual language" rule 1); it is not a welcome graphic.
 *
 * Weight is carried by opacity of a single colour rather than four hues. The
 * product's palette is one accent and warm neutrals, and introducing a
 * categorical scale here would invent a colour system the rest of the app does
 * not have — and would imply the domains differ in kind rather than in size.
 *
 * The bar is `aria-hidden`; the list beneath it is the same information as
 * text, already readable by everyone.
 */
export function TrackShape({
  slices,
  className,
}: {
  slices: readonly Slice[];
  className?: string;
}) {
  const shown = slices.filter((s) => s.available > 0);
  if (shown.length < 2) return null;

  const total = shown.reduce((n, s) => n + s.available, 0);
  if (total === 0) return null;

  // Largest first: the question the bar answers is "where is the weight".
  const ordered = [...shown].sort((a, b) => b.available - a.available);

  return (
    <div className={cn("", className)}>
      <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {ordered.map((s, i) => (
          <div
            key={s.id}
            className="h-full bg-accent first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(s.available / total) * 100}%`,
              opacity: 1 - i * 0.18,
            }}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-1">
        {ordered.map((s, i) => (
          <li
            key={s.id}
            className="flex items-baseline justify-between gap-3 text-[0.8125rem] text-muted-foreground"
          >
            <span className="flex min-w-0 items-baseline gap-2">
              <span
                className="h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full bg-accent"
                style={{ opacity: 1 - i * 0.18 }}
                aria-hidden
              />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="shrink-0 tabular-nums">{s.available}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
