import type { Specialty } from "./types";

export interface ChiefComplaint {
  id: string;
  /** Patient-facing wording (avoid diagnostic terms, per manual). */
  label: string;
  /** Common Filipino phrasing students may hear, mirrored from the manual samples. */
  aka?: string[];
  specialty: Specialty;
  /** Whether a curated question set exists; otherwise AI-generated then cached. */
  curated: boolean;
}

// Seed list of common pediatric chief complaints. The manual stresses the CC
// should be a symptom (not a diagnosis) and ideally a single symptom.
export const PEDIATRIC_COMPLAINTS: ChiefComplaint[] = [
  { id: "cough-colds", label: "Cough and/or colds", aka: ["ubo", "sipon", "ubo at sipon"], specialty: "pediatrics", curated: true },
  { id: "difficulty-breathing", label: "Difficulty of breathing", aka: ["hingal", "hirap huminga"], specialty: "pediatrics", curated: false },
  { id: "fever", label: "Fever", aka: ["lagnat", "mataas na lagnat"], specialty: "pediatrics", curated: false },
  { id: "diarrhea", label: "Loose stools / diarrhea", aka: ["pagtatae"], specialty: "pediatrics", curated: false },
  { id: "vomiting", label: "Vomiting", aka: ["pagsusuka"], specialty: "pediatrics", curated: false },
  { id: "abdominal-pain", label: "Abdominal pain", aka: ["masakit ang tiyan"], specialty: "pediatrics", curated: false },
  { id: "poor-feeding", label: "Poor feeding / poor appetite", aka: ["mahinang kumain"], specialty: "pediatrics", curated: false },
  { id: "rash", label: "Rash / skin lesions", aka: ["pantal"], specialty: "pediatrics", curated: false },
  { id: "seizure", label: "Seizure / convulsion", aka: ["kombulsyon"], specialty: "pediatrics", curated: false },
  { id: "jaundice", label: "Yellowish discoloration (jaundice)", aka: ["paninilaw"], specialty: "pediatrics", curated: false },
  { id: "ear-complaints", label: "Ear pain / discharge", aka: ["masakit ang tenga"], specialty: "pediatrics", curated: false },
  { id: "decreased-urine", label: "Decreased urine output", specialty: "pediatrics", curated: false },
];

export const FALLBACK_COMPLAINT_ID = "__general__";

export function findComplaint(id: string): ChiefComplaint | undefined {
  return PEDIATRIC_COMPLAINTS.find((c) => c.id === id);
}
