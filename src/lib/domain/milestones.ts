// Developmental milestones by age, transcribed from the Physical Diagnosis
// Manual in Pediatrics (Developmental History tables). Used for the
// Developmental History section and for a simple "at par for age" check.

export type DevDomain = "grossMotor" | "fineMotor" | "expressiveLanguage" | "receptiveLanguage" | "personalSocial";

export interface Milestone {
  domain: DevDomain;
  ageMonths: number;
  skill: string;
}

export const DOMAIN_LABEL: Record<DevDomain, string> = {
  grossMotor: "Gross motor",
  fineMotor: "Fine motor",
  expressiveLanguage: "Expressive language",
  receptiveLanguage: "Receptive language",
  personalSocial: "Personal-social",
};

// Infancy (0-12 months) — most relevant to the cough/colds slice (sample patient is 6 mo).
export const INFANCY_MILESTONES: Milestone[] = [
  { domain: "grossMotor", ageMonths: 3, skill: "Head hold" },
  { domain: "grossMotor", ageMonths: 5, skill: "Roll over" },
  { domain: "grossMotor", ageMonths: 7, skill: "Sitting" },
  { domain: "grossMotor", ageMonths: 9, skill: "Pull to stand" },
  { domain: "grossMotor", ageMonths: 12, skill: "Walk independently" },
  { domain: "fineMotor", ageMonths: 3, skill: "Unfisted hands" },
  { domain: "fineMotor", ageMonths: 5, skill: "Midline hand play" },
  { domain: "fineMotor", ageMonths: 7, skill: "Transfer object from one hand to another" },
  { domain: "fineMotor", ageMonths: 9, skill: "Thumb-finger grasp" },
  { domain: "fineMotor", ageMonths: 12, skill: "Voluntary release (throwing/casting objects)" },
  { domain: "expressiveLanguage", ageMonths: 3, skill: "Cooing" },
  { domain: "expressiveLanguage", ageMonths: 6, skill: "Babbling" },
  { domain: "expressiveLanguage", ageMonths: 9, skill: "Mama/Papa non-specific" },
  { domain: "expressiveLanguage", ageMonths: 12, skill: "Single words with meaning" },
  { domain: "receptiveLanguage", ageMonths: 3, skill: "Alert to human voice" },
  { domain: "receptiveLanguage", ageMonths: 6, skill: "Localize sound" },
  { domain: "receptiveLanguage", ageMonths: 9, skill: "Understand 'no'" },
  { domain: "receptiveLanguage", ageMonths: 12, skill: "Follow 1-step command with gesture" },
];

/** Expected milestones at or before a given age, grouped by domain. */
export function expectedMilestones(ageMonths: number): Record<DevDomain, Milestone[]> {
  const out = { grossMotor: [], fineMotor: [], expressiveLanguage: [], receptiveLanguage: [], personalSocial: [] } as Record<DevDomain, Milestone[]>;
  for (const m of INFANCY_MILESTONES) {
    if (m.ageMonths <= ageMonths + 0.001) out[m.domain].push(m);
  }
  return out;
}

// Standard EPI vaccines for the immunization history checklist (manual list).
export const VACCINES = [
  "BCG", "Hepatitis B", "DPT", "OPV/IPV", "H. Influenza B (Hib)",
  "Pneumococcal (PCV)", "Rotavirus", "Measles", "MMR", "Varicella",
  "Influenza", "Hepatitis A", "Typhoid", "Meningococcal",
];
