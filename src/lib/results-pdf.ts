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
import { buildPdfWithCover, coverStream } from "./results-pdf-cover";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 54;
const BODY_SIZE = 9.5;
const LEADING = 13.5;
const COLUMN = Math.floor((PAGE_WIDTH - MARGIN * 2) / (BODY_SIZE * 0.6));

function toAscii(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00B7/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E]/g, "?");
}

function escapePdf(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(text: string, width = COLUMN): string[] {
  const lines: string[] = [];
  for (const paragraph of toAscii(text).split("\n")) {
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
  spaceBefore: number;
}

export class Doc {
  readonly lines: Line[] = [];

  add(text: string, weight: Weight = "regular", spaceBefore = 0, size = BODY_SIZE) {
    for (const line of wrap(text, Math.floor((PAGE_WIDTH - MARGIN * 2) / (size * 0.6)))) {
      this.lines.push({ text: line, weight, size, spaceBefore });
      spaceBefore = 0;
    }
  }

  blank(points = LEADING * 0.5) {
    this.lines.push({ text: "", weight: "regular", size: BODY_SIZE, spaceBefore: points });
  }

  rule() {
    this.add("-".repeat(COLUMN), "regular", 2);
  }
}

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
      line = { ...line, spaceBefore: 0 };
    }
    page.push(line);
    used += height;
  }
  if (page.length) pages.push(page);
  return pages.length ? pages : [[]];
}

function bar(accuracy: number, width = 20): string {
  const filled = Math.round((Math.max(0, Math.min(100, accuracy)) / 100) * width);
  return `[${"#".repeat(filled)}${".".repeat(width - filled)}]`;
}

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

export function resultPdfBytes(result: CompletedResult): Uint8Array {
  const score = scoreResult(result);
  const report = paginate(resultReportLines(result, score).lines);
  const title = `${result.mode === "exam" ? "AIGP Practice Exam" : "AIGP Practice Session"} results`;
  const pdf = buildPdfWithCover(coverStream(result, score), report, title);
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return bytes;
}

export function resultPdfFilename(result: CompletedResult): string {
  const date = result.completedAt.slice(0, 10);
  return `aigp-${result.mode}-results-${date}.pdf`;
}
