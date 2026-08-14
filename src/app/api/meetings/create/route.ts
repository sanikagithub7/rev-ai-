import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRealGoogleMeetEvent } from "@/lib/google/calendar";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!member) {
      return NextResponse.json({ error: "No active workspace found." }, { status: 403 });
    }

    const body = await request.json();
    const { title, date, time, type, participantEmail, company, leadName } = body || {};

    if (!title || !date || !time || !participantEmail) {
      return NextResponse.json(
        { error: "Meeting title, date, time, and participant email are required." },
        { status: 400 }
      );
    }

    if (!participantEmail.includes("@") || !participantEmail.includes(".")) {
      return NextResponse.json({ error: "Please enter a valid participant email address." }, { status: 400 });
    }

    // Create real Google Calendar event + Google Meet
    const meetRes = await createRealGoogleMeetEvent({
      title: title.trim(),
      date: date.trim(),
      startTime: time.trim(),
      participantEmail: participantEmail.trim(),
      description: `Sales Discovery Meeting with ${leadName || participantEmail} (${company || "Prospect"}).`,
    });

    if (!meetRes.success || !meetRes.meetUrl) {
      return NextResponse.json({ error: meetRes.error || "Google authorization failed." }, { status: 500 });
    }

    const formattedDateTime = `${date} &bull; ${time}`;
    const prospectName = leadName?.trim() || participantEmail.split("@")[0].toUpperCase();

    const { data: insertedMeeting, error: insertErr } = await supabase
      .from("meetings")
      .insert({
        organization_id: member.organization_id,
        lead_name: prospectName,
        company: company?.trim() || "Independent Lead",
        date_time: formattedDateTime,
        type: type?.trim() || title.trim(),
        status: "CONFIRMED",
        meeting_link: meetRes.meetUrl,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      meeting: insertedMeeting,
      meetUrl: meetRes.meetUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unable to save data. Please try again." }, { status: 500 });
  }
}
