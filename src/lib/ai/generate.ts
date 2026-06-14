import type { CaseRecord, GeneratedNarrative, GeneratedReport, QuestionSet, ReportSectionKey, Answer, Question } from "../domain/types";
import { buildQuestionRegistry, REGIONAL_EXAM_PARTS } from "../domain/standardModules";
import { ROS_SYSTEMS } from "../domain/ros";
import { complete, hasApiKey, parseJson } from "./anthropic";
import { MODELS } from "./models";
import { NARRATIVE_SYSTEM, REPORT_SYSTEM } from "./prompts";
import { serializeCase } from "./serialize";

const SECTION_TITLES: Record<ReportSectionKey, string> = {
  generalData: "General Data", chiefComplaint: "Chief Complaint", hpi: "History of Present Illness",
  ros: "Review of Systems", birthMaternal: "Birth & Maternal History", pastMedical: "Past Medical History",
  family: "Family History", nutritional: "Nutritional History", immunization: "Immunization History",
  developmental: "Developmental History", personalSocial: "Personal & Social History", environmental: "Environmental History",
  physicalExam: "Physical Examination", caseDiscussion: "Case Discussion", management: "Management", drugIndex: "Drug Index",
};

export const NARRATIVE_KEYS: ReportSectionKey[] = [
  "generalData", "chiefComplaint", "hpi", "ros", "birthMaternal", "pastMedical",
  "family", "nutritional", "immunization", "developmental", "personalSocial", "environmental",
];

// ---------- Narrative ----------
export async function generateNarrative(c: CaseRecord, set: QuestionSet): Promise<GeneratedNarrative> {
  if (!hasApiKey()) return mockNarrative(c, set);
  const payload = serializeCase(c, set);
  const text = await complete({
    model: MODELS.narrative,
    system: NARRATIVE_SYSTEM,
    user: `Captured case data:\n\n${payload}\n\nReturn the JSON sections now.`,
    maxTokens: 4096,
  });
  const sections = parseJson<Partial<Record<ReportSectionKey, string>>>(text);
  return { sections, model: MODELS.narrative, createdAt: new Date().toISOString() };
}

// ---------- Report ----------
export async function generateReport(c: CaseRecord, set: QuestionSet, narrative: GeneratedNarrative): Promise<GeneratedReport> {
  if (!hasApiKey()) return mockReport(c, narrative);
  const peText = peSection(c);
  const narrText = NARRATIVE_KEYS.filter((k) => narrative.sections[k])
    .map((k) => `## ${SECTION_TITLES[k]}\n${narrative.sections[k]}`).join("\n\n");
  const markdown = await complete({
    model: MODELS.report,
    system: REPORT_SYSTEM,
    user: `NARRATIVE HISTORY SECTIONS:\n\n${narrText}\n\nPHYSICAL EXAM DATA:\n${peText}\n\nProduce the complete report in Markdown now.`,
    maxTokens: 8192,
  });
  return { markdown, sections: narrative.sections, model: MODELS.report, createdAt: new Date().toISOString() };
}

// ---------- Deterministic mock (no API key) ----------
function phraseFor(q: Question | undefined, a: Answer): string[] {
  if (!a.selected?.length) return [];
  return a.selected
    .filter((id) => id !== "na")
    .map((id) => {
      const o = q?.options?.find((x) => x.id === id);
      return o?.phrase || o?.label || id;
    });
}

