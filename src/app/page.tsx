"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FilePlus2, Trash2, FileText } from "lucide-react";
import { listCases, deleteCase } from "@/lib/store";
import type { CaseRecord } from "@/lib/domain/types";

export default function Home() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  useEffect(() => setCases(listCases()), []);

  function remove(id: string) {
    if (!confirm("Delete this case? This cannot be undone.")) return;
    deleteCase(id);
    setCases(listCases());
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Your cases</h1>
        <Link href="/cases/new" className="btn btn-primary"><FilePlus2 size={16} /> New case</Link>
      </div>

      {cases.length === 0 ? (
        <div className="card p-8 text-center text-[var(--muted)]">
          <FileText className="mx-auto mb-2 opacity-60" />
          <p>No cases yet. Start one to take a chip-based pediatric history.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {cases.map((c) => (
            <li key={c.id} className="card flex items-center justify-between p-4">
              <Link href={`/cases/${c.id}`} className="flex-1">
                <p className="font-semibold">{c.header.initials || "Unnamed"} · {c.complaintLabel}</p>
                <p className="text-xs text-[var(--muted)]">
                  {c.report ? "Report drafted" : c.narrative ? "Narrative drafted" : "In progress"} · updated {new Date(c.updatedAt).toLocaleString()}
                </p>
              </Link>
              <button onClick={() => remove(c.id)} className="text-[var(--muted)] hover:text-[var(--danger)]" title="Delete">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
