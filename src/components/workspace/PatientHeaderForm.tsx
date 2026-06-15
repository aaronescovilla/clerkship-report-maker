"use client";
import { ShieldAlert } from "lucide-react";
import type { WorkspaceProps } from "./types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

export function PatientHeaderForm({ c, update }: WorkspaceProps) {
  const h = c.header;
  return (
    <div className="space-y-4">
      <div className="card flex items-start gap-3 border-l-4 border-l-[var(--warn)] p-3 text-sm">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-[var(--warn)]" />
        <div>
          <p className="font-semibold">De-identified mode {c.deidentified ? "on" : "off"}</p>
          <p className="text-[var(--muted)]">
            Stored/shared records omit the full name. Toggle off only for a local printed copy with consent.
          </p>
          <label className="mt-2 inline-flex items-center gap-2">
            <input type="checkbox" checked={c.deidentified} onChange={(e) => update((d) => { d.deidentified = e.target.checked; })} />
            <span>Keep de-identified</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {!c.deidentified && (
          <Field label="Full name (local only)">
            <input className="input" value={h.fullName ?? ""} onChange={(e) => update((d) => { d.header.fullName = e.target.value; })} />
          </Field>
        )}
        <Field label="Initials"><input className="input" value={h.initials ?? ""} onChange={(e) => update((d) => { d.header.initials = e.target.value; })} /></Field>
        <Field label="Age (e.g. 6 months old)"><input className="input" value={h.ageText ?? ""} onChange={(e) => update((d) => { d.header.ageText = e.target.value; })} /></Field>
        <Field label="Sex">
          <select className="input" value={h.sex ?? ""} onChange={(e) => update((d) => { d.header.sex = (e.target.value || undefined) as typeof d.header.sex; })}>
            <option value="">—</option><option value="male">Male</option><option value="female">Female</option>
          </select>
        </Field>
        <Field label="Birth date"><input type="date" className="input" value={h.birthDate ?? ""} onChange={(e) => update((d) => { d.header.birthDate = e.target.value; })} /></Field>
        <Field label="Informant (who gave the history)"><input className="input" value={h.informant ?? ""} onChange={(e) => update((d) => { d.header.informant = e.target.value; })} /></Field>
        <Field label="Reliability % (how dependable)"><input type="number" className="input" value={h.reliabilityPct ?? ""} onChange={(e) => update((d) => { d.header.reliabilityPct = Number(e.target.value); })} /></Field>
        <Field label="Hospital"><input className="input" value={h.hospital ?? ""} onChange={(e) => update((d) => { d.header.hospital = e.target.value; })} /></Field>
        <Field label="Attending physician"><input className="input" value={h.attendingPhysician ?? ""} onChange={(e) => update((d) => { d.header.attendingPhysician = e.target.value; })} /></Field>
        <Field label="Group"><input className="input" value={h.group ?? ""} onChange={(e) => update((d) => { d.header.group = e.target.value; })} /></Field>
      </div>
    </div>
  );
}
