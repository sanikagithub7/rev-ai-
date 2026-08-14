"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Plus, CheckCircle2, Clock, Video, X, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MeetingRecord {
  id: string;
  organization_id: string;
  lead_name: string;
  company: string;
  date_time: string;
  type: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
  meeting_link: string;
  created_at: string;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("Sales Qualification & Demo Call");
  const [leadName, setLeadName] = useState("");
  const [company, setCompany] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("10:00 AM EST");
  const [participantEmail, setParticipantEmail] = useState("");

  const supabase = createClient();

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
    fetchMeetings();
  }, [fetchMeetings]);

  async function handleCreateMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date || !time || !participantEmail.trim()) {
      setError("Meeting title, date, time, and participant email are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/meetings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          date: date.trim(),
          time: time.trim(),
          participantEmail: participantEmail.trim(),
          company: company.trim(),
          leadName: leadName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create Google Calendar meeting.");
      } else if (data.meeting) {
        setMeetings((prev) => [data.meeting, ...prev]);
        setSuccessMsg(`Google Meet created! Link: ${data.meetUrl}`);
        setShowModal(false);
        setTitle("Sales Qualification & Demo Call");
        setLeadName("");
        setCompany("");
        setParticipantEmail("");
      }
    } catch {
      setError("Unable to save data. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black pb-6">
        <div>
          <div className="text-xs font-mono text-[#123B2D] uppercase tracking-widest mb-1">
            // CALENDAR & GOOGLE MEET DISCOVERY
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            SCHEDULED MEETINGS
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Create real Google Calendar events with automated Google Meet links and calendar invitations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href="/api/auth/google"
            className="px-3 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-bold uppercase sharp-border cursor-pointer flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#12B76A]" /> Connect Google Calendar
          </a>
          <button
            onClick={fetchMeetings}
            className="px-3 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-bold uppercase sharp-border cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-pill-primary text-xs cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-4 h-4 text-[#12B76A]" /> Create Meeting
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
          <RefreshCw className="w-4 h-4 animate-spin text-[#12B76A]" /> Loading real meetings from database...
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
            Connect your Google Calendar or create your first meeting slot to generate a Google Meet video conference link and attendee invite.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="btn-pill-primary text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#12B76A]" /> Create First Meeting
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meetings.map((m) => (
            <div key={m.id} className="bg-white p-6 sharp-border space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="bg-[#12B76A] text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sharp-border flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {m.status}
                  </span>
                  <span className="text-xs font-mono text-neutral-400">GOOGLE MEET VERIFIED</span>
                </div>

                <h3 className="text-xl font-extrabold uppercase tracking-tight text-black">
                  {m.type || m.lead_name}
                </h3>
                <div className="text-xs font-bold text-neutral-800">
                  Prospect: {m.lead_name} ({m.company})
                </div>

                <div className="p-3 bg-[#F1F2F3] sharp-border text-xs font-mono text-neutral-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#12B76A]" />
                  <span dangerouslySetInnerHTML={{ __html: m.date_time }} />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
                <a
                  href={m.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-pill-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5 text-[#12B76A]" /> JOIN GOOGLE MEET
                </a>

                <span className="text-[10px] font-mono text-neutral-400">
                  {m.meeting_link.replace(/^https?:\/\//, "").slice(0, 22)}...
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MEETING MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 sharp-border max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h2 className="text-lg font-black uppercase tracking-tight">
                Create Meeting & Google Meet Link
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
                  placeholder="e.g. Sales Architecture Review"
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none sharp-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
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
                    Time Slot *
                  </label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="10:00 AM EST"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none sharp-border"
                  />
                </div>
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
                  placeholder="alex@company.com"
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs focus:outline-none sharp-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                    Prospect Name
                  </label>
                  <input
                    type="text"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="e.g. Alex Rostova"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs focus:outline-none sharp-border"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Apex Global"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs focus:outline-none sharp-border"
                  />
                </div>
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
                  {submitting ? "Creating..." : "CREATE MEETING"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
