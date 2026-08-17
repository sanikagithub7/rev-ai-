import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteGoogleCalendarEvent } from "@/lib/google/calendar";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
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
      return NextResponse.json({ error: "No active workspace found" }, { status: 403 });
    }

    // Fetch existing meeting
    const { data: meeting, error: fetchErr } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .eq("organization_id", member.organization_id)
      .single();

    if (fetchErr || !meeting) {
      return NextResponse.json({ error: "Meeting not found or access denied." }, { status: 404 });
    }

    // Fetch Google OAuth token if google_event_id is present
    if (meeting.google_event_id) {
      const { data: tokenRecord } = await supabase
        .from("user_google_tokens")
        .select("access_token")
        .eq("user_id", user.id)
        .eq("organization_id", member.organization_id)
        .limit(1)
        .single();

      if (tokenRecord?.access_token) {
        await deleteGoogleCalendarEvent(meeting.google_event_id, tokenRecord.access_token);
      }
    }

    // Update Supabase status to CANCELLED
    const { data: updated, error: updateErr } = await supabase
      .from("meetings")
      .update({ status: "CANCELLED" })
      .eq("id", meetingId)
      .eq("organization_id", member.organization_id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, meeting: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to cancel meeting." }, { status: 500 });
  }
}
