"use client";
import {
  AlignmentType,
  BorderStyle,
  Document,
  LineRuleType,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

const FONT = "Arial";
const PT11 = 22; // half-points: 11pt × 2
const PT12 = 24;

// Spacing helpers (twips: 1/20 of a point, 1pt = 20 twips)
const sp = (before: number, after: number) => ({
  before: before * 20,
  after: after * 20,
  line: 240,
  lineRule: LineRuleType.AUTO,
});

function inlineRuns(text: string): TextRun[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map((p) => {
    if (/^\*\*[^*]+\*\*$/.test(p))
      return new TextRun({ text: p.slice(2, -2), bold: true, font: FONT, size: PT11 });
    if (/^\*[^*]+\*$/.test(p))
      return new TextRun({ text: p.slice(1, -1), italics: true, font: FONT, size: PT11 });
    return new TextRun({ text: p, font: FONT, size: PT11 });
  });
}

export async function downloadDocx(markdown: string, filename: string) {
  const paras: Paragraph[] = [];

  for (const raw of markdown.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();

    // Horizontal rule
    if (/^---+$/.test(line)) {
      paras.push(
        new Paragraph({
          children: [],
          spacing: sp(6, 6),
          border: { bottom: { style: BorderStyle.SINGLE, color: "000000", size: 6, space: 1 } },
        })
      );
      continue;
    }

    // Headings
    const h = raw.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const txt = h[2].replace(/\*\*/g, "").replace(/\*/g, "");
      if (level === 1) {
        // Document title: centered, bold, 12pt
        paras.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: sp(0, 14),
            children: [new TextRun({ text: txt, bold: true, font: FONT, size: PT12 })],
          })
        );
      } else if (level === 2) {
        // Major section (CLINICAL HISTORY etc.): centered, bold, 11pt
        paras.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: sp(14, 4),
            children: [new TextRun({ text: txt, bold: true, font: FONT, size: PT11 })],
          })
        );
      } else {
        // Subsection (I. General Data etc.): bold, left-aligned
        paras.push(
          new Paragraph({
            spacing: sp(8, 0),
            children: [new TextRun({ text: txt, bold: true, font: FONT, size: PT11 })],
          })
        );
      }
      continue;
    }

    // Bullet
    if (/^\s*[-*]\s+/.test(raw)) {
      paras.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: sp(0, 0),
          indent: { left: 360 },
          children: inlineRuns(raw.replace(/^\s*[-*]\s+/, "")),
        })
      );
      continue;
    }

    // Empty line — skip (spacing handled by paragraph spacing)
    if (line === "") continue;

    // Body paragraph — indented to align under roman-numeral headers
    paras.push(
      new Paragraph({
        spacing: sp(0, 4),
        indent: { left: 360 },
        children: inlineRuns(raw),
      })
    );
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: PT11 },
          paragraph: { spacing: { line: 240, lineRule: LineRuleType.AUTO } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            // ~1 inch top/bottom, ~1.25 inch left/right (standard Word margins)
            margin: { top: 1440, bottom: 1440, left: 1800, right: 1440 },
          },
        },
        children: paras,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".docx") ? filename : `${filename}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
