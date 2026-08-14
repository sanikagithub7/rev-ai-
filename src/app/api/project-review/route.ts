import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchWebsiteSafely } from "@/lib/ai/scraper";
import { generateProjectReviewWithQwen } from "@/lib/ai/ollama";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!member) {
      return NextResponse.json({ error: "No organization workspace found." }, { status: 403 });
    }

    const { data: reviews, error } = await supabase
      .from("project_reviews")
      .select("*")
      .eq("organization_id", member.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reviews: reviews || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!member) {
      return NextResponse.json({ error: "No organization workspace found." }, { status: 403 });
    }

    const body = await request.json();
    const {
      projectName,
      websiteUrl,
      projectDescription,
      targetAudience,
      productService,
      currentGoal = "Generate Leads",
      additionalContext,
    } = body || {};

    if (!projectName || typeof projectName !== "string" || !projectName.trim()) {
      return NextResponse.json({ error: "Project / Company Name is required." }, { status: 400 });
    }

    if (!projectDescription || typeof projectDescription !== "string" || !projectDescription.trim()) {
      return NextResponse.json({ error: "Project Description is required." }, { status: 400 });
    }

    let scrapedWebsiteText = "";
    let websiteWarning: string | null = null;

    if (websiteUrl && typeof websiteUrl === "string" && websiteUrl.trim()) {
      const cleanUrl = websiteUrl.trim();
      const scrapeResult = await fetchWebsiteSafely(cleanUrl);
      if (scrapeResult.success && scrapeResult.textContent) {
        scrapedWebsiteText = scrapeResult.textContent;
      } else {
        websiteWarning = "Website analysis unavailable. Review generated using the provided project information.";
      }
    }

    // Call Ollama Qwen AI for Project Review
    let reviewResult;
    try {
      reviewResult = await generateProjectReviewWithQwen({
        projectName: projectName.trim(),
        websiteUrl: websiteUrl?.trim(),
        projectDescription: projectDescription.trim(),
        targetAudience: targetAudience?.trim(),
        productService: productService?.trim(),
        currentGoal: currentGoal?.trim(),
        additionalContext: additionalContext?.trim(),
        scrapedWebsiteText,
      });
    } catch (aiErr: any) {
      return NextResponse.json(
        { error: aiErr.message || "AI PROJECT REVIEW IS CURRENTLY UNAVAILABLE — OLLAMA COULD NOT BE REACHED." },
        { status: 503 }
      );
    }

    // Save Review to Supabase
    const { data: reviewRecord, error: insertError } = await supabase
      .from("project_reviews")
      .insert({
        organization_id: member.organization_id,
        created_by: user.id,
        project_name: projectName.trim(),
        website_url: websiteUrl?.trim() || null,
        project_description: projectDescription.trim(),
        target_audience: targetAudience?.trim() || null,
        product_service: productService?.trim() || null,
        current_goal: currentGoal?.trim() || "Generate Leads",
        additional_context: additionalContext?.trim() || null,
        overall_score: reviewResult.overall_score,
        review_result: reviewResult,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: "Unable to save project review to database." }, { status: 500 });
    }

    // Audit Log in ai_runs
    await supabase.from("ai_runs").insert({
      organization_id: member.organization_id,
      user_id: user.id,
      type: "PROJECT_REVIEW",
      model: reviewResult.modelUsed || "qwen2.5",
      prompt: `Project Review: ${projectName.trim()}`,
      output: JSON.stringify(reviewResult),
      status: "SUCCESS",
      tokens: 450,
    });

    return NextResponse.json({
      success: true,
      review: reviewRecord,
      websiteWarning,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process project review" }, { status: 500 });
  }
}
