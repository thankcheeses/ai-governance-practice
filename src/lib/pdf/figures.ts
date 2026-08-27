import { type Canvas, type PathCmd, type Rgb } from "./canvas";
import type { ReadinessState } from "../readiness";

/**
 * The result illustrations and the hand-drawn letter grade, as vector paths.
 *
 * **Why these are drawn rather than embedded.** The reference images for these
 * states are raster JPEGs of a well-known meme character. Three problems, any
 * one of which is disqualifying for this particular document: they are
 * somebody else's artwork and this report is distributed publicly by a product
 * whose entire argument is that it is careful about provenance; they are
 * opaque white rectangles, so on the report's cream ground every one of them
 * would paint a white box; and they are raster, so they would go soft in print
 * on a document meant to be printable. Redrawing them as single-stroke vector
 * paths keeps the tone, prints crisply at any size, adds about two kilobytes,
 * and belongs to this product.
 *
 * The states map to the referenced ones one for one. `encouraging` uses the
 * confident two-handed grin rather than the tongue-out celebration — the
 * report is a document an AI governance professional might attach to an email,
 * and that was the stated runner-up for exactly this reason.
 *
 * Coordinates are in a 100 x 100 box with y growing downward, scaled and
 * translated by `drawFigure`. Keeping every figure in the same box is what
 * makes them look like one set.
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

/** A circle as four bezier arcs. Used for eyes, the OK ring and full stops. */
function circle(cx: number, cy: number, r: number): PathCmd[] {
  const k = r * 0.5522847498;
  return [
    M(cx, cy - r),
    C(cx + k, cy - r, cx + r, cy - k, cx + r, cy),
    C(cx + r, cy + k, cx + k, cy + r, cx, cy + r),
    C(cx - k, cy + r, cx - r, cy + k, cx - r, cy),
    C(cx - r, cy - k, cx - k, cy - r, cx, cy - r),
    { op: "Z" },
  ];
}

/*
  The body. One open stroke: up the long left side, over the dome, in at the
  chin, then down the short right edge. Every figure shares it, which is what
  makes five drawings read as one character in five moods.
*/
const BLOB: PathCmd[] = [
  M(22, 100),
  C(6, 64, 14, 22, 44, 14),
  C(68, 8, 88, 20, 88, 40),
  C(88, 55, 79, 60, 71, 60),
  L(67, 100),
];

const EYES: PathCmd[] = [...circle(47, 34, 2.4), ...circle(70, 32, 2.4)];

/** A calm, closed mouth. */
const MOUTH_FLAT: PathCmd[] = [M(43, 47), C(54, 51, 64, 50, 73, 45)];

/** Corners down. */
const MOUTH_FROWN: PathCmd[] = [M(43, 50), C(54, 43, 64, 42, 73, 47)];

/** Brows angled inward, which is what carries the unimpressed expression. */
const BROWS: PathCmd[] = [M(41, 27), L(52, 24), M(66, 24), L(76, 27)];

/**
 * An open grin: a filled lens shape.
 *
 * It had tooth dividers, which were invisible. They were strokes inside a
 * filled subpath, so the fill simply covered them — the kind of thing that
 * only shows up when you look at the rendered page. A solid mouth reads
 * correctly at 70 points, which is the size this is actually drawn at.
 */
const MOUTH_GRIN: PathCmd[] = [
  M(41, 42),
  C(50, 57, 68, 57, 77, 41),
  C(68, 37, 50, 37, 41, 42),
  { op: "Z" },
];

/** A limb: shoulder, elbow, hand — the bend is what stops it reading as a stick. */
const arm = (
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  hx: number,
  hy: number,
): PathCmd[] => [M(sx, sy), L(ex, ey), L(hx, hy)];

/** A pointing hand: a small filled wedge at the end of an arm. */
const point = (x: number, y: number, dx: number, dy: number): PathCmd[] => [
  M(x, y),
  L(x + dx, y + dy),
  L(x + dx * 0.55, y + dy * 1.5),
  { op: "Z" },
];