function mockNarrative(c: CaseRecord, set: QuestionSet): GeneratedNarrative {
  const reg = buildQuestionRegistry(set);
  const sections: Partial<Record<ReportSectionKey, string>> = {};
  sections.chiefComplaint = `"${c.complaintLabel}"`;

  // HPI from timeline
  const events = [...c.timeline].sort((a, b) => b.hoursPrior - a.hoursPrior);
  const sentences: string[] = [];
  events.forEach((ev, i) => {
    const get = (qid: string) => {
      const a = ev.answers.find((x) => x.questionId === qid);
      return a ? phraseFor(reg.get(qid), a) : [];
    };
    const findings = [...get("cough"), ...get("rhinorrhea"), ...get("associated")].filter((p) => !/^no /.test(p));
    const negatives = [...get("cough"), ...get("rhinorrhea"), ...get("associated")].filter((p) => /^no /.test(p));
    const meds = get("meds").filter((m) => m.toLowerCase() !== "none");
    const resp = get("response")[0];
    const consult = get("consult")[0];
    const lead = i === 0 ? `The patient was apparently well until ${ev.label}, when he/she was noted to have` : `${cap(ev.label)},`;
    let s = `${lead} ${findings.length ? joinList(findings) : "persistence of symptoms"}.`;
    if (negatives.length) s += ` There was ${joinList(negatives)}.`;
    if (meds.length) s += ` ${meds.length ? "Given " + joinList(meds) : ""}${resp ? " " + resp : ""}.`;
    if (consult) s += ` ${cap(consult)}.`;
    if (ev.note?.trim()) s += ` ${ev.note.trim()}`;
    sentences.push(s.replace(/\s+/g, " ").trim());
  });
  sections.hpi = sentences.length ? sentences.join(" ") : "Not obtained.";

  // ROS by system
  const rosLines: string[] = [];
  for (const sys of ROS_SYSTEMS) {
    const a = c.answers.find((x) => x.questionId === `ros:${sys.id}`);
    if (!a) continue;
    const pos = phraseFor(reg.get(`ros:${sys.id}`), a).filter((p) => p !== "(all negative)");
    if (a.selected?.includes("none") && !pos.length) rosLines.push(`${sys.label}: all negative.`);
    else if (pos.length) rosLines.push(`${sys.label}: (+) ${pos.join(", ")}.`);
  }
  if (rosLines.length) sections.ros = rosLines.join("\n");

  // Other sections: dump resolved answers as prose-ish lines.
  for (const key of NARRATIVE_KEYS) {
    if (key === "hpi" || key === "ros" || key === "chiefComplaint") continue;
    const lines = c.answers
      .filter((a) => reg.get(a.questionId)?.section === key)
      .map((a) => {
        const q = reg.get(a.questionId);
        const ph = phraseFor(q, a);
        const note = a.note?.trim() ? ` (${a.note.trim()})` : "";
        return ph.length || note ? `${q?.prompt}: ${ph.join(", ")}${note}` : "";
      })
      .filter(Boolean);
    if (lines.length) sections[key] = lines.join("; ") + ".";
  }

  return { sections, model: "mock (no API key)", createdAt: new Date().toISOString() };
}

function peSection(c: CaseRecord): string {
  const pe = c.pe;
  const L: string[] = [];
  L.push(`General Survey: ${pe.generalSurvey || "Not obtained."}`);
  const v = pe.vitals;
  L.push(`Vital Signs: ${v && (v.hr || v.rr || v.temp || v.bp || v.spo2) ? [v.hr && `HR ${v.hr}`, v.rr && `RR ${v.rr}`, v.temp && `T ${v.temp}°C`, v.bp && `BP ${v.bp}`, v.spo2 && `SpO2 ${v.spo2}%`].filter(Boolean).join(", ") : "Not obtained."}`);
  const an = pe.anthropometrics;
  L.push(`Anthropometrics: ${an && (an.weightKg || an.lengthCm || an.headCircumferenceCm) ? [an.weightKg && `${an.weightKg} kg`, an.lengthCm && `${an.lengthCm} cm`, an.headCircumferenceCm && `HC ${an.headCircumferenceCm} cm`].filter(Boolean).join(", ") : "Not obtained."}`);
  for (const part of REGIONAL_EXAM_PARTS) L.push(`${part.label}: ${pe.findings?.[part.key]?.trim() || "Not obtained."}`);
  return L.join("\n");
}

function mockReport(c: CaseRecord, narrative: GeneratedNarrative): GeneratedReport {
  const L: string[] = [];
  L.push(`# Pediatric Clerkship Report`);
  L.push(`\n_Generated in demo mode (no API key). Sections marked "Not obtained." need data; Case Discussion requires Claude._\n`);
  L.push(`## **CLINICAL HISTORY**`);
  for (const k of NARRATIVE_KEYS) {
    L.push(`\n### ${SECTION_TITLES[k]}`);
    L.push(narrative.sections[k] || "Not obtained.");
  }
  L.push(`\n## **PHYSICAL EXAMINATION**\n`);
  L.push(peSection(c).split("\n").map((line) => `**${line.split(":")[0]}:** ${line.split(":").slice(1).join(":").trim()}`).join("\n\n"));
  L.push(`\n## **CASE DISCUSSION**`);
  L.push(`_Salient features, differential diagnoses, and primary impression require clinical reasoning — add an ANTHROPIC_API_KEY to generate this section with Claude._`);
  L.push(`\n## **MANAGEMENT**`);
  L.push(`_Requires Claude (see above)._`);
  const md = L.join("\n");
  return { markdown: md, sections: narrative.sections, model: "mock (no API key)", createdAt: new Date().toISOString() };
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
function joinList(items: string[]): string {
  const u = [...new Set(items)];
  if (u.length <= 1) return u.join("");
  if (u.length === 2) return `${u[0]} and ${u[1]}`;
  return `${u.slice(0, -1).join(", ")}, and ${u[u.length - 1]}`;
}

export { SECTION_TITLES };
