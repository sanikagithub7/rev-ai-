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

    // Determine user's organization server-side (tenant isolation)
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
    const {
      leadId,
      contactName,
      companyName,
      email,
      phone,
      industry,
      budget,
      statedRequirement,
      inboundMessage,
    } = body || {};

    if (!contactName || typeof contactName !== "string" || !contactName.trim()) {
      return NextResponse.json({ error: "Contact Name is required for AI analysis." }, { status: 422 });
    }

    let activeLeadId = leadId;
    let existingMetadata: any = {};

    // 1. Verify/Retrieve existing lead OR create new lead if leadId not provided
    if (activeLeadId) {
      const { data: existingLead, error: leadFetchErr } = await supabase
        .from("leads")
        .select("id, organization_id, metadata")
        .eq("id", activeLeadId)
        .eq("organization_id", member.organization_id)
        .single();

      if (leadFetchErr || !existingLead) {
        return NextResponse.json({ error: "Lead not found or access denied." }, { status: 404 });
      }
      existingMetadata = existingLead.metadata || {};
    } else {
      // Create new lead record if user typed new data directly in Left Panel
      const { data: newLead, error: createErr } = await supabase
        .from("leads")
        .insert({
          organization_id: member.organization_id,
          name: contactName.trim(),
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          company: companyName?.trim() || null,
          industry: industry?.trim() || null,
          source: "AI Intelligence Form",
          budget: budget?.trim() || null,
          status: "NEW",
          priority: "NORMAL",
          stated_requirement: statedRequirement?.trim() || null,
          inbound_notes: inboundMessage?.trim() || null,
          score: 0,
          heat_level: "NOT ANALYZED",
        })
        .select()
        .single();

      if (createErr || !newLead) {
        return NextResponse.json({ error: `Failed to initialize lead: ${createErr?.message}` }, { status: 500 });
      }
      activeLeadId = newLead.id;
    }

    // 2. Execute Server-Side Ollama + Qwen Structured AI Lead Analysis
    let aiResult;
    try {
      aiResult = await analyzeStructuredLeadIntelligenceWithQwen({
        contactName: contactName.trim(),
        companyName: companyName?.trim(),
        email: email?.trim(),
        phone: phone?.trim(),
        industry: industry?.trim(),
        budget: budget?.trim(),
        statedRequirement: statedRequirement?.trim(),
        inboundMessage: inboundMessage?.trim(),
      });
    } catch (aiErr: any) {
      // Audit log failed attempt in ai_runs
      await supabase.from("ai_runs").insert({
        organization_id: member.organization_id,
        type: "QWEN_LEAD_INTELLIGENCE",
        model: "qwen2.5",
        input: { leadId: activeLeadId, contactName, companyName, industry },
        output: { error: aiErr?.message },
        status: "FAILED",
        error: aiErr?.message,
      });

      return NextResponse.json(
        { error: aiErr?.message || "AI service is currently unavailable. Ensure Ollama is running." },
        { status: 503 }
      );
    }

    // 3. Update the SAME lead in Supabase (No Duplicate Record)
    const updatedMetadata = {
      ...existingMetadata,
      ai_intelligence: aiResult,
    };

    const { data: updatedLead, error: updateErr } = await supabase
      .from("leads")
      .update({
        name: contactName.trim(),
        company: companyName?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        industry: industry?.trim() || null,
        budget: budget?.trim() || null,
        stated_requirement: statedRequirement?.trim() || null,
        inbound_notes: inboundMessage?.trim() || null,
        score: aiResult.lead_score,
        heat_level: aiResult.classification,
        metadata: updatedMetadata,
      })
      .eq("id", activeLeadId)
      .eq("organization_id", member.organization_id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: `Failed to persist AI results: ${updateErr.message}` }, { status: 500 });
    }

    // 4. Record Audit Log in public.ai_runs
    await supabase.from("ai_runs").insert({
      organization_id: member.organization_id,
      type: "QWEN_LEAD_INTELLIGENCE",
      model: aiResult.modelUsed,
      input: {
        lead_id: activeLeadId,
        contact_name: contactName,
        company_name: companyName,
        industry,
        budget,
        stated_requirement: statedRequirement,
        inbound_message: inboundMessage,
      },
      output: aiResult,
      tokens: Math.round(((inboundMessage || "").length + (statedRequirement || "").length) / 4) + 150,
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      intelligence: aiResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error while processing lead intelligence." },
      { status: 500 }
    );
  }
}
