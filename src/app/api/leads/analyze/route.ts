import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeStructuredLeadIntelligenceWithQwen } from "@/lib/ai/ollama";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    // Get tenant context — always resolve org from user session
    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!member) {
      return NextResponse.json({ error: "No organization associated with account." }, { status: 403 });
    }

    const body = await request.json();
    const { leadId, url, name, email, company, industry, budget, statedRequirement, inboundMessage } = body || {};

    if (!leadId || typeof leadId !== "string") {
      return NextResponse.json({ error: "leadId is required for AI analysis." }, { status: 400 });
    }

    // Retrieve authoritative lead from Supabase
    const { data: existingLead, error: leadFetchErr } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .eq("organization_id", member.organization_id)
      .single();

    if (leadFetchErr || !existingLead) {
      return NextResponse.json({ error: "Lead not found or access denied." }, { status: 404 });
    }

    // Prepare lead payload from lead record or request body fallback
    const payload = {
      contactName: name?.trim() || existingLead.name || "Unknown Lead",
      companyName: company?.trim() || existingLead.company || "",
      email: email?.trim() || existingLead.email || "",
      phone: existingLead.phone || "",
      industry: industry?.trim() || existingLead.industry || "",
      budget: budget?.trim() || existingLead.budget || "",
      statedRequirement: statedRequirement?.trim() || existingLead.stated_requirement || "",
      inboundMessage: inboundMessage?.trim() || existingLead.inbound_notes || "",
    };

    // Execute Qwen AI Structured Lead Intelligence Analysis
    let aiResult;
    try {
      aiResult = await analyzeStructuredLeadIntelligenceWithQwen(payload);
    } catch (aiErr: any) {
      await supabase.from("ai_runs").insert({
        organization_id: member.organization_id,
        type: "QWEN_LEAD_INTELLIGENCE",
        model: "qwen2.5",
        input: { leadId, payload },
        output: { error: aiErr?.message },
        status: "FAILED",
        error: aiErr?.message,
      });

      return NextResponse.json({
        error: aiErr.message || "Ollama is unavailable. Please start Ollama and verify the configured Qwen model.",
      }, { status: 503 });
    }

    const existingMetadata = existingLead.metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      ai_intelligence: aiResult,
    };

    // UPDATE the SAME lead record in Supabase — NEVER insert a duplicate
    const { data: updatedLead, error: updateErr } = await supabase
      .from("leads")
      .update({
        score: aiResult.lead_score,
        heat_level: aiResult.classification,
        metadata: updatedMetadata,
      })
      .eq("id", leadId)
      .eq("organization_id", member.organization_id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Log execution to public.ai_runs
    await supabase.from("ai_runs").insert({
      organization_id: member.organization_id,
      type: "QWEN_LEAD_INTELLIGENCE",
      model: aiResult.modelUsed,
      input: { leadId, payload },
      output: aiResult,
      tokens: Math.round(((payload.inboundMessage || "").length + (payload.statedRequirement || "").length) / 4) + 120,
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      analysis: aiResult,
      intelligence: aiResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unable to analyze lead. Please try again." }, { status: 500 });
  }
}
