import type { Question, QuestionGroup, QuestionSet, ReportSectionKey } from "./types";
import { ROS_SYSTEMS } from "./ros";
import { VACCINES } from "./milestones";

// Standard pediatric history modules shared across ALL chief complaints
// (per the manual, these sections are taken for every pediatric case; only the
// HPI and the relevant ROS vary by complaint). Rendered after the
// complaint-specific HPI questions in the interview.

function yn(id: string, prompt: string, section: ReportSectionKey, opts: string[], hint?: string): Question {
  return {
    id,
    prompt,
    kind: "multi",
    section,
    hint,
    options: [
      { id: "none", label: "None / not applicable", negative: true },
      ...opts.map((o) => {
        const slug = o.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        return { id: slug, label: o, term: slug };
      }),
    ],
  };
}

// ROS group generated from the manual's organ-system map.
const ROS_GROUP: QuestionGroup = {
  id: "ros",
  title: "Review of Systems",
  section: "ros",
  questions: ROS_SYSTEMS.map<Question>((sys) => ({
    id: `ros:${sys.id}`,
    prompt: sys.label,
    kind: "multi",
    section: "ros",
    options: [
      { id: "none", label: "(all negative)", negative: true },
      ...sys.symptoms.map((s) => {
        const slug = s.replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-+|-+$/g, "");
        return { id: slug, label: s, term: slug };
      }),
    ],
  })),
};

const BIRTH_MATERNAL: QuestionGroup = {
  id: "birthMaternal",
  title: "Birth & Maternal History",
  section: "birthMaternal",
  questions: [
    { id: "bm:obscore", prompt: "Obstetric score / maternal age", kind: "single", section: "birthMaternal", options: [{ id: "noted", label: "Recorded in notes" }, { id: "unknown", label: "Unknown" }], hint: "Use the note field for G_P_ (____), maternal/paternal age." },
    yn("bm:maternal-illness", "Maternal illnesses during pregnancy", "birthMaternal", ["Bleeding/spotting", "Infection/fever", "PROM", "Hypertension", "Diabetes"]),
    yn("bm:exposures", "Exposure to toxigens/substances", "birthMaternal", ["Alcohol", "Cigarette", "Radiation", "Prohibited drugs"]),
    { id: "bm:delivery", prompt: "Type of delivery", kind: "single", section: "birthMaternal", options: [{ id: "nsvd", label: "NSVD" }, { id: "cs", label: "Cesarean" }, { id: "assisted", label: "Assisted" }] },
    { id: "bm:term", prompt: "Maturity", kind: "single", section: "birthMaternal", options: [{ id: "term", label: "Term" }, { id: "preterm", label: "Pre-term" }, { id: "postterm", label: "Post-term" }] },
    { id: "bm:nicu", prompt: "Admitted to NICU?", kind: "single", section: "birthMaternal", options: [{ id: "no", label: "No", negative: true }, { id: "yes", label: "Yes" }] },
  ],
};

const PAST_MEDICAL: QuestionGroup = {
  id: "pastMedical",
  title: "Past Medical History",
  section: "pastMedical",
  questions: [
    yn("pmh:illness", "Past illnesses", "pastMedical", ["Measles", "Mumps", "Chickenpox"], "Use the note field for details, severity, complications."),
    { id: "pmh:hospitalization", prompt: "Prior hospitalizations", kind: "single", section: "pastMedical", options: [{ id: "no", label: "None", negative: true }, { id: "yes", label: "Yes (note details)" }] },
    { id: "pmh:surgery", prompt: "Operations / surgeries / injuries", kind: "single", section: "pastMedical", options: [{ id: "no", label: "None", negative: true }, { id: "yes", label: "Yes (note details)" }] },
    { id: "pmh:maintenance", prompt: "Maintenance medications", kind: "single", section: "pastMedical", options: [{ id: "no", label: "None", negative: true }, { id: "yes", label: "Yes (note details)" }] },
  ],
};

const FAMILY: QuestionGroup = {
  id: "family",
  title: "Family History",
  section: "family",
  questions: [
    yn("fh:conditions", "Heredofamilial conditions", "family", ["Asthma", "Cancer", "Diabetes", "Heart disease", "Hypertension", "Kidney disease", "Lung disease", "Tuberculosis", "Allergies/Atopy", "Congenital/Genetic disorder"], "Use the note field for the affected side & relation."),
  ],
};

