import { SUBDOMAINS } from "@/content/bok";
import { getQuestion, getTrackQuestions } from "@/content/registry";
import { BRAND, COMPANY, DISCLAIMER_BODY, DISCLAIMER_TITLE } from "./brand";
import {
  Canvas,
  type DrawOp,
  type FontId,
  type Rgb,
  rgb,
  textWidth,
  truncate,
  wrapText,
} from "./pdf/canvas";
import { documentBytes } from "./pdf/document";
import { drawFigure, drawGradeStamp } from "./pdf/figures";
import { GRADE_BANDS, type Readiness, assessReadiness, gradeFor } from "./readiness";
import {
  type CompletedResult,
  type SittingScore,
  elapsedMs,
  formatDuration,
  scoreResult,
  timeRemainingAtFinish,
  weakestSubdomains,
} from "./results";

/**
 * The results report.
 *
 * Still hand-written, still no library and no service: the file is the
 * learner's own performance data, and posting it to a renderer to get a
 * document back would send it somewhere it has no reason to go. The mobile
 * target is a static export inside a WebView, so anything needing a server
 * would work on the web and quietly not in the app.
 *
 * What changed is that this is now a laid-out document rather than a
 * monospaced dump. The old generator emitted text operators and nothing else,
 * which is why a progress bar could only ever be `[#####.....]` — there were no
 * path operators in the file to draw one with. `pdf/canvas.ts` supplies them;
 * this module composes.
 *
 * Three rules the composition holds to, each of which the tests enforce:
 *
 *  1. **No claim about a real examination.** Not a prediction, not a
 *     probability, not a readiness determination for anyone's certification.
 *     The grade is a practice grade over this project's own questions.
 *  2. **Completion gates the verdict.** One correct answer out of one is 100%
 *     and means nothing; `readiness.ts` is where that judgement lives and this
 *     module only renders it.
 *  3. **Nothing is carried by colour alone.** Every bar prints its percentage,
 *     its grade and its counts as text, so the report survives a monochrome
 *     printer and a reader who cannot distinguish the hues.
 */

/* ------------------------------------------------------------------ */
/* Page and palette                                                    */
/* ------------------------------------------------------------------ */

const PAGE_W = 595.28; // A4 portrait, points
const PAGE_H = 841.89;
const MARGIN = 46;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_TOP = PAGE_H - 42;

/*
  Drawn from the application's own light-theme tokens in `globals.css` rather
  than picked fresh, so the report and the screen are recognisably the same
  product. Borders are given as opaque hexes because PDF has no alpha on a
  stroke colour without an ExtGState, and a 10%-black border over cream is this.
*/
const GROUND = rgb("#f5f3f0");
const CARD = rgb("#fbfaf8");
const INK = rgb("#1a2332");
const MUTED = rgb("#5c6470");
const BORDER = rgb("#dcd7d1");
const ACCENT = rgb("#6b7fd7");
const ACCENT_TINT = rgb("#eef0fb");
const INSIGHT_TINT = rgb("#fdf2e9");
const INSIGHT_INK = rgb("#a86232");
const SUCCESS = rgb("#4a7c59");
const WARNING = rgb("#a86232");
const DESTRUCTIVE = rgb("#c4453a");
const TRACK = rgb("#e6e2dd");
/** The red a grade gets written in. Not a palette token; it is marker ink. */
const MARKER = rgb("#d3231b");

/**
 * Bar colour by percentage.
 *
 * A severity ramp — attention at the low end, settled green at the high end —
 * in the app's own hues rather than the saturated rainbow a progress-bar sprite
 * sheet would give. It runs low-to-high in the direction a reader expects, and
 * because every bar is labelled it is reinforcement rather than information.
 */
function barColor(pct: number): Rgb {
  if (pct >= 85) return SUCCESS;
  if (pct >= 70) return ACCENT;
  if (pct >= 50) return rgb("#c98b52");
  if (pct >= 30) return WARNING;
  return DESTRUCTIVE;
}

/* ------------------------------------------------------------------ */
/* Text handling                                                       */
/* ------------------------------------------------------------------ */

