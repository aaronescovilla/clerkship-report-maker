// Review of Systems organ-system map, transcribed from the
// Physical Diagnosis Manual in Pediatrics (Pediatric Clinical History Guidelines).
// The manual requires the ROS to be reported BY ORGAN SYSTEM (not paragraph form),
// asking only symptoms applicable to the patient's age.

export interface RosSystem {
  id: string;
  label: string;
  symptoms: string[];
}

export const ROS_SYSTEMS: RosSystem[] = [
  { id: "general", label: "General", symptoms: ["weight loss", "weight gain", "loss of appetite", "poor activity", "delay in growth"] },
  { id: "skin", label: "Skin", symptoms: ["rash", "pigmentation", "hair loss", "acne", "pruritus"] },
  {
    id: "heent",
    label: "Head, Eyes, Ears, Nose",
    symptoms: [
      "headache", "dizziness", "hearing difficulties", "use of glasses", "lacrimation",
      "frequent colds", "ear pain", "ear discharge", "nasal discharge", "epistaxis",
      "toothache", "dental caries", "use of braces",
    ],
  },
  { id: "neckThroat", label: "Neck & Throat", symptoms: ["mass / lymphadenopathy", "muscle stiffness", "frequent sore throat"] },
  { id: "cardiovascular", label: "Cardiovascular", symptoms: ["cyanosis", "orthopnea", "fainting spells", "easy fatigability", "palpitations"] },
  { id: "respiratory", label: "Respiratory", symptoms: ["cough", "dyspnea", "chest pain"] },
  {
    id: "gastrointestinal",
    label: "Gastrointestinal",
    symptoms: ["vomiting", "diarrhea", "constipation", "abdominal pain", "jaundice", "food intolerance", "encopresis", "passage of worms"],
  },
  { id: "genitourinary", label: "Genitourinary", symptoms: ["dysuria", "frequency", "discharge", "edema"] },
  { id: "endocrine", label: "Endocrine", symptoms: ["cold intolerance", "heat intolerance", "polyuria", "polydipsia", "polyphagia"] },
  {
    id: "nervousBehavioral",
    label: "Nervous / Behavioral",
    symptoms: ["seizures", "weakness", "sleep problems", "behavioral changes", "memory loss", "mood changes", "temper outbursts", "personality changes", "hallucinations"],
  },
  { id: "musculoskeletal", label: "Musculoskeletal", symptoms: ["myalgia", "joint pains", "joint swelling", "limitation of motion"] },
  { id: "hematopoietic", label: "Hematopoietic", symptoms: ["pallor", "bleeding", "easy bruisability"] },
];
