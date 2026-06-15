"use client";
import { useState } from "react";
import { Plus, Trash2, Clock, ChevronDown, Pencil, Check, CopyPlus } from "lucide-react";
import type { Answer, Question, TimelineEvent } from "@/lib/domain/types";
import { PTA_PRESETS } from "@/lib/store";
import { ChipQuestion } from "@/components/ChipQuestion";
import type { WorkspaceProps } from "./types";

export function TimelineEditor({ c, update, hpiQuestions }: WorkspaceProps & { hpiQuestions: Question[] }) {
  const [custom, setCustom] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const events = [...c.timeline].sort((a, b) => b.hoursPrior - a.hoursPrior);

  function addEvent(label: string, hoursPrior: number) {
    const id = crypto.randomUUID();
    update((d) => { d.timeline.push({ id, label, hoursPrior, answers: [] }); });
    setOpenId(id); // newly added interval opens for entry
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

  function setLabel(eventId: string, label: string) {
    update((d) => {
      const ev = d.timeline.find((e) => e.id === eventId);
      if (!ev) return;
      ev.label = label;
      const hrs = reguessHours(label);
      if (hrs != null) ev.hoursPrior = hrs;
    });
  }

  // Copy the previous (earlier) interval's answers as a starting point, so unchanged
  // findings don't have to be re-tapped at every time point.
  function carryForward(eventId: string) {
    update((d) => {
      const sorted = [...d.timeline].sort((a, b) => b.hoursPrior - a.hoursPrior);
      const idx = sorted.findIndex((e) => e.id === eventId);
      const prev = sorted[idx - 1];
      const ev = d.timeline.find((e) => e.id === eventId);
      if (!prev || !ev) return;
      ev.answers = structuredClone(prev.answers);
      if (!ev.note?.trim() && prev.note?.trim()) ev.note = prev.note;
    });
  }

  const used = new Set(c.timeline.map((e) => e.label));
  const available = PTA_PRESETS.filter((p) => !used.has(p.label));

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Build a timeline from when the child first got sick up to admission, then tap a time point to
        record what changed. Use <span className="font-medium">Same as previous</span>{" "}to copy findings
        forward so you don&apos;t re-tap them. The app turns this into a chronological history of the illness.
        <span className="mt-1 block text-xs">Tip: &ldquo;before admission&rdquo; is what clerks write as <span className="font-medium">PTA</span> (prior to admission).</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {available.map((p) => (
          <button key={p.label} className="chip" onClick={() => addEvent(p.label, p.hoursPrior)}>
            <Plus size={13} /> {p.label}
          </button>
        ))}
        <span className="flex items-center gap-1">
          <input className="input w-40 py-1" placeholder="Custom (e.g. 10 days before)" value={custom} onChange={(e) => setCustom(e.target.value)} />
          <button
            className="btn btn-ghost px-2 py-1"
            onClick={() => { if (custom.trim()) { addEvent(custom.trim(), guessHours(custom)); setCustom(""); } }}
          >Add</button>
        </span>
      </div>

      {events.length === 0 && <div className="card p-6 text-center text-[var(--muted)]">No time points yet — add “Onset” to start.</div>}

      <ol className="space-y-2">
        {events.map((ev, i) => {
          const open = openId === ev.id;
          const count = countFindings(ev, hpiQuestions);
          return (
            <li key={ev.id} className="card overflow-hidden">
              {/* Header row — tap to expand/collapse */}
              <div className="flex items-center gap-2 px-3 py-2.5">
                {editId === ev.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Clock size={15} className="shrink-0 text-[var(--accent)]" />
                    <input
                      autoFocus
                      className="input py-1 text-sm font-semibold"
                      value={ev.label}
                      onChange={(e) => setLabel(ev.id, e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") setEditId(null); }}
                    />
                    <button className="text-[var(--accent)]" onClick={() => setEditId(null)} title="Done"><Check size={16} /></button>
                  </div>
                ) : (
                  <button className="flex flex-1 items-center gap-2 text-left" onClick={() => setOpenId(open ? null : ev.id)}>
                    <Clock size={15} className="shrink-0 text-[var(--accent)]" />
                    <span className="font-semibold text-[var(--accent)]">{ev.label}</span>
                    {count > 0 && <span className="rounded-full bg-[var(--accent-soft)] px-1.5 text-xs font-medium text-[var(--accent)]">{count}</span>}
                  </button>
                )}
                <button onClick={() => setEditId(editId === ev.id ? null : ev.id)} className="text-[var(--muted)] hover:text-[var(--accent)]" title="Rename"><Pencil size={14} /></button>
                <button onClick={() => removeEvent(ev.id)} className="text-[var(--muted)] hover:text-[var(--danger)]" title="Delete"><Trash2 size={15} /></button>
                <button onClick={() => setOpenId(open ? null : ev.id)} className="text-[var(--muted)]" title={open ? "Collapse" : "Expand"}>
                  <ChevronDown size={17} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
                </button>
              </div>

              {/* Collapsed summary */}
              {!open && (
                <button className="w-full border-t border-[var(--border)] px-3 py-2 text-left text-xs text-[var(--muted)]" onClick={() => setOpenId(ev.id)}>
                  {summarize(ev, hpiQuestions)}
                </button>
              )}

              {/* Expanded editor */}
              {open && (
                <div className="border-t border-[var(--border)] px-4 pb-3">
                  {i > 0 && (
                    <button className="btn btn-ghost mt-3 px-2 py-1 text-xs" onClick={() => carryForward(ev.id)}>
                      <CopyPlus size={13} /> Same as {events[i - 1].label}
                    </button>
                  )}
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
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Count of questions answered with at least one positive (non-negative) value. */
function countFindings(ev: TimelineEvent, qs: Question[]): number {
  let n = 0;
  for (const q of qs) {
    const a = ev.answers.find((x) => x.questionId === q.id);
    if (!a) continue;
    if (q.kind === "slider") { if (a.value != null) n++; continue; }
    if ((a.selected ?? []).some((id) => !q.options?.find((o) => o.id === id)?.negative)) n++;
  }
  return n;
}

/** One-line summary of positive findings for a collapsed interval. */
function summarize(ev: TimelineEvent, qs: Question[]): string {
  const bits: string[] = [];
  for (const q of qs) {
    const a = ev.answers.find((x) => x.questionId === q.id);
    if (!a || q.kind === "slider") continue;
    for (const id of a.selected ?? []) {
      const o = q.options?.find((x) => x.id === id);
      if (!o || o.negative || id === "na") continue;
      const drug = q.dosing ? a.drugs?.[id] : undefined;
      bits.push(drug?.dose ? `${o.label} ${drug.dose}` : o.label);
    }
  }
  if (ev.note?.trim()) bits.push("✎ note");
  const text = bits.join(" · ");
  return text.length ? (text.length > 90 ? text.slice(0, 88) + "…" : text) : "Tap to record findings…";
}

// Rough mapping of a free-text anchor to hours-prior for sorting (default if unparsed).
function guessHours(label: string): number {
  return reguessHours(label) ?? 100;
}

/** Like guessHours but returns null when the label has no parseable duration. */
function reguessHours(label: string): number | null {
  const m = label.match(/(\d+)\s*(hour|day|week|month)/i);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult = unit.startsWith("hour") ? 1 : unit.startsWith("day") ? 24 : unit.startsWith("week") ? 168 : 720;
  return n * mult;
}