/**
 * Fold typographic characters into ASCII.
 *
 * Two reasons, and the second is the load-bearing one. The built-in fonts'
 * WinAnsi encoding renders several of these as the wrong glyph; and the
 * cross-reference table records byte offsets, which stay computable from string
 * length only while one character is one byte.
 */
export function toAscii(text: string): string {
  return text
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/·/g, "-")
    .replace(/ /g, " ")
    .replace(/[^\x20-\x7E]/g, "?");
}

const pct = (v: number) => `${Math.round(Math.max(0, Math.min(100, v)))}%`;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "unknown";
  return `${d.toISOString().replace("T", " ").slice(0, 16)} UTC`;
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

/**
 * A cursor over a growing stack of pages.
 *
 * Every `draw*` advances `y`; `need` opens a new page when the next block will
 * not fit. Page furniture — the watermark behind, the footer in front — is
 * applied once at the end, when the total page count is finally known.
 */
class Report {
  readonly pages: Canvas[] = [];
  private canvas!: Canvas;
  y = 0;

  /**
   * Points held back at the foot of page one for the disclosure block.
   *
   * Without this the block was laid out inline and simply flowed onto page two
   * whenever page one ran long — which happened on the first timed-exam sample
   * rendered, leaving a third of page one blank and the independence statement
   * on the back. A disclosure a reader has to turn the page for is not a
   * disclosure, so the space is claimed before anything else is drawn.
   */
  constructor(readonly firstPageReserve = 0) {
    this.newPage();
  }

  private newPage(): void {
    this.canvas = new Canvas(PAGE_W, PAGE_H);
    // The paper and the watermark are added by `paintFurniture` at the end, in
    // front of the ground and behind everything here. Painting the ground now
    // would put it on top of a watermark inserted later.
    this.pages.push(this.canvas);
    this.y = MARGIN;
  }

  /** The lowest y content may reach on the current page. */
  private get floor(): number {
    return (
      FOOTER_TOP - 14 - (this.pages.length === 1 ? this.firstPageReserve : 0)
    );
  }

  /** Open a new page unless `height` points remain above the footer. */
  need(height: number): void {
    if (this.y + height > this.floor) this.newPage();
  }

  get c(): Canvas {
    return this.canvas;
  }

  /**
   * A section rule with a label sitting on it.
   *
   * `keepWith` is the height of the first block that follows. Without it a
   * heading could land in the last few points of a page and leave its own
   * section on the next one — which is what happened to "Practice readiness"
   * on the first timed-exam sample. A heading is never the last thing on a
   * page.
   */
  heading(label: string, keepWith = 0): void {
    this.need(34 + keepWith);
    this.y += 6;
    this.canvas.hairline(MARGIN, this.y, CONTENT_W, BORDER);
    this.y += 13;
    this.canvas.text(toAscii(label.toUpperCase()), MARGIN, this.y, {
      font: "sansBold",
      size: 8,
      color: MUTED,
    });
    this.y += 13;
  }

  /** A run of body copy, wrapped and paginated line by line. */
  paragraph(
    text: string,
    opts: {
      size?: number;
      font?: FontId;
      color?: Rgb;
      width?: number;
      x?: number;
      leading?: number;
    } = {},
  ): void {
    const size = opts.size ?? 9;
    const font = opts.font ?? "sans";
    const color = opts.color ?? INK;
    const width = opts.width ?? CONTENT_W;
    const x = opts.x ?? MARGIN;
    const leading = opts.leading ?? size * 1.45;
    for (const line of wrapText(toAscii(text), font, size, width)) {
      this.need(leading);
      this.y += leading;
      this.canvas.text(line, x, this.y, { font, size, color });
    }
  }
}

/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */

/**
 * A progress bar: a rounded track with a rounded fill over it.
 *
 * Real geometry, not characters. A non-zero percentage always draws something
 * at least as wide as the bar is tall, so 1% reads as a visible sliver rather
 * than as nothing — the difference between "barely any" and "none" is exactly
 * what this report must not blur.
 */
