import { NextRequest, NextResponse } from "next/server";
import { analyzeLeadWithAI } from "@/lib/ai/salesAgent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, name, email, company, notes, autonomyMode } = body;

    if (!name) {
      return NextResponse.json({ error: "Lead name is required." }, { status: 400 });
    }

    const analysis = await analyzeLeadWithAI({
      leadId: leadId || crypto.randomUUID(),
      name,
      email,
      company,
      notes,
    });

    return NextResponse.json({
      success: true,
      analysis,
      autonomyMode: autonomyMode || "REQUIRE_APPROVAL",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
