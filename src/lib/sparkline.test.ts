import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MIN_DAYS_FOR_SPARKLINE,
  dailySeries,
  sparklinePoints,
  trendSummary,
  type DailyRow,
} from "./sparkline";

/**
 * A sparkline is a claim about direction, so most of these assertions are about
 * the cases where it must refuse to draw one, and about the two scaling choices
 * that decide whether the line tells the truth.
 */

const TODAY = new Date("2026-10-01T12:00:00Z");
const day = (back: number) =>
  new Date(TODAY.getTime() - back * 86_400_000).toISOString().slice(0, 10);

function rows(spec: Record<number, number>, metric = "dau", dimension = "all"): DailyRow[] {
  return Object.entries(spec).map(([back, value]) => ({
    day: day(Number(back)),
    metric,
    dimension,
    value,
  }));
}

/* ------------------------------------------------------------- refusals -- */

test("no line below a week of coverage", () => {
  const thin = rows({ 0: 5, 1: 4, 2: 6 });
  assert.equal(dailySeries(thin, "dau", "all", 30, TODAY), null);
});

test("the coverage floor is exact", () => {
  const under: Record<number, number> = {};
  for (let i = 0; i < MIN_DAYS_FOR_SPARKLINE - 1; i++) under[i] = 3;
  assert.equal(dailySeries(rows(under), "dau", "all", 30, TODAY), null);

  const at: Record<number, number> = {};
  for (let i = 0; i < MIN_DAYS_FOR_SPARKLINE; i++) at[i] = 3;
  assert.ok(dailySeries(rows(at), "dau", "all", 30, TODAY), "refused at the floor");
});

test("no rows for the metric means no line, not a flat one", () => {
  // A flat line along the bottom would claim "measured, and it was zero".
  // Nothing measured at all is a different statement.
  assert.equal(dailySeries(rows({ 0: 5 }, "sessions"), "dau", "all", 30, TODAY), null);
  assert.equal(dailySeries([], "dau", "all", 30, TODAY), null);
});

test("coverage counts days with rows, not the window length", () => {
  // Seven rows spread across a 30-day window is seven days of coverage. The 23
  // zero-filled days must not count toward the floor, or every sparse metric
  // would clear it.
  const spread = rows({ 0: 2, 4: 2, 9: 2, 14: 2, 19: 2, 24: 2 }); // six days
  assert.equal(dailySeries(spread, "dau", "all", 30, TODAY), null);
});

/* --------------------------------------------------------------- series -- */

test("a day with no row is zero, not skipped", () => {
  // Skipping absent days would compress the x-axis and draw a smooth climb
  // through a week nobody used the app.
  const sparse: Record<number, number> = { 0: 10, 2: 10, 4: 10, 6: 10, 8: 10, 10: 10, 12: 10 };
  const s = dailySeries(rows(sparse), "dau", "all", 13, TODAY);
  assert.ok(s);
  assert.equal(s.length, 13, "the window length is not preserved");
  assert.equal(s.filter((v) => v === 0).length, 6, "absent days were not zero-filled");
});

test("the series runs oldest to newest", () => {
  const s = dailySeries(rows({ 0: 99, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }), "dau", "all", 7, TODAY);
  assert.ok(s);
  assert.equal(s[s.length - 1], 99, "today is not last");
});

test("a null dimension sums every dimension for that metric", () => {
  // `events` is keyed by event name, so a per-event series needs the dimension
  // and a total needs all of them.
  const mixed: DailyRow[] = [];
  for (let i = 0; i < 7; i++) {
    mixed.push({ day: day(i), metric: "events", dimension: "question_answered", value: 10 });
    mixed.push({ day: day(i), metric: "events", dimension: "exam_started", value: 1 });
  }
  const all = dailySeries(mixed, "events", null, 7, TODAY);
  const one = dailySeries(mixed, "events", "question_answered", 7, TODAY);
  assert.deepEqual(all, Array(7).fill(11));
  assert.deepEqual(one, Array(7).fill(10));
});

/* -------------------------------------------------------------- scaling -- */

test("the y-axis starts at zero, so steady large numbers look steady", () => {
  // Min–max scaling is the sparkline convention and it is what turns 100 -> 110
  // into a dramatic ascent. With a zero baseline the whole series sits in a
  // narrow band near the top.
  const pts = sparklinePoints([100, 105, 110], 90, 24)
    .split(" ")
    .map((p) => Number(p.split(",")[1]));
  const spread = Math.max(...pts) - Math.min(...pts);
  assert.ok(spread < 6, `a 10% change spans ${spread.toFixed(1)}px — axis is not zero-based`);
});

test("a real collapse still reads as a collapse", () => {
  // The zero baseline must not flatten everything: 50 -> 5 is most of the box.
  const pts = sparklinePoints([50, 30, 5], 90, 24)
    .split(" ")
    .map((p) => Number(p.split(",")[1]));
  assert.ok(Math.max(...pts) - Math.min(...pts) > 15, "a 10x drop was flattened");
});

test("an all-zero series draws flat along the bottom rather than dividing by zero", () => {
  const pts = sparklinePoints([0, 0, 0, 0], 90, 24);
  const ys = pts.split(" ").map((p) => Number(p.split(",")[1]));
  assert.ok(ys.every(Number.isFinite), "produced NaN on an all-zero series");
  assert.equal(new Set(ys).size, 1, "an all-zero series is not flat");
});

test("points stay inside the box so a 2px stroke is not clipped", () => {
  const w = 90;
  const h = 24;
  for (const [x, y] of sparklinePoints([0, 37, 12, 5], w, h)
    .split(" ")
    .map((p) => p.split(",").map(Number))) {
    assert.ok(x >= 0 && x <= w, `x out of box: ${x}`);
    assert.ok(y >= 0 && y <= h, `y out of box: ${y}`);
  }
});

test("fewer than two points draws nothing", () => {
  assert.equal(sparklinePoints([5], 90, 24), "");
  assert.equal(sparklinePoints([], 90, 24), "");
});

/* ------------------------------------------------------- accessible name -- */

test("the summary describes the series without interpreting it", () => {
  const s = trendSummary([14, 20, 9, 31]);
  assert.match(s, /started at 14/);
  assert.match(s, /ended at 31/);
  assert.match(s, /lowest 9/);
  assert.match(s, /highest 31/);
});

test("the summary never asserts a direction", () => {
  // "Rising" is a claim about a noisy 30-point series that the series cannot
  // support. A sighted reader infers it from the line; a screen-reader user
  // gets the same raw material, not a verdict.
  const text = trendSummary([1, 2, 3, 4, 5, 6, 40]);
  for (const verdict of [/rising/i, /falling/i, /growing/i, /declining/i, /trending up/i, /improv/i]) {
    assert.doesNotMatch(text, verdict, `the summary interprets the data: ${verdict}`);
  }
});

test("an empty series has no summary rather than a misleading one", () => {
  assert.equal(trendSummary([]), "");
});
