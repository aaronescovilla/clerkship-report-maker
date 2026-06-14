import type { QuestionSet } from "../domain/types";
import { getCuratedSet, COUGH_COLDS_SET } from "../domain/questionSets";
import { findComplaint } from "../domain/complaints";
import { complete, hasApiKey, parseJson } from "./anthropic";
import { MODELS } from "./models";
import { AUGMENT_SYSTEM } from "./prompts";

/** Resolve a question set: curated -> AI-generated -> generic fallback. */
export async function getOrGenerateQuestionSet(complaintId: string): Promise<QuestionSet> {
  const curated = getCuratedSet(complaintId);
  if (curated) return curated;

  const complaint = findComplaint(complaintId);
  const label = complaint?.label ?? complaintId;

  if (hasApiKey()) {
    try {
      const text = await complete({
        model: MODELS.augment,
        system: AUGMENT_SYSTEM,
        user: `Chief complaint id: "${complaintId}"\nChief complaint: "${label}"\nGenerate the JSON question set now.`,
        maxTokens: 3000,
        temperature: 0.4,
      });
      const set = parseJson<QuestionSet>(text);
      set.complaintId = complaintId;
      set.source = "ai";
      return set;
    } catch {
      // fall through to generic
    }
  }
  return genericFallback(complaintId, label);
}

/** Generic per-interval set derived from the cough/colds template structure. */
function genericFallback(complaintId: string, label: string): QuestionSet {
  return {
    complaintId,
    specialty: "pediatrics",
    source: "ai",
    version: 1,
    groups: [
      {
        id: "hpi-template",
        title: `What changed at this point? (${label})`,
        section: "hpi",
        questions: [
          {
            id: "symptom",
            prompt: "Symptom status",
            kind: "multi",
            section: "hpi",
            options: [
              { id: "onset", label: "New onset", phrase: `onset of ${label.toLowerCase()}` },
              { id: "worse", label: "Worsening", phrase: "worsening of symptoms" },
              { id: "same", label: "Persistent", phrase: "persistence of symptoms" },
              { id: "better", label: "Improving", phrase: "improvement of symptoms" },
            ],
          },
          {
            id: "associated",
            prompt: "Associated symptoms",
            kind: "multi",
            section: "hpi",
            options: [
              { id: "fever", label: "Fever", phrase: "fever" },
              { id: "vomiting", label: "Vomiting", phrase: "vomiting" },
              { id: "poorfeed", label: "Poor feeding", phrase: "decreased appetite" },
              { id: "none", label: "None", phrase: "no other associated symptoms", negative: true },
            ],
          },
          { id: "meds", prompt: "Medications given", kind: "multi", section: "hpi", options: [{ id: "none", label: "None", negative: true }, { id: "other", label: "Yes (note)" }], hint: "Use the note field for drug, dose, frequency." },
          { id: "response", prompt: "Response", kind: "single", section: "hpi", options: [{ id: "na", label: "N/A" }, { id: "none", label: "No improvement", phrase: "with no improvement" }, { id: "minimal", label: "Minimal relief", phrase: "with minimal relief" }, { id: "improved", label: "Improved", phrase: "with improvement" }] },
          { id: "consult", prompt: "Consult done?", kind: "single", section: "hpi", options: [{ id: "none", label: "No consult", phrase: "no consult was done" }, { id: "private", label: "Private MD", phrase: "sought consult with a private physician" }, { id: "center", label: "Health center", phrase: "sought consult at a health center" }] },
        ],
      },
    ],
  };
}

export { COUGH_COLDS_SET };
