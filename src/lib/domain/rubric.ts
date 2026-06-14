import type { RubricStage, Stage } from "./types";

// Verification rubric for PEDIATRICS, grounded in the
// "Physical Diagnosis Manual in Pediatrics" (Clinical History & PE Guidelines).
// Each stage's criteria are scored 0..1 by the LLM judge; the weighted sum
// (x100) is compared against passThreshold. Deterministic structural checks run
// alongside (see lib/verify/deterministic.ts).

export const PEDIATRIC_RUBRICS: Record<Stage, RubricStage> = {
  interview: {
    stage: "interview",
    passThreshold: 75,
    criteria: [
      { id: "hpi-elements", weight: 0.3, label: "HPI elements covered", guidance: "Per-interval questions let the student capture onset, character (quality/frequency/timing), aggravating/relieving factors, medications given with their effect, prior consults, and associated symptoms." },
      { id: "pertinent-neg", weight: 0.2, label: "Pertinent negatives", guidance: "Includes 'no/none' chips so pertinent negatives relevant to the differential can be recorded, not only positives." },
      { id: "non-diagnostic", weight: 0.15, label: "Patient-answerable, non-diagnostic", guidance: "Chips capture symptoms/observations a patient or caregiver could report; they do not ask for diagnoses or interpretations." },
      { id: "age-appropriate", weight: 0.15, label: "Age-appropriate", guidance: "Questions are applicable to the patient's age group (e.g. bottles/day for infants)." },
      { id: "coverage", weight: 0.2, label: "Complaint coverage", guidance: "Question set covers the key clinical axes expected for this chief complaint without obvious gaps." },
    ],
  },
  narrative: {
    stage: "narrative",
    passThreshold: 78,
    criteria: [
      { id: "chronological", weight: 0.25, label: "Chronological HPI in paragraph form", guidance: "HPI is a coherent paragraph narrative ordered from onset to admission ('apparently well until ... prior to admission'), NOT a bullet list. Each interval flows into the next." },
      { id: "symptom-detail", weight: 0.2, label: "Symptom detail per manual", guidance: "Symptoms described by onset, character, aggravating/relieving factors; medications include dose/frequency/duration and their effect; prior consults noted." },
      { id: "ros-by-system", weight: 0.15, label: "ROS reported by organ system", guidance: "Review of Systems is organized by organ system (list/by-system), not woven into prose, per the manual." },
      { id: "cc-wording", weight: 0.1, label: "Chief complaint wording", guidance: "Chief complaint is a symptom in the informant's words, contains no diagnostic terms or disease names." },
      { id: "fidelity", weight: 0.2, label: "Fidelity to captured data", guidance: "Narrative asserts ONLY what the chips/notes/PE support. No invented symptoms, vitals, exam findings, or labs." },
      { id: "completeness", weight: 0.1, label: "Section completeness", guidance: "Expected history sections are present (General Data, CC, HPI, ROS, Birth/Maternal, PMHx, Family, Nutritional, Immunization, Developmental, Personal/Social, Environmental) or explicitly marked not-obtained." },
    ],
  },
  report: {
    stage: "report",
    passThreshold: 80,
    criteria: [
      { id: "structure", weight: 0.15, label: "Full clerkship structure", guidance: "Report contains Clinical History, Physical Examination, Case Discussion (salient features, differentials, primary impression), and Management, with clear bold headings." },
      { id: "salient", weight: 0.15, label: "Salient features", guidance: "Case summary distills the pertinent positives and negatives that drive the assessment." },
      { id: "differentials", weight: 0.2, label: "≥3 differentials with reasoning", guidance: "At least three differential diagnoses, each justified by case-specific findings (supporting and refuting)." },
      { id: "impression", weight: 0.15, label: "Justified primary impression", guidance: "Primary impression follows logically from the history/PE and explains why it is favored over the differentials." },
      { id: "management", weight: 0.15, label: "Management completeness", guidance: "Diagnostics, pharmacologic, and supportive management are appropriate and tied to the impression." },
      { id: "safety", weight: 0.2, label: "Clinical safety / no fabrication", guidance: "No fabricated exam findings, vitals, or lab results beyond entered data. Drug doses and calculations are flagged for student verification rather than asserted as fact." },
    ],
  },
};

export function getRubric(stage: Stage): RubricStage {
  return PEDIATRIC_RUBRICS[stage];
}
