/**
 * Assembles pages, resources, metadata and the cross-reference table into PDF
 * bytes.
 *
 * The cross-reference table records the byte offset of every object, and a
 * reader that cannot follow those offsets shows a blank document rather than
 * an error — so the one invariant this file exists to hold is that offsets
 * stay true. Everything written is folded to single-byte ASCII upstream, which
 * keeps string length equal to byte length and makes the offsets computable
 * from the string being built.
 */

import { BASE_FONTS, type Canvas, FONT_KEYS, escapePdf, serialize } from "./canvas";

export interface DocumentMeta {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  /** Generation time. Injectable so a test can assert a fixed value. */
  createdAt: Date;
}

/** PDF's own date syntax: `D:YYYYMMDDHHmmSSZ`. */
function pdfDate(d: Date): string {
  const p = (v: number, w = 2) => String(v).padStart(w, "0");
  return (
    `D:${p(d.getUTCFullYear(), 4)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

export function buildDocument(canvases: Canvas[], meta: DocumentMeta): string {
  const pages = canvases.length ? canvases : [];
  const objects: string[] = [];

  /*
    Object numbering, fixed up front because the page tree has to name its
    children before they are written:
      1  catalog
      2  page tree
      3–5 the three base fonts
      6 + 2i   page i
      7 + 2i   page i's content stream
      last     the info dictionary
  */
  const firstPageId = 6;
  const pageIds = pages.map((_, i) => firstPageId + i * 2);

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] ` +
      `/Count ${pages.length} >>`,
  );
  for (const font of ["sans", "sansBold", "sansItalic"] as const) {
    objects.push(
      `<< /Type /Font /Subtype /Type1 /BaseFont /${BASE_FONTS[font]} ` +
        "/Encoding /WinAnsiEncoding >>",
    );
  }

  for (const canvas of pages) {
    const { stream, alphas } = serialize(canvas);
    const contentId = objects.length + 2;

    const fontRes = (["sans", "sansBold", "sansItalic"] as const)
      .map((f, i) => `/${FONT_KEYS[f]} ${3 + i} 0 R`)
      .join(" ");
    // Alpha is not a graphics-state operator; it is a named resource. Only the
    // values the page actually used are declared.
    const gsRes = alphas.length
      ? " /ExtGState << " +
        alphas
          .map((a, i) => `/GS${i} << /Type /ExtGState /ca ${a} /CA ${a} >>`)
          .join(" ") +
        " >>"
      : "";

    objects.push(
      `<< /Type /Page /Parent 2 0 R ` +
        `/MediaBox [0 0 ${canvas.width.toFixed(2)} ${canvas.height.toFixed(2)}] ` +
        `/Resources << /Font << ${fontRes} >>${gsRes} >> ` +
        `/Contents ${contentId} 0 R >>`,
    );
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }

  const infoId = objects.length + 1;
  const date = pdfDate(meta.createdAt);
  objects.push(
    "<< " +
      `/Title (${escapePdf(meta.title)}) ` +
      `/Author (${escapePdf(meta.author)}) ` +
      `/Subject (${escapePdf(meta.subject)}) ` +
      `/Keywords (${escapePdf(meta.keywords)}) ` +
      `/Creator (${escapePdf(meta.creator)}) ` +
      `/Producer (${escapePdf(meta.creator)}) ` +
      `/CreationDate (${date}) /ModDate (${date}) >>`,
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

/** The assembled document as bytes. ASCII in, one byte out per character. */
export function documentBytes(canvases: Canvas[], meta: DocumentMeta): Uint8Array {
  const pdf = buildDocument(canvases, meta);
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return bytes;
}
