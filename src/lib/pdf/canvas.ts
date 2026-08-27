/**
 * A drawing surface for the hand-written PDF generator.
 *
 * The report used to be text and nothing else: the generator emitted `BT … Tj
 * … ET` and no path operators at all, so a progress bar could only ever be
 * characters — `[####......]`. That was not a font or glyph problem and no
 * amount of picking a different character would have fixed it. This module
 * adds the missing half: filled and stroked geometry, so a bar is a bar.
 *
 * Three decisions worth stating, because each one has a tempting alternative.
 *
 * **Still no library.** The reasons that kept `results-pdf.ts` hand-written
 * hold here unchanged — the file is the learner's own performance data, the
 * mobile target is a static export inside a WebView, and a PDF library is
 * larger than the whole generator. Drawing rectangles and bezier curves is
 * roughly a hundred lines of operators.
 *
 * **A display list, not a string builder.** Every primitive appends a typed
 * op, and serialisation happens once at the end. That keeps the report
 * testable without parsing PDF syntax: a test can assert that a bar of a given
 * width exists at a given percentage, which is the thing worth checking.
 *
 * **Y grows downward.** PDF's origin is the bottom-left corner and every
 * offset counts upward, which is the wrong way round for laying out a document
 * that reads top to bottom. Callers work in top-down points from the top-left
 * corner and `serialize` flips them. Getting this wrong is silent — the
 * document renders, upside down in stacking order — so it is converted in
 * exactly one place.
 */

/* ------------------------------------------------------------------ */
/* Colour                                                              */
/* ------------------------------------------------------------------ */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** `#6b7fd7` or `#fff` to a PDF colour triple in 0–1. */
export function rgb(hex: string): Rgb {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`not a colour: ${hex}`);
  }
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  };
}

const colorOp = (c: Rgb, stroke: boolean) =>
  `${c.r.toFixed(4)} ${c.g.toFixed(4)} ${c.b.toFixed(4)} ${stroke ? "RG" : "rg"}`;

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */

/**
 * Three of the fourteen fonts every PDF reader is required to have built in,
 * so nothing is embedded and the file stays a few kilobytes.
 *
 * Helvetica rather than the Courier the report used to be set in. Courier was
 * defensible when the document was a monospaced grid — the columns were held
 * apart by runs of spaces, and a proportional face would have destroyed them.
 * Now that bars and rules are drawn rather than typed, nothing depends on
 * every character being the same width, and a proportional face is simply
 * easier to read at report sizes.
 *
 * The large letter grade is not set in any of these. It is drawn as strokes —
 * see `figures.ts` — because a hand-drawn feel is the one thing none of the
 * built-in fourteen can do, and embedding a display font to set a single
 * character would cost more bytes than the rest of the document.
 */
export type FontId = "sans" | "sansBold" | "sansItalic";

export const BASE_FONTS: Record<FontId, string> = {
  sans: "Helvetica",
  sansBold: "Helvetica-Bold",
  sansItalic: "Helvetica-Oblique",
};

/** PDF resource names, in the order the resource dictionary lists them. */
export const FONT_KEYS: Record<FontId, string> = {
  sans: "F1",
  sansBold: "F2",
  sansItalic: "F3",
};

/*
  Advance widths in 1/1000 em, from Adobe's AFM metrics for the standard
  fourteen. Needed because centring and right-aligning text requires knowing
  how wide it is, and a proportional font will not tell you for free.

  Only ASCII 32–126 is tabulated. Everything written to the document is folded
  to that range first (see `toAscii` in results-pdf.ts), both so the widths are
  complete and so one character stays one byte — the cross-reference table
  records byte offsets, and a multi-byte sequence would silently desynchronise
  them from string length.
*/
const HELVETICA_WIDTHS =
  "278 278 355 556 556 889 667 191 333 333 389 584 278 333 278 278 " +
  "556 556 556 556 556 556 556 556 556 556 278 278 584 584 584 556 " +
  "1015 667 667 722 722 667 611 778 722 278 500 667 556 833 722 778 " +
  "667 778 722 667 611 722 667 944 667 667 611 278 278 278 469 556 " +
  "333 556 556 500 556 556 278 556 556 222 222 500 222 833 556 556 " +
  "556 556 333 500 278 556 500 722 500 500 500 334 260 334 584";