/** An open palm: three short splayed strokes. */
const palm = (x: number, y: number, dir: number): PathCmd[] => [
  M(x, y),
  L(x + 7 * dir, y - 4),
  M(x, y),
  L(x + 8 * dir, y + 1),
  M(x, y),
  L(x + 6 * dir, y + 5),
];

interface Figure {
  /** Stroked outline: body, arms, face lines. */
  strokes: PathCmd[];
  /** Filled shapes: eyes, hands, the grin. */
  fills: PathCmd[];
  /** Optional lettering drawn above the figure, e.g. "???". */
  annotation?: string;
}

/** A thumb: a filled blob at the end of a raised arm. */
const thumb = (x: number, y: number): PathCmd[] => [
  M(x, y),
  C(x + 4, y - 7, x + 9, y - 6, x + 8, y - 1),
  C(x + 7, y + 4, x + 2, y + 5, x, y + 3),
  { op: "Z" },
];

/*
  One entry per readiness state. The tone ladder is deliberate: the two states
  that mean "we cannot tell" are puzzled rather than disapproving, and the one
  that means "this went badly" is unimpressed rather than scolding. Nothing
  here mocks the reader.
*/
const FIGURES: Record<ReadinessState, Figure> = {
  // Nothing attempted: a shrug, and the question marks say the rest.
  noEvidence: {
    strokes: [
      ...BLOB,
      ...MOUTH_FLAT,
      ...arm(23, 66, 12, 76, 8, 66),
      ...arm(67, 68, 80, 78, 85, 68),
      ...palm(8, 66, -1),
      ...palm(85, 66, 1),
    ],
    fills: [...EYES],
    annotation: "???",
  },

  // Barely attempted: the same shrug. Too little data is too little data, and
  // pretending the two cases differ would be inventing a distinction.
  earlySignal: {
    strokes: [
      ...BLOB,
      ...MOUTH_FLAT,
      ...arm(23, 66, 12, 76, 8, 66),
      ...arm(67, 68, 80, 78, 85, 68),
      ...palm(8, 66, -1),
      ...palm(85, 66, 1),
    ],
    fills: [...EYES],
    annotation: "??",
  },

  // Real attempt, low accuracy: hands on hips. Unimpressed, not unkind.
  insufficient: {
    strokes: [
      ...BLOB,
      ...MOUTH_FROWN,
      ...BROWS,
      ...arm(24, 64, 8, 76, 26, 84),
      ...arm(67, 66, 84, 76, 65, 84),
    ],
    fills: [...EYES],
  },

  // Progress with clear gaps: one hand raised, mid-instruction.
  developing: {
    strokes: [
      ...BLOB,
      ...MOUTH_FLAT,
      ...arm(23, 68, 10, 60, 14, 40),
      ...arm(67, 70, 82, 80, 66, 86),
    ],
    fills: [...point(14, 40, 1, -9)],
    annotation: "GO STUDY",
  },

  // Good, not finished: the OK ring.
  mixed: {
    strokes: [
      ...BLOB,
      ...MOUTH_FLAT,
      ...arm(24, 72, 16, 84, 33, 74),
      ...circle(35, 70, 5),
      M(38, 66),
      L(44, 61),
      M(41, 69),
      L(47, 66),
    ],
    fills: [...EYES],
  },

  // Strong across real coverage: both hands pointing, wide grin.
  encouraging: {
    strokes: [
      ...BLOB,
      ...arm(24, 62, 12, 82, 32, 72),
      ...arm(68, 64, 88, 82, 78, 62),
    ],
    fills: [
      ...EYES,
      ...MOUTH_GRIN,
      ...point(32, 72, 13, -4),
      ...point(78, 62, 13, -5),
    ],
  },
};

