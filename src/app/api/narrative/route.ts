import { NextRequest, NextResponse } from "next/server";
import type { CaseRecord, QuestionSet } from "@/lib/domain/types";
import { generateNarrative } from "@/lib/ai/generate";
import { serializeCase } from "@/lib/ai/serialize";
import { verifyStage } from "@/lib/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { case: c, set } = (await req.json()) as { case: CaseRecord; set: QuestionSet };
    if (!c || !set) return NextResponse.json({ error: "case and set required" }, { status: 400 });
    const captured = serializeCase(c, set);

    let narrative = await generateNarrative(c, set);
    let verification = await verifyStage("narrative", narrative, captured);

    // Regenerate once if below threshold, then warn + allow override.
    if (!verification.passed) {
      const retry = await generateNarrative(c, set);
      const retryVerify = await verifyStage("narrative", retry, captured, true);
      if (retryVerify.score >= verification.score) {
        narrative = retry;
        verification = retryVerify;
      }
    }
    return NextResponse.json({ narrative, verification });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
