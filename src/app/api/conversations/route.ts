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
    const status = searchParams.get("status")?.trim() || "All Status";
    const priority = searchParams.get("priority")?.trim() || "All Priorities";
    const assignee = searchParams.get("assignee")?.trim() || "All Team";
    const leadId = searchParams.get("leadId")?.trim();

    let query = supabase
      .from("conversations")
      .select("*, leads(*)")
      .eq("organization_id", member.organization_id);

    if (leadId) {
      query = query.eq("lead_id", leadId);
    }

    if (status && status !== "All Status" && status !== "ALL") {
      query = query.eq("status", status);
    }

    if (priority && priority !== "All Priorities" && priority !== "ALL") {
      query = query.eq("priority", priority);
    }

    if (assignee && assignee !== "All Team" && assignee !== "ALL") {
      query = query.eq("assignee", assignee);
    }

    if (search) {
      query = query.or(`subject.ilike.%${search}%,lead_name.ilike.%${search}%,lead_company.ilike.%${search}%`);
    }

    query = query.order("updated_at", { ascending: false });

    const { data: conversations, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversations: conversations || [] });
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
      lead_id,
      subject,
      channel = "WEB",
      priority = "NORMAL",
      assignee = "Unassigned",
      initial_message,
    } = body || {};

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json({ error: "Conversation subject is required." }, { status: 400 });
    }

    let leadName = "Direct Inquiry / No Lead";
    let leadCompany = "Inbound Prospect";

    if (lead_id && lead_id !== "NO_LEAD") {
      const { data: lead } = await supabase
        .from("leads")
        .select("name, company")
        .eq("id", lead_id)
        .eq("organization_id", member.organization_id)
        .maybeSingle();

      if (lead) {
        leadName = lead.name;
        leadCompany = lead.company || "Independent";
      }
    }

    const initialMsgText = initial_message?.trim() || "";

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        organization_id: member.organization_id,
        lead_id: lead_id && lead_id !== "NO_LEAD" ? lead_id : null,
        lead_name: leadName,
        lead_company: leadCompany,
        subject: subject.trim(),
        channel: channel?.trim() || "WEB",
        priority: priority?.trim() || "NORMAL",
        assignee: assignee?.trim() || "Unassigned",
        status: "ACTIVE",
        last_message: initialMsgText || "Conversation started",
        unread_count: 0,
      })
      .select()
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: convError?.message || "Failed to create conversation" }, { status: 500 });
    }

    // Insert Initial Message if provided
    if (initialMsgText) {
      await supabase.from("messages").insert({
        organization_id: member.organization_id,
        conversation_id: conversation.id,
        sender: "user",
        sender_name: user.email?.split("@")[0].toUpperCase() || "YOU",
        text: initialMsgText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    }

    // Record Event for Workflow Engine
    await supabase.from("conversation_events").insert({
      organization_id: member.organization_id,
      conversation_id: conversation.id,
      lead_id: lead_id && lead_id !== "NO_LEAD" ? lead_id : null,
      event_type: "NEW_CONVERSATION",
      title: `New conversation started: ${subject.trim()}`,
      details: { subject: subject.trim(), channel, priority },
    });

    return NextResponse.json({ success: true, conversation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create conversation" }, { status: 500 });
  }
}