function drawBar(
  canvas: Canvas,
  x: number,
  y: number,
  w: number,
  h: number,
  value: number,
  color?: Rgb,
): void {
  const v = Math.max(0, Math.min(100, value));
  canvas.rect(x, y, w, h, { radius: h / 2, fill: TRACK, tag: "bar-track" });
  if (v <= 0) return;
  const filled = Math.max(h, (w * v) / 100);
  canvas.rect(x, y, filled, h, {
    radius: h / 2,
    fill: color ?? barColor(v),
    tag: "bar-fill",
  });
}

/** Label on the left, percentage and counts on the right, bar underneath. */
function labelledBar(
  report: Report,
  label: string,
  value: number,
  detail: string,
  color?: Rgb,
): void {
  report.need(26);
  report.y += 11;
  const right = MARGIN + CONTENT_W;
  const tail = `${pct(value)}   ${toAscii(detail)}`;
  const tailW = textWidth(tail, "sans", 8.5);
  report.c.text(
    truncate(toAscii(label), "sansBold", 8.5, CONTENT_W - tailW - 14),
    MARGIN,
    report.y,
    { font: "sansBold", size: 8.5, color: INK },
  );
  report.c.text(tail, right, report.y, {
    font: "sans",
    size: 8.5,
    color: MUTED,
    align: "right",
  });
  report.y += 5;
  drawBar(report.c, MARGIN, report.y, CONTENT_W, 7, value, color);
  report.y += 7;
}

/** One boxed number with a caption under it. */
function statTile(
  canvas: Canvas,
  x: number,
  y: number,
  w: number,
  value: string,
  caption: string,
): void {
  canvas.rect(x, y, w, 44, {
    radius: 8,
    fill: CARD,
    stroke: BORDER,
    lineWidth: 0.7,
  });
  canvas.text(toAscii(value), x + w / 2, y + 22, {
    font: "sansBold",
    size: 15,
    color: INK,
    align: "center",
  });
  canvas.text(toAscii(caption).toUpperCase(), x + w / 2, y + 34, {
    font: "sans",
    size: 6.5,
    color: MUTED,
    align: "center",
  });
}

/* ------------------------------------------------------------------ */
/* Disclosures                                                         */
/* ------------------------------------------------------------------ */

/**
 * The four shared lines every surface carries, plus the three this document
 * needs because it is the artefact that leaves the app and gets shown to other
 * people. Sharing the first four with `brand.ts` is the point — the disclosure
 * cannot drift between the app and the report.
 */
export const REPORT_DISCLOSURES: string[] = [
  ...DISCLAIMER_BODY,
  "This report describes performance in this independent practice tool only. " +
    "It is not an official score, and the readiness statement is not a " +
    "prediction of any examination outcome.",
  "Use this as one practice tool among several. Do not use it as your only " +
    "source of study.",
  "You are responsible for checking current official candidate materials " +
    "before sitting any examination.",
];

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function drawHeader(report: Report, result: CompletedResult, now: Date): void {
  const isExam = result.mode === "exam";
  report.y += 16;
  report.c.text(toAscii(BRAND.name), MARGIN, report.y, {
    font: "sansBold",
    size: 19,
    color: INK,
  });
  report.c.text(
    isExam ? "Practice exam results" : "Practice session results",
    MARGIN + CONTENT_W,
    report.y,
    { font: "sans", size: 10, color: MUTED, align: "right" },
  );
  report.y += 13;
  report.c.text(
    "Independent educational product. Not affiliated with or endorsed by the IAPP.",
    MARGIN,
    report.y,
    { font: "sansItalic", size: 8, color: MUTED },
  );
  report.c.text(
    toAscii(`${formatDate(now.toISOString())}`),
    MARGIN + CONTENT_W,
    report.y,
    { font: "sans", size: 8, color: MUTED, align: "right" },
  );
  report.y += 8;
  report.c.hairline(MARGIN, report.y, CONTENT_W, INK, 0.5);
  report.y += 4;
}

/**
 * The hero: the grade written in marker on the left, the honest one-liner in
 * the middle, the illustration on the right.
 */
