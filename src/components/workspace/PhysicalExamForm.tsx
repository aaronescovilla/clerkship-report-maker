"use client";
import { Calculator } from "lucide-react";
import { REGIONAL_EXAM_PARTS } from "@/lib/domain/standardModules";
import { bmi, hollidaySegarPerDayMl, hollidaySegarRateMlPerHr, lmsZScore, zToPercentile, WHO_WFA_BOYS } from "@/lib/calc";
import type { RegionalExamKey } from "@/lib/domain/types";
import type { WorkspaceProps } from "./types";

const NORMALS: Partial<Record<RegionalExamKey, string>> = {
  skin: "Warm, good turgor, no rashes, no jaundice.",
  heent: "Anicteric sclerae, pink palpebral conjunctivae, no nasoaural discharge, moist lips, no tonsillopharyngeal congestion.",
  neck: "Supple, no lymphadenopathy, no masses.",
  chestLungs: "Symmetric chest expansion, no retractions, clear breath sounds.",
  cardiovascular: "Adynamic precordium, normal rate and regular rhythm, no murmurs.",
  abdomen: "Flat, soft, non-tender, normoactive bowel sounds, no organomegaly.",
  genitalia: "Grossly normal external genitalia.",
  anusRectum: "Patent anus, no fissures or tags.",
  extremities: "No deformities, full pulses, no edema, no cyanosis.",
  neurologic: "Awake, active, good tone, no focal deficits.",
};

export function PhysicalExamForm({ c, update }: WorkspaceProps) {
  const pe = c.pe;
  const w = pe.anthropometrics?.weightKg;
  const len = pe.anthropometrics?.lengthCm;
  const computedBmi = w && len ? bmi(w, len) : null;
  const wfa = w && WHO_WFA_BOYS[6] ? lmsZScore(w, WHO_WFA_BOYS[6]) : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">Objective findings YOU examined. Anything left blank prints as “Not obtained.” Math is computed below, not by the AI.</p>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">General Survey</span>
        <textarea className="input" value={pe.generalSurvey ?? ""} onChange={(e) => update((d) => { d.pe.generalSurvey = e.target.value; })} placeholder="Awake, active, not in cardiorespiratory distress…" />
      </label>

      <div className="card p-3">
        <p className="mb-2 text-xs font-semibold text-[var(--muted)]">Vital Signs</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {([["hr", "HR"], ["rr", "RR"], ["temp", "T °C"], ["spo2", "SpO₂"]] as const).map(([k, label]) => (
            <label key={k} className="text-xs">{label}
              <input type="number" className="input" value={pe.vitals?.[k] ?? ""} onChange={(e) => update((d) => { d.pe.vitals = { ...d.pe.vitals, [k]: e.target.value ? Number(e.target.value) : undefined }; })} />
            </label>
          ))}
          <label className="text-xs">BP
            <input className="input" value={pe.vitals?.bp ?? ""} onChange={(e) => update((d) => { d.pe.vitals = { ...d.pe.vitals, bp: e.target.value }; })} />
          </label>
        </div>
      </div>

      <div className="card p-3">
        <p className="mb-2 text-xs font-semibold text-[var(--muted)]">Anthropometrics</p>
        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs">Weight (kg)
            <input type="number" className="input" value={w ?? ""} onChange={(e) => update((d) => { d.pe.anthropometrics = { ...d.pe.anthropometrics, weightKg: e.target.value ? Number(e.target.value) : undefined }; })} />
          </label>
          <label className="text-xs">Length/Height (cm)
            <input type="number" className="input" value={len ?? ""} onChange={(e) => update((d) => { d.pe.anthropometrics = { ...d.pe.anthropometrics, lengthCm: e.target.value ? Number(e.target.value) : undefined }; })} />
          </label>
          <label className="text-xs">Head circ (cm)
            <input type="number" className="input" value={pe.anthropometrics?.headCircumferenceCm ?? ""} onChange={(e) => update((d) => { d.pe.anthropometrics = { ...d.pe.anthropometrics, headCircumferenceCm: e.target.value ? Number(e.target.value) : undefined }; })} />
          </label>
        </div>
        {w && (
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--accent)]">
            <span className="inline-flex items-center gap-1"><Calculator size={12} /> Maint. fluids: {hollidaySegarPerDayMl(w)} mL/day ({hollidaySegarRateMlPerHr(w)} mL/hr)</span>
            {computedBmi && <span>BMI: {computedBmi}</span>}
            {wfa != null && <span>WFA z (≈6 mo boy): {wfa} ({zToPercentile(wfa)}%ile)</span>}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {REGIONAL_EXAM_PARTS.map((part) => (
          <div key={part.key} className="card p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold">{part.label}</span>
              {NORMALS[part.key] && (
                <button className="chip py-0.5 text-xs" onClick={() => update((d) => { d.pe.findings = { ...d.pe.findings, [part.key]: NORMALS[part.key] }; })}>
                  Normal
                </button>
              )}
            </div>
            <textarea className="input text-sm" value={pe.findings?.[part.key] ?? ""} onChange={(e) => update((d) => { d.pe.findings = { ...d.pe.findings, [part.key]: e.target.value }; })} />
          </div>
        ))}
      </div>
    </div>
  );
}
