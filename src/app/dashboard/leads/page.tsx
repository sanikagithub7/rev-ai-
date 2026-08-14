"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  RefreshCw,
  Plus,
  Eye,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Flame,
  User,
  Mail,
  Phone,
  Building,
  CreditCard,
  MessageSquare,
  FileText,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LeadRecord {
  id: string;
  organization_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  industry?: string;
  source?: string;
  budget?: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST" | string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" | string;
  heat_level?: string;
  score: number;
  stated_requirement?: string;
  inbound_notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export default function LeadsManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightLeadId = searchParams.get("leadId");

  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Filters & Search state matching screenshot
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL STATUSES");
  const [priorityFilter, setPriorityFilter] = useState("ALL PRIORITIES");
  const [heatFilter, setHeatFilter] = useState("ALL HEAT LEVELS");
  const [sortField, setSortField] = useState("CREATED DATE");
  const [sortOrder, setSortOrder] = useState("DESCENDING");

  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields matching screenshot 2 exactly
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [source, setSource] = useState("Website");
  const [budget, setBudget] = useState("");
  const [initialStatus, setInitialStatus] = useState("NEW");
  const [priority, setPriority] = useState("NORMAL");
  const [statedRequirement, setStatedRequirement] = useState("");
  const [inboundNotes, setInboundNotes] = useState("");

  // Edit Modal state
  const [editingLead, setEditingLead] = useState<LeadRecord | null>(null);
  const [viewingLead, setViewingLead] = useState<LeadRecord | null>(null);
  const [analyzingLeadId, setAnalyzingLeadId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        priority: priorityFilter,
        heat_level: heatFilter,
        sort_field: sortField,
        sort_order: sortOrder,
      });

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load leads from database.");
        setLeads([]);
      } else {
        setLeads(data.leads || []);
      }
    } catch {
      setError("Failed to connect to backend server.");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, heatFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Handle Create Lead
  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Lead Name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          company: company.trim(),
          industry: industry.trim(),
          source,
          budget: budget.trim(),
          status: initialStatus,
          priority,
          stated_requirement: statedRequirement.trim(),
          inbound_notes: inboundNotes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create lead.");
      } else if (data.lead) {
        setToast(`Lead "${data.lead.name}" created successfully!`);
        setShowCreateModal(false);
        // Reset form
        setName("");
        setEmail("");
        setPhone("");
        setCompany("");
        setIndustry("");
        setSource("Website");
        setBudget("");
        setInitialStatus("NEW");
        setPriority("NORMAL");
        setStatedRequirement("");
        setInboundNotes("");
        fetchLeads();
        setTimeout(() => setToast(null), 4000);
      }
    } catch {
      setError("Unable to save lead to database.");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Edit Lead
  async function handleUpdateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLead) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/leads/${editingLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingLead.name,
          email: editingLead.email,
          phone: editingLead.phone,
          company: editingLead.company,
          industry: editingLead.industry,
          source: editingLead.source,
          budget: editingLead.budget,
          status: editingLead.status,
          priority: editingLead.priority,
          stated_requirement: editingLead.stated_requirement,
          inbound_notes: editingLead.inbound_notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update lead.");
      } else {
        setToast(`Lead "${editingLead.name}" updated successfully!`);
        setEditingLead(null);
        fetchLeads();
        setTimeout(() => setToast(null), 4000);
      }
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Delete Lead
  async function handleDeleteLead(id: string, leadName: string) {
    if (!confirm(`Are you sure you want to delete lead "${leadName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setToast(`Lead "${leadName}" deleted.`);
        fetchLeads();
        setTimeout(() => setToast(null), 4000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete lead.");
      }
    } catch {
      setError("Failed to delete lead.");
    }
  }

  // Handle AI Lead Analysis with Ollama Qwen
  async function handleAnalyzeLead(lead: LeadRecord) {
    setAnalyzingLeadId(lead.id);
    setError(null);
    try {
      const targetUrl = lead.metadata?.website_url || (lead.company ? `https://${lead.company.toLowerCase().replace(/\s+/g, "")}.com` : `https://google.com`);
      const res = await fetch("/api/leads/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          name: lead.name,
          email: lead.email,
          company: lead.company,
        }),
      });

      const data = await res.json();
      if (res.ok && data.analysis) {
        setToast(`AI Analysis completed for "${lead.name}"!`);
        fetchLeads();
        setTimeout(() => setToast(null), 4000);
      } else {
        setError(data.error || "AI Analysis unavailable.");
      }
    } catch {
      setError("AI Analysis unavailable.");
    } finally {
      setAnalyzingLeadId(null);
    }
  }

  // Navigate to Conversations 2.0 with Lead Context
  function handleOpenConversation(lead: LeadRecord) {
    router.push(`/dashboard/conversations?leadId=${lead.id}`);
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#12B76A] text-white font-bold text-xs uppercase px-4 py-3 sharp-border shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* TOP HEADER CARD — MATCHING SCREENSHOT 1 EXACTLY */}
      <div className="bg-white sharp-border p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 z-10 max-w-xl">
          {/* Top Black Badge */}
          <div className="inline-flex items-center gap-1.5 bg-black text-white px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider sharp-border">
            <User className="w-3 h-3 text-[#12B76A]" />
            MULTI-TENANT CRM LEADS PIPELINE
          </div>

          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black">
            LEADS MANAGEMENT ({leads.length})
          </h1>

          <p className="text-[11px] font-mono text-neutral-600 uppercase tracking-wider">
            REAL-TIME WORKSPACE LEADS &bull; END-TO-END MULTI-TENANT SECURITY
          </p>
        </div>

        {/* Far-Right Green Block with Create Button */}
        <div className="relative md:self-stretch flex items-center justify-end">
          <div className="hidden md:block w-28 bg-[#12B76A] absolute right-0 top-0 bottom-0 sharp-border" />
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-pill-primary text-xs relative z-10 cursor-pointer shadow-md"
          >
            + CREATE NEW LEAD
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-600 text-xs font-bold uppercase text-red-900 flex items-center gap-2 sharp-border">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* SEARCH / FILTER SECTION — MATCHING SCREENSHOT 1 EXACTLY */}
      <div className="bg-white sharp-border p-4 space-y-4">
        {/* Top Row: Search Input + Refresh Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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

          <button
            onClick={fetchLeads}
            className="px-4 py-2 border border-black bg-[#F1F2F3] hover:bg-neutral-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 sharp-border cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> REFRESH
          </button>
        </div>

        {/* Filters Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 text-xs font-mono font-bold uppercase border-t border-neutral-200">
          {/* STATUS FILTER */}
          <div>
            <label className="block text-[9px] text-neutral-500 mb-1">STATUS</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border cursor-pointer"
            >
              <option value="ALL STATUSES">ALL STATUSES</option>
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="CONVERTED">CONVERTED</option>
              <option value="LOST">LOST</option>
            </select>
          </div>

          {/* PRIORITY FILTER */}
          <div>
            <label className="block text-[9px] text-neutral-500 mb-1">PRIORITY</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full p-2 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border cursor-pointer"
            >
              <option value="ALL PRIORITIES">ALL PRIORITIES</option>
              <option value="LOW">LOW</option>
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>

          {/* AI CLASSIFICATION (HEAT) */}
          <div>
            <label className="block text-[9px] text-neutral-500 mb-1">AI CLASSIFICATION</label>
            <select
              value={heatFilter}
              onChange={(e) => setHeatFilter(e.target.value)}
              className="w-full p-2 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border cursor-pointer"
            >
              <option value="ALL HEAT LEVELS">ALL HEAT LEVELS</option>
              <option value="HOT">HOT</option>
              <option value="WARM">WARM</option>
              <option value="COLD">COLD</option>
              <option value="NOT ANALYZED">NOT ANALYZED</option>
            </select>
          </div>

          {/* SORT FIELD */}
          <div>
            <label className="block text-[9px] text-neutral-500 mb-1">SORT FIELD</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="w-full p-2 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border cursor-pointer"
            >
              <option value="CREATED DATE">CREATED DATE</option>
              <option value="NAME">NAME</option>
              <option value="AI SCORE">AI SCORE</option>
              <option value="COMPANY">COMPANY</option>
            </select>
          </div>

          {/* SORT ORDER */}
          <div>
            <label className="block text-[9px] text-neutral-500 mb-1">SORT ORDER</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full p-2 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border cursor-pointer"
            >
              <option value="DESCENDING">DESCENDING</option>
              <option value="ASCENDING">ASCENDING</option>
            </select>
          </div>
        </div>
      </div>

      {/* LEADS TABLE — MATCHING SCREENSHOT 1 EXACTLY */}
      <div className="bg-white sharp-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-neutral-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#12B76A]" /> Fetching workspace leads from Supabase...
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 bg-[#F1F2F3] border border-black flex items-center justify-center mx-auto text-neutral-400 font-mono font-bold text-lg">
              0
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-black">
              NO LEADS YET
            </h2>
            <p className="text-xs text-neutral-600 max-w-sm mx-auto">
              No real lead records found in your organization workspace. Click below to add your first opportunity.
            </p>
            <div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-pill-primary text-xs cursor-pointer"
              >
                + CREATE NEW LEAD
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F1F2F3] border-b border-black text-xs font-mono font-bold uppercase tracking-wider text-black">
                    <th className="p-4">NAME & CONTACT</th>
                    <th className="p-4">COMPANY & INDUSTRY</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4">PRIORITY</th>
                    <th className="p-4">AI SCORE</th>
                    <th className="p-4">SOURCE</th>
                    <th className="p-4">CREATED</th>
                    <th className="p-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-xs font-medium">
                  {leads.map((lead) => {
                    const isHighlighted = lead.id === highlightLeadId;
                    return (
                      <tr
                        key={lead.id}
                        className={`transition-colors ${
                          isHighlighted ? "bg-[#12B76A]/10 border-l-4 border-l-[#12B76A]" : "hover:bg-[#F1F2F3]/60"
                        }`}
                      >
                        {/* NAME & CONTACT */}
                        <td className="p-4 font-mono">
                          <div className="font-bold text-black uppercase">{lead.name}</div>
                          <div className="text-[10px] text-neutral-500 lowercase">{lead.email || "no-email@provided"}</div>
                          <div className="text-[10px] text-neutral-400">{lead.phone || ""}</div>
                        </td>

                        {/* COMPANY & INDUSTRY */}
                        <td className="p-4 font-mono">
                          <div className="font-bold text-black">{lead.company || "Independent Lead"}</div>
                          <div className="text-[10px] text-neutral-500 uppercase">{lead.industry || "General"}</div>
                        </td>

                        {/* STATUS */}
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider sharp-border ${
                              lead.status === "NEW"
                                ? "bg-[#20C8E8] text-black"
                                : lead.status === "QUALIFIED" || lead.status === "HOT"
                                ? "bg-[#12B76A] text-white"
                                : lead.status === "CONVERTED"
                                ? "bg-[#F4B62A] text-black"
                                : "bg-neutral-200 text-black"
                            }`}
                          >
                            {lead.status}
                          </span>
                        </td>

                        {/* PRIORITY */}
                        <td className="p-4 font-mono text-xs font-bold uppercase text-neutral-800">
                          {lead.priority || "NORMAL"}
                        </td>

                        {/* AI SCORE */}
                        <td className="p-4 font-mono">
                          {lead.score > 0 || lead.heat_level === "HOT" ? (
                            <span className="inline-flex items-center gap-1 bg-[#12B76A] text-white px-2 py-0.5 font-bold text-[10px] sharp-border">
                              <Flame className="w-3 h-3 fill-current" /> {lead.score}/100
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-neutral-400 uppercase">
                              {lead.heat_level || "NOT ANALYZED"}
                            </span>
                          )}
                        </td>

                        {/* SOURCE */}
                        <td className="p-4 font-mono text-xs uppercase text-neutral-700">
                          {lead.source || "WEBSITE"}
                        </td>

                        {/* CREATED */}
                        <td className="p-4 font-mono text-[11px] text-neutral-500">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>

                        {/* ACTIONS */}
                        <td className="p-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleAnalyzeLead(lead)}
                            disabled={analyzingLeadId === lead.id}
                            className="p-1.5 border border-black bg-white hover:bg-neutral-100 sharp-border cursor-pointer inline-flex items-center justify-center"
                            title="Analyze with Qwen AI"
                          >
                            {analyzingLeadId === lead.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#12B76A]" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-black" />
                            )}
                          </button>

                          <button
                            onClick={() => handleOpenConversation(lead)}
                            className="p-1.5 border border-black bg-white hover:bg-[#12B76A] hover:text-white sharp-border cursor-pointer inline-flex items-center justify-center"
                            title="Open Conversation 2.0"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setEditingLead(lead)}
                            className="p-1.5 border border-black bg-white hover:bg-neutral-100 sharp-border cursor-pointer inline-flex items-center justify-center"
                            title="Edit Lead"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-black" />
                          </button>

                          <button
                            onClick={() => handleDeleteLead(lead.id, lead.name)}
                            className="p-1.5 border border-black bg-white hover:bg-red-600 hover:text-white sharp-border cursor-pointer inline-flex items-center justify-center"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600 hover:text-white" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER — MATCHING SCREENSHOT 1 EXACTLY */}
            <div className="p-4 bg-[#F1F2F3] border-t border-black flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono font-bold uppercase text-black">
              <div>
                SHOWING PAGE 1 OF 1 ({leads.length} TOTAL LEADS)
              </div>

              <div className="flex items-center gap-2">
                <button disabled className="px-3 py-1 bg-neutral-200 text-neutral-400 sharp-border cursor-not-allowed">
                  &lt; Previous
                </button>
                <span className="px-3 py-1 bg-white border border-black sharp-border">
                  1 / 1
                </span>
                <button disabled className="px-3 py-1 bg-neutral-200 text-neutral-400 sharp-border cursor-not-allowed">
                  Next &gt;
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CREATE NEW LEAD MODAL — MATCHING SCREENSHOT 2 EXACTLY */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white sharp-border max-w-2xl w-full p-6 space-y-5 my-8">
            {/* Header Box */}
            <div className="flex items-center justify-between border-b border-black pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#12B76A] text-white sharp-border flex items-center justify-center font-bold">
                  +
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-black">
                    CREATE NEW LEAD
                  </h2>
                  <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                    ADD OPPORTUNITY TO AUTHORIZED WORKSPACE
                  </p>
                </div>
              </div>
              <X className="w-5 h-5 cursor-pointer text-black hover:opacity-70" onClick={() => setShowCreateModal(false)} />
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs font-mono">
              {/* Row 1: LEAD NAME * & EMAIL ADDRESS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#12B76A]" /> LEAD NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-neutral-500" /> EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rahul@company.com"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                  />
                </div>
              </div>

              {/* Row 2: PHONE NUMBER & COMPANY NAME */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-neutral-500" /> PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-neutral-500" /> COMPANY NAME
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. TechNova Labs"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                  />
                </div>
              </div>

              {/* Row 3: INDUSTRY, SOURCE, BUDGET (₹) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold uppercase mb-1 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-neutral-500" /> INDUSTRY
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. SaaS"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1">SOURCE</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border cursor-pointer"
                  >
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Cold Outreach">Cold Outreach</option>
                    <option value="Inbound Form">Inbound Form</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-[#12B76A]" /> BUDGET (₹)
                  </label>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                  />
                </div>
              </div>

              {/* Row 4: INITIAL STATUS & PRIORITY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase mb-1">INITIAL STATUS</label>
                  <select
                    value={initialStatus}
                    onChange={(e) => setInitialStatus(e.target.value)}
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border cursor-pointer"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="CONVERTED">CONVERTED</option>
                    <option value="LOST">LOST</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1">PRIORITY</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border cursor-pointer"
                  >
                    <option value="LOW">LOW</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              {/* Row 5: STATED REQUIREMENT */}
              <div>
                <label className="block font-bold uppercase mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-neutral-500" /> STATED REQUIREMENT
                </label>
                <input
                  type="text"
                  value={statedRequirement}
                  onChange={(e) => setStatedRequirement(e.target.value)}
                  placeholder="e.g. Needs sales automation & lead qualification"
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                />
              </div>

              {/* Row 6: INBOUND INQUIRY MESSAGE / NOTES */}
              <div>
                <label className="block font-bold uppercase mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-neutral-500" /> INBOUND INQUIRY MESSAGE / NOTES
                </label>
                <textarea
                  rows={3}
                  value={inboundNotes}
                  onChange={(e) => setInboundNotes(e.target.value)}
                  placeholder="Enter customer message or additional lead notes..."
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase hover:bg-neutral-200 sharp-border cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-pill-primary text-xs cursor-pointer"
                >
                  {submitting ? "CREATING..." : "+ CREATE LEAD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LEAD MODAL */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white sharp-border max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h2 className="text-lg font-black uppercase tracking-tight">EDIT LEAD: {editingLead.name}</h2>
              <X className="w-4 h-4 cursor-pointer" onClick={() => setEditingLead(null)} />
            </div>

            <form onSubmit={handleUpdateLead} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block font-bold uppercase mb-1">Lead Name *</label>
                <input
                  type="text"
                  required
                  value={editingLead.name}
                  onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                  className="w-full p-2 border border-black bg-[#F1F2F3] text-xs font-bold sharp-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={editingLead.email || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    className="w-full p-2 border border-black bg-[#F1F2F3] text-xs sharp-border"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase mb-1">Company</label>
                  <input
                    type="text"
                    value={editingLead.company || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })}
                    className="w-full p-2 border border-black bg-[#F1F2F3] text-xs sharp-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold uppercase mb-1">Status</label>
                  <select
                    value={editingLead.status}
                    onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value })}
                    className="w-full p-2 border border-black bg-[#F1F2F3] text-xs font-bold uppercase sharp-border"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="CONVERTED">CONVERTED</option>
                    <option value="LOST">LOST</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1">Priority</label>
                  <select
                    value={editingLead.priority}
                    onChange={(e) => setEditingLead({ ...editingLead, priority: e.target.value })}
                    className="w-full p-2 border border-black bg-[#F1F2F3] text-xs font-bold uppercase sharp-border"
                  >
                    <option value="LOW">LOW</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-4 py-2 border border-black bg-[#F1F2F3] text-xs font-bold uppercase sharp-border"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-pill-primary text-xs">
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