function drawGradeBlock(
  report: Report,
  score: SittingScore,
  readiness: Readiness,
  seed: string,
): void {
  const top = report.y + 10;
  const H = 118;
  report.c.rect(MARGIN, top, CONTENT_W, H, {
    radius: 12,
    fill: CARD,
    stroke: BORDER,
    lineWidth: 0.7,
  });

  /*
    A sitting nobody answered is unmeasured, not failed. Stamping it with a
    red F would contradict the report's own verdict two boxes down ("a grade
    of 0% here means unmeasured rather than wrong") and would tell someone who
    simply has not started yet that they have failed something. It gets a dash.
  */
  const graded = readiness.state !== "noEvidence";
  const stampCx = MARGIN + 66;
  const stampCy = top + H / 2 - 6;
  drawGradeStamp(report.c, graded ? readiness.grade : "-", stampCx, stampCy, 40, MARKER);
  report.c.text(graded ? "PRACTICE GRADE" : "NOT GRADED YET", stampCx, top + H - 16, {
    font: "sansBold",
    size: 6.5,
    color: MUTED,
    align: "center",
  });

  const midX = MARGIN + 140;
  const midW = CONTENT_W - 140 - 120;
  let y = top + 30;
  if (graded) {
    const headline = pct(score.percentage);
    report.c.text(headline, midX, y, { font: "sansBold", size: 26, color: INK });
    report.c.text(
      `${score.correct} of ${score.total} correct`,
      midX + textWidth(headline, "sansBold", 26) + 10,
      y,
      { font: "sans", size: 10, color: MUTED },
    );
  } else {
    // No percentage in the hero slot when there is nothing to report one for.
    // A big "0%" beside a dashed grade invites exactly the misreading the
    // dash exists to prevent.
    report.c.text(`0 of ${score.total} answered`, midX, y - 2, {
      font: "sansBold",
      size: 17,
      color: INK,
    });
  }
  y += 18;
  for (const line of wrapText(toAscii(readiness.headline), "sansBold", 9.5, midW)) {
    report.c.text(line, midX, y, { font: "sansBold", size: 9.5, color: INK });
    y += 13;
  }
  report.c.text(
    toAscii(
      graded
        ? "Practice grade over this project's own questions - not an official score."
        : "Nothing was answered, so there is no performance to grade.",
    ),
    midX,
    y + 2,
    { font: "sansItalic", size: 7.5, color: MUTED },
  );

  drawFigure(report.c, readiness.state, MARGIN + CONTENT_W - 96, top + 26, 72, INK, seed);
  report.y = top + H;
}

function drawOverview(
  report: Report,
  result: CompletedResult,
  score: SittingScore,
  readiness: Readiness,
): void {
  // The tile row is 46pt and is meaningless split across a page break.
  report.heading("Performance overview", 52);

  const gap = 10;
  const w = (CONTENT_W - gap * 3) / 4;
  report.y += 2;
  const tiles: [string, string][] = [
    [pct(score.percentage), "Score"],
    [String(readiness.attempted), "Attempted"],
    [String(score.correct), "Correct"],
    [String(score.unanswered), "Unanswered"],
  ];
  tiles.forEach(([value, caption], i) => {
    statTile(report.c, MARGIN + i * (w + gap), report.y, w, value, caption);
  });
  report.y += 46;

  labelledBar(
    report,
    "Overall accuracy",
    score.percentage,
    `${score.correct}/${score.total} correct`,
  );
  /*
    Coverage is a fact about the sitting, not a mark against the learner: 41%
    of the bank is neither good nor bad, it is simply how much was drawn on.
    Running it through the severity ramp painted it the same alarming colour as
    a failing score, so it gets the neutral accent instead.
  */
  labelledBar(
    report,
    "Bank coverage this sitting",
    readiness.coverage,
    `${score.total} of ${readiness.bankSize} questions`,
    ACCENT,
  );

  report.y += 10;
  const facts: string[] = [
    `Sitting: ${result.label}`,
    `Reference: ${result.sittingId}`,
    `Completed: ${formatDate(result.completedAt)}`,
    `Time used: ${formatDuration(elapsedMs(result))}`,
  ];
  if (result.reason === "expired") facts.push("Closed by: the time limit expiring");
  if (result.mode === "exam") facts.push(`Flagged: ${score.flaggedCount}`);
  const left = timeRemainingAtFinish(result);
  if (left !== null) {
    facts.push(
      `Time remaining: ${formatDuration(left)} of ${formatDuration(result.durationMs!)}`,
    );
  }
  // Two columns, so the metadata occupies half the vertical space.
  const half = CONTENT_W / 2;
  const rows = Math.ceil(facts.length / 2);
  report.need(rows * 11 + 6);
  const startY = report.y;
  facts.forEach((fact, i) => {
    const col = Math.floor(i / rows);
    const row = i % rows;
    report.c.text(toAscii(fact), MARGIN + col * half, startY + row * 11, {
      font: "sans",
      size: 8,
      color: MUTED,
    });
  });
  report.y = startY + rows * 11;
}

