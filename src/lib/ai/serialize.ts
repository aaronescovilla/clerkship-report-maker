import type { Answer, CaseRecord, Question, QuestionSet } from "../domain/types";
import { buildQuestionRegistry, REGIONAL_EXAM_PARTS } from "../domain/standardModules";

function resolveAnswer(q: Question | undefined, a: Answer): string | null {
  const parts: string[] = [];
  if (q?.kind === "slider" && a.value != null) {
    parts.push(`${a.value}${q.slider?.unit ? " " + q.slider.unit : ""}`);
  } else if (a.selected?.length) {
    const labels = a.selected.map((id) => {
      const opt = q?.options?.find((o) => o.id === id);
      return opt?.phrase || opt?.label || id;
    });
    parts.push(labels.join(", "));
  }
  if (a.note?.trim()) parts.push(`(note: ${a.note.trim()})`);
  if (!parts.length) return null;
  return parts.join(" ");
}

/**
 * Render the captured case as a structured, faithful text payload.
 * Only includes data the student actually entered.
 */
export function serializeCase(c: CaseRecord, set: QuestionSet): string {
  const reg = buildQuestionRegistry(set);
  const L: string[] = [];

  L.push(`SPECIALTY: ${c.specialty}`);
  L.push(`CHIEF COMPLAINT (chosen): ${c.complaintLabel}`);

  // Header
  const h = c.header;
  const hdr: string[] = [];
  if (h.initials) hdr.push(`initials ${h.initials}`);
  if (c.deidentified ? false : h.fullName) hdr.push(`name ${h.fullName}`);
  if (h.ageText) hdr.push(h.ageText);
  if (h.sex) hdr.push(h.sex);
  if (h.birthDate) hdr.push(`born ${h.birthDate}`);
  if (h.informant) hdr.push(`informant: ${h.informant}`);
  if (h.reliabilityPct != null) hdr.push(`reliability ${h.reliabilityPct}%`);
  if (h.hospital) hdr.push(`hospital ${h.hospital}`);
  if (hdr.length) L.push(`GENERAL DATA: ${hdr.join(", ")}`);

  // HPI timeline (chronological: earliest first)
  L.push("\nHPI TIMELINE (earliest first):");
  const events = [...c.timeline].sort((a, b) => b.hoursPrior - a.hoursPrior);
  if (!events.length) L.push("  (no timeline entries captured)");
  for (const ev of events) {
    const lines: string[] = [];
    for (const a of ev.answers) {
      const r = resolveAnswer(reg.get(a.questionId), a);
      if (r) lines.push(`${reg.get(a.questionId)?.prompt ?? a.questionId}: ${r}`);
    }
    if (ev.note?.trim()) lines.push(`key note: ${ev.note.trim()}`);
    L.push(`  • ${ev.label}: ${lines.length ? lines.join("; ") : "(no details)"}`);
  }

  // Non-timeline answers grouped by section
  const bySection = new Map<string, string[]>();
  for (const a of c.answers) {
    const q = reg.get(a.questionId);
    const r = resolveAnswer(q, a);
    if (!r) continue;
    const sec = q?.section ?? "other";
    const arr = bySection.get(sec) ?? [];
    arr.push(`${q?.prompt ?? a.questionId}: ${r}`);
    bySection.set(sec, arr);
  }
  for (const [sec, arr] of bySection) {
    // Per-interval HPI answers live in the timeline; remaining "hpi" answers here
    // are once-per-case context (e.g. sick contacts), so surface them too.
    const heading = sec === "hpi" ? "HPI ADDITIONAL CONTEXT" : sec.toUpperCase();
    L.push(`\n${heading}:`);
    for (const line of arr) L.push(`  - ${line}`);
  }

  // Physical exam (student-entered objective data)
  L.push("\nPHYSICAL EXAMINATION (entered by student):");
  const pe = c.pe;
  if (pe.generalSurvey) L.push(`  General Survey: ${pe.generalSurvey}`);
  if (pe.vitals) {
    const v = pe.vitals;
    const vs = [v.hr && `HR ${v.hr}`, v.rr && `RR ${v.rr}`, v.temp && `T ${v.temp}°C`, v.bp && `BP ${v.bp}`, v.spo2 && `SpO2 ${v.spo2}%`].filter(Boolean);
    if (vs.length) L.push(`  Vital Signs: ${vs.join(", ")}`);
  }
  if (pe.anthropometrics) {
    const an = pe.anthropometrics;
    const as = [an.weightKg && `${an.weightKg} kg`, an.lengthCm && `${an.lengthCm} cm`, an.headCircumferenceCm && `HC ${an.headCircumferenceCm} cm`].filter(Boolean);
    if (as.length) L.push(`  Anthropometrics: ${as.join(", ")}`);
  }
  for (const part of REGIONAL_EXAM_PARTS) {
    const f = pe.findings?.[part.key];
    if (f?.trim()) L.push(`  ${part.label}: ${f.trim()}`);
  }

  return L.join("\n");
}
