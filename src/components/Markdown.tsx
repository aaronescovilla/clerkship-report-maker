"use client";
import React from "react";

// Minimal, safe Markdown renderer (headings, bold, lists, paragraphs).
// Avoids a markdown dependency and never injects raw HTML.
function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={`${keyPrefix}-${i}`}>{p.slice(2, -2)}</strong>;
    return <React.Fragment key={`${keyPrefix}-${i}`}>{p}</React.Fragment>;
  });
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r/g, "").split("\n");
  const out: React.ReactNode[] = [];
  let list: React.ReactNode[] = [];
  const flush = () => {
    if (list.length) { out.push(<ul key={`ul-${out.length}`}>{list}</ul>); list = []; }
  };

  lines.forEach((line, i) => {
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) { flush(); const lvl = h[1].length; const txt = h[2].replace(/\*\*/g, "");
      out.push(lvl === 1 ? <h1 key={i}>{txt}</h1> : lvl === 2 ? <h2 key={i}>{txt}</h2> : <h3 key={i}>{txt}</h3>);
      return;
    }
    if (/^\s*[-*]\s+/.test(line)) { list.push(<li key={i}>{inline(line.replace(/^\s*[-*]\s+/, ""), `li${i}`)}</li>); return; }
    flush();
    if (line.trim() === "") return;
    out.push(<p key={i}>{inline(line, `p${i}`)}</p>);
  });
  flush();
  return <div className="report-body">{out}</div>;
}