function drawDomains(report: Report, score: SittingScore): void {
  if (!score.byDomain.length) return;
  const gap = 10;
  const w = (CONTENT_W - gap) / 2;
  const h = 62;
  report.heading("Domain performance", h + 8);
  for (let i = 0; i < score.byDomain.length; i += 2) {
    report.need(h + 8);
    report.y += 4;
    const rowTop = report.y;
    for (const [j, d] of score.byDomain.slice(i, i + 2).entries()) {
      const x = MARGIN + j * (w + gap);
      report.c.rect(x, rowTop, w, h, {
        radius: 10,
        fill: CARD,
        stroke: BORDER,
        lineWidth: 0.7,
      });
      /*
        Grade and percentage as text on every card: the bar reinforces, it
        never carries the value on its own. A domain with nothing attempted
        shows a dash rather than an F, for the same reason the hero does.
      */
      const mark = d.answered > 0 ? `${gradeFor(d.accuracy)}  ${pct(d.accuracy)}` : "--";
      report.c.text(`${d.roman}`, x + 12, rowTop + 17, {
        font: "sansBold",
        size: 8.5,
        color: ACCENT,
      });
      report.c.text(
        truncate(
          toAscii(d.label),
          "sansBold",
          9,
          w - 46 - textWidth(mark, "sansBold", 9),
        ),
        x + 12 + textWidth(`${d.roman}`, "sansBold", 8.5) + 7,
        rowTop + 17,
        { font: "sansBold", size: 9, color: INK },
      );
      report.c.text(mark, x + w - 12, rowTop + 17, {
        font: "sansBold",
        size: 9,
        color: d.answered > 0 ? INK : MUTED,
        align: "right",
      });
      drawBar(report.c, x + 12, rowTop + 26, w - 24, 7, d.accuracy);
      report.c.text(
        `${d.correct} correct of ${d.total}  -  ${d.answered} attempted`,
        x + 12,
        rowTop + 48,
        { font: "sans", size: 7.5, color: MUTED },
      );
    }
    report.y = rowTop + h;
  }
}

function drawWhatToReview(
  report: Report,
  score: SittingScore,
  readiness: Readiness,
): void {
  report.heading("What to review", 40);
  const weak = weakestSubdomains(score);
  if (!weak.length || readiness.state === "noEvidence") {
    report.paragraph(
      "There is not enough data in this sitting to single out a weakest " +
        "competency. Answer more questions across more domains and this " +
        "section will name specific areas rather than staying silent.",
      { color: MUTED },
    );
    return;
  }
  for (const sub of weak) {
    const meta = SUBDOMAINS.find((x) => x.id === sub.key);
    report.need(30);
    report.y += 12;
    report.c.text(
      truncate(
        toAscii(`${sub.key} - ${meta?.competency ?? sub.key}`),
        "sansBold",
        9,
        CONTENT_W - 70,
      ),
      MARGIN,
      report.y,
      { font: "sansBold", size: 9, color: INK },
    );
    report.c.text(
      `${sub.correct}/${sub.total}  ${pct(sub.accuracy)}`,
      MARGIN + CONTENT_W,
      report.y,
      { font: "sans", size: 8.5, color: MUTED, align: "right" },
    );
    report.y += 7;
    drawBar(report.c, MARGIN, report.y, CONTENT_W, 5, sub.accuracy);
    report.y += 6;
    if (meta?.recommendation) {
      report.paragraph(meta.recommendation, { size: 8, color: MUTED });
    }
    // Entries otherwise run into each other: the recommendation of one sits
    // directly against the heading of the next with no gap to separate them.
    report.y += 6;
  }
}

