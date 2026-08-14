import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "ALL STATUSES";
    const priority = searchParams.get("priority")?.trim() || "ALL PRIORITIES";
    const heatLevel = searchParams.get("heat_level")?.trim() || "ALL HEAT LEVELS";
    const sortField = searchParams.get("sort_field")?.trim() || "CREATED DATE";
    const sortOrder = searchParams.get("sort_order")?.trim() || "DESCENDING";

    let query = supabase
      .from("leads")
      .select("*")
      .eq("organization_id", member.organization_id);

    // Apply Status Filter
    if (status && status !== "ALL STATUSES" && status !== "ALL") {
      query = query.eq("status", status);
    }

    // Apply Priority Filter
    if (priority && priority !== "ALL PRIORITIES" && priority !== "ALL") {
      query = query.eq("priority", priority);
    }

    // Apply Heat Level (AI Classification) Filter
    if (heatLevel && heatLevel !== "ALL HEAT LEVELS" && heatLevel !== "ALL") {
      query = query.eq("heat_level", heatLevel);
    }

    // Apply Search Filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }

    // Apply Sorting
    let column = "created_at";
    if (sortField === "NAME") column = "name";
    if (sortField === "AI SCORE") column = "score";
    if (sortField === "COMPANY") column = "company";

    const ascending = sortOrder === "ASCENDING";
    query = query.order(column, { ascending });

    const { data: leads, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leads: leads || [] });
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
      name,
      email,
      phone,
      company,
      industry,
      source = "Website",
      budget,
      status = "NEW",
      priority = "NORMAL",
      stated_requirement,
      inbound_notes,
    } = body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Lead Name is required." }, { status: 400 });
    }

    const { data: lead, error: insertError } = await supabase
      .from("leads")
      .insert({
        organization_id: member.organization_id,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        industry: industry?.trim() || null,
        source: source?.trim() || "Website",
        budget: budget?.trim() || null,
        status: status?.trim() || "NEW",
        priority: priority?.trim() || "NORMAL",
        stated_requirement: stated_requirement?.trim() || null,
        inbound_notes: inbound_notes?.trim() || null,
        score: 0,
        heat_level: "NOT ANALYZED",
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create lead" }, { status: 500 });
  }
}
