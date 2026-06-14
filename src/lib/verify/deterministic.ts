import type { GeneratedNarrative, GeneratedReport, QuestionSet, Stage } from "../domain/types";

const DIAGNOSTIC_TERMS = /\b(pneumonia|asthma|bronchitis|sepsis|leukemia|dengue|tuberculosis|gastroenteritis|uti|otitis)\b/i;

export function checkInterview(set: QuestionSet): string[] {
  const issues: string[] = [];
  const hpi = set.groups.find((g) => g.section === "hpi");
  if (!hpi) issues.push("No HPI question group found.");
  const allOpts = set.groups.flatMap((g) => g.questions).flatMap((q) => q.options ?? []);
  if (!allOpts.some((o) => o.negative)) issues.push("No pertinent-negative chips present.");
  const assoc = set.groups.flatMap((g) => g.questions).find((q) => /associat/i.test(q.prompt));
  if (!assoc) issues.push("No associated-symptoms question.");
  return issues;
}

export function checkNarrative(n: GeneratedNarrative): string[] {
  const issues: string[] = [];
  if (!n.sections.chiefComplaint?.trim()) issues.push("Chief Complaint missing.");
  else if (DIAGNOSTIC_TERMS.test(n.sections.chiefComplaint)) issues.push("Chief Complaint contains a diagnostic term (manual: CC must be a symptom).");
  const hpi = n.sections.hpi?.trim() ?? "";
  if (!hpi) issues.push("HPI missing.");
  else if (/^\s*[-*•]/m.test(hpi)) issues.push("HPI appears to be a bullet list; manual requires paragraph form.");
  else if (hpi.length < 80 && hpi !== "Not obtained.") issues.push("HPI is very short.");
  return issues;
}

export function checkReport(r: GeneratedReport): string[] {
  const issues: string[] = [];
  const md = r.markdown;
  for (const heading of ["CLINICAL HISTORY", "PHYSICAL EXAMINATION", "CASE DISCUSSION", "MANAGEMENT"]) {
    if (!new RegExp(heading, "i").test(md)) issues.push(`Missing major section: ${heading}.`);
  }
  // Heuristic: count differential entries under Case Discussion.
  const ddxMatch = md.match(/differential[\s\S]{0,1500}/i)?.[0] ?? "";
  const ddxCount = (ddxMatch.match(/^\s*(?:\d+\.|[-*]|\*\*\d)/gm) ?? []).length;
  if (/case discussion/i.test(md) && ddxCount < 3) issues.push("Fewer than 3 differential diagnoses detected.");
  return issues;
}

export function deterministicCheck(stage: Stage, artifact: QuestionSet | GeneratedNarrative | GeneratedReport): string[] {
  if (stage === "interview") return checkInterview(artifact as QuestionSet);
  if (stage === "narrative") return checkNarrative(artifact as GeneratedNarrative);
  return checkReport(artifact as GeneratedReport);
}