const HELVETICA_BOLD_WIDTHS =
  "278 333 474 556 556 889 722 238 333 333 389 584 278 333 278 278 " +
  "556 556 556 556 556 556 556 556 556 556 333 333 584 584 584 611 " +
  "975 722 722 722 722 667 611 778 722 278 556 722 611 833 722 778 " +
  "667 778 722 667 611 722 667 944 667 667 611 333 278 333 584 556 " +
  "333 556 611 556 611 556 333 611 611 278 278 556 278 889 611 611 " +
  "611 611 389 556 333 611 556 778 556 556 500 389 280 389 584";

const parseWidths = (table: string) => table.split(" ").map(Number);

const WIDTHS: Record<FontId, number[]> = {
  sans: parseWidths(HELVETICA_WIDTHS),
  // Oblique is the same face slanted; the advance widths are identical.
  sansItalic: parseWidths(HELVETICA_WIDTHS),
  sansBold: parseWidths(HELVETICA_BOLD_WIDTHS),
};

/** Width of `text` in points, at `size`. */
export function textWidth(text: string, font: FontId, size: number): number {
  const widths = WIDTHS[font];
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Anything outside the tabulated range is measured as a space rather than
    // as zero, so an unexpected character shifts a line slightly instead of
    // letting it silently overlap what follows.
    total += code >= 32 && code <= 126 ? widths[code - 32] : widths[0];
  }
  return (total / 1000) * size;
}

/**
 * The longest prefix of `text` that fits in `max` points, with an ellipsis if
 * anything was dropped. Used where a variable-length label shares a row with
 * fixed columns.
 */
export function truncate(text: string, font: FontId, size: number, max: number): string {
  if (textWidth(text, font, size) <= max) return text;
  const ellipsis = "...";
  const room = max - textWidth(ellipsis, font, size);
  if (room <= 0) return "";
  let out = "";
  for (const ch of text) {
    if (textWidth(out + ch, font, size) > room) break;
    out += ch;
  }
  return out.trimEnd() + ellipsis;
}

/** Greedy word wrap to a width in points. Words longer than the line are cut. */
export function wrapText(
  text: string,
  font: FontId,
  size: number,
  max: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      let w = word;
      // A single word wider than the column would otherwise loop forever.
      while (textWidth(w, font, size) > max) {
        if (line) {
          lines.push(line);
          line = "";
        }
        let piece = "";
        for (const ch of w) {
          if (textWidth(piece + ch, font, size) > max) break;
          piece += ch;
        }
        if (!piece) piece = w[0];
        lines.push(piece);
        w = w.slice(piece.length);
      }
      if (!line) line = w;
      else if (textWidth(`${line} ${w}`, font, size) <= max) line += ` ${w}`;
      else {
        lines.push(line);
        line = w;
      }
    }
    lines.push(line);
  }
  return lines;
}

/* ------------------------------------------------------------------ */
/* The display list                                                    */
/* ------------------------------------------------------------------ */

export type Align = "left" | "center" | "right";

