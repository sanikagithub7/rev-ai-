import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchWebsiteSafely, validateScrapeUrl } from "@/lib/ai/scraper";
import { analyzeWebsiteReviewWithQwen } from "@/lib/ai/ollama";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!member) {
      return NextResponse.json({ success: false, error: "No organization workspace found." }, { status: 403 });
    }

    const { data: reviews, error } = await supabase
      .from("project_reviews")
      .select("*")
      .eq("organization_id", member.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reviews: reviews || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!member) {
      return NextResponse.json({ success: false, error: "No organization workspace found." }, { status: 403 });
    }

    const body = await request.json();
    const { websiteUrl } = body || {};

    if (!websiteUrl || typeof websiteUrl !== "string" || !websiteUrl.trim()) {
      return NextResponse.json({ success: false, error: "Website URL is required." }, { status: 400 });
    }

    const cleanUrl = websiteUrl.trim();

    // 1. SSRF Security & URL Format Validation
    const urlValidation = validateScrapeUrl(cleanUrl);
    if (!urlValidation.valid || !urlValidation.parsedUrl) {
      return NextResponse.json(
        { success: false, error: urlValidation.error || "Invalid website URL or blocked network address." },
        { status: 400 }
      );
    }

    const validatedTargetUrl = urlValidation.parsedUrl.toString();

    // 2. Fetch & Extract Website Content safely from server
    const scrapeResult = await fetchWebsiteSafely(validatedTargetUrl);
    if (!scrapeResult.success || !scrapeResult.textContent) {
      return NextResponse.json(
        { success: false, error: scrapeResult.error || "Unable to access or extract website content." },
        { status: 422 }
      );
    }

    // 3. Ollama + Qwen Analysis
    let reviewResult;
    try {
      reviewResult = await analyzeWebsiteReviewWithQwen({
        websiteUrl: validatedTargetUrl,
        title: scrapeResult.title,
        metaDescription: scrapeResult.metaDescription,
        headings: scrapeResult.headings,
        extractedText: scrapeResult.textContent,
      });
    } catch (aiErr: any) {
      return NextResponse.json(
        { success: false, error: aiErr.message || "AI Analysis unavailable — Ollama endpoint could not be reached." },
        { status: 503 }
      );
    }

    const projectName = scrapeResult.title || urlValidation.parsedUrl.hostname;
    const projectDescription = scrapeResult.metaDescription || scrapeResult.textContent.slice(0, 300);

    // 4. Save Complete Review to Supabase
    const { data: reviewRecord, error: insertError } = await supabase
      .from("project_reviews")
      .insert({
        organization_id: member.organization_id,
        created_by: user.id,
        project_name: projectName,
        website_url: validatedTargetUrl,
        project_description: projectDescription,
        target_audience: reviewResult.target_audience,
        product_service: reviewResult.primary_product_or_service,
        current_goal: "Website Conversion & Lead Gen Analysis",
        overall_score: reviewResult.overall_score,
        review_result: reviewResult,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ success: false, error: "Unable to save review to Supabase database." }, { status: 500 });
    }

    // 5. Audit Log in ai_runs
    await supabase.from("ai_runs").insert({
      organization_id: member.organization_id,
      user_id: user.id,
      type: "WEBSITE_REVIEW",
      model: reviewResult.modelUsed || "qwen2.5",
      prompt: `Website Review: ${validatedTargetUrl}`,
      output: JSON.stringify(reviewResult),
      status: "SUCCESS",
      tokens: 500,
    });

    return NextResponse.json({
      success: true,
      reviewId: reviewRecord.id,
      websiteUrl: validatedTargetUrl,
      review: reviewRecord,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to generate website review" }, { status: 500 });
  }
}
