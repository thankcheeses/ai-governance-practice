#!/usr/bin/env node
/**
 * Smoke test for the PDF inspection toolchain.
 *
 * Checks that each capability resolves AND produces output, because a tool that
 * exists and fails is the same problem as one that is missing. Everything runs
 * against a PDF this script generates, so it needs no fixture and cannot pass
 * because of something left behind by an earlier run.
 *
 * Not part of `release:gate`: this describes the container, not the product, and
 * a contributor without poppler installed should still be able to ship a code
 * change. Run it before trusting anything extracted from a source document.
 *
 *   npm run check:pdf-tooling
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "pdf-tooling-"));
const pdf = join(dir, "probe.pdf");

/* A minimal one-page PDF with known text, written by hand so the expected
   output is known exactly rather than assumed. */
const MARKER = "BlueprintProbe42";
const body = `BT /F1 24 Tf 72 700 Td (${MARKER}) Tj ET`;
const objs = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
  `<< /Length ${body.length} >>\nstream\n${body}\nendstream`,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
];
let out = "%PDF-1.4\n";
const offsets = [0];
objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
const xref = out.length;
out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
for (let i = 1; i <= objs.length; i++) out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
writeFileSync(pdf, out, "latin1");

const results = [];
function probe(name, fn) {
  try { results.push({ name, ok: true, detail: fn() }); }
  catch (e) { results.push({ name, ok: false, detail: String(e.message ?? e).split("\n")[0] }); }
}

probe("pdftotext (text extraction)", () => {
  const t = execFileSync("pdftotext", ["-layout", pdf, "-"], { encoding: "utf8" });
  if (!t.includes(MARKER)) throw new Error(`ran but did not return the known marker`);
  return "extracted the known marker";
});

probe("pdftoppm (page rendering)", () => {
  execFileSync("pdftoppm", ["-png", "-r", "72", pdf, join(dir, "page")]);
  const pngs = readdirSync(dir).filter((f) => f.endsWith(".png"));
  if (!pngs.length) throw new Error("ran but produced no image");
  return `rendered ${pngs.length} page image`;
});

probe("pdfimages (embedded images)", () => {
  execFileSync("pdfimages", ["-list", pdf], { encoding: "utf8" });
  return "listed embedded images (none expected in the probe)";
});

probe("pymupdf (structured access)", () => {
  const t = execFileSync("python3", ["-c",
    `import pymupdf;d=pymupdf.open(${JSON.stringify(pdf)});print(d[0].get_text().strip())`],
    { encoding: "utf8" });
  if (!t.includes(MARKER)) throw new Error("ran but did not return the known marker");
  return "read page text";
});

probe("pillow (image metadata)", () => {
  const pngs = readdirSync(dir).filter((f) => f.endsWith(".png"));
  if (!pngs.length) throw new Error("no rendered page to measure");
  return execFileSync("python3", ["-c",
    `from PIL import Image;im=Image.open(${JSON.stringify(join(dir, pngs[0]))});print(f"{im.width}x{im.height} {im.format}")`],
    { encoding: "utf8" }).trim();
});

probe("tesseract (OCR fallback)", () => {
  const pngs = readdirSync(dir).filter((f) => f.endsWith(".png"));
  if (!pngs.length) throw new Error("no rendered page to OCR");
  const t = execFileSync("tesseract", [join(dir, pngs[0]), "-", "--psm", "6"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  // OCR is allowed to be imperfect; it must simply return something.
  if (!t.trim()) throw new Error("ran but returned nothing");
  return `read ${t.trim().split(/\s+/).length} token(s)`;
});

console.log("PDF inspection toolchain\n");
for (const r of results) {
  console.log(`  ${r.ok ? "ok  " : "MISSING"}  ${r.name.padEnd(32)} ${r.detail}`);
}
const missing = results.filter((r) => !r.ok);
console.log();
if (missing.length) {
  console.error(`${missing.length} capability/capabilities unavailable. See docs/pdf-tooling.md.`);
  console.error("Install with: apt-get update && apt-get install -y poppler-utils tesseract-ocr && pip install pymupdf pillow");
  process.exit(1);
}
console.log("All capabilities present and producing output.");
console.log("Reminder: render and read a page before trusting extracted text (docs/pdf-tooling.md).");
