"use client";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

// Convert the report Markdown into a .docx and trigger a download.
function inlineRuns(text: string): TextRun[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((p) =>
    /^\*\*[^*]+\*\*$/.test(p) ? new TextRun({ text: p.slice(2, -2), bold: true }) : new TextRun(p)
  );
}

export async function downloadDocx(markdown: string, filename: string) {
  const paras: Paragraph[] = [];
  for (const raw of markdown.replace(/\r/g, "").split("\n")) {
    const h = raw.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const txt = h[2].replace(/\*\*/g, "");
      const level = h[1].length === 1 ? HeadingLevel.TITLE : h[1].length === 2 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2;
      paras.push(new Paragraph({ heading: level, children: [new TextRun({ text: txt, bold: true })] }));
      continue;
    }
    if (/^\s*[-*]\s+/.test(raw)) {
      paras.push(new Paragraph({ bullet: { level: 0 }, children: inlineRuns(raw.replace(/^\s*[-*]\s+/, "")) }));
      continue;
    }
    paras.push(new Paragraph({ children: inlineRuns(raw) }));
  }

  const doc = new Document({ sections: [{ children: paras }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".docx") ? filename : `${filename}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
