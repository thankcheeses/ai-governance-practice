import { SUBDOMAINS } from "@/content/bok";
import { getQuestion } from "@/content/registry";
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
 * A results PDF, written by hand.
 *
 * No library, and no service. Three reasons, in order of weight:
 *
 *  1. The result is the learner's own performance data. Posting it to a
 *     rendering service to get a file back would send it somewhere it has no
 *     reason to go, for a document we can produce locally.
 *  2. The mobile target is a static export inside a WebView. A generator that
 *     needs a server would work on the web build and quietly not on the app.
 *  3. Every PDF library worth using is larger than this file, for a document
 *     that is monospaced text on a grid.
 *
 * The output uses Courier, one of the fourteen fonts every reader is required
 * to have built in, so nothing is embedded and the file stays a few kilobytes.
 * It also happens to be the right typeface: the product is monospace-first and
 * the report should look like it came from the same place.
 *
 * Byte offsets in the cross-reference table have to be exact, so everything
 * written is sanitised to single-byte ASCII first — that keeps string length
 * and byte length equal and the table honest.
 */

const PAGE_WIDTH = 595.28; // A4 portrait, points
const PAGE_HEIGHT = 841.89;
const MARGIN = 54;
const BODY_SIZE = 9.5;
const LEADING = 13.5;
const COLUMN = Math.floor((PAGE_WIDTH - MARGIN * 2) / (BODY_SIZE * 0.6));

/**
 * Fold the typographic characters the question bank uses into ASCII.
 *
 * The bank is written with proper dashes and quotes, and Courier's WinAnsi
 * encoding would render several of them as the wrong glyph. Folding is more
 * honest than dropping: the reader sees the sentence, in plain characters.
 */
function toAscii(text: string): string {
  return text
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/·/g, "-")
    .replace(/ /g, " ")
    .replace(/[^\x20-\x7E]/g, "?");
}

