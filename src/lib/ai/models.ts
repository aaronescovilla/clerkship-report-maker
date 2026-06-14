// Model mix. Cheaper models for augmentation/judging, strongest for the report.
// IDs are centralized here so they are trivial to swap.
export const MODELS = {
  augment: "claude-haiku-4-5-20251001",
  judge: "claude-haiku-4-5-20251001",
  narrative: "claude-sonnet-4-6",
  report: "claude-opus-4-8",
} as const;

export type ModelRole = keyof typeof MODELS;
