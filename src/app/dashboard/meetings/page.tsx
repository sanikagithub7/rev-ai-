"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Plus, CheckCircle2, Clock, Video, X, RefreshCw, AlertCircle } from "lucide-react";
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
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [leadName, setLeadName] = useState("");
  const [company, setCompany] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [type, setType] = useState("Sales Qualification Call");

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

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!leadName.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const { data: member } = await supabase
        .from("organization_members")
        .select("organization_id")
        .limit(1)
        .single();

      if (!member) {
        setError("No organization found. Please sign in again.");
        setSubmitting(false);
        return;
      }

      const generatedLink = `https://meet.google.com/rev-${Math.random().toString(36).substring(2, 7)}-ai`;

      const { data: inserted, error: insertErr } = await supabase
        .from("meetings")
        .insert({
          organization_id: member.organization_id,
          lead_name: leadName.trim(),
          company: company.trim() || "Independent Prospect",
          date_time: dateTime.trim() || "Tomorrow &bull; 10:00 AM EST",
          type: type.trim(),
          status: "CONFIRMED",
          meeting_link: generatedLink,
        })
        .select()
        .single();

      if (insertErr) {
        setError(insertErr.message);
      } else if (inserted) {
        setMeetings((prev) => [inserted, ...prev]);
        setShowModal(false);
        setLeadName("");
        setCompany("");
        setDateTime("");
        setType("Sales Qualification Call");
      }
    } catch {
      setError("Failed to schedule meeting.");
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
            // CALENDAR & SALES DISCOVERY
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            SCHEDULED MEETINGS
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage automated calendar slots, sales demos, and discovery calls booked by AI.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
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
            <Plus className="w-4 h-4 text-[#12B76A]" /> Book Meeting Slot
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-600 text-xs font-bold uppercase text-red-900 flex items-center gap-2 sharp-border">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
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
            Connect your Google Calendar or schedule your first sales demo slot to convert qualified leads into scheduled discovery meetings.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="btn-pill-primary text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#12B76A]" /> Book First Meeting Slot
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
                  <span className="text-xs font-mono text-neutral-400">DATABASE SYNC</span>
                </div>

                <h3 className="text-xl font-extrabold uppercase tracking-tight text-black">
                  {m.type}
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
                  <Video className="w-3.5 h-3.5 text-[#12B76A]" /> Join Call
                </a>

                <span className="text-[10px] font-mono text-neutral-400">
                  LINK: {m.meeting_link.slice(8, 28)}...
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 sharp-border max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h2 className="text-lg font-black uppercase tracking-tight">
                Schedule Meeting Slot
              </h2>
              <X className="w-4 h-4 cursor-pointer" onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSchedule} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                  Prospect Lead Name *
                </label>
                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none sharp-border"
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

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                  Meeting Type / Title
                </label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g. Enterprise Architecture Demo"
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs focus:outline-none sharp-border"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                  Date & Time Slot
                </label>
                <input
                  type="text"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  placeholder="e.g. Friday, Aug 21 &bull; 3:00 PM EST"
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
                  {submitting ? "Booking..." : "Confirm Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
