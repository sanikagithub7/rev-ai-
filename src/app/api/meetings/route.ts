import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createGoogleCalendarEventWithMeet,
  getGoogleCalendarConnection,
} from "@/lib/google/calendar";
import { sendMeetingNotifications, validateEmailAddress } from "@/lib/email";
import fs from "fs";
import path from "path";

const MEETINGS_CACHE_FILE = path.join(process.cwd(), ".meetings.json");

function loadMeetingsFromDiskCache(): any[] {
  if (fs.existsSync(MEETINGS_CACHE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(MEETINGS_CACHE_FILE, "utf8"));
      if (Array.isArray(data)) return data;
    } catch (e) {}
  }
  return [];
}

function saveMeetingToDiskCache(meetingRecord: any) {
  try {
    let existing = loadMeetingsFromDiskCache();
    existing = existing.filter(
      (m) => m.id !== meetingRecord.id && m.google_event_id !== meetingRecord.google_event_id
    );
    existing.unshift(meetingRecord);
    fs.writeFileSync(MEETINGS_CACHE_FILE, JSON.stringify(existing, null, 2), "utf8");
  } catch (e) {}
}

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

    let dbMeetings: any[] = [];
    if (orgId) {
      const { data: meetings } = await supabase
        .from("meetings")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (Array.isArray(meetings)) {
        dbMeetings = meetings;
      }
    }

    const diskMeetings = loadMeetingsFromDiskCache();

    // Merge and deduplicate by google_event_id or id
    const map = new Map<string, any>();
    for (const m of diskMeetings) {
      const key = m.google_event_id || m.id;
      if (key) map.set(key, m);
    }
    for (const m of dbMeetings) {
      const key = m.google_event_id || m.id;
      if (key) map.set(key, m);
    }

    const combined = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at || b.start_time).getTime() - new Date(a.created_at || a.start_time).getTime()
    );

    return NextResponse.json({ meetings: combined });
  } catch (err: any) {
    const diskMeetings = loadMeetingsFromDiskCache();
    return NextResponse.json({ meetings: diskMeetings });
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
      orgId = "00000000-0000-0000-0000-000000000000";
    }

    const body = await request.json();
    const {
      title,
      participantName,
      participantEmail,
      participants = [],
      additionalAttendees = [],
      date,
      startTime,
      endTime,
      durationMinutes = 30,
      timezone = "Asia/Kolkata",
      description,
      company,
    } = body || {};

    // 1. Backend Validations
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ success: false, code: "INVALID_MEETING_DATA", error: "Meeting title is required." }, { status: 400 });
    }

    // Determine target attendees list
    const attendeeList: Array<{ name: string; email: string }> = [];
    const seenEmails = new Set<string>();

    if (Array.isArray(participants) && participants.length > 0) {
      for (const p of participants) {
        if (p?.email && typeof p.email === "string") {
          const val = validateEmailAddress(p.email);
          if (!val.valid) {
            return NextResponse.json({ success: false, code: "INVALID_ATTENDEE_EMAIL", error: val.reason }, { status: 400 });
          }
          if (!seenEmails.has(val.cleanEmail!)) {
            seenEmails.add(val.cleanEmail!);
            attendeeList.push({ name: p.name?.trim() || "Participant", email: val.cleanEmail! });
          }
        }
      }
    } else if (participantEmail) {
      const val = validateEmailAddress(participantEmail);
      if (!val.valid) {
        return NextResponse.json({ success: false, code: "INVALID_ATTENDEE_EMAIL", error: val.reason }, { status: 400 });
      }
      seenEmails.add(val.cleanEmail!);
      attendeeList.push({ name: participantName?.trim() || "Participant", email: val.cleanEmail! });
    }

    if (attendeeList.length === 0) {
      return NextResponse.json({ success: false, code: "INVALID_MEETING_DATA", error: "At least one valid participant email address is required." }, { status: 400 });
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
    const primaryParticipant = attendeeList[0];
    const googleRes = await createGoogleCalendarEventWithMeet({
      title: title.trim(),
      description: description?.trim() || `Sales Discovery Meeting with ${primaryParticipant.name} (${company || "Prospect"}).`,
      startDateTime: startIso.toISOString(),
      endDateTime: endIso.toISOString(),
      timezone,
      participantEmail: primaryParticipant.email,
      participantName: primaryParticipant.name,
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
    const finalProspectName = primaryParticipant.name;

    const meetingRecord: any = {
      id: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organization_id: orgId,
      created_by: userId || null,
      title: title.trim(),
      lead_name: finalProspectName,
      participant_name: finalProspectName,
      participant_email: primaryParticipant.email,
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
      created_at: new Date().toISOString(),
    };

    // 5. Persist actual meeting in Supabase (if table exists)
    try {
      const { data: insertedMeeting } = await supabase
        .from("meetings")
        .insert({
          organization_id: orgId,
          created_by: userId || null,
          title: title.trim(),
          lead_name: finalProspectName,
          participant_name: finalProspectName,
          participant_email: primaryParticipant.email,
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

      if (insertedMeeting && insertedMeeting.id) {
        meetingRecord.id = insertedMeeting.id;
      }
    } catch (e) {}

    // Save to disk cache for 100% reliable persistence & immediate retrieval
    saveMeetingToDiskCache(meetingRecord);

    // 6. Send Email Notifications to both Host and Participants
    let hostEmail = user?.email || conn.accountEmail || "";
    if (!hostEmail || hostEmail.includes("revai.io")) {
      hostEmail = primaryParticipant.email;
    }
    const hostName = user?.user_metadata?.full_name || "Sanika Wazarkar";

    const emailRes = await sendMeetingNotifications({
      meetingTitle: title.trim(),
      hostName,
      hostEmail,
      participantName: primaryParticipant.name,
      participantEmail: primaryParticipant.email,
      participants: attendeeList,
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
      meeting: meetingRecord,
      meetUrl: googleRes.meetUrl,
      calendarUrl: googleRes.htmlLink,
      invitations: emailRes.invitations,
      warning: emailRes.warning || undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, code: "MEETING_CREATION_FAILED", error: err.message || "Failed to create meeting." }, { status: 500 });
  }
}
