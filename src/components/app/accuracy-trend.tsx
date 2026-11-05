import type { Attempt } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Rolling accuracy over the attempts so far.
 *
 * The Progress page already reports an overall score, and a single percentage
 * cannot answer the question the page exists for — am I getting better? 65%
 * reads the same whether it is 40% climbing or 90% falling. This draws the
 * shape behind the number, which is the job README "Visual language" rule 1
 * asks a graphic to earn its place with.
 *
 * Rolling rather than cumulative: a cumulative line flattens as attempts
 * accumulate and stops responding to recent work, which is exactly the period a
 * learner is asking about. The window is deliberately small, and the component
 * renders nothing below it rather than drawing a line through too few points
 * and implying a trend that is not there.
 *
 * Stroked in `currentColor` so it inherits the surface and reads in both
 * themes (rule 2). It is `aria-hidden`; the summary sentence beneath carries
 * the same information as text.
 */

const WINDOW = 10;
/** Below this, a line would be noise shaped like a trend. */
const MIN_ATTEMPTS = 12;

export function rollingAccuracy(attempts: Attempt[], window = WINDOW): number[] {
  if (attempts.length < window) return [];
  const ordered = [...attempts].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const out: number[] = [];
  for (let i = window; i <= ordered.length; i++) {
    const slice = ordered.slice(i - window, i);
    out.push(slice.filter((a) => a.correct).length / window);
  }
  return out;
}

export function AccuracyTrend({
  attempts,
  className,
}: {
  attempts: Attempt[];
  className?: string;
}) {
  if (attempts.length < MIN_ATTEMPTS) return null;
  const series = rollingAccuracy(attempts);
  if (series.length < 2) return null;

  const w = 300;
  const h = 56;
  const pad = 4;

  /*
    The band is drawn full-width, so a fixed 0–100% domain stretches any real
    movement into a near-flat line: a 40-point climb crossed about a fifth of
    the height and read as noise. The domain is therefore the series' own
    range, padded, which is the usual sparkline trade — shape is legible,
    absolute height is not meaningful.

    That trade is only honest because the sentence underneath states the real
    percentage and the real change. The guide line is drawn at 50% only when
    50% is actually inside the range, so it never implies a midpoint that is
    off the chart.
  */
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const span = Math.max(hi - lo, 0.08);
  const min = Math.max(0, lo - span * 0.15);
  const max = Math.min(1, hi + span * 0.15);

  const x = (i: number) => (i / (series.length - 1)) * (w - pad * 2) + pad;
  const y = (v: number) =>
    h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
  const guideInRange = 0.5 > min && 0.5 < max;

  const line = series.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(series.length - 1).toFixed(1)} ${h} L${x(0).toFixed(1)} ${h} Z`;

  const first = series[0];
  const last = series[series.length - 1];
  const delta = Math.round((last - first) * 100);
  const direction = delta > 2 ? "climbing" : delta < -2 ? "slipping" : "steady";

  return (
    <div className={cn("", className)}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-14 w-full text-accent"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        {/* Half-way guide, drawn only when 50% is inside the plotted range. */}
        {guideInRange ? (
          <path
            d={`M${pad} ${y(0.5)} H${w - pad}`}
            stroke="currentColor"
            strokeOpacity={0.18}
            strokeWidth={1}
            strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        <path d={area} fill="currentColor" fillOpacity={0.08} />
        <path
          d={line}
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={x(series.length - 1)} cy={y(last)} r={2.5} fill="currentColor" />
      </svg>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        Last {WINDOW} answered: <span className="text-foreground">{Math.round(last * 100)}%</span>{" "}
        — {direction} {delta === 0 ? "" : `${delta > 0 ? "+" : ""}${delta} pts `}since this run began.
      </p>
    </div>
  );
}
