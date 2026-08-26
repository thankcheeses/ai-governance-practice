import {
  type CompletedResult,
  type FlorkKind,
  type SittingScore,
  practiceVerdict,
} from "./results";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

function toAscii(text: string): string {
  return text.replace(/[^\x20-\x7E]/g, "?");
}

function escapePdf(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export interface ReportLine {
  text: string;
  weight: "regular" | "bold";
  size: number;
  spaceBefore: number;
}

function rg(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(((n >> 16) & 255) / 255).toFixed(3)} ${(((n >> 8) & 255) / 255).toFixed(3)} ${((n & 255) / 255).toFixed(3)} rg`;
}
function RG(hex: string): string {
  return rg(hex).replace(/rg$/, "RG");
}

function barFill(pct: number): string {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  if (p >= 100) return "#16A34A";
  if (p >= 90) return "#86EFAC";
  if (p >= 80) return "#EAB308";
  if (p >= 70) return "#FB923C";
  if (p >= 60) return "#C2410C";
  if (p >= 50) return "#DC2626";
  if (p >= 40) return "#DB2777";
  if (p >= 30) return "#6B21A8";
  if (p >= 20) return "#1D4ED8";
  if (p >= 10) return "#7DD3FC";
  return "#CBD5E1";
}

function letterColor(letter: string): string {
  if (letter === "A") return "#16A34A";
  if (letter === "B") return "#1D4ED8";
  if (letter === "C") return "#C2410C";
  if (letter === "D") return "#7C3AED";
  return "#B91C1C";
}

function capsule(x: number, y: number, w: number, h: number, pct: number): string[] {
  const r = h / 2;
  const fillW = Math.max(h, (w * Math.max(0, Math.min(100, pct))) / 100);
  const color = barFill(pct);
  const path = (width: number) => {
    const right = x + width;
    return [
      `${(x + r).toFixed(2)} ${y.toFixed(2)} m`,
      `${(right - r).toFixed(2)} ${y.toFixed(2)} l`,
      `${right.toFixed(2)} ${y.toFixed(2)} ${right.toFixed(2)} ${(y + h).toFixed(2)} ${(right - r).toFixed(2)} ${(y + h).toFixed(2)} c`,
      `${(x + r).toFixed(2)} ${(y + h).toFixed(2)} l`,
      `${x.toFixed(2)} ${(y + h).toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} ${(x + r).toFixed(2)} ${y.toFixed(2)} c`,
      "h",
    ];
  };
  const out: string[] = [];
  out.push("q", "0.902 0.910 0.922 rg", ...path(w), "f", "Q");
  out.push("q", rg(color), ...path(fillW), "W n");
  out.push("0.95 0.95 0.95 RG", "0.6 w");
  for (let s = -h; s < fillW + h; s += 6) {
    out.push(`${(x + s).toFixed(2)} ${y.toFixed(2)} m ${(x + s + h).toFixed(2)} ${(y + h).toFixed(2)} l S`);
  }
  out.push(rg(color), ...path(fillW), "f", "Q");
  out.push("0.70 0.72 0.75 RG", "0.8 w", ...path(w), "S");
  return out;
}

function textAt(font: "F3" | "F4", size: number, x: number, y: number, text: string, fill = "0 0 0 rg"): string[] {
  return ["BT", fill, `/${font} ${size} Tf`, `1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`, `(${escapePdf(toAscii(text))}) Tj`, "ET"];
}

function circleApprox(cx: number, cy: number, rx: number, ry: number): string[] {
  const k = 0.5522847498;
  return [
    `${(cx - rx).toFixed(2)} ${cy.toFixed(2)} m`,
    `${(cx - rx).toFixed(2)} ${(cy + k * ry).toFixed(2)} ${(cx - k * rx).toFixed(2)} ${(cy + ry).toFixed(2)} ${cx.toFixed(2)} ${(cy + ry).toFixed(2)} c`,
    `${(cx + k * rx).toFixed(2)} ${(cy + ry).toFixed(2)} ${(cx + rx).toFixed(2)} ${(cy + k * ry).toFixed(2)} ${(cx + rx).toFixed(2)} ${cy.toFixed(2)} c`,
    `${(cx + rx).toFixed(2)} ${(cy - k * ry).toFixed(2)} ${(cx + k * rx).toFixed(2)} ${(cy - ry).toFixed(2)} ${cx.toFixed(2)} ${(cy - ry).toFixed(2)} c`,
    `${(cx - k * rx).toFixed(2)} ${(cy - ry).toFixed(2)} ${(cx - rx).toFixed(2)} ${(cy - k * ry).toFixed(2)} ${(cx - rx).toFixed(2)} ${cy.toFixed(2)} c`,
    "h",
  ];
}

function florkPaths(kind: FlorkKind, ox: number, oy: number): string[] {
  const o: string[] = ["q", "0 0 0 RG", "0 0 0 rg", "2.6 w", "1 j", "1 J"];
  o.push(...circleApprox(ox + 72, oy + 62, 38, 48), "S");
  const eye = (x: number, y: number) => o.push(...circleApprox(x, y, 2.4, 2.4), "f");
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    o.push(`${x1.toFixed(1)} ${y1.toFixed(1)} m ${x2.toFixed(1)} ${y2.toFixed(1)} l S`);

  if (kind === "slay") {
    eye(ox + 60, oy + 80); eye(ox + 84, oy + 80);
    o.push(`${(ox + 62).toFixed(1)} ${(oy + 58).toFixed(1)} m ${(ox + 70).toFixed(1)} ${(oy + 52).toFixed(1)} ${(ox + 80).toFixed(1)} ${(oy + 52).toFixed(1)} ${(ox + 86).toFixed(1)} ${(oy + 58).toFixed(1)} c S`);
    line(ox + 110, oy + 70, ox + 96, oy + 48);
    o.push(...circleApprox(ox + 94, oy + 44, 7, 6), "S");
    line(ox + 34, oy + 55, ox + 18, oy + 30);
    line(ox + 55, oy + 18, ox + 48, oy + 2);
    line(ox + 88, oy + 18, ox + 102, oy + 2);
    o.push(...textAt("F4", 13, ox + 28, oy + 128, "slaaaaaaay"));
  } else if (kind === "study") {
    eye(ox + 60, oy + 78); eye(ox + 84, oy + 78);
    o.push(`${(ox + 62).toFixed(1)} ${(oy + 58).toFixed(1)} m ${(ox + 70).toFixed(1)} ${(oy + 54).toFixed(1)} ${(ox + 78).toFixed(1)} ${(oy + 54).toFixed(1)} ${(ox + 84).toFixed(1)} ${(oy + 58).toFixed(1)} c S`);
    line(ox + 96, oy + 78, ox + 108, oy + 118);
    o.push(`${(ox + 100).toFixed(1)} ${(oy + 118).toFixed(1)} m ${(ox + 118).toFixed(1)} ${(oy + 132).toFixed(1)} l ${(ox + 126).toFixed(1)} ${(oy + 124).toFixed(1)} l ${(ox + 108).toFixed(1)} ${(oy + 110).toFixed(1)} l h S`);
    line(ox + 34, oy + 58, ox + 16, oy + 40);
    line(ox + 55, oy + 16, ox + 48, oy + 2);
    line(ox + 88, oy + 16, ox + 96, oy + 2);
    o.push(...textAt("F4", 12, ox + 8, oy + 132, "GO STUDY!"));
  } else if (kind === "shrug") {
    eye(ox + 60, oy + 78); eye(ox + 84, oy + 78);
    o.push(`${(ox + 64).toFixed(1)} ${(oy + 56).toFixed(1)} m ${(ox + 80).toFixed(1)} ${(oy + 56).toFixed(1)} l S`);
    line(ox + 38, oy + 70, ox + 8, oy + 88);
    line(ox + 106, oy + 70, ox + 136, oy + 88);
    line(ox + 55, oy + 16, ox + 48, oy + 2);
    line(ox + 88, oy + 16, ox + 96, oy + 2);
    o.push(...textAt("F4", 16, ox + 52, oy + 128, "???"));
  } else if (kind === "hips") {
    line(ox + 52, oy + 88, ox + 66, oy + 82);
    line(ox + 92, oy + 88, ox + 78, oy + 82);
    eye(ox + 60, oy + 76); eye(ox + 84, oy + 76);
    o.push(`${(ox + 64).toFixed(1)} ${(oy + 54).toFixed(1)} m ${(ox + 70).toFixed(1)} ${(oy + 50).toFixed(1)} ${(ox + 76).toFixed(1)} ${(oy + 50).toFixed(1)} ${(ox + 80).toFixed(1)} ${(oy + 54).toFixed(1)} c S`);
    line(ox + 38, oy + 62, ox + 22, oy + 48); line(ox + 22, oy + 48, ox + 38, oy + 42);
    line(ox + 106, oy + 62, ox + 122, oy + 48); line(ox + 122, oy + 48, ox + 106, oy + 42);
    line(ox + 55, oy + 16, ox + 48, oy + 2); line(ox + 88, oy + 16, ox + 96, oy + 2);
  } else if (kind === "ok") {
    eye(ox + 60, oy + 78); eye(ox + 84, oy + 78);
    o.push(`${(ox + 62).toFixed(1)} ${(oy + 58).toFixed(1)} m ${(ox + 70).toFixed(1)} ${(oy + 54).toFixed(1)} ${(ox + 78).toFixed(1)} ${(oy + 54).toFixed(1)} ${(ox + 84).toFixed(1)} ${(oy + 58).toFixed(1)} c S`);
    line(ox + 106, oy + 70, ox + 128, oy + 88);
    o.push(...circleApprox(ox + 134, oy + 94, 6, 6), "S");
    line(ox + 34, oy + 58, ox + 16, oy + 36);
    line(ox + 55, oy + 16, ox + 48, oy + 2); line(ox + 88, oy + 16, ox + 96, oy + 2);
  } else if (kind === "math") {
    eye(ox + 58, oy + 78); eye(ox + 82, oy + 78);
    o.push(`${(ox + 60).toFixed(1)} ${(oy + 54).toFixed(1)} m ${(ox + 68).toFixed(1)} ${(oy + 48).toFixed(1)} ${(ox + 76).toFixed(1)} ${(oy + 48).toFixed(1)} ${(ox + 82).toFixed(1)} ${(oy + 54).toFixed(1)} c S`);
    line(ox + 48, oy + 92, ox + 32, oy + 108); line(ox + 96, oy + 92, ox + 112, oy + 108);
    o.push(...textAt("F3", 8, ox + 4, oy + 128, "f(x)"));
    line(ox + 55, oy + 16, ox + 48, oy + 2); line(ox + 88, oy + 16, ox + 96, oy + 2);
  } else if (kind === "guns") {
    eye(ox + 58, oy + 80); eye(ox + 86, oy + 80);
    o.push(`${(ox + 54).toFixed(1)} ${(oy + 58).toFixed(1)} m ${(ox + 64).toFixed(1)} ${(oy + 46).toFixed(1)} ${(ox + 80).toFixed(1)} ${(oy + 46).toFixed(1)} ${(ox + 90).toFixed(1)} ${(oy + 58).toFixed(1)} c S`);
    line(ox + 30, oy + 62, ox + 4, oy + 70); line(ox + 4, oy + 70, ox + 10, oy + 78);
    line(ox + 114, oy + 62, ox + 140, oy + 70); line(ox + 140, oy + 70, ox + 134, oy + 78);
    line(ox + 55, oy + 16, ox + 48, oy + 2); line(ox + 88, oy + 16, ox + 96, oy + 2);
  } else if (kind === "thumbs") {
    eye(ox + 60, oy + 78); eye(ox + 84, oy + 78);
    o.push(`${(ox + 62).toFixed(1)} ${(oy + 58).toFixed(1)} m ${(ox + 70).toFixed(1)} ${(oy + 52).toFixed(1)} ${(ox + 78).toFixed(1)} ${(oy + 52).toFixed(1)} ${(ox + 84).toFixed(1)} ${(oy + 58).toFixed(1)} c S`);
    line(ox + 34, oy + 68, ox + 16, oy + 86); line(ox + 16, oy + 86, ox + 16, oy + 98);
    line(ox + 110, oy + 68, ox + 128, oy + 86); line(ox + 128, oy + 86, ox + 128, oy + 98);
    line(ox + 55, oy + 16, ox + 48, oy + 2); line(ox + 88, oy + 16, ox + 96, oy + 2);
  } else {
    o.push(`${(ox + 56).toFixed(1)} ${(oy + 80).toFixed(1)} m ${(ox + 66).toFixed(1)} ${(oy + 80).toFixed(1)} l S`);
    o.push(`${(ox + 78).toFixed(1)} ${(oy + 80).toFixed(1)} m ${(ox + 88).toFixed(1)} ${(oy + 80).toFixed(1)} l S`);
    o.push(`${(ox + 62).toFixed(1)} ${(oy + 58).toFixed(1)} m ${(ox + 70).toFixed(1)} ${(oy + 54).toFixed(1)} ${(ox + 78).toFixed(1)} ${(oy + 54).toFixed(1)} ${(ox + 84).toFixed(1)} ${(oy + 58).toFixed(1)} c S`);
    line(ox + 100, oy + 78, ox + 108, oy + 118); line(ox + 108, oy + 118, ox + 108, oy + 132);
    line(ox + 34, oy + 58, ox + 16, oy + 36);
    line(ox + 55, oy + 16, ox + 48, oy + 2); line(ox + 88, oy + 16, ox + 96, oy + 2);
  }
  o.push("Q");
  return o;
}

export function coverStream(result: CompletedResult, score: SittingScore): string {
  const v = practiceVerdict(score, `${result.sittingId}|${result.completedAt}`);
  const parts: string[] = [];
  parts.push("q", rg("#0F172A"), "0 788 595.28 53.89 re f", "Q");
  parts.push(...textAt("F4", 13, 24, 808, "AI Governance Practice  -  Results Report", "1 1 1 rg"));
  parts.push("q", "/GS1 gs", "0.82 0.84 0.86 rg");
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 3; col++) {
      const x = 20 + col * 190;
      const y = 80 + row * 70;
      parts.push("BT", "/F3 8 Tf", `1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm`, "(practice only - not an official exam) Tj", "ET");
    }
  }
  parts.push("Q");
  parts.push("q", "0.12 0.14 0.18 RG", "1.8 w", "36 620 150 140 re S", "Q");
  parts.push(...textAt("F3", 8, 48, 740, "PRACTICE GRADE", "0.35 0.38 0.42 rg"));
  parts.push(...textAt("F4", 48, 78, 668, v.letter, rg(letterColor(v.letter))));
  parts.push("q", RG("#DC2626"), "2.2 w", ...circleApprox(108, 686, 38, 32), "S", "Q");
  parts.push(...textAt("F3", 10, 48, 636, `${score.percentage}%  -  ${score.correct}/${score.total}`, "0.25 0.27 0.30 rg"));
  parts.push(...florkPaths(v.flork, 360, 610));
  parts.push(...textAt("F3", 11, 36, 590, v.line, "0.15 0.16 0.18 rg"));
  parts.push(...textAt("F4", 13, 36, 558, "PROGRESS ON THIS SITTING", rg("#0F172A")));
  const coverage = score.total === 0 ? 0 : Math.round(((score.total - score.unanswered) / score.total) * 100);
  const rows = [
    { label: `Overall accuracy  -  ${score.correct} answered correctly / ${score.total} available`, pct: score.percentage },
    { label: `Coverage on this sitting  -  ${score.total - score.unanswered} answered / ${score.total}`, pct: coverage },
    ...score.byDomain.map((d) => ({ label: `Domain ${d.roman}  -  ${d.label}  -  ${d.correct}/${d.total}`, pct: d.accuracy })),
  ];
  let y = 520;
  for (const row of rows) {
    parts.push(...textAt("F3", 8, 36, y + 16, row.label, "0.30 0.32 0.35 rg"));
    parts.push(...capsule(36, y - 2, 340, 14, row.pct));
    const fillW = Math.max(14, (340 * Math.max(0, Math.min(100, row.pct))) / 100);
    parts.push(...textAt("F3", 8, 36 + fillW - 22, y + 2, `${row.pct}%`, "1 1 1 rg"));
    y -= 42;
  }
  parts.push("q", rg("#F8FAFC"), "0 0 595.28 56 re f", "Q");
  parts.push(...textAt("F3", 8, 24, 32, "Independent educational product. Not affiliated with or endorsed by the IAPP.", "0.40 0.42 0.45 rg"));
  parts.push(...textAt("F3", 8, 24, 18, "NOT A SOLE STUDY SOURCE. Practice scores do not predict certification results.", "0.40 0.42 0.45 rg"));
  return parts.join("\n");
}

function contentStreamLocal(page: ReportLine[]): string {
  const parts: string[] = ["BT"];
  let y = PAGE_HEIGHT - 54;
  let font: "regular" | "bold" | null = null;
  let size = 0;
  for (const line of page) {
    y -= 13.5 + line.spaceBefore;
    if (line.weight !== font || line.size !== size) {
      font = line.weight;
      size = line.size;
      parts.push(`/${font === "bold" ? "F2" : "F1"} ${size} Tf`);
    }
    parts.push(`1 0 0 1 54.00 ${y.toFixed(2)} Tm`);
    if (line.text) parts.push(`(${escapePdf(line.text)}) Tj`);
  }
  parts.push("ET");
  return parts.join("\n");
}

export function buildPdfWithCover(cover: string, reportPages: ReportLine[][], title: string): string {
  const objects: string[] = [];
  const pageCount = 1 + reportPages.length;
  const firstPageId = 8;
  const pageIds: number[] = [];
  for (let i = 0; i < pageCount; i++) pageIds.push(firstPageId + i * 2);
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  objects.push("<< /Type /ExtGState /CA 0.14 /ca 0.14 >>");
  const resources = "/Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> /ExtGState << /GS1 7 0 R >> >>";
  objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ${resources} /Contents 9 0 R >>`);
  objects.push(`<< /Length ${cover.length} >>\nstream\n${cover}\nendstream`);
  reportPages.forEach((page, i) => {
    const pageId = firstPageId + (i + 1) * 2;
    const contentId = pageId + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
    const stream = contentStreamLocal(page);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  const infoId = objects.length + 1;
  objects.push(`<< /Title (${escapePdf(toAscii(title))}) /Producer (AI Governance Practice) /Author (NHID-Clinical) /Keywords (NOT A SOLE STUDY SOURCE - AI GOVERNANCE PRACTICE) /Subject (Independent educational practice report. Not affiliated with IAPP.) >>`);
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}
