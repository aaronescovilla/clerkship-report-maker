// Core domain types for the clerkship app.
// These are intentionally framework-agnostic so they can be shared between
// the chip-interview UI, the AI generation pipeline, and the verification layer.

export type Specialty = "pediatrics";

/** A chip question's answer-input style. */
export type ChipKind = "single" | "multi" | "slider";

export interface ChipOption {
  /** Stable id used in answers + narrative assembly. */
  id: string;
  /** Label shown on the chip. */
  label: string;
  /**
   * Optional canonical clinical phrasing the narrative generator should prefer
   * over the short chip label (e.g. label "Yellow/thick" -> "yellow, thick nasal discharge").
   */
  phrase?: string;
  /** Marks a "pertinent negative" chip (e.g. "No fever") for ROS/HPI completeness. */
  negative?: boolean;
}

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  unit?: string;
  /** Optional labels at key points, e.g. {0: "None", 10: "Worst"}. */
  marks?: Record<number, string>;
}

export interface Question {
  id: string;
  /** The prompt the student reads/asks. */
  prompt: string;
  kind: ChipKind;
  /** Which report section this question feeds. */
  section: ReportSectionKey;
  options?: ChipOption[];
  slider?: SliderConfig;
  /** Short helper text shown under the question. */
  hint?: string;
  /**
   * When true, this question is a "key clinical point" the rubric expects to be
   * addressed; verification flags it if left blank.
   */
  required?: boolean;
}

export interface QuestionGroup {
  id: string;
  title: string;
  section: ReportSectionKey;
  questions: Question[];
}

export interface QuestionSet {
  complaintId: string;
  specialty: Specialty;
  /** "curated" = reviewed + cached; "ai" = generated on the fly then cached. */
  source: "curated" | "ai";
  version: number;
  groups: QuestionGroup[];
}

/** A single answer captured from the chip UI. */
export interface Answer {
  questionId: string;
  /** option ids for single/multi; number for slider. */
  selected?: string[];
  value?: number;
  /** Free-text "key note" captured outside the chip options. */
  note?: string;
}

/** One time-anchored entry on the HPI timeline. */
export interface TimelineEvent {
  id: string;
  /** Relative anchor, e.g. "2 weeks PTA", "1 day PTA", "few hours PTA", "onset". */
  label: string;
  /**
   * Sort key: number of hours prior to admission/consult (larger = earlier).
   * Onset is the largest. Lets us order events chronologically.
   */
  hoursPrior: number;
  /** Chip answers scoped to this interval (symptom/character/meds/response). */
  answers: Answer[];
  /** Free-text key notes for this interval. */
  note?: string;
}

export type ReportSectionKey =
  | "generalData"
  | "chiefComplaint"
  | "hpi"
  | "ros"
  | "birthMaternal"
  | "pastMedical"
  | "family"
  | "nutritional"
  | "immunization"
  | "developmental"
  | "personalSocial"
  | "environmental"
  | "physicalExam"
  | "caseDiscussion"
  | "management"
  | "drugIndex";

/** Objective data entered by the student (not patient-reported). */
export interface PhysicalExam {
  generalSurvey?: string;
  vitals?: {
    hr?: number;
    rr?: number;
    temp?: number;
    bp?: string;
    spo2?: number;
  };
  anthropometrics?: {
    weightKg?: number;
    lengthCm?: number;
    headCircumferenceCm?: number;
  };
  /** Free/normal-abnormal findings keyed by regional exam part. */
  findings?: Partial<Record<RegionalExamKey, string>>;
}

export type RegionalExamKey =
  | "skin"
  | "heent"
  | "neck"
  | "chestLungs"
  | "cardiovascular"
  | "abdomen"
  | "genitalia"
  | "anusRectum"
  | "extremities"
  | "neurologic";

export interface PatientHeader {
  // De-identified by default; full identifiers only included on local/non-shared export.
  fullName?: string;
  initials?: string;
  ageText?: string; // e.g. "6 months old"
  birthDate?: string;
  sex?: "male" | "female";
  address?: string;
  religion?: string;
  hospital?: string;
  informant?: string;
  reliabilityPct?: number;
  attendingPhysician?: string;
  historian?: string;
  group?: string;
  dateTaken?: string;
}

export type Stage = "interview" | "narrative" | "report";

export interface GeneratedNarrative {
  /** Section key -> narrative text (paragraph form, except ROS). */
  sections: Partial<Record<ReportSectionKey, string>>;
  model: string;
  createdAt: string;
}

export interface GeneratedReport {
  markdown: string;
  sections: Partial<Record<ReportSectionKey, string>>;
  model: string;
  createdAt: string;
}

export interface CaseRecord {
  id: string;
  ownerId?: string;
  specialty: Specialty;
  complaintId: string;
  complaintLabel: string;
  header: PatientHeader;
  /** Non-timeline chip answers (ROS, PMHx, family, etc.). */
  answers: Answer[];
  timeline: TimelineEvent[];
  pe: PhysicalExam;
  narrative?: GeneratedNarrative;
  report?: GeneratedReport;
  /** De-identified export toggle (default true for shared storage). */
  deidentified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Verification ----

export interface RubricCriterion {
  id: string;
  label: string;
  /** weight toward the section/stage score. */
  weight: number;
  /** Guidance for the LLM judge on what "meets" looks like. */
  guidance: string;
}

export interface RubricStage {
  stage: Stage;
  passThreshold: number; // 0..100
  criteria: RubricCriterion[];
}

export interface CriterionResult {
  id: string;
  label: string;
  score: number; // 0..1
  comment: string;
}

export interface VerificationResult {
  stage: Stage;
  score: number; // 0..100
  passed: boolean;
  /** Deterministic structural problems (missing sections/fields). */
  structural: string[];
  /** LLM-judge per-criterion feedback. */
  criteria: CriterionResult[];
  summary: string;
  /** Whether this was a regeneration attempt. */
  regenerated: boolean;
  model?: string;
}
