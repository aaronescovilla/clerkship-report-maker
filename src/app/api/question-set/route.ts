import { NextRequest, NextResponse } from "next/server";
import { getOrGenerateQuestionSet } from "@/lib/ai/questionset";
import { verifyStage } from "@/lib/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { complaintId } = await req.json();
    if (!complaintId) return NextResponse.json({ error: "complaintId required" }, { status: 400 });
    const set = await getOrGenerateQuestionSet(complaintId);
    // Verify the question set (interview stage) — curated sets pass trivially.
    const verification = await verifyStage("interview", set, `Chief complaint: ${complaintId}`);
    return NextResponse.json({ set, verification });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
