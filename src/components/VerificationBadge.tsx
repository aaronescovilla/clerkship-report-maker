"use client";
import { useState } from "react";
import { ChevronDown, ShieldCheck, ShieldAlert } from "lucide-react";
import type { VerificationResult } from "@/lib/domain/types";

export function VerificationBadge({ v }: { v: VerificationResult }) {
  const [open, setOpen] = useState(false);
  const color = v.passed ? "var(--ok)" : "var(--warn)";
  return (
    <div className="card no-print my-3 overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="flex items-center gap-2 font-semibold" style={{ color }}>
          {v.passed ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
          Quality check: {v.score}/100 {v.passed ? "· passed" : "· needs review"}
          {v.regenerated && <span className="text-xs font-normal text-[var(--muted)]">(regenerated)</span>}
        </span>
        <ChevronDown size={18} className={open ? "rotate-180 transition" : "transition"} />
      </button>
      {open && (
        <div className="border-t border-[var(--border)] px-4 py-3 text-sm">
          <p className="mb-2 text-xs text-[var(--muted)]">An AI examiner checked this draft against the clerkship rubric. Always read it yourself before submitting.</p>
          {v.summary && <p className="mb-2 text-[var(--muted)]">{v.summary}</p>}
          {v.structural.length > 0 && (
            <div className="mb-2">
              <p className="font-semibold text-[var(--warn)]">Structural issues</p>
              <ul className="ml-4 list-disc text-[var(--muted)]">
                {v.structural.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          <div className="space-y-1">
            {v.criteria.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3">
                <span>{c.label}</span>
                <span className="shrink-0 tabular-nums" style={{ color: c.score >= 0.75 ? "var(--ok)" : c.score >= 0.5 ? "var(--warn)" : "var(--danger)" }}>
                  {Math.round(c.score * 100)}%
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">Judge model: {v.model}</p>
        </div>
      )}
    </div>
  );
}
