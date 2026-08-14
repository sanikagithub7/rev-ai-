"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Flame, X, UserPlus, RefreshCw, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LeadRecord {
  id: string;
  organization_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: "NEW" | "QUALIFIED" | "HOT" | "NURTURING" | "CONVERTED" | "LOST";
  score: number;
  created_at: string;
  updated_at: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Lead Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [score, setScore] = useState(85);
  const [status, setStatus] = useState<LeadRecord["status"]>("NEW");

  const supabase = createClient();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchErr) {
        setError(fetchErr.message);
        setLeads([]);
      } else {
        setLeads(data || []);
      }
    } catch {
      setError("Failed to connect to database.");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      // Get current user's organization_id
      const { data: member } = await supabase
        .from("organization_members")
        .select("organization_id")
        .limit(1)
        .single();

      if (!member) {
        setError("No organization found. Please ensure you are logged in.");
        setSubmitting(false);
        return;
      }

      const calculatedStatus = score >= 80 ? "HOT" : status;

      const { data: insertedLead, error: insertErr } = await supabase
        .from("leads")
        .insert({
          organization_id: member.organization_id,
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          company: company.trim() || null,
          status: calculatedStatus,
          score: Number(score),
        })
        .select()
        .single();

      if (insertErr) {
        setError(insertErr.message);
      } else if (insertedLead) {
        setLeads((prev) => [insertedLead, ...prev]);
        setShowModal(false);
        setName("");
        setEmail("");
        setPhone("");
        setCompany("");
        setScore(85);
        setStatus("NEW");
      }
    } catch {
      setError("Failed to save lead.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredLeads = leads.filter((l) => {
    const matchesFilter = filter === "ALL" || l.status === filter;
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
      (l.company && l.company.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black pb-6">
        <div>
          <div className="text-xs font-mono text-[#123B2D] uppercase tracking-widest mb-1">
            // PIPELINE MANAGEMENT
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            LEADS & PROSPECTS
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Capture, score, and track inbound prospective sales leads across channels.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchLeads}
            className="px-3 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-bold uppercase sharp-border cursor-pointer flex items-center gap-1"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-pill-primary text-xs cursor-pointer flex items-center gap-1"
          >
            <UserPlus className="w-4 h-4 text-[#12B76A]" /> Add Prospective Lead
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-600 text-xs font-bold uppercase text-red-900 flex items-center gap-2 sharp-border">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* 2. SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 sharp-border">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, email, or company..."
            className="w-full pl-9 pr-4 py-2 bg-[#F1F2F3] text-xs font-medium border border-black focus:outline-none focus:bg-white sharp-border"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold uppercase overflow-x-auto">
          {["ALL", "NEW", "QUALIFIED", "HOT", "NURTURING", "CONVERTED", "LOST"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 sharp-border cursor-pointer ${
                filter === st
                  ? "bg-black text-white"
                  : "bg-[#F1F2F3] text-black hover:bg-neutral-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 3. LEADS TABLE OR EMPTY STATE */}
      <div className="bg-white sharp-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-neutral-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#12B76A]" /> Fetching real leads from Supabase...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-[#F1F2F3] border border-black flex items-center justify-center mx-auto text-neutral-400 font-mono font-bold text-lg">
              0
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-black">
              NO LEADS YET
            </h3>
            <p className="text-xs text-neutral-600 max-w-sm mx-auto">
              No lead records found in database matching your filters. Click below to create your first real lead.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setShowModal(true)}
                className="btn-pill-primary text-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-[#12B76A]" /> Create Your First Lead
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F2F3] border-b border-black text-xs font-mono font-bold uppercase tracking-wider text-black">
                <th className="p-4">Lead Name</th>
                <th className="p-4">Company</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">AI Score</th>
                <th className="p-4">Status Tag</th>
                <th className="p-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs font-medium">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[#F1F2F3]/60 transition-colors">
                  <td className="p-4 font-bold text-black uppercase">
                    {lead.name}
                  </td>
                  <td className="p-4 text-neutral-700">
                    {lead.company || "—"}
                  </td>
                  <td className="p-4 text-neutral-600 font-mono">
                    <div>{lead.email || "No email"}</div>
                    <div className="text-[10px] text-neutral-400">{lead.phone || ""}</div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 font-bold font-mono text-xs sharp-border ${
                        lead.score >= 80
                          ? "bg-[#12B76A] text-white"
                          : lead.score >= 60
                          ? "bg-[#20C8E8] text-black"
                          : "bg-neutral-200 text-black"
                      }`}
                    >
                      {lead.score >= 80 && <Flame className="w-3 h-3 fill-current text-white" />}
                      {lead.score} / 100
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider sharp-border ${
                        lead.status === "HOT"
                          ? "bg-[#12B76A] text-white"
                          : lead.status === "QUALIFIED"
                          ? "bg-[#20C8E8] text-black"
                          : lead.status === "CONVERTED"
                          ? "bg-[#F4B62A] text-black"
                          : "bg-neutral-200 text-black"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-500 font-mono text-[11px]">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. ADD LEAD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 sharp-border max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h2 className="text-lg font-black uppercase tracking-tight">
                Add Prospective Lead
              </h2>
              <X className="w-4 h-4 cursor-pointer" onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleAddLead} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                  Lead Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
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
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none sharp-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@apex.com"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs focus:outline-none sharp-border"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs focus:outline-none sharp-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                    AI Qualification Score (0-100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none sharp-border"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                    Status Tag
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadRecord["status"])}
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border"
                  >
                    <option value="NEW">NEW</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="HOT">HOT</option>
                    <option value="NURTURING">NURTURING</option>
                    <option value="CONVERTED">CONVERTED</option>
                    <option value="LOST">LOST</option>
                  </select>
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
                  {submitting ? "Saving..." : "Save Lead to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
