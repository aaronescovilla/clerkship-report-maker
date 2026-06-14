"use client";
import { useState } from "react";
import { Plus, StickyNote } from "lucide-react";
import type { Answer, Question } from "@/lib/domain/types";

export function ChipQuestion({
  question,
  answer,
  onChange,
}: {
  question: Question;
  answer?: Answer;
  onChange: (a: Answer) => void;
}) {
  const [showNote, setShowNote] = useState(!!answer?.note);
  const selected = answer?.selected ?? [];

  function update(patch: Partial<Answer>) {
    onChange({ questionId: question.id, selected, ...answer, ...patch });
  }

  function toggle(optId: string) {
    const isExclusive = optId === "none";
    if (question.kind === "single") {
      update({ selected: selected.includes(optId) ? [] : [optId] });
      return;
    }
    let next: string[];
    if (selected.includes(optId)) next = selected.filter((s) => s !== optId);
    else if (isExclusive) next = [optId];
    else next = [...selected.filter((s) => s !== "none"), optId];
    update({ selected: next });
  }

  return (
    <div className="py-3 border-b border-[var(--border)] last:border-0">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[0.95rem]">{question.prompt}</p>
          {question.hint && <p className="text-xs text-[var(--muted)]">{question.hint}</p>}
        </div>
        <button type="button" className="text-[var(--muted)] hover:text-[var(--accent)]" onClick={() => setShowNote((s) => !s)} title="Add key note">
          <StickyNote size={16} />
        </button>
      </div>

      {question.kind === "slider" ? (
        <div className="flex items-center gap-3">
          <input
            type="range"
            className="flex-1 accent-[var(--accent)]"
            min={question.slider?.min ?? 0}
            max={question.slider?.max ?? 10}
            step={question.slider?.step ?? 1}
            value={answer?.value ?? question.slider?.min ?? 0}
            onChange={(e) => update({ value: Number(e.target.value) })}
          />
          <span className="min-w-20 text-right text-sm tabular-nums">
            {answer?.value ?? "—"} {question.slider?.unit}
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {question.options?.map((o) => (
            <button
              key={o.id}
              type="button"
              className="chip"
              data-selected={selected.includes(o.id)}
              data-negative={o.negative ? "true" : undefined}
              onClick={() => toggle(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {showNote && (
        <div className="mt-2 flex items-start gap-2">
          <Plus size={14} className="mt-2 text-[var(--muted)]" />
          <textarea
            className="input min-h-[2.4rem] text-sm"
            placeholder="Key note the patient said that no chip covers…"
            value={answer?.note ?? ""}
            onChange={(e) => update({ note: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
