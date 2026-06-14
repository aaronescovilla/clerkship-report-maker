import type { QuestionSet, QuestionGroup } from "../types";

// Curated, reviewed question set for the "Cough and/or colds" chief complaint.
// The group with section "hpi" is a PER-INTERVAL TEMPLATE: the interview UI clones
// these questions onto each timeline event ("2 weeks PTA", "1 day PTA", etc.) so the
// AI can assemble a chronological HPI exactly as the manual prescribes
// (onset -> character -> aggravating/relieving -> meds + effect -> associated symptoms).

const HPI_TEMPLATE: QuestionGroup = {
  id: "hpi-template",
  title: "What changed at this point in time?",
  section: "hpi",
  questions: [
    {
      id: "cough",
      prompt: "Cough character",
      kind: "multi",
      section: "hpi",
      options: [
        { id: "none", label: "No cough", phrase: "no cough", negative: true },
        { id: "dry", label: "Dry", phrase: "dry, non-productive cough" },
        { id: "productive", label: "Productive", phrase: "productive cough" },
        { id: "whitish", label: "Whitish phlegm", phrase: "productive cough with whitish phlegm" },
        { id: "yellow", label: "Yellowish phlegm", phrase: "productive cough with yellowish phlegm" },
        { id: "blood", label: "Blood-tinged", phrase: "blood-tinged phlegm" },
        { id: "paroxysmal", label: "Paroxysmal", phrase: "paroxysmal cough" },
        { id: "barking", label: "Barking", phrase: "barking cough" },
        { id: "crackles", label: "Audible crackles", phrase: "audible crackles" },
        { id: "posttussive", label: "Post-tussive emesis", phrase: "post-tussive emesis" },
        { id: "night", label: "Worse at night", phrase: "worse at night" },
      ],
      hint: "Tap all that apply for this time point.",
    },
    {
      id: "rhinorrhea",
      prompt: "Colds / nasal discharge",
      kind: "multi",
      section: "hpi",
      options: [
        { id: "none", label: "No colds", phrase: "no colds", negative: true },
        { id: "clear", label: "Clear/watery", phrase: "clear, watery rhinorrhea" },
        { id: "mucoid", label: "Mucoid", phrase: "mucoid nasal discharge" },
        { id: "thick", label: "Yellow/thick", phrase: "yellow, thick nasal discharge" },
        { id: "congestion", label: "Congestion", phrase: "nasal congestion" },
      ],
    },
    {
      id: "associated",
      prompt: "Associated symptoms",
      kind: "multi",
      section: "hpi",
      options: [
        { id: "fever", label: "Fever", phrase: "fever" },
        { id: "warm", label: "Warm to touch", phrase: "noted to be warm to touch" },
        { id: "dob", label: "Difficulty breathing", phrase: "difficulty of breathing" },
        { id: "fast", label: "Fast breathing", phrase: "tachypnea" },
        { id: "retractions", label: "Chest retractions", phrase: "chest retractions" },
        { id: "wheeze", label: "Wheezing", phrase: "wheezing" },
        { id: "poorfeed", label: "Poor feeding", phrase: "decreased appetite" },
        { id: "lowactivity", label: "Decreased activity", phrase: "decreased activity" },
        { id: "vomiting", label: "Vomiting", phrase: "vomiting" },
        { id: "diarrhea", label: "Diarrhea", phrase: "diarrhea" },
        { id: "lowurine", label: "Decreased urine output", phrase: "decreased urine output" },
        { id: "none", label: "None of these", phrase: "no other associated symptoms", negative: true },
      ],
      hint: "Pertinent positives AND negatives both matter for the differential.",
    },
    {
      id: "intake",
      prompt: "Oral intake (bottles/day, if infant)",
      kind: "slider",
      section: "hpi",
      slider: { min: 0, max: 10, step: 1, unit: "bottles/day", marks: { 0: "None", 8: "Baseline" } },
      hint: "Leave at baseline if not relevant.",
    },
    {
      id: "meds",
      prompt: "Medications given (this interval)",
      kind: "multi",
      section: "hpi",
      options: [
        { id: "none", label: "None", negative: true },
        { id: "salbutamol", label: "Salbutamol neb" },
        { id: "amoxicillin", label: "Amoxicillin" },
        { id: "cefixime", label: "Cefixime" },
        { id: "cetirizine", label: "Cetirizine" },
        { id: "paracetamol", label: "Paracetamol" },
        { id: "carbocisteine", label: "Carbocisteine" },
      ],
      hint: "Use the note field for exact dose / brand / frequency.",
    },
    {
      id: "response",
      prompt: "Response to treatment",
      kind: "single",
      section: "hpi",
      options: [
        { id: "na", label: "N/A" },
        { id: "none", label: "No improvement", phrase: "with no improvement of symptoms" },
        { id: "minimal", label: "Minimal relief", phrase: "with minimal relief of symptoms" },
        { id: "improved", label: "Improved", phrase: "with improvement of symptoms" },
      ],
    },
    {
      id: "consult",
      prompt: "Consult done?",
      kind: "single",
      section: "hpi",
      options: [
        { id: "none", label: "No consult", phrase: "no consult was done" },
        { id: "private", label: "Private MD", phrase: "sought consult with a private physician" },
        { id: "center", label: "Health center", phrase: "sought consult at a health center" },
        { id: "er", label: "ER / admitted", phrase: "was advised admission" },
      ],
    },
  ],
};

const CONTEXT_GROUP: QuestionGroup = {
  id: "cough-context",
  title: "Complaint-specific context",
  section: "hpi",
  questions: [
    {
      id: "sick-contacts",
      prompt: "Sick contacts / exposures",
      kind: "multi",
      section: "hpi",
      options: [
        { id: "none", label: "None known", negative: true },
        { id: "household", label: "Sick household member" },
        { id: "daycare", label: "Daycare/school", },
        { id: "tb", label: "Known TB contact" },
        { id: "smoke", label: "Cigarette smoke exposure" },
      ],
    },
  ],
};

export const COUGH_COLDS_SET: QuestionSet = {
  complaintId: "cough-colds",
  specialty: "pediatrics",
  source: "curated",
  version: 1,
  groups: [HPI_TEMPLATE, CONTEXT_GROUP],
};
