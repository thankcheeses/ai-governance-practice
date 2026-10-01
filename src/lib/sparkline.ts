/**
 * Sparklines for the usage stat tiles.
 *
 * The dashboard could answer "how many" and could not answer "which way". A
 * 30-day total of 751 visitors reads the same whether that was 25 a day flat or
 * 50 a day collapsing to 5, and those call for opposite responses. This adds
 * the shape without adding a chart library — one inline `<polyline>` per tile.
 *
 * Pure, so the arithmetic is testable in node and the component stays a
 * renderer.
 *
 * ## Three decisions that are about honesty rather than looks
 *
 * **A missing day is zero, not a gap.** `telemetry.daily` only has a row for a
 * day something happened, so a quiet day is simply absent. Skipping absent days
 * would compress the x-axis and draw a line that climbs smoothly through a week
 * nobody used the app. Absent means zero here.
 *
 * **The y-axis starts at zero.** Min–max scaling is the sparkline convention
 * and it is what turns 100 → 110 into a dramatic ascent. Anchoring at zero
 * keeps the amplitude proportional to the numbers, at the cost of looking flat
 * when values are large and steady — which is the honest picture of large and
 * steady.
 *
 * **Below a week of coverage there is no line.** Two points joined by a segment
 * look like a trend and are not one. Same discipline as the calibration and
 * reasoning-pattern floors: say nothing rather than imply evidence.
 */

/** A day in the window, as `telemetry.daily` stores them. */
export interface DailyRow {
  day: string;
  metric: string;
  dimension: string;
  value: number;
}

/**
 * Days of coverage required before a line is drawn.
 *
 * A week, because that is the shortest span in which "which way" is a question
 * with an answer rather than a coin flip.
 */
export const MIN_DAYS_FOR_SPARKLINE = 7;

/**
 * One value per day across the window, oldest first.
 *
 * `days` is the window length, and the window ends today. Days with no row
 * become 0 — see the note above. Returns null when coverage is too thin for a
 * line to mean anything, which the caller renders as no sparkline at all.
 */
export function dailySeries(
  rows: readonly DailyRow[],
  metric: string,
  dimension: string | null,
  days: number,
  today: Date = new Date(),
): number[] | null {
  const matching = rows.filter(
    (r) => r.metric === metric && (dimension === null || r.dimension === dimension),
  );
  if (!matching.length) return null;

  const byDay = new Map<string, number>();
  for (const r of matching) {
    byDay.set(r.day, (byDay.get(r.day) ?? 0) + Number(r.value));
  }

  const series: number[] = [];
  let covered = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    const v = byDay.get(d);
    if (v !== undefined) covered++;
    series.push(v ?? 0);
  }

  return covered >= MIN_DAYS_FOR_SPARKLINE ? series : null;
}

/**
 * `points` for an SVG polyline, in a `width` × `height` box.
 *
 * Inset by `pad` so a 2px stroke at the extremes is not clipped by the
 * viewBox. The y-scale runs from 0 to the series maximum; an all-zero series
 * draws flat along the bottom, which is what no usage looks like.
 */
export function sparklinePoints(
  values: readonly number[],
  width: number,
  height: number,
  pad = 1,
): string {
  if (values.length < 2) return "";
  const max = Math.max(...values, 0);
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const step = innerW / (values.length - 1);

  return values
    .map((v, i) => {
      const x = pad + i * step;
      // max === 0 would divide by zero; a flat floor is the right picture.
      const y = max === 0 ? height - pad : height - pad - (v / max) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

/**
 * What the line says, in words, for the accessible name.
 *
 * Deliberately descriptive and not interpretive: first, last, lowest, highest.
 * Calling it "rising" would be a claim about a noisy 30-point series that the
 * series cannot support — the reader can draw that conclusion, and a sighted
 * reader draws it from the line itself. This gives a screen-reader user the
 * same raw material rather than a verdict.
 */
export function trendSummary(values: readonly number[], unit = "per day"): string {
  if (!values.length) return "";
  const first = values[0];
  const last = values[values.length - 1];
  const low = Math.min(...values);
  const high = Math.max(...values);
  return `${values.length}-day trend, ${unit}: started at ${first}, ended at ${last}, lowest ${low}, highest ${high}.`;
}
