import { NextRequest, NextResponse } from "next/server";
import type { CaseRecord, GeneratedNarrative, QuestionSet } from "@/lib/domain/types";
import { generateNarrative, generateReport } from "@/lib/ai/generate";
import { serializeCase } from "@/lib/ai/serialize";
import { verifyStage } from "@/lib/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { case: c, set } = (await req.json()) as { case: CaseRecord; set: QuestionSet };
    if (!c || !set) return NextResponse.json({ error: "case and set required" }, { status: 400 });
    const captured = serializeCase(c, set);

    const narrative: GeneratedNarrative = c.narrative ?? (await generateNarrative(c, set));

    let report = await generateReport(c, set, narrative);
    let verification = await verifyStage("report", report, captured);

    if (!verification.passed) {
      const retry = await generateReport(c, set, narrative);
      const retryVerify = await verifyStage("report", retry, captured, true);
      if (retryVerify.score >= verification.score) {
        report = retry;
        verification = retryVerify;
      }
    }
    return NextResponse.json({ report, narrative, verification });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
