import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapeWebsiteContent } from "@/lib/ai/scraper";
import { analyzeLeadWithQwen } from "@/lib/ai/ollama";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    // Get tenant context — always resolve org from session, never trust frontend
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
    // leadId is required — we UPDATE the existing lead, never create a duplicate
    const { leadId, url, name, email, company } = body || {};

    if (!leadId || typeof leadId !== "string") {
      return NextResponse.json({ error: "leadId is required for AI analysis." }, { status: 400 });
    }

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Website URL is required for AI analysis." }, { status: 400 });
    }

    // Verify that the lead belongs to this user's organization (tenant isolation)
    const { data: existingLead, error: leadFetchErr } = await supabase
      .from("leads")
      .select("id, organization_id")
      .eq("id", leadId)
      .eq("organization_id", member.organization_id)
      .single();

    if (leadFetchErr || !existingLead) {
      return NextResponse.json({ error: "Lead not found or access denied." }, { status: 404 });
    }

    // 1. SSRF-Safe Server Scraping
    const scrapeRes = await scrapeWebsiteContent(url);
    if (!scrapeRes.success || !scrapeRes.content) {
      return NextResponse.json({
        error: scrapeRes.error || "Website could not be analyzed.",
      }, { status: 422 });
    }

    // 2. Ollama + Qwen Lead Analysis
    let aiResults;
    try {
      aiResults = await analyzeLeadWithQwen(url, scrapeRes.content);
    } catch (aiErr: any) {
      return NextResponse.json({
        error: aiErr.message || "AI service is currently unavailable.",
      }, { status: 503 });
    }

    // 3. Compute score and heat_level from AI results
    const score = aiResults.hot_lead.result
      ? Math.max(85, aiResults.hot_lead.confidence)
      : Math.round(aiResults.lead_qualification.confidence * 0.8);

    // Map AI result to heat_level (HOT / WARM / COLD)
    let heat_level: string;
    if (aiResults.hot_lead.result) {
      heat_level = "HOT";
    } else if (score >= 50) {
      heat_level = "WARM";
    } else {
      heat_level = "COLD";
    }

    const metadata = {
      website_url: url,
      hot_lead: aiResults.hot_lead,
      spam_detection: aiResults.spam_detection,
      lead_qualification: aiResults.lead_qualification,
      model_used: aiResults.modelUsed,
      analyzed_at: new Date().toISOString(),
    };

    // 4. UPDATE the existing lead — NEVER insert a new one
    const { data: updatedLead, error: updateErr } = await supabase
      .from("leads")
      .update({
        score,
        heat_level,
        metadata,
      })
      .eq("id", leadId)
      .eq("organization_id", member.organization_id) // double-check org isolation
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 5. Record in ai_runs audit log
    await supabase.from("ai_runs").insert({
      organization_id: member.organization_id,
      type: "QWEN_LEAD_INTELLIGENCE",
      model: aiResults.modelUsed,
      input: { website_url: url, lead_id: leadId },
      output: metadata,
      tokens: Math.round(scrapeRes.content.length / 4),
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      analysis: aiResults,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unable to analyze lead. Please try again." }, { status: 500 });
  }
}
