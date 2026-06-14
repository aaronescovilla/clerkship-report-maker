import type { CriterionResult, RubricStage } from "../domain/types";
import { complete, hasApiKey, parseJson } from "../ai/anthropic";
import { MODELS } from "../ai/models";
import { JUDGE_SYSTEM } from "../ai/prompts";

interface JudgeResponse {
  criteria: { id: string; score: number; comment: string }[];
  summary: string;
}

/** LLM-as-judge scoring of an artifact against a rubric stage. */
export async function judge(
  rubric: RubricStage,
  artifactText: string,
  capturedData: string,
): Promise<{ criteria: CriterionResult[]; summary: string; model: string }> {
  if (!hasApiKey()) return heuristicJudge(rubric, artifactText);

  const rubricText = rubric.criteria
    .map((c) => `- ${c.id} (${c.label}): ${c.guidance}`)
    .join("\n");
  const text = await complete({
    model: MODELS.judge,
    system: JUDGE_SYSTEM,
    user: `RUBRIC (stage: ${rubric.stage}):\n${rubricText}\n\nCAPTURED CASE DATA (ground truth — flag anything in the artifact not supported here):\n${capturedData}\n\nARTIFACT TO SCORE:\n${artifactText}\n\nReturn the JSON now.`,
    maxTokens: 1500,
    temperature: 0,
  });
  const parsed = parseJson<JudgeResponse>(text);
  const byId = new Map(parsed.criteria.map((c) => [c.id, c]));
  const criteria: CriterionResult[] = rubric.criteria.map((c) => {
    const got = byId.get(c.id);
    return { id: c.id, label: c.label, score: clamp01(got?.score ?? 0.6), comment: got?.comment ?? "No comment." };
  });
  return { criteria, summary: parsed.summary ?? "", model: MODELS.judge };
}

// Offline fallback: score from simple textual signals so the pipeline still works.
function heuristicJudge(rubric: RubricStage, artifactText: string): { criteria: CriterionResult[]; summary: string; model: string } {
  const len = artifactText.trim().length;
  const base = len > 1200 ? 0.82 : len > 400 ? 0.72 : len > 80 ? 0.6 : 0.4;
  const criteria: CriterionResult[] = rubric.criteria.map((c) => ({
    id: c.id, label: c.label, score: base,
    comment: "Heuristic estimate (no API key); add ANTHROPIC_API_KEY for a real rubric critique.",
  }));
  return { criteria, summary: "Heuristic score only — LLM judge disabled without an API key.", model: "heuristic" };
}

function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }
