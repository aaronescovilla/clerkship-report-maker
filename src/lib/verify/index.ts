import type { GeneratedNarrative, GeneratedReport, QuestionSet, Stage, VerificationResult } from "../domain/types";
import { getRubric } from "../domain/rubric";
import { deterministicCheck } from "./deterministic";
import { judge } from "./judge";

function artifactToText(stage: Stage, artifact: QuestionSet | GeneratedNarrative | GeneratedReport): string {
  if (stage === "interview") {
    const s = artifact as QuestionSet;
    return s.groups.map((g) => `${g.title}\n` + g.questions.map((q) => `- ${q.prompt} [${q.kind}]: ${(q.options ?? []).map((o) => o.label).join(", ")}`).join("\n")).join("\n\n");
  }
  if (stage === "narrative") {
    const n = artifact as GeneratedNarrative;
    return Object.entries(n.sections).map(([k, v]) => `## ${k}\n${v}`).join("\n\n");
  }
  return (artifact as GeneratedReport).markdown;
}

/**
 * Hybrid verification: deterministic structural checks + weighted LLM-judge score.
 * Combined score is reduced by structural issues. `passed` requires meeting the
 * stage threshold with no structural problems.
 */
export async function verifyStage(
  stage: Stage,
  artifact: QuestionSet | GeneratedNarrative | GeneratedReport,
  capturedData: string,
  regenerated = false,
): Promise<VerificationResult> {
  const rubric = getRubric(stage);
  const structural = deterministicCheck(stage, artifact);
  const artifactText = artifactToText(stage, artifact);
  const { criteria, summary, model } = await judge(rubric, artifactText, capturedData);

  const totalWeight = rubric.criteria.reduce((s, c) => s + c.weight, 0) || 1;
  const weighted = rubric.criteria.reduce((s, c) => {
    const got = criteria.find((x) => x.id === c.id);
    return s + c.weight * (got?.score ?? 0);
  }, 0) / totalWeight;
  const penalty = structural.length * 8;
  const score = Math.max(0, Math.round(weighted * 100 - penalty));
  const passed = score >= rubric.passThreshold && structural.length === 0;

  return { stage, score, passed, structural, criteria, summary, regenerated, model };
}
