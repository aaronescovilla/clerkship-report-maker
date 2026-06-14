"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, CheckCircle2 } from "lucide-react";
import { PEDIATRIC_COMPLAINTS } from "@/lib/domain/complaints";
import { createCase } from "@/lib/store";

export default function NewCase() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = PEDIATRIC_COMPLAINTS.filter(
    (c) => c.label.toLowerCase().includes(q.toLowerCase()) || c.aka?.some((a) => a.includes(q.toLowerCase()))
  );

  function start(id: string, label: string) {
    setBusy(true);
    const c = createCase(id, label);
    router.push(`/cases/${c.id}`);
  }

  function startCustom() {
    const label = q.trim();
    if (!label) return;
    const id = "custom-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    start(id, label);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Select chief complaint</h1>
      <p className="text-sm text-[var(--muted)]">A symptom, in the caregiver&apos;s words — not a diagnosis.</p>

      <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
        <Search size={16} className="text-[var(--muted)]" />
        <input
          className="input border-0 px-1 focus:outline-none"
          placeholder="Search e.g. cough, lagnat, pagtatae…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {filtered.map((c) => (
          <button key={c.id} disabled={busy} onClick={() => start(c.id, c.label)} className="card flex flex-col items-start gap-1 p-3 text-left hover:border-[var(--accent)]">
            <span className="font-semibold text-sm">{c.label}</span>
            {c.curated && <span className="inline-flex items-center gap-1 text-xs text-[var(--accent)]"><CheckCircle2 size={12} /> curated</span>}
            {c.aka && <span className="text-xs text-[var(--muted)]">{c.aka.join(", ")}</span>}
          </button>
        ))}
      </div>

      {q.trim() && filtered.length === 0 && (
        <button onClick={startCustom} disabled={busy} className="btn btn-primary w-full">
          <Sparkles size={16} /> Generate a question set for “{q.trim()}”
        </button>
      )}
    </div>
  );
}
