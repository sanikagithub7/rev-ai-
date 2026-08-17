"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Clock,
  Video,
  X,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Trash2,
  Globe,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MeetingRecord {
  id: string;
  organization_id: string;
  title?: string;
  lead_name: string;
  participant_name?: string;
  participant_email?: string;
  company?: string;
  date_time: string;
  start_time?: string;
  end_time?: string;
  timezone?: string;
  type?: string;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  meeting_link: string;
  calendar_url?: string;
  google_event_id?: string;
  description?: string;
  created_at: string;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("Rev AI Product Demo");
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [company, setCompany] = useState("");
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = useState("15:00");
  const [endTime, setEndTime] = useState("15:30");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [description, setDescription] = useState("Demo of Rev AI B2B Sales Automation platform.");

  const supabase = createClient();

  const checkGoogleStatus = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/google/status");
      const data = await res.json();
      const isConnected = Boolean(data.connected);
      setGoogleConnected(isConnected);
      return isConnected;
    } catch {
      setGoogleConnected(false);
      return false;
    }
  }, []);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("meetings")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchErr) {
        setError(fetchErr.message);
        setMeetings([]);
      } else {
        setMeetings(data || []);
      }
    } catch {
      setError("Failed to fetch meetings from database.");
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    checkGoogleStatus();
    fetchMeetings();

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("status") === "google_connected") {
        setSuccessMsg("✅ Google Calendar successfully connected!");
        checkGoogleStatus();
      } else if (urlParams.has("error")) {
        setError(`⚠️ ${urlParams.get("error")}`);
      }
    }
  }, [checkGoogleStatus, fetchMeetings]);

  async function handleOpenScheduleModal() {
    setError(null);
    const isConn = await checkGoogleStatus();
    if (!isConn) {
      setError("Connect Google Calendar before scheduling a meeting.");
      return;
    }
    setShowModal(true);
  }

  async function handleCreateMeeting(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Meeting title is required.");
      return;
    }
    if (!participantName.trim()) {
      setError("Participant name is required.");
      return;
    }
    if (!participantEmail.trim() || !participantEmail.includes("@") || !participantEmail.includes(".")) {
      setError("Please enter a valid participant email address.");
      return;
    }
    if (!date || !startTime || !endTime) {
      setError("Date, start time, and end time are required.");
      return;
    }
    if (endTime <= startTime) {
      setError("End time must be after start time.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          participantName: participantName.trim(),
          participantEmail: participantEmail.trim(),
          company: company.trim(),
          date: date.trim(),
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          timezone,
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.code === "GOOGLE_NOT_CONNECTED") {
          setGoogleConnected(false);
          setError("Connect Google Calendar before scheduling a meeting.");
        } else if (data.code === "GOOGLE_TOKEN_EXPIRED") {
          setGoogleConnected(false);
          setError("Your Google Calendar connection has expired. Please reconnect Google Calendar.");
        } else {
          setError(data.error || "Google Calendar could not create the meeting. Please try again.");
        }
      } else if (data.meeting) {
        setMeetings((prev) => [data.meeting, ...prev]);
        setSuccessMsg(`✅ Real Google Calendar event & Google Meet link created! Link: ${data.meetUrl}`);
        setShowModal(false);
        setTitle("Rev AI Product Demo");
        setParticipantName("");
        setParticipantEmail("");
        setCompany("");
        setDescription("Demo of Rev AI B2B Sales Automation platform.");
      }
    } catch {
      setError("Network error while creating Google Calendar meeting.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelMeeting(meetingId: string) {
    if (!confirm("Are you sure you want to cancel this meeting and remove it from Google Calendar?")) return;

    setCancellingId(meetingId);
    setError(null);

    try {
      const res = await fetch(`/api/meetings/${meetingId}/cancel`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to cancel meeting.");
      } else {
        setMeetings((prev) =>
          prev.map((m) => (m.id === meetingId ? { ...m, status: "CANCELLED" } : m))
        );
        setSuccessMsg("Meeting cancelled and updated on Google Calendar.");
      }
    } catch {
      setError("Failed to cancel meeting.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black pb-6">
        <div>
          <div className="text-xs font-mono text-[#123B2D] uppercase tracking-widest mb-1">
            // GOOGLE CALENDAR & GOOGLE MEET DISCOVERY
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            SCHEDULED MEETINGS
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Create genuine Google Calendar events with automated Google Meet video conference links.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {googleConnected === true ? (
            <span className="px-3 py-2 border border-black bg-emerald-50 text-emerald-900 text-xs font-bold uppercase sharp-border flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> GOOGLE CALENDAR CONNECTED
            </span>
          ) : (
            <a
              href="/api/google/auth"
              className="px-3 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-bold uppercase sharp-border cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#12B76A]" /> CONNECT GOOGLE CALENDAR
            </a>
          )}

          <button
            onClick={fetchMeetings}
            className="px-3 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-bold uppercase sharp-border cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={handleOpenScheduleModal}
            className="btn-pill-primary text-xs cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-4 h-4 text-[#12B76A]" /> Schedule Meeting
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-600 text-xs font-bold uppercase text-red-900 flex items-center gap-2 sharp-border">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-600 text-xs font-bold uppercase text-emerald-900 flex items-center gap-2 sharp-border">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* MEETINGS GRID OR EMPTY STATE */}
      {loading ? (
        <div className="bg-white p-12 text-center text-xs font-mono text-neutral-500 sharp-border flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#12B76A]" /> Loading real scheduled meetings from Supabase...
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-white p-12 text-center sharp-border space-y-4 max-w-2xl mx-auto my-4">
          <div className="w-12 h-12 bg-[#12B76A] text-white sharp-border flex items-center justify-center mx-auto">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">
            NO MEETINGS SCHEDULED
          </h2>
          <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
            Connect your Google Calendar and schedule your first event to generate genuine Google Meet conference links and attendee invites.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            {!googleConnected ? (
              <a href="/api/google/auth" className="btn-pill-primary text-xs cursor-pointer inline-flex items-center gap-1">
                <ExternalLink className="w-4 h-4 text-[#12B76A]" /> Connect Google Calendar
              </a>
            ) : (
              <button
                onClick={handleOpenScheduleModal}
                className="btn-pill-primary text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#12B76A]" /> Schedule First Meeting
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meetings.map((m) => (
            <div key={m.id} className="bg-white p-6 sharp-border space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sharp-border flex items-center gap-1 ${
                      m.status === "SCHEDULED" || m.status === "CONFIRMED"
                        ? "bg-[#12B76A] text-white"
                        : m.status === "CANCELLED"
                        ? "bg-red-600 text-white"
                        : "bg-black text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" /> {m.status}
                  </span>
                  <span className="text-xs font-mono text-neutral-400">REAL GOOGLE MEET</span>
                </div>

                <h3 className="text-xl font-extrabold uppercase tracking-tight text-black">
                  {m.title || m.type || "Sales Meeting"}
                </h3>
                <div className="text-xs font-bold text-neutral-800">
                  Participant: {m.participant_name || m.lead_name} ({m.participant_email || m.company || "Prospect"})
                </div>

                {m.description && (
                  <div className="text-xs text-neutral-600">
                    {m.description}
                  </div>
                )}

                <div className="p-3 bg-[#F1F2F3] sharp-border text-xs font-mono text-neutral-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#12B76A]" />
                  <span dangerouslySetInnerHTML={{ __html: m.date_time }} />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {m.meeting_link && m.status !== "CANCELLED" && (
                    <a
                      href={m.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-pill-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5 text-[#12B76A]" /> JOIN GOOGLE MEET
                    </a>
                  )}

                  {m.calendar_url && (
                    <a
                      href={m.calendar_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold uppercase underline hover:text-[#12B76A] flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3" /> Event Link
                    </a>
                  )}
                </div>

                {m.status !== "CANCELLED" && (
                  <button
                    onClick={() => handleCancelMeeting(m.id)}
                    disabled={cancellingId === m.id}
                    className="text-xs text-red-600 hover:text-red-800 font-bold uppercase flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {cancellingId === m.id ? "Cancelling..." : "Cancel"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SCHEDULE MEETING MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 sharp-border max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h2 className="text-lg font-black uppercase tracking-tight">
                Schedule Meeting & Google Meet Link
              </h2>
              <X className="w-4 h-4 cursor-pointer" onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Rev AI Product Demo"
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none sharp-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                    Participant Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Sarah Connor"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs focus:outline-none sharp-border"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                    Participant Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={participantEmail}
                    onChange={(e) => setParticipantEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs focus:outline-none sharp-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none sharp-border"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none sharp-border"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none sharp-border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none sharp-border"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST - India)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                  Description / Agenda
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Demo of Rev AI Sales Automation platform."
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs focus:outline-none sharp-border"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-pill-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-pill-primary text-xs">
                  {submitting ? "Creating Google Event..." : "SCHEDULE WITH GOOGLE MEET"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
