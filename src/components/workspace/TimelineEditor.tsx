"use client";
import { useState } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import type { Answer, Question, TimelineEvent } from "@/lib/domain/types";
import { PTA_PRESETS } from "@/lib/store";
import { ChipQuestion } from "@/components/ChipQuestion";
import type { WorkspaceProps } from "./types";

export function TimelineEditor({ c, update, hpiQuestions }: WorkspaceProps & { hpiQuestions: Question[] }) {
  const [custom, setCustom] = useState("");
  const events = [...c.timeline].sort((a, b) => b.hoursPrior - a.hoursPrior);

  function addEvent(label: string, hoursPrior: number) {
    update((d) => {
      d.timeline.push({ id: crypto.randomUUID(), label, hoursPrior, answers: [] });
    });
  }

  function removeEvent(id: string) {
    update((d) => { d.timeline = d.timeline.filter((e) => e.id !== id); });
  }

  function setAnswer(eventId: string, a: Answer) {
    update((d) => {
      const ev = d.timeline.find((e) => e.id === eventId);
      if (!ev) return;
      const idx = ev.answers.findIndex((x) => x.questionId === a.questionId);
      if (idx >= 0) ev.answers[idx] = a; else ev.answers.push(a);
    });
  }

  function setNote(eventId: string, note: string) {
    update((d) => { const ev = d.timeline.find((e) => e.id === eventId); if (ev) ev.note = note; });
  }

  const used = new Set(c.timeline.map((e) => e.label));
  const available = PTA_PRESETS.filter((p) => !used.has(p.label));

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Add each time point of the illness from onset to admission. Tap chips for what changed at each step — the AI weaves them into a chronological HPI.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {available.map((p) => (
          <button key={p.label} className="chip" onClick={() => addEvent(p.label, p.hoursPrior)}>
            <Plus size={13} /> {p.label}
          </button>
        ))}
        <span className="flex items-center gap-1">
          <input className="input w-40 py-1" placeholder="Custom (e.g. 10 days PTA)" value={custom} onChange={(e) => setCustom(e.target.value)} />
          <button
            className="btn btn-ghost px-2 py-1"
            onClick={() => { if (custom.trim()) { addEvent(custom.trim(), guessHours(custom)); setCustom(""); } }}
          >Add</button>
        </span>
      </div>

      {events.length === 0 && <div className="card p-6 text-center text-[var(--muted)]">No time points yet — add “Onset” to start.</div>}

      <ol className="space-y-3">
        {events.map((ev) => (
          <li key={ev.id} className="card p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-[var(--accent)]"><Clock size={15} /> {ev.label}</span>
              <button onClick={() => removeEvent(ev.id)} className="text-[var(--muted)] hover:text-[var(--danger)]"><Trash2 size={15} /></button>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {hpiQuestions.map((q) => (
                <ChipQuestion
                  key={q.id}
                  question={q}
                  answer={ev.answers.find((a) => a.questionId === q.id)}
                  onChange={(a) => setAnswer(ev.id, a)}
                />
              ))}
            </div>
            <textarea
              className="input mt-3 text-sm"
              placeholder="Free-text key note for this interval (anything chips don't capture)…"
              value={ev.note ?? ""}
              onChange={(e) => setNote(ev.id, e.target.value)}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

// Rough mapping of a free-text anchor to hours-prior for sorting.
function guessHours(label: string): number {
  const m = label.match(/(\d+)\s*(hour|day|week|month)/i);
  if (!m) return 100;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult = unit.startsWith("hour") ? 1 : unit.startsWith("day") ? 24 : unit.startsWith("week") ? 168 : 720;
  return n * mult;
}
