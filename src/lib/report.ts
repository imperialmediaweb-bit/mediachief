import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { SITE } from "@/data/site";
import { newspaperNameFor } from "@/lib/newspaper-name";

/**
 * The link report a client gets once their article is published: the document
 * they forward to partners or put under "In the press". Two formats, because
 * one is for reading and the other for pasting into a spreadsheet.
 */

export interface ReportData {
  articleTitle: string;
  clientName?: string | null;
  publishedAt: Date | null;
  urls: string[];
}

/** Excel and Google Sheets both open this directly. */
export function buildCsv(data: ReportData): string {
  const rows: string[][] = [
    ["#", "Newspaper", "URL", "Published"],
    ...data.urls.map((url, i) => [
      String(i + 1),
      newspaperNameFor(url),
      url,
      data.publishedAt ? data.publishedAt.toISOString().slice(0, 10) : "",
    ]),
  ];

  return rows
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}

function csvCell(value: string): string {
  // Quote whenever the value could break the row, and double any inner quote.
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function buildPdf(data: ReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Publication report — ${data.articleTitle}`);
  doc.setProducer(SITE.name);
  doc.setCreator(SITE.name);

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(0.04, 0.09, 0.22);
  const red = rgb(0.76, 0.07, 0.12);
  const grey = rgb(0.42, 0.45, 0.5);
  const line = rgb(0.88, 0.9, 0.92);

  const A4: [number, number] = [595.28, 841.89];
  const margin = 48;
  const bottom = 64;

  let page = doc.addPage(A4);
  let y = A4[1] - margin;

  const text = (
    s: string,
    opts: { size?: number; font?: typeof regular; color?: typeof navy; x?: number }
  ) => {
    page.drawText(s, {
      x: opts.x ?? margin,
      y,
      size: opts.size ?? 10,
      font: opts.font ?? regular,
      color: opts.color ?? navy,
    });
  };

  const newPage = () => {
    page = doc.addPage(A4);
    y = A4[1] - margin;
  };

  // ---- header
  text(SITE.name.toUpperCase(), { size: 9, font: bold, color: red });
  y -= 24;
  text("Publication report", { size: 20, font: bold });
  y -= 22;
  text(clip(data.articleTitle, 70), { size: 12, font: bold, color: grey });
  y -= 18;

  const meta = [
    data.clientName ? `Prepared for ${data.clientName}` : null,
    data.publishedAt ? `Published ${data.publishedAt.toISOString().slice(0, 10)}` : null,
    `${data.urls.length} publication${data.urls.length === 1 ? "" : "s"}`,
  ]
    .filter(Boolean)
    .join("   ·   ");
  text(meta, { size: 9, color: grey });
  y -= 20;

  page.drawLine({
    start: { x: margin, y },
    end: { x: A4[0] - margin, y },
    thickness: 1,
    color: line,
  });
  y -= 22;

  // ---- table
  text("#", { size: 8, font: bold, color: grey });
  text("NEWSPAPER", { size: 8, font: bold, color: grey, x: margin + 24 });
  text("ADDRESS", { size: 8, font: bold, color: grey, x: margin + 170 });
  y -= 14;

  data.urls.forEach((url, i) => {
    if (y < bottom + 30) {
      newPage();
      y -= 10;
    }
    text(String(i + 1), { size: 9, color: grey });
    text(clip(newspaperNameFor(url), 22), { size: 9, font: bold, x: margin + 24 });
    text(clip(url, 62), { size: 8, color: grey, x: margin + 170 });
    y -= 8;
    page.drawLine({
      start: { x: margin, y },
      end: { x: A4[0] - margin, y },
      thickness: 0.5,
      color: line,
    });
    y -= 12;
  });

  // ---- footer on every page
  const note = [
    "Every address above is permanent. We publish the article and provide these links.",
    "We make no promise of traffic, search rankings or customers.",
  ];
  doc.getPages().forEach((p, idx, all) => {
    note.forEach((lineText, i) => {
      p.drawText(clip(lineText, 120), {
        x: margin,
        y: 48 - i * 9,
        size: 7,
        font: regular,
        color: grey,
      });
    });
    p.drawText(`${SITE.domain}   -   page ${idx + 1} of ${all.length}`, {
      x: margin,
      y: 24,
      size: 7,
      font: regular,
      color: grey,
    });
  });

  return doc.save();
}

/** pdf-lib's standard fonts cannot draw characters outside WinAnsi. */
function clip(s: string, max: number): string {
  const safe = s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
  return safe.length > max ? safe.slice(0, max - 1) + "…".replace("…", "...") : safe;
}
