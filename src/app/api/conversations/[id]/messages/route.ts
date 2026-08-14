import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .eq("organization_id", member.organization_id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { text, content, sender = "user" } = body || {};
    const messageContent = (text || content || "").trim();

    if (!messageContent) {
      return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
    }

    const timestampStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const senderName = sender === "user" ? user.email?.split("@")[0].toUpperCase() || "YOU" : sender === "agent" ? "AI AUTOPILOT AGENT" : "PROSPECT";

    // 1. Insert message
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .insert({
        organization_id: member.organization_id,
        conversation_id: id,
        sender,
        sender_name: senderName,
        text: messageContent,
        timestamp: timestampStr,
      })
      .select()
      .single();

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    // 2. Update Conversation last_message
    await supabase
      .from("conversations")
      .update({
        last_message: messageContent,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", member.organization_id);

    // 3. Emit event for Workflow Engine
    await supabase.from("conversation_events").insert({
      organization_id: member.organization_id,
      conversation_id: id,
      event_type: "NEW_MESSAGE",
      title: "New message received in thread",
      details: { sender, text: messageContent.slice(0, 100) },
    });

    return NextResponse.json({ success: true, message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send message" }, { status: 500 });
  }
}
