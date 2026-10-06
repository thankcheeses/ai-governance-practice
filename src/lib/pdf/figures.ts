import { type Canvas, type PathCmd, type Rgb } from "./canvas";

/**
 * The hand-drawn letter grade, as vector paths.
 *
 * This module also held a set of cartoon figures, one per readiness state,
 * redrawn as single-stroke vectors from raster meme artwork. The artwork was
 * removed from the product on 4 October 2026 and the figures went with it —
 * 322 lines of blob geometry — leaving the grade stamp, which is not a mascot
 * and was never part of that set.
 *
 * **Why the grade is drawn rather than set in type.** None of the fourteen
 * built-in PDF fonts has a hand-lettered face, and embedding a display font to
 * set one character would cost more bytes than the whole rest of the document.
 * Each letter is deliberately slightly off-square, so it reads as written by
 * hand rather than typeset.
 *
 * Coordinates are in a 100 x 100 box with y growing downward, scaled and
 * translated at draw time.
 */

const M = (x: number, y: number): PathCmd => ({ op: "M", x, y });
const L = (x: number, y: number): PathCmd => ({ op: "L", x, y });
const C = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number,
  y: number,
): PathCmd => ({ op: "C", x1, y1, x2, y2, x, y });

/*
  Each glyph as a stroke path, in the same 100 x 100 box.
*/
const LETTERS: Record<string, PathCmd[]> = {
  A: [M(10, 126), L(49, 8), L(91, 124), M(26, 88), L(77, 84)],
  B: [
    M(19, 9),
    L(21, 125),
    L(61, 123),
    C(91, 120, 93, 76, 59, 70),
    L(21, 68),
    M(21, 68),
    L(57, 66),
    C(87, 61, 85, 13, 55, 10),
    L(19, 9),
  ],
  C: [M(87, 27), C(59, -4, 13, 13, 13, 66), C(13, 119, 61, 137, 87, 103)],
  D: [M(19, 9), L(21, 125), L(53, 123), C(97, 117, 95, 17, 51, 10), L(19, 9)],
  F: [M(23, 126), L(17, 9), L(85, 13), M(19, 67), L(67, 64)],
  // Written when there is nothing to grade. A sitting nobody answered is
  // unmeasured, not failed, and stamping it with a red F would say the
  // opposite of what the report's own verdict says.
  "-": [M(14, 68), L(88, 64)],
};

/**
 * The loose ellipse a teacher rings a grade with, as one marker pass.
 *
 * `rot` and the radii differ slightly per pass; four passes overlapping at
 * different angles is what produces the scribbled ring rather than a neat
 * oval. The start point is offset from the axis so the passes do not all begin
 * in the same place, which would read as a printed outline.
 */
function markerLoop(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number,
): PathCmd[] {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const at = (x: number, y: number): [number, number] => [
    cx + x * cos - y * sin,
    cy + x * sin + y * cos,
  ];
  const k = 0.5522847498;
  const [sx, sy] = at(0, -ry);
  const seg = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x: number,
    y: number,
  ): PathCmd => {
    const [a, b] = at(x1, y1);
    const [c1, d] = at(x2, y2);
    const [e, f] = at(x, y);
    return C(a, b, c1, d, e, f);
  };
  return [
    M(sx, sy),
    seg(rx * k, -ry, rx, -ry * k, rx, 0),
    seg(rx, ry * k, rx * k, ry, 0, ry),
    seg(-rx * k, ry, -rx, ry * k, -rx, 0),
    seg(-rx, -ry * k, -rx * k, -ry, 0, -ry),
    // A short overshoot past the start, so the pass ends where a hand would
    // lift rather than closing exactly on itself.
    seg(rx * k * 0.5, -ry, rx * 0.55, -ry * 0.92, rx * 0.62, -ry * 0.78),
  ];
}

/**
 * Draw a grade the way it gets written on a returned paper: the letter in
 * marker, ringed with four loose overlapping passes.
 *
 * The ring is decoration and carries no meaning of its own. Nothing is ever
 * conveyed by color alone in this report — the letter, the percentage and the
 * grading convention all appear as text beside it, so a reader with no color
 * vision, or one holding a monochrome printout, loses nothing.
 *
 * `size` is the cap height of the letter; the ring is sized from it.
 */
export function drawGradeStamp(
  canvas: Canvas,
  letter: string,
  cx: number,
  cy: number,
  size: number,
  marker: Rgb,
): void {
  const rx = size * 1.28;
  const ry = size * 0.92;
  const weight = Math.max(1.4, size * 0.05);

  /*
    Four passes, each nudged and rotated by a different amount. The offsets are
    written out rather than generated: a random jitter would give a different
    scribble on every download of the same result, and a report that changes
    when regenerated is a report nobody can compare against a saved copy.
  */
  const passes: [number, number, number, number][] = [
    [0, 0, 0.97, -0.06],
    [rx * 0.05, -ry * 0.07, 1.06, 0.075],
    [-rx * 0.06, ry * 0.05, 0.93, 0.17],
    [rx * 0.02, ry * 0.09, 1.03, -0.15],
    [-rx * 0.02, -ry * 0.02, 1.0, 0.25],
  ];
  for (const [dx, dy, scale, rot] of passes) {
    canvas.path(markerLoop(cx + dx, cy + dy, rx * scale, ry * scale, rot), {
      stroke: marker,
      lineWidth: weight * 0.8,
    });
  }

  const cmds = LETTERS[letter] ?? LETTERS.F;
  const s = size / 130;
  const x = cx - (100 * s) / 2;
  const top = cy - size / 2;
  canvas.path(
    cmds.map((c) =>
      c.op === "M"
        ? M(x + c.x * s, top + c.y * s)
        : c.op === "L"
          ? L(x + c.x * s, top + c.y * s)
          : c.op === "Z"
            ? c
            : C(
                x + c.x1 * s,
                top + c.y1 * s,
                x + c.x2 * s,
                top + c.y2 * s,
                x + c.x * s,
                top + c.y * s,
              ),
    ),
    { stroke: marker, lineWidth: Math.max(2.4, size * 0.085) },
  );
}
