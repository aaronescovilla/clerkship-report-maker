"use client";
import { useState } from "react";
import { StickyNote, Info } from "lucide-react";
import type { Answer, ChipOption, DrugDetail, Question } from "@/lib/domain/types";
import { lookupGlossary } from "@/lib/domain/glossary";

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
  const [openDef, setOpenDef] = useState<string | null>(null);
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

  function setComment(optId: string, text: string) {
    const comments = { ...answer?.comments };
    if (text) comments[optId] = text;
    else delete comments[optId];
    update({ comments });
  }

  function setDrug(optId: string, patch: Partial<DrugDetail>) {
    const drugs = { ...answer?.drugs };
    drugs[optId] = { ...drugs[optId], ...patch };
    update({ drugs });
  }

  // Plain-language primary label for a chip/row (falls back to the clinical label).
  function plainOf(o: ChipOption): string {
    return lookupGlossary(o)?.plain ?? o.label;
  }

  // Selected options worth annotating: skip pertinent-negative / "none"-style chips.
  const annotatable: ChipOption[] = (question.options ?? []).filter(
    (o) => selected.includes(o.id) && !o.negative && o.id !== "na"
  );

  const openOpt = openDef ? question.options?.find((o) => o.id === openDef) : undefined;
  const openEntry = openOpt ? lookupGlossary(openOpt) : null;

  return (
    <div className="py-3 border-b border-[var(--border)] last:border-0">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[0.95rem]">
            {question.prompt}
            {question.required && (
              <span className="ml-1.5 align-middle text-xs font-medium text-[var(--accent)]" title="Key item — try to fill this in">★ key</span>
            )}
          </p>
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
          {question.options?.map((o) => {
            const g = lookupGlossary(o);
            const isSel = selected.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                className="chip"
                data-selected={isSel}
                data-negative={o.negative ? "true" : undefined}
                onClick={() => toggle(o.id)}
              >
                <span>{g?.plain ?? o.label}</span>
                {g?.clinical && g.clinical.toLowerCase() !== (g.plain ?? "").toLowerCase() && (
                  <span className="text-[0.7rem] opacity-70">· {g.clinical}</span>
                )}
                {g?.definition && (
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={`What is ${g.clinical ?? o.label}?`}
                    className="-mr-1 ml-0.5 inline-flex opacity-70 hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); setOpenDef(openDef === o.id ? null : o.id); }}
                  >
                    <Info size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tap-to-reveal definition for the currently opened chip. */}
      {openEntry && (
        <p className="mt-2 rounded-lg bg-[var(--accent-soft)] px-2.5 py-1.5 text-xs text-[var(--foreground)]">
          <b>{openEntry.clinical ?? openOpt?.label}:</b> {openEntry.definition}
        </p>
      )}

      {/* Per-symptom detail: structured drug fields (dosing) or a free-text comment. */}
      {annotatable.length > 0 && (
        <div className="mt-2.5 space-y-2">
          {annotatable.map((o) =>
            question.dosing ? (
              <DrugRow key={o.id} label={plainOf(o)} detail={answer?.drugs?.[o.id]} onChange={(p) => setDrug(o.id, p)} />
            ) : (
              <label key={o.id} className="flex items-center gap-2">
                <span className="min-w-[5.5rem] shrink-0 text-right text-xs font-medium text-[var(--muted)]">{plainOf(o)}</span>
                <input
                  className="input py-1 text-sm"
                  placeholder="add detail — severity, amount, character… (optional)"
                  value={answer?.comments?.[o.id] ?? ""}
                  onChange={(e) => setComment(o.id, e.target.value)}
                />
              </label>
            )
          )}
        </div>
      )}

      {showNote && (
        <textarea
          className="input mt-2 min-h-[2.4rem] text-sm"
          placeholder="Key note the patient said that no chip covers…"
          value={answer?.note ?? ""}
          onChange={(e) => update({ note: e.target.value })}
        />
      )}
    </div>
  );
}

function DrugRow({ label, detail, onChange }: { label: string; detail?: DrugDetail; onChange: (p: Partial<DrugDetail>) => void }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--accent-soft)] p-2">
      <p className="mb-1.5 text-xs font-semibold text-[var(--accent)]">{label}</p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <input className="input py-1 text-sm" placeholder="dose (e.g. 250 mg)" value={detail?.dose ?? ""} onChange={(e) => onChange({ dose: e.target.value })} />
        <input className="input py-1 text-sm" placeholder="how often (e.g. 2x/day)" value={detail?.frequency ?? ""} onChange={(e) => onChange({ frequency: e.target.value })} />
        <input className="input py-1 text-sm" placeholder="how given (e.g. by mouth)" value={detail?.route ?? ""} onChange={(e) => onChange({ route: e.target.value })} />
        <input className="input py-1 text-sm" placeholder="how long (e.g. 5 days)" value={detail?.duration ?? ""} onChange={(e) => onChange({ duration: e.target.value })} />
      </div>
    </div>
  );
}