const NUTRITIONAL: QuestionGroup = {
  id: "nutritional",
  title: "Nutritional History",
  section: "nutritional",
  questions: [
    { id: "nut:feeding", prompt: "Feeding history", kind: "single", section: "nutritional", options: [{ id: "breast", label: "Breastfed" }, { id: "formula", label: "Formula" }, { id: "mixed", label: "Mixed" }] },
    { id: "nut:appetite", prompt: "Baseline appetite", kind: "single", section: "nutritional", options: [{ id: "good", label: "Good" }, { id: "picky", label: "Picky eater" }] },
    { id: "nut:vitamins", prompt: "Multivitamins", kind: "single", section: "nutritional", options: [{ id: "no", label: "No", negative: true }, { id: "yes", label: "Yes (note)" }] },
  ],
};

const IMMUNIZATION: QuestionGroup = {
  id: "immunization",
  title: "Immunization History",
  section: "immunization",
  questions: [
    {
      id: "imm:vaccines",
      prompt: "Vaccines received",
      kind: "multi",
      section: "immunization",
      options: VACCINES.map((v) => {
        const id = v.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
        return { id, label: v, term: id.replace(/^-+|-+$/g, "") };
      }),
      hint: "Use the note field for doses, ages given, and any reactions.",
    },
    { id: "imm:status", prompt: "Completeness for age", kind: "single", section: "immunization", options: [{ id: "complete", label: "Complete for age" }, { id: "incomplete", label: "Incomplete" }, { id: "unknown", label: "Unknown" }] },
  ],
};

const DEVELOPMENTAL: QuestionGroup = {
  id: "developmental",
  title: "Developmental History",
  section: "developmental",
  questions: [
    { id: "dev:status", prompt: "Development for age", kind: "single", section: "developmental", options: [{ id: "atpar", label: "At par for age" }, { id: "delay", label: "Delay/concern (note)" }], hint: "Milestone reference is shown in the side panel." },
  ],
};

const PERSONAL_SOCIAL: QuestionGroup = {
  id: "personalSocial",
  title: "Personal & Social History",
  section: "personalSocial",
  questions: [
    { id: "ps:livesWith", prompt: "Child lives with", kind: "multi", section: "personalSocial", options: [{ id: "both", label: "Both parents" }, { id: "mother", label: "Mother" }, { id: "father", label: "Father" }, { id: "others", label: "Others (note)" }] },
    { id: "ps:gadget", prompt: "TV/gadget exposure", kind: "single", section: "personalSocial", options: [{ id: "none", label: "None", negative: true }, { id: "some", label: "Yes (note duration)" }] },
  ],
};

const ENVIRONMENTAL: QuestionGroup = {
  id: "environmental",
  title: "Environmental History",
  section: "environmental",
  questions: [
    yn("env:exposure", "Exposure to cigarette smoke / pollutants", "environmental", ["Cigarette smoke", "Air pollutants"]),
    { id: "env:water", prompt: "Drinking water source", kind: "single", section: "environmental", options: [{ id: "mineral", label: "Mineral/purified" }, { id: "tap", label: "Tap/NAWASA" }, { id: "deepwell", label: "Deep well" }] },
  ],
};

export const STANDARD_MODULES: QuestionGroup[] = [
  ROS_GROUP,
  BIRTH_MATERNAL,
  PAST_MEDICAL,
  FAMILY,
  NUTRITIONAL,
  IMMUNIZATION,
  DEVELOPMENTAL,
  PERSONAL_SOCIAL,
  ENVIRONMENTAL,
];

/** A flat id->question registry merging a complaint's set with standard modules. */
export function buildQuestionRegistry(set: QuestionSet): Map<string, Question> {
  const map = new Map<string, Question>();
  for (const g of [...set.groups, ...STANDARD_MODULES]) {
    for (const q of g.questions) map.set(q.id, q);
  }
  return map;
}

/** All non-HPI groups the interview should render (after the timeline). */
export const REGIONAL_EXAM_PARTS = [
  { key: "skin", label: "Skin" },
  { key: "heent", label: "HEENT" },
  { key: "neck", label: "Neck" },
  { key: "chestLungs", label: "Chest & Lungs" },
  { key: "cardiovascular", label: "Cardiovascular" },
  { key: "abdomen", label: "Abdomen" },
  { key: "genitalia", label: "Genitalia" },
  { key: "anusRectum", label: "Anus & Rectum" },
  { key: "extremities", label: "Extremities" },
  { key: "neurologic", label: "Neurologic" },
] as const;
