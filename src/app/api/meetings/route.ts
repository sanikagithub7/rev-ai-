import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createGoogleCalendarEventWithMeet,
  getGoogleCalendarConnection,
} from "@/lib/google/calendar";
import { sendMeetingNotifications } from "@/lib/email";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.getUser();

    let orgId: string | null = null;
    if (user) {
      const { data: member } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      if (member) orgId = member.organization_id;
    }

    if (!orgId) {
      const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
      if (Array.isArray(orgs) && orgs.length > 0) orgId = orgs[0].id;
    }

    if (!orgId) {
      return NextResponse.json({ meetings: [] });
    }

    const { data: meetings, error: fetchErr } = await supabase
      .from("meetings")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    return NextResponse.json({ meetings: meetings || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch meetings." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.getUser();

    let orgId: string | null = null;
    let userId: string | null = user?.id || null;

    if (user) {
      const { data: member } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      if (member) orgId = member.organization_id;
    }

    if (!orgId) {
      const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
      if (Array.isArray(orgs) && orgs.length > 0) orgId = orgs[0].id;
    }

    if (!orgId) {
      return NextResponse.json({ success: false, code: "NO_WORKSPACE", error: "No active workspace found." }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      participantName,
      participantEmail,
      additionalAttendees = [],
      date,
      startTime,
      endTime,
      durationMinutes = 30,
      timezone = "Asia/Kolkata",
      description,
      company,
      leadName,
    } = body || {};

    // 1. Backend Validations
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ success: false, code: "INVALID_MEETING_DATA", error: "Meeting title is required." }, { status: 400 });
    }

    if (!participantName || typeof participantName !== "string" || !participantName.trim()) {
      return NextResponse.json({ success: false, code: "INVALID_MEETING_DATA", error: "Participant name is required." }, { status: 400 });
    }

    if (!participantEmail || typeof participantEmail !== "string" || !participantEmail.includes("@") || !participantEmail.includes(".")) {
      return NextResponse.json({ success: false, code: "INVALID_MEETING_DATA", error: "Please enter a valid participant email address." }, { status: 400 });
    }

    if (!date || !startTime) {
      return NextResponse.json({ success: false, code: "INVALID_MEETING_DATA", error: "Meeting date and start time are required." }, { status: 400 });
    }

    // Parse Start & End Datetimes
    const startIsoStr = `${date}T${startTime.length === 5 ? startTime + ":00" : startTime}`;
    const startIso = new Date(startIsoStr);
    if (isNaN(startIso.getTime())) {
      return NextResponse.json({ success: false, code: "INVALID_MEETING_DATA", error: "Invalid date or start time format." }, { status: 400 });
    }

    let endIso: Date;
    if (endTime && typeof endTime === "string" && endTime.trim()) {
      const endIsoStr = `${date}T${endTime.length === 5 ? endTime + ":00" : endTime}`;
      endIso = new Date(endIsoStr);
      if (isNaN(endIso.getTime())) {
        return NextResponse.json({ success: false, code: "INVALID_MEETING_DATA", error: "Invalid end time format." }, { status: 400 });
      }
      if (endIso.getTime() <= startIso.getTime()) {
        return NextResponse.json({ success: false, code: "INVALID_MEETING_DATA", error: "End time must be after start time." }, { status: 400 });
      }
    } else {
      endIso = new Date(startIso.getTime() + Number(durationMinutes) * 60000);
    }

    // 2. Single Source of Truth lookup for Google Calendar Connection
    const conn = await getGoogleCalendarConnection(supabase, userId || "", orgId);

    if (!conn.connected || !conn.accessToken) {
      return NextResponse.json(
        {
          success: false,
          code: "GOOGLE_NOT_CONNECTED",
          error: conn.error || "Connect Google Calendar before scheduling a meeting.",
        },
        { status: 400 }
      );
    }

    // 3. Call Google Calendar API to create Event + Google Meet Link
    const googleRes = await createGoogleCalendarEventWithMeet({
      title: title.trim(),
      description: description?.trim() || `Sales Discovery Meeting with ${participantName.trim()} (${company || "Prospect"}).`,
      startDateTime: startIso.toISOString(),
      endDateTime: endIso.toISOString(),
      timezone,
      participantEmail: participantEmail.trim(),
      participantName: participantName.trim(),
      accessToken: conn.accessToken,
    });

    // 4. IF Google Calendar creation fails, DO NOT save fake data to Supabase
    if (!googleRes.success || !googleRes.meetUrl) {
      return NextResponse.json(
        {
          success: false,
          code: googleRes.errorCode || "GOOGLE_CALENDAR_API_ERROR",
          error: googleRes.error || "Google Calendar could not create the meeting. Please try again.",
        },
        { status: 400 }
      );
    }

    const formattedTimeStr = endTime ? `${startTime} - ${endTime}` : `${startTime} (${durationMinutes} min)`;
    const formattedDateTime = `${date} &bull; ${formattedTimeStr} (${timezone})`;
    const finalProspectName = participantName.trim();

    // 5. Persist actual meeting in Supabase
    const { data: insertedMeeting, error: insertErr } = await supabase
      .from("meetings")
      .insert({
        organization_id: orgId,
        created_by: userId || null,
        title: title.trim(),
        lead_name: finalProspectName,
        participant_name: finalProspectName,
        participant_email: participantEmail.trim(),
        company: company?.trim() || "Prospect",
        date_time: formattedDateTime,
        start_time: startIso.toISOString(),
        end_time: endIso.toISOString(),
        timezone,
        type: title.trim(),
        status: "SCHEDULED",
        meeting_link: googleRes.meetUrl,
        google_event_id: googleRes.eventId || null,
        calendar_url: googleRes.htmlLink || null,
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ success: false, code: "SUPABASE_PERSISTENCE_FAILED", error: insertErr.message }, { status: 500 });
    }

    // 6. Send Email Notifications (Host + Participant + Attendees)
    const hostEmail = user?.email || "sanika@revai.io";
    const hostName = user?.user_metadata?.full_name || "Sanika Wazarkar";

    const emailRes = await sendMeetingNotifications({
      meetingTitle: title.trim(),
      hostName,
      hostEmail,
      participantName: finalProspectName,
      participantEmail: participantEmail.trim(),
      additionalAttendees: Array.isArray(additionalAttendees) ? additionalAttendees : [],
      date,
      startTime,
      endTime,
      timezone,
      durationMinutes,
      description: description?.trim(),
      googleMeetUrl: googleRes.meetUrl,
      calendarUrl: googleRes.htmlLink,
    });

    return NextResponse.json({
      success: true,
      meeting: insertedMeeting,
      meetUrl: googleRes.meetUrl,
      calendarUrl: googleRes.htmlLink,
      notifications: emailRes.notifications,
      warning: emailRes.warning || undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, code: "MEETING_CREATION_FAILED", error: err.message || "Failed to create meeting." }, { status: 500 });
  }
}