export type PathCmd =
  | { op: "M"; x: number; y: number }
  | { op: "L"; x: number; y: number }
  | { op: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { op: "Z" };

export interface TextOp {
  kind: "text";
  x: number;
  y: number;
  text: string;
  font: FontId;
  size: number;
  color: Rgb;
  align: Align;
  opacity: number;
  /** Degrees, anticlockwise about (x, y). Used only by the watermark. */
  rotate: number;
  tag?: string;
}

export interface RectOp {
  kind: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  fill?: Rgb;
  stroke?: Rgb;
  lineWidth: number;
  opacity: number;
  tag?: string;
}

export interface PathOp {
  kind: "path";
  cmds: PathCmd[];
  fill?: Rgb;
  stroke?: Rgb;
  lineWidth: number;
  opacity: number;
  tag?: string;
}

export type DrawOp = TextOp | RectOp | PathOp;

/** Bezier handle length for a quarter-circle of radius r. */
const KAPPA = 0.5522847498;

/**
 * One page's worth of drawing, in top-down coordinates.
 *
 * Ops are drawn in the order they are added, so a caller paints backgrounds
 * before the things that sit on them, exactly as it reads.
 */
export class Canvas {
  readonly ops: DrawOp[] = [];

  constructor(
    readonly width: number,
    readonly height: number,
  ) {}

  text(
    text: string,
    x: number,
    y: number,
    opts: {
      font?: FontId;
      size?: number;
      color: Rgb;
      align?: Align;
      opacity?: number;
      rotate?: number;
      tag?: string;
    },
  ): void {
    if (!text) return;
    this.ops.push({
      kind: "text",
      x,
      y,
      text,
      font: opts.font ?? "sans",
      size: opts.size ?? 10,
      color: opts.color,
      align: opts.align ?? "left",
      opacity: opts.opacity ?? 1,
      rotate: opts.rotate ?? 0,
      tag: opts.tag,
    });
  }

  rect(
    x: number,
    y: number,
    w: number,
    h: number,
    opts: {
      radius?: number;
      fill?: Rgb;
      stroke?: Rgb;
      lineWidth?: number;
      opacity?: number;
      tag?: string;
    },
  ): void {
    this.ops.push({
      kind: "rect",
      x,
      y,
      w,
      h,
      // A radius wider than half the box would produce crossed handles.
      radius: Math.max(0, Math.min(opts.radius ?? 0, w / 2, h / 2)),
      fill: opts.fill,
      stroke: opts.stroke,
      lineWidth: opts.lineWidth ?? 0.75,
      opacity: opts.opacity ?? 1,
      tag: opts.tag,
    });
  }

  path(
    cmds: PathCmd[],
    opts: {
      fill?: Rgb;
      stroke?: Rgb;
      lineWidth?: number;
      opacity?: number;
      tag?: string;
    },
  ): void {
    if (!cmds.length) return;
    this.ops.push({
      kind: "path",
      cmds,
      fill: opts.fill,
      stroke: opts.stroke,
      lineWidth: opts.lineWidth ?? 1,
      opacity: opts.opacity ?? 1,
      tag: opts.tag,
    });
  }

  /** A horizontal hairline. Thin enough to read as a rule, not a bar. */
  hairline(x: number, y: number, w: number, color: Rgb, opacity = 1): void {
    this.path([{ op: "M", x, y }, { op: "L", x: x + w, y }], {
      stroke: color,
      lineWidth: 0.6,
      opacity,
    });
  }
}

/* ------------------------------------------------------------------ */
/* Serialisation                                                       */
/* ------------------------------------------------------------------ */

/** Escape the three characters that end or nest a PDF string literal. */
export function escapePdf(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

const n = (v: number) => v.toFixed(3);

function roundedRectPath(r: RectOp, flip: (y: number) => number): string[] {
  const { x, w, radius: rad } = r;
  // Flip once: the top edge in page coordinates is the higher y in PDF space.
  const top = flip(r.y);
  const bottom = flip(r.y + r.h);
  const right = x + w;
  const k = rad * KAPPA;
  if (rad === 0) {
    return [`${n(x)} ${n(bottom)} ${n(w)} ${n(r.h)} re`];
  }
  return [
    `${n(x + rad)} ${n(top)} m`,
    `${n(right - rad)} ${n(top)} l`,
    `${n(right - rad + k)} ${n(top)} ${n(right)} ${n(top - rad + k)} ${n(right)} ${n(top - rad)} c`,
    `${n(right)} ${n(bottom + rad)} l`,
    `${n(right)} ${n(bottom + rad - k)} ${n(right - rad + k)} ${n(bottom)} ${n(right - rad)} ${n(bottom)} c`,
    `${n(x + rad)} ${n(bottom)} l`,
    `${n(x + rad - k)} ${n(bottom)} ${n(x)} ${n(bottom + rad - k)} ${n(x)} ${n(bottom + rad)} c`,
    `${n(x)} ${n(top - rad)} l`,
    `${n(x)} ${n(top - rad + k)} ${n(x + rad - k)} ${n(top)} ${n(x + rad)} ${n(top)} c`,
    "h",
  ];
}

/** How a filled and/or stroked shape is painted. */
function paintOp(fill?: Rgb, stroke?: Rgb): string {
  if (fill && stroke) return "B";
  if (fill) return "f";
  return "S";
}

export interface SerializedPage {
  stream: string;
  /** Distinct alpha values used, so the caller can build the ExtGStates. */
  alphas: number[];
}

/**
 * Turn a canvas into a content stream, flipping to PDF's bottom-left origin.
 *
 * Alpha is not a graphics-state operator in PDF — it lives in an ExtGState
 * resource referenced by name — so distinct opacity values are collected here
 * and the caller registers them as `/GS0`, `/GS1`, … in page resources.
 */
export function serialize(canvas: Canvas): SerializedPage {
  const flip = (y: number) => canvas.height - y;
  const alphas: number[] = [];
  const gsName = (alpha: number) => {
    let i = alphas.indexOf(alpha);
    if (i < 0) i = alphas.push(alpha) - 1;
    return `/GS${i} gs`;
  };

  const parts: string[] = [];
  for (const op of canvas.ops) {
    // `q`/`Q` around every op: colour, line width and alpha are all graphics
    // state, and leaking one op's state into the next produced the kind of bug
    // that only shows up in the fifth element painted.
    parts.push("q");
    if (op.opacity !== 1) parts.push(gsName(op.opacity));

    if (op.kind === "text") {
      const w = textWidth(op.text, op.font, op.size);
      const dx = op.align === "center" ? -w / 2 : op.align === "right" ? -w : 0;
      const x = op.x + dx;
      // The y given is the text baseline, counted from the top of the page.
      const y = flip(op.y);
      parts.push(colorOp(op.color, false));
      parts.push("BT");
      parts.push(`/${FONT_KEYS[op.font]} ${n(op.size)} Tf`);
      if (op.rotate) {
        const rad = (op.rotate * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        // Rotate about the anchor, then apply the alignment offset in the
        // rotated frame so centred rotated text stays centred.
        const ox = dx * cos;
        const oy = dx * sin;
        parts.push(
          `${n(cos)} ${n(sin)} ${n(-sin)} ${n(cos)} ${n(op.x + ox)} ${n(y + oy)} Tm`,
        );
      } else {
        parts.push(`1 0 0 1 ${n(x)} ${n(y)} Tm`);
      }
      parts.push(`(${escapePdf(op.text)}) Tj`);
      parts.push("ET");
    } else if (op.kind === "rect") {
      if (op.fill) parts.push(colorOp(op.fill, false));
      if (op.stroke) {
        parts.push(colorOp(op.stroke, true));
        parts.push(`${n(op.lineWidth)} w`);
      }
      parts.push(...roundedRectPath(op, flip));
      parts.push(paintOp(op.fill, op.stroke));
    } else {
      if (op.fill) parts.push(colorOp(op.fill, false));
      if (op.stroke) {
        parts.push(colorOp(op.stroke, true));
        parts.push(`${n(op.lineWidth)} w`);
        // Round caps and joins: the figures are single-stroke line drawings
        // and mitred corners on a curve read as chipped.
        parts.push("1 J");
        parts.push("1 j");
      }
      for (const c of op.cmds) {
        if (c.op === "M") parts.push(`${n(c.x)} ${n(flip(c.y))} m`);
        else if (c.op === "L") parts.push(`${n(c.x)} ${n(flip(c.y))} l`);
        else if (c.op === "Z") parts.push("h");
        else {
          parts.push(
            `${n(c.x1)} ${n(flip(c.y1))} ${n(c.x2)} ${n(flip(c.y2))} ` +
              `${n(c.x)} ${n(flip(c.y))} c`,
          );
        }
      }
      parts.push(paintOp(op.fill, op.stroke));
    }
    parts.push("Q");
  }
  return { stream: parts.join("\n"), alphas };
}