/*
  Alternates, so two sittings in the same band do not produce identical
  documents.

  The pool-and-seed idea is lifted from an earlier pass at this feature that
  drew its figures the same way. It is a good one: a report a learner generates
  weekly should not look photocopied. What is not carried over is picking the
  pool from accuracy alone — that is what produced a celebration on a sitting of
  one question — so the pool is keyed to the readiness state, which already
  accounts for how much was attempted.
*/
const VARIANTS: Partial<Record<ReadinessState, Figure[]>> = {
  encouraging: [
    // A plain thumbs-up, for the reports where a two-handed grin is more
    // celebration than the moment calls for.
    {
      strokes: [
        ...BLOB,
        ...MOUTH_FLAT,
        ...arm(24, 70, 14, 84, 30, 76),
        ...arm(68, 66, 84, 74, 80, 56),
      ],
      fills: [...EYES, ...thumb(78, 54)],
    },
  ],
  insufficient: [
    // Practised hard and it is still not landing. Overwhelmed rather than
    // rebuked — the frown is dropped and the eyes go wide.
    {
      strokes: [
        ...BLOB,
        M(43, 48),
        C(52, 44, 64, 44, 73, 48),
        // Hands up beside the head. Without them the variant rendered as a
        // torso with no arms at all.
        ...arm(23, 66, 8, 62, 12, 44),
        ...arm(67, 68, 84, 64, 80, 46),
        ...palm(12, 44, -1),
        ...palm(80, 46, 1),
        M(36, 20),
        L(41, 14),
        M(52, 14),
        L(55, 8),
        M(66, 10),
        L(72, 15),
      ],
      fills: [...circle(47, 34, 3.4), ...circle(70, 32, 3.4)],
      annotation: "?!",
    },
  ],
};

/**
 * FNV-1a over the sitting reference. Deterministic on purpose: the same result
 * regenerated must produce the same document, or a saved copy cannot be
 * compared against a fresh one.
 */
function seedHash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickFigure(state: ReadinessState, seed: string): Figure {
  const pool = [FIGURES[state], ...(VARIANTS[state] ?? [])];
  return pool[seedHash(seed) % pool.length];
}

/** Scale a path from the 100x100 design box into a placed box on the page. */
function place(cmds: PathCmd[], x: number, y: number, size: number): PathCmd[] {
  const s = size / 100;
  const px = (v: number) => x + v * s;
  const py = (v: number) => y + v * s;
  return cmds.map((c) =>
    c.op === "M"
      ? M(px(c.x), py(c.y))
      : c.op === "L"
        ? L(px(c.x), py(c.y))
        : c.op === "Z"
          ? c
          : C(px(c.x1), py(c.y1), px(c.x2), py(c.y2), px(c.x), py(c.y)),
  );
}

/**
 * Draw the illustration for a readiness state, top-left at (x, y).
 *
 * The stroke weight scales with the figure so it keeps the same heavy
 * single-line character at any size.
 */
export function drawFigure(
  canvas: Canvas,
  state: ReadinessState,
  x: number,
  y: number,
  size: number,
  ink: Rgb,
  seed = "",
): void {
  const figure = pickFigure(state, seed);
  const weight = Math.max(1.1, size * 0.028);

  if (figure.annotation) {
    canvas.text(figure.annotation, x + size * 0.5, y - size * 0.06, {
      font: "sansBold",
      size: size * 0.15,
      color: ink,
      align: "center",
    });
  }
  canvas.path(place(figure.strokes, x, y, size), {
    stroke: ink,
    lineWidth: weight,
  });
  if (figure.fills.length) {
    canvas.path(place(figure.fills, x, y, size), { fill: ink });
  }
}

/* ------------------------------------------------------------------ */
/* The letter grade                                                    */
/* ------------------------------------------------------------------ */

/*
  Hand-drawn letterforms, in a 100 x 130 box.

  Set as strokes rather than type because none of the fourteen built-in PDF
  fonts has a hand-lettered face, and embedding a display font to set one
  character would cost more bytes than the entire rest of the document. Each
  letter is deliberately slightly off-square — the crossbar of the A tilts, the
  stem of the F leans — so it reads as written rather than set.
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
 * conveyed by colour alone in this report — the letter, the percentage and the
 * grading convention all appear as text beside it, so a reader with no colour
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
