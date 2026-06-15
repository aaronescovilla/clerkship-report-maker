import type { ChipOption, GlossaryEntry } from "./types";

// Central plain-language glossary for the beginner clerk. Keyed by the option `term`
// (preferred) or `id` — which, for programmatically generated questions (ROS, vaccines,
// yes/no modules), is the auto-slug of the source string. Entries are DISPLAY-ONLY:
// they never touch the clinical `phrase`/`label` that feeds the AI, so reports stay correct.
//
// Only genuinely jargon-y items need an entry. An option with no entry simply shows its
// existing label with no info affordance.

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // ---- ROS: HEENT ----
  lacrimation: { plain: "Watery eyes", clinical: "Lacrimation", definition: "Excess tearing of the eyes." },
  epistaxis: { plain: "Nosebleed", clinical: "Epistaxis", definition: "Bleeding from the nose." },

  // ---- ROS: Neck & Throat ----
  "mass-lymphadenopathy": { plain: "Swollen glands", clinical: "Mass / lymphadenopathy", definition: "Enlarged lymph nodes or a lump in the neck." },

  // ---- ROS: Cardiovascular ----
  cyanosis: { plain: "Bluish lips/skin", clinical: "Cyanosis", definition: "Bluish color of the lips or skin from low oxygen." },
  orthopnea: { plain: "Breathless lying down", clinical: "Orthopnea", definition: "Trouble breathing when flat, relieved by sitting up." },
  "easy-fatigability": { plain: "Tires easily", clinical: "Easy fatigability", definition: "Gets tired faster than expected." },
  palpitations: { plain: "Racing heartbeat", clinical: "Palpitations", definition: "Feeling the heart pound or race." },

  // ---- ROS: Respiratory ----
  dyspnea: { plain: "Hard to breathe", clinical: "Dyspnea", definition: "Difficulty or discomfort with breathing." },

  // ---- ROS: GI ----
  jaundice: { plain: "Yellowing", clinical: "Jaundice", definition: "Yellow color of the skin or eyes." },
  encopresis: { plain: "Soiling accidents", clinical: "Encopresis", definition: "Stooling in the underwear past toilet-training age." },

  // ---- ROS: Genitourinary ----
  dysuria: { plain: "Painful peeing", clinical: "Dysuria", definition: "Pain or burning when urinating." },

  // ---- ROS: Endocrine ----
  polyuria: { plain: "Peeing a lot", clinical: "Polyuria", definition: "Passing unusually large amounts of urine." },
  polydipsia: { plain: "Very thirsty", clinical: "Polydipsia", definition: "Excessive, constant thirst." },
  polyphagia: { plain: "Very hungry", clinical: "Polyphagia", definition: "Excessive hunger or eating." },

  // ---- ROS: Musculoskeletal / Hematopoietic ----
  myalgia: { plain: "Muscle aches", clinical: "Myalgia", definition: "Muscle pain." },
  pallor: { plain: "Looks pale", clinical: "Pallor", definition: "Unusually pale skin." },
  "easy-bruisability": { plain: "Bruises easily", clinical: "Easy bruisability", definition: "Bruises appear with little or no trauma." },

  // ---- HPI (cough/colds curated set) ----
  paroxysmal: { plain: "Coughing fits", clinical: "Paroxysmal cough", definition: "Sudden bursts of severe, repeated coughing." },
  posttussive: { plain: "Vomits after coughing", clinical: "Post-tussive emesis", definition: "Throwing up triggered by a coughing fit." },
  crackles: { plain: "Crackly chest sounds", clinical: "Audible crackles", definition: "A crackling sound from the chest when breathing." },
  mucoid: { plain: "Slimy mucus", clinical: "Mucoid", definition: "Thick, clear-to-cloudy mucus discharge." },
  rhinorrhea: { plain: "Runny nose", clinical: "Rhinorrhea", definition: "A runny nose / nasal discharge." },
  fast: { plain: "Fast breathing", clinical: "Tachypnea", definition: "Breathing faster than normal for age." },
  retractions: { plain: "Chest pulling in", clinical: "Chest retractions", definition: "Skin pulling in between/under the ribs with each breath — a sign of breathing difficulty." },

  // ---- Birth & delivery ----
  prom: { plain: "Water broke early", clinical: "PROM", definition: "Premature rupture of membranes — the water bag broke before labor started." },
  nsvd: { plain: "Normal vaginal birth", clinical: "NSVD", definition: "Normal spontaneous vaginal delivery." },
  cs: { plain: "C-section", clinical: "Cesarean", definition: "Delivery through a surgical cut in the abdomen." },
  preterm: { plain: "Born early", clinical: "Pre-term", definition: "Born before 37 weeks of pregnancy." },
  postterm: { plain: "Born late", clinical: "Post-term", definition: "Born after 42 weeks of pregnancy." },
  nicu: { plain: "Newborn ICU", clinical: "NICU", definition: "Neonatal intensive care unit for sick or premature newborns." },

  // ---- Vaccines (immunization checklist) ----
  bcg: { plain: "TB vaccine", clinical: "BCG", definition: "Protects against severe tuberculosis." },
  dpt: { plain: "3-in-1 (DPT)", clinical: "DPT", definition: "Diphtheria, pertussis (whooping cough) and tetanus vaccine." },
  "opv-ipv": { plain: "Polio vaccine", clinical: "OPV / IPV", definition: "Oral or injected polio vaccine." },
  "h-influenza-b-hib": { plain: "Hib vaccine", clinical: "H. influenzae B (Hib)", definition: "Protects against Haemophilus influenzae type B infections." },
  "pneumococcal-pcv": { plain: "Pneumonia vaccine", clinical: "Pneumococcal (PCV)", definition: "Protects against pneumococcal disease (pneumonia, meningitis)." },
  mmr: { plain: "3-in-1 (MMR)", clinical: "MMR", definition: "Measles, mumps and rubella vaccine." },

  // ---- Misc ----
  tap: { plain: "Tap water", clinical: "Tap / NAWASA", definition: "Water from the local utility supply." },
};

/** Resolve the glossary entry for an option: explicit `term` first, then `id`. */
export function lookupGlossary(opt: Pick<ChipOption, "id" | "term">): GlossaryEntry | null {
  return (opt.term ? GLOSSARY[opt.term] : undefined) ?? GLOSSARY[opt.id] ?? null;
}