function drawReadiness(report: Report, readiness: Readiness): void {
  const body = wrapText(toAscii(readiness.verdict), "sans", 9, CONTENT_W - 28);
  const boxH = 30 + body.length * 13;
  report.heading("Practice readiness", boxH + 8);
  report.y += 4;
  const top = report.y;
  report.c.rect(MARGIN, top, CONTENT_W, boxH, {
    radius: 10,
    fill: INSIGHT_TINT,
    stroke: rgb("#f0d5bb"),
    lineWidth: 0.7,
  });
  report.c.text(
    "AN ESTIMATE FROM THIS PRACTICE TOOL ONLY - NOT AN EXAMINATION PREDICTION",
    MARGIN + 14,
    top + 16,
    { font: "sansBold", size: 6.5, color: INSIGHT_INK },
  );
  body.forEach((line, i) => {
    report.c.text(line, MARGIN + 14, top + 32 + i * 13, {
      font: "sans",
      size: 9,
      color: INK,
    });
  });
  report.y = top + boxH;
}

function drawNextSteps(report: Report, readiness: Readiness): void {
  report.heading("Recommended next steps", 30);
  readiness.nextSteps.forEach((step, i) => {
    report.need(16);
    report.y += 12;
    report.c.text(`${i + 1}.`, MARGIN, report.y, {
      font: "sansBold",
      size: 9,
      color: ACCENT,
    });
    const x = MARGIN + 16;
    const lines = wrapText(toAscii(step), "sans", 9, CONTENT_W - 16);
    lines.forEach((line, j) => {
      if (j > 0) {
        report.need(12);
        report.y += 12;
      }
      report.c.text(line, x, report.y, { font: "sans", size: 9, color: INK });
    });
  });
}

function drawGradingConvention(report: Report): void {
  report.heading("How the practice grade is calculated", 44);
  report.paragraph(
    "Accuracy across every question in this sitting, including questions left " +
      "unanswered, mapped to a conventional school scale. It describes " +
      "performance on this project's own questions and is not a grading " +
      "mechanism of the IAPP or of any certification body.",
    { size: 8.5, color: MUTED },
  );
  report.y += 6;
  for (const band of GRADE_BANDS) {
    report.need(14);
    report.y += 12;
    const range =
      band.grade === "F" ? "0-59%" : `${band.min}-${band.min === 90 ? 100 : band.min + 9}%`;
    report.c.text(band.grade, MARGIN + 4, report.y, {
      font: "sansBold",
      size: 9,
      color: INK,
    });
    report.c.text(range, MARGIN + 24, report.y, {
      font: "sans",
      size: 8.5,
      color: MUTED,
    });
    report.c.text(toAscii(band.meaning), MARGIN + 84, report.y, {
      font: "sans",
      size: 8.5,
      color: INK,
    });
  }
  report.y += 6;
  report.paragraph(
    "Readiness is judged on two things, not one. A high percentage over very " +
      "few questions is not evidence of readiness, so the statement above " +
      "takes both accuracy and how much of the bank was attempted into account.",
    { size: 8.5, color: MUTED },
  );
}

