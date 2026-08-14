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

    // Get tenant context
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
    const { url, name, email, company } = body || {};

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Website URL is required for AI analysis." }, { status: 400 });
    }

    // 1. SSRF-Safe Server Scraping
    const scrapeRes = await scrapeWebsiteContent(url);
    if (!scrapeRes.success || !scrapeRes.content) {
      return NextResponse.json({
        error: scrapeRes.error || "Website could not be analyzed.",
      }, { status: 422 });
    }

    // 2. Ollama + Qwen Lead Analysis (Exactly 3 Results)
    let aiResults;
    try {
      aiResults = await analyzeLeadWithQwen(url, scrapeRes.content);
    } catch (aiErr: any) {
      return NextResponse.json({
        error: aiErr.message || "AI service is currently unavailable.",
      }, { status: 503 });
    }

    // 3. Save Lead & AI Results to Supabase
    const leadName = name?.trim() || company?.trim() || url.replace(/^https?:\/\//, "").split("/")[0];
    const score = aiResults.hot_lead.result ? Math.max(85, aiResults.hot_lead.confidence) : Math.round(aiResults.lead_qualification.confidence * 0.8);
    const status = aiResults.hot_lead.result ? "HOT" : aiResults.lead_qualification.status === "QUALIFIED" ? "QUALIFIED" : "NEW";

    const metadata = {
      website_url: url,
      hot_lead: aiResults.hot_lead,
      spam_detection: aiResults.spam_detection,
      lead_qualification: aiResults.lead_qualification,
      model_used: aiResults.modelUsed,
      analyzed_at: new Date().toISOString(),
    };

    const { data: insertedLead, error: insertErr } = await supabase
      .from("leads")
      .insert({
        organization_id: member.organization_id,
        name: leadName,
        email: email?.trim() || null,
        company: company?.trim() || url.replace(/^https?:\/\//, "").split("/")[0],
        status,
        score,
        metadata,
      })
      .select()
      .single();

    // Also record in ai_runs audit log
    await supabase.from("ai_runs").insert({
      organization_id: member.organization_id,
      type: "QWEN_LEAD_INTELLIGENCE",
      model: aiResults.modelUsed,
      input: { website_url: url },
      output: metadata,
      tokens: Math.round(scrapeRes.content.length / 4),
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      lead: insertedLead,
      analysis: aiResults,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unable to save data. Please try again." }, { status: 500 });
  }
}