/** Escape the three characters that end or nest a PDF string literal. */
function escapePdf(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Greedy wrap to the monospace column width. Long words are broken. */
function wrap(text: string, width = COLUMN): string[] {
  const lines: string[] = [];
  for (const paragraph of toAscii(text).split("\n")) {
    // A line that already fits is emitted untouched. The report aligns labels
    // and bars with runs of spaces, and reflowing would collapse them — the
    // columns are the point of a monospaced document.
    if (paragraph.length <= width) {
      lines.push(paragraph);
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      let w = word;
      while (w.length > width) {
        if (line) {
          lines.push(line);
          line = "";
        }
        lines.push(w.slice(0, width));
        w = w.slice(width);
      }
      if (!line) line = w;
      else if (line.length + 1 + w.length <= width) line += ` ${w}`;
      else {
        lines.push(line);
        line = w;
      }
    }
    lines.push(line);
  }
  return lines;
}

type Weight = "regular" | "bold";
interface Line {
  text: string;
  weight: Weight;
  size: number;
  /** Extra space above, in points. */
  spaceBefore: number;
}

/** Accumulates lines, then paginates them at the end. */
export class Doc {
  readonly lines: Line[] = [];

  add(text: string, weight: Weight = "regular", spaceBefore = 0, size = BODY_SIZE) {
    for (const line of wrap(text, Math.floor((PAGE_WIDTH - MARGIN * 2) / (size * 0.6)))) {
      this.lines.push({ text: line, weight, size, spaceBefore });
      spaceBefore = 0; // only the first wrapped line carries the gap
    }
  }

  blank(points = LEADING * 0.5) {
    this.lines.push({ text: "", weight: "regular", size: BODY_SIZE, spaceBefore: points });
  }

  rule() {
    this.add("-".repeat(COLUMN), "regular", 2);
  }
}

/** Split the accumulated lines into pages that fit. */
function paginate(lines: Line[]): Line[][] {
  const usable = PAGE_HEIGHT - MARGIN * 2;
  const pages: Line[][] = [];
  let page: Line[] = [];
  let used = 0;
  for (const original of lines) {
    let line = original;
    const height = LEADING + line.spaceBefore;
    if (used + height > usable && page.length) {
      pages.push(page);
      page = [];
      used = 0;
      // A gap at the top of a fresh page is wasted space.
      line = { ...line, spaceBefore: 0 };
    }
    page.push(line);
    used += height;
  }
  if (page.length) pages.push(page);
  return pages.length ? pages : [[]];
}

function contentStream(page: Line[]): string {
  const parts: string[] = ["BT"];
  let y = PAGE_HEIGHT - MARGIN;
  let font: Weight | null = null;
  let size = 0;
  for (const line of page) {
    y -= LEADING + line.spaceBefore;
    if (line.weight !== font || line.size !== size) {
      font = line.weight;
      size = line.size;
      parts.push(`/${font === "bold" ? "F2" : "F1"} ${size} Tf`);
    }
    parts.push(`1 0 0 1 ${MARGIN.toFixed(2)} ${y.toFixed(2)} Tm`);
    if (line.text) parts.push(`(${escapePdf(line.text)}) Tj`);
  }
  parts.push("ET");
  return parts.join("\n");
}

/** Assemble the objects, cross-reference table and trailer. */
function buildPdf(pages: Line[][], title: string): string {
  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  // 1 catalog, 2 pages, 3 + 4 fonts, then two objects per page.
  const firstPageId = 5;
  pages.forEach((_, i) => pageObjectIds.push(firstPageId + i * 2));

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  );
  objects.push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>",
  );
  objects.push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>",
  );

  pages.forEach((page, i) => {
    const contentId = firstPageId + i * 2 + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    const stream = contentStream(page);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  // The info dictionary is the last object, so it is numbered after the pages.
  const infoId = objects.length + 1;
  objects.push(
    `<< /Title (${escapePdf(toAscii(title))}) /Producer (AI Governance Practice) >>`,
  );

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${infoId} 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}

/* ------------------------------------------------------------------ */
/* The report                                                          */
/* ------------------------------------------------------------------ */

function bar(accuracy: number, width = 20): string {
  const filled = Math.round((Math.max(0, Math.min(100, accuracy)) / 100) * width);
  return `[${"#".repeat(filled)}${".".repeat(width - filled)}]`;
}

/**
 * Build one breakdown row, clipping the trailing label so the row fits.
 *
 * The columns are load-bearing: a row that overflows is reflowed by the
 * wrapper, its runs of spaces collapse, and the bars stop lining up down the
 * page. Clipping the one variable-length part keeps the grid intact.
 */
function breakdownRow(
  prefix: string,
  prefixWidth: number,
  accuracy: number,
  correct: number,
  total: number,
  label: string,
  barWidth: number,
): string {
  const head =
    `${prefix.padEnd(prefixWidth)} ${bar(accuracy, barWidth)} ` +
    `${String(correct).padStart(3)}/${String(total).padEnd(3)} ` +
    `${String(accuracy).padStart(3)}%  `;
  return head + toAscii(label).slice(0, Math.max(0, COLUMN - head.length));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "unknown";
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

/**
 * Compose the report body.
 *
 * Exported separately from the file bytes so its content can be asserted in a
 * test without parsing a PDF — the thing worth checking is that the numbers on
 * the page are the numbers in the result.
 */
export function resultReportLines(result: CompletedResult, score?: SittingScore): Doc {
  const s = score ?? scoreResult(result);
  const doc = new Doc();
  const isExam = result.mode === "exam";

  doc.add(isExam ? "AIGP Practice Exam - Results" : "AIGP Practice Session - Results", "bold", 0, 14);
  doc.add(
    "Practice simulation over independently authored questions. Not a " +
      "certification exam, and not affiliated with any certification body. " +
      "This score describes this sitting only and predicts no certification result.",
  );
  doc.rule();

  doc.add("SUMMARY", "bold", LEADING);
  doc.add(`Mode            ${isExam ? "Exam" : "Practice"}`);
  doc.add(`Sitting         ${result.label}`);
  doc.add(`Reference       ${result.sittingId}`);
  doc.add(`Completed       ${formatDate(result.completedAt)}`);
  if (result.reason === "expired") {
    doc.add("Closed by       the time limit expiring");
  }
  doc.add(`Score           ${s.correct} / ${s.total}  (${s.percentage}%)`);
  doc.add(`Correct         ${s.correct}`);
  doc.add(`Incorrect       ${s.incorrect}`);
  doc.add(`Unanswered      ${s.unanswered}`);
  if (isExam) doc.add(`Flagged         ${s.flaggedCount}`);
  doc.add(`Time used       ${formatDuration(elapsedMs(result))}`);
  const left = timeRemainingAtFinish(result);
  if (left !== null) {
    doc.add(`Time remaining  ${formatDuration(left)} of ${formatDuration(result.durationMs!)}`);
  }

  if (s.byDomain.length) {
    doc.add("DOMAIN PERFORMANCE", "bold", LEADING);
    for (const d of s.byDomain) {
      doc.add(breakdownRow(d.roman, 4, d.accuracy, d.correct, d.total, d.label, 20));
    }
  }

  if (s.bySubdomain.length) {
    doc.add("SUB-DOMAIN PERFORMANCE", "bold", LEADING);
    for (const sub of s.bySubdomain) {
      const meta = SUBDOMAINS.find((x) => x.id === sub.key);
      doc.add(
        breakdownRow(sub.key, 6, sub.accuracy, sub.correct, sub.total, meta?.competency ?? "", 14),
      );
    }
  }

  const weak = weakestSubdomains(s);
  if (weak.length) {
    doc.add("WHERE TO STUDY NEXT", "bold", LEADING);
    for (const sub of weak) {
      const meta = SUBDOMAINS.find((x) => x.id === sub.key);
      doc.add(`${sub.key} - ${meta?.competency ?? sub.key} (${sub.correct}/${sub.total})`, "bold", 4);
      if (meta?.recommendation) doc.add(meta.recommendation);
    }
  }

  if (s.missedIds.length) {
    doc.add(`TO REVISIT (${s.missedIds.length})`, "bold", LEADING);
    doc.add(
      "Questions answered incorrectly or left blank. The full rationale for " +
        "each is in the app; only the prompt is listed here.",
    );
    let n = 0;
    for (const id of s.missedIds) {
      const question = getQuestion(id);
      if (!question) continue;
      n += 1;
      const chosen = result.answers[id];
      const status = chosen?.length ? "incorrect" : "unanswered";
      doc.add(`${String(n).padStart(3)}. [${status}] ${question.question}`, "regular", 4);
      doc.add(`     ${question.bokSubdomain} - ${question.keyTakeaway}`);
    }
  }

  doc.blank(LEADING);
  doc.rule();
  doc.add(
    "Generated by AI Governance Practice. Questions are independently " +
      "written from the published body of knowledge.",
  );
  return doc;
}

/** The finished document, as PDF bytes. */
export function resultPdfBytes(result: CompletedResult): Uint8Array {
  const doc = resultReportLines(result);
  const title = `${result.mode === "exam" ? "AIGP Practice Exam" : "AIGP Practice Session"} results`;
  const pdf = buildPdf(paginate(doc.lines), title);
  const bytes = new Uint8Array(pdf.length);
  // Sanitised to ASCII upstream, so one character is one byte and the offsets
  // recorded in the cross-reference table are correct.
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return bytes;
}

/** `aigp-exam-results-2026-08-08.pdf` */
export function resultPdfFilename(result: CompletedResult): string {
  const date = result.completedAt.slice(0, 10);
  return `aigp-${result.mode}-results-${date}.pdf`;
}
