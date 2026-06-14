import type { QuestionSet } from "../types";
import { COUGH_COLDS_SET } from "./coughColds";

const CURATED: Record<string, QuestionSet> = {
  "cough-colds": COUGH_COLDS_SET,
};

export function getCuratedSet(complaintId: string): QuestionSet | undefined {
  return CURATED[complaintId];
}

export { COUGH_COLDS_SET };