function drawMissed(report: Report, result: CompletedResult, score: SittingScore): void {
  if (!score.missedIds.length) return;
  report.heading(`To revisit (${score.missedIds.length})`, 44);
  report.paragraph(
    "Answered incorrectly or left blank. The full rationale for each is in " +
      "the app; only the prompt is listed here.",
    { size: 8.5, color: MUTED },
  );
  report.y += 4;

  let n = 0;
  for (const id of score.missedIds) {
    const question = getQuestion(id);
    if (!question) continue;
    n += 1;
    const chosen = result.answers[id];
    const status = chosen?.length ? "incorrect" : "unanswered";
    report.need(28);
    report.y += 11;
    const badge = `${n}.`;
    report.c.text(badge, MARGIN, report.y, {
      font: "sansBold",
      size: 8,
      color: MUTED,
    });
    report.c.text(status, MARGIN + 22, report.y, {
      font: "sansBold",
      size: 7,
      color: status === "incorrect" ? DESTRUCTIVE : WARNING,
    });
    const x = MARGIN + 62;
    const w = CONTENT_W - 62;
    wrapText(toAscii(question.question), "sans", 8.5, w).forEach((line, j) => {
      if (j > 0) {
        report.need(11);
        report.y += 11;
      }
      report.c.text(line, x, report.y, { font: "sans", size: 8.5, color: INK });
    });
    report.need(11);
    report.y += 11;
    report.c.text(
      truncate(
        toAscii(`${question.bokSubdomain} - ${question.keyTakeaway}`),
        "sansItalic",
        7.5,
        w,
      ),
      x,
      report.y,
      { font: "sansItalic", size: 7.5, color: MUTED },
    );
  }
}

/** Wrapped disclosure copy and the height the block needs for it. */
function disclosureLayout(): { lines: string[]; height: number } {
  const lines = REPORT_DISCLOSURES.flatMap((d) =>
    wrapText(toAscii(d), "sans", 7.5, CONTENT_W - 28),
  );
  return { lines, height: 34 + lines.length * 10 };
}

/** Drawn into the band reserved at the foot of page one, never inline. */
function drawDisclosures(canvas: Canvas): void {
  const { lines, boxH } = (() => {
    const l = disclosureLayout();
    return { lines: l.lines, boxH: l.height };
  })();
  const top = FOOTER_TOP - 16 - boxH;
  canvas.rect(MARGIN, top, CONTENT_W, boxH, {
    radius: 10,
    fill: ACCENT_TINT,
    stroke: rgb("#cfd6f2"),
    lineWidth: 0.7,
  });
  canvas.text(toAscii(DISCLAIMER_TITLE), MARGIN + 14, top + 18, {
    font: "sansBold",
    size: 8.5,
    color: INK,
  });
  let y = top + 32;
  for (const line of lines) {
    canvas.text(line, MARGIN + 14, y, { font: "sans", size: 7.5, color: INK });
    y += 10;
  }
}

/* ------------------------------------------------------------------ */
/* Page furniture                                                      */
/* ------------------------------------------------------------------ */

const WATERMARK = `${BRAND.name} - practice only - not an official exam`;

/**
 * Watermark behind the content, footer in front.
 *
 * The watermark is visible text at low opacity, and deliberately so. A hidden
 * mark that only a machine can read, placed there in the hope of steering
 * whatever software the file is later fed to, would be a trick played on the
 * reader — and an unreliable one. A line anybody can see does the same job
 * honestly: a person reading the page sees it, and so does anything that
 * extracts the text.
 */
function paintFurniture(canvas: Canvas, page: number, total: number): void {
  const behind = new Canvas(PAGE_W, PAGE_H);
  behind.rect(0, 0, PAGE_W, PAGE_H, { fill: GROUND });
  behind.text(WATERMARK, PAGE_W / 2, PAGE_H / 2 + 90, {
    font: "sansBold",
    size: 21,
    color: INK,
    align: "center",
    opacity: 0.12,
    rotate: 32,
    tag: "watermark",
  });
  // Painted first so nothing sits on top of the report's own content.
  canvas.ops.unshift(...behind.ops);

  canvas.hairline(MARGIN, FOOTER_TOP - 12, CONTENT_W, BORDER);
  canvas.text(
    toAscii(`${BRAND.name} - published by ${COMPANY.name}`),
    MARGIN,
    FOOTER_TOP,
    { font: "sans", size: 7, color: MUTED },
  );
  canvas.text("thankcheeses.github.io/ai-governance-practice", PAGE_W / 2, FOOTER_TOP, {
    font: "sans",
    size: 7,
    color: MUTED,
    align: "center",
  });
  canvas.text(`Page ${page} of ${total}`, MARGIN + CONTENT_W, FOOTER_TOP, {
    font: "sans",
    size: 7,
    color: MUTED,
    align: "right",
  });
  canvas.text(
    "Original scenarios. Progress is stored on this device unless the learner signed in.",
    MARGIN,
    FOOTER_TOP + 10,
    { font: "sans", size: 6.5, color: MUTED },
  );
}

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

export interface ReportOptions {
  /** Generation time. Injectable so a test can pin it. */
  now?: Date;
  /** Bank size for the coverage and evidence calculations. */
  bankSize?: number;
}

/**
 * Lay the whole report out and return its pages.
 *
 * Exported so the composition can be asserted without parsing PDF syntax — the
 * things worth checking are that the numbers on the page are the numbers in the
 * result, that bars are geometry rather than characters, and that the document
 * makes no claim it is not entitled to.
 */
export function resultReportPages(
  result: CompletedResult,
  options: ReportOptions = {},
): Canvas[] {
  const score = scoreResult(result);
  const bankSize = options.bankSize ?? getTrackQuestions(result.trackId).length;
  const weakLabels = weakestSubdomains(score).map((s) => {
    const meta = SUBDOMAINS.find((x) => x.id === s.key);
    return `${s.key} ${meta?.competency ?? ""}`.trim();
  });
  const readiness = assessReadiness(score, bankSize, weakLabels);
  const now = options.now ?? new Date(result.completedAt);

  // The disclosure band is measured first and its space claimed, so page one
  // can never run long enough to push it onto page two.
  const report = new Report(disclosureLayout().height + 20);
  drawHeader(report, result, now);
  drawGradeBlock(report, score, readiness, result.sittingId);
  drawOverview(report, result, score, readiness);
  drawDomains(report, score);
  drawReadiness(report, readiness);
  drawWhatToReview(report, score, readiness);
  drawNextSteps(report, readiness);
  drawGradingConvention(report);
  drawMissed(report, result, score);

  // Page one, always, in the band held back for it.
  drawDisclosures(report.pages[0]);

  report.pages.forEach((canvas, i) => {
    paintFurniture(canvas, i + 1, report.pages.length);
  });
  return report.pages;
}

/** Every drawing op across every page, in order. For tests. */
export function resultReportOps(
  result: CompletedResult,
  options: ReportOptions = {},
): DrawOp[] {
  return resultReportPages(result, options).flatMap((c) => c.ops);
}

/** All text on the report, in reading order. For tests. */
export function resultReportText(
  result: CompletedResult,
  options: ReportOptions = {},
): string {
  return resultReportOps(result, options)
    .filter((op): op is Extract<DrawOp, { kind: "text" }> => op.kind === "text")
    .map((op) => op.text)
    .join("\n");
}

/**
 * Document metadata.
 *
 * Provenance, and nothing more. It names the application that produced the
 * file and states what the file is, so that anything reading it — a person
 * checking document properties, a search index, a model summarising an
 * attachment — is told plainly that this is practice output from an
 * unaffiliated tool and should not be treated as anyone's only study source.
 * It is not addressed to any particular software and issues no instructions.
 */
export function reportMetadata(result: CompletedResult, now: Date) {
  return {
    title: `${BRAND.name} - Results`,
    author: COMPANY.name,
    subject:
      "Independent educational practice report. Not affiliated with or " +
      "endorsed by the IAPP. Not an official score and not an examination " +
      "prediction. Not a sole study source.",
    keywords:
      "AI governance, practice report, independent educational resource, " +
      "not affiliated with IAPP, NOT A SOLE STUDY SOURCE - AI GOVERNANCE PRACTICE",
    creator: BRAND.name,
    createdAt: now,
  };
}

/** The finished document, as PDF bytes. */
export function resultPdfBytes(
  result: CompletedResult,
  options: ReportOptions = {},
): Uint8Array {
  const now = options.now ?? new Date(result.completedAt);
  const pages = resultReportPages(result, { ...options, now });
  return documentBytes(pages, reportMetadata(result, now));
}

/** `aigp-exam-results-2026-08-08.pdf` */
export function resultPdfFilename(result: CompletedResult): string {
  const date = result.completedAt.slice(0, 10);
  return `aigp-${result.mode}-results-${date}.pdf`;
}
