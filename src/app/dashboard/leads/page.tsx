"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  RefreshCw,
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
  Zap,
  Code,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { StructuredLeadIntelligence } from "@/lib/ai/ollama";

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
  metadata?: {
    ai_intelligence?: StructuredLeadIntelligence;
    website_url?: string;
    [key: string]: any;
  };
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

  // Filters & Search state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL STATUSES");
  const [priorityFilter, setPriorityFilter] = useState("ALL PRIORITIES");
  const [heatFilter, setHeatFilter] = useState("ALL HEAT LEVELS");
  const [sortField, setSortField] = useState("CREATED DATE");
  const [sortOrder, setSortOrder] = useState("DESCENDING");

  // Create & Edit Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal Create Form State
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

  // AI Workspace Active Lead State
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [formContactName, setFormContactName] = useState("");
  const [formCompanyName, setFormCompanyName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formIndustry, setFormIndustry] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formStatedRequirement, setFormStatedRequirement] = useState("");
  const [formInboundMessage, setFormInboundMessage] = useState("");

  // AI Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [activeIntelligence, setActiveIntelligence] = useState<StructuredLeadIntelligence | null>(null);
  const [showRawJsonModal, setShowRawJsonModal] = useState(false);

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
        const loadedLeads: LeadRecord[] = data.leads || [];
        setLeads(loadedLeads);

        // Auto-select highlight lead from URL or keep currently selected lead updated
        if (loadedLeads.length > 0) {
          const target = highlightLeadId
            ? loadedLeads.find((l) => l.id === highlightLeadId) || loadedLeads[0]
            : selectedLeadId
            ? loadedLeads.find((l) => l.id === selectedLeadId) || loadedLeads[0]
            : loadedLeads[0];

          if (target && target.id !== selectedLeadId) {
            populateWorkspaceLead(target);
          }
        }
      }
    } catch {
      setError("Failed to connect to backend server.");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, heatFilter, sortField, sortOrder, highlightLeadId, selectedLeadId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Populate the Left & Right Workspace panels with selected lead data
  function populateWorkspaceLead(lead: LeadRecord) {
    setSelectedLeadId(lead.id);
    setFormContactName(lead.name || "");
    setFormCompanyName(lead.company || "");
    setFormEmail(lead.email || "");
    setFormPhone(lead.phone || "");
    setFormIndustry(lead.industry || "");
    setFormBudget(lead.budget || "");
    setFormStatedRequirement(lead.stated_requirement || "");
    setFormInboundMessage(lead.inbound_notes || "");

    // Populate existing AI Intelligence if present
    if (lead.metadata?.ai_intelligence) {
      setActiveIntelligence(lead.metadata.ai_intelligence);
    } else {
      setActiveIntelligence(null);
    }
  }

  // Handle Create Lead via Modal
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

        populateWorkspaceLead(data.lead);
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
        if (selectedLeadId === id) {
          setSelectedLeadId(null);
          setActiveIntelligence(null);
        }
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

  // RUN LEAD INTELLIGENCE AGENT (Calls backend POST /api/leads/intelligence)
  async function handleRunLeadIntelligence() {
    if (!formContactName.trim()) {
      setError("Contact Name is required to run Lead Intelligence Agent.");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/leads/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLeadId || undefined,
          contactName: formContactName.trim(),
          companyName: formCompanyName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          industry: formIndustry.trim(),
          budget: formBudget.trim(),
          statedRequirement: formStatedRequirement.trim(),
          inboundMessage: formInboundMessage.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "AI service is currently unavailable.");
      } else if (data.intelligence && data.lead) {
        setActiveIntelligence(data.intelligence);
        setSelectedLeadId(data.lead.id);
        setToast(`AI Lead Intelligence completed for "${data.lead.name}"!`);
        fetchLeads(); // Refresh lead table to reflect persisted score & heat_level
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err: any) {
      setError(err?.message || "AI service unavailable. Make sure Ollama is running.");
    } finally {
      setAnalyzing(false);
    }
  }

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

      {/* TOP pinkish/sharp BANNER - MATCHING REFERENCE SCREENSHOT */}
      <div className="bg-[#FFF0F5] border border-black p-3 text-center text-xs font-mono font-extrabold uppercase tracking-widest text-black sharp-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-black inline-block" />
          <span>INTERNAL DECISION ENGINE &bull; STRUCTURED JSON VALIDATION &bull; SERVER-SIDE OLLAMA</span>
        </div>
        <div className="text-[10px] bg-black text-white px-2 py-0.5 font-mono font-bold">
          QWEN 2.5 ACTIVE
        </div>
      </div>

      {/* WORKSPACE HEADER BAR / LEAD SELECTOR */}
      <div className="bg-white sharp-border p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-black text-white px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider sharp-border">
            <Sparkles className="w-3 h-3 text-[#12B76A]" />
            AI LEAD INTELLIGENCE WORKSPACE
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            LEAD INTELLIGENCE AGENT
          </h1>
        </div>

        {/* Lead Dropdown Selector & Create Button */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedLeadId || ""}
            onChange={(e) => {
              const selected = leads.find((l) => l.id === e.target.value);
              if (selected) populateWorkspaceLead(selected);
            }}
            className="flex-1 md:w-64 p-2 border border-black bg-[#F1F2F3] text-xs font-mono font-bold uppercase focus:outline-none sharp-border cursor-pointer"
          >
            {leads.length === 0 ? (
              <option value="">NO LEADS AVAILABLE</option>
            ) : (
              leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.company ? `(${l.company})` : ""} &bull; {l.heat_level || "NEW"}
                </option>
              ))
            )}
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-pill-primary text-xs shrink-0 cursor-pointer shadow-sm"
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

      {/* 2-COLUMN INTELLIGENCE WORKSPACE - EXACTLY MATCHING REFERENCE SCREENSHOT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================================= */}
        {/* LEFT PANEL — INBOUND LEAD SAMPLE DATA */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 bg-white sharp-border p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header Box */}
            <div className="border-b border-black pb-3">
              <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#12B76A]" /> INBOUND LEAD SAMPLE DATA
              </h2>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                SIMULATE UNFORMATTED INCOMING LEAD SUBMISSION PAYLOAD
              </p>
            </div>

            {/* Input Form Fields matching reference screenshot exactly */}
            <div className="space-y-4 font-mono text-xs">
              {/* Row 1: CONTACT NAME & COMPANY NAME */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase mb-1 text-[10px] text-neutral-700">
                    CONTACT NAME
                  </label>
                  <input
                    type="text"
                    value={formContactName}
                    onChange={(e) => setFormContactName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold text-black focus:outline-none focus:bg-white sharp-border"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1 text-[10px] text-neutral-700">
                    COMPANY NAME
                  </label>
                  <input
                    type="text"
                    value={formCompanyName}
                    onChange={(e) => setFormCompanyName(e.target.value)}
                    placeholder="Example Technologies"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold text-black focus:outline-none focus:bg-white sharp-border"
                  />
                </div>
              </div>

              {/* Row 2: INDUSTRY SECTOR & ESTIMATED BUDGET (₹) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase mb-1 text-[10px] text-neutral-700">
                    INDUSTRY SECTOR
                  </label>
                  <input
                    type="text"
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                    placeholder="SaaS"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold text-black focus:outline-none focus:bg-white sharp-border"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1 text-[10px] text-neutral-700">
                    ESTIMATED BUDGET (₹)
                  </label>
                  <input
                    type="text"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    placeholder="200000"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold text-black focus:outline-none focus:bg-white sharp-border"
                  />
                </div>
              </div>

              {/* Row 3: STATED REQUIREMENT */}
              <div>
                <label className="block font-bold uppercase mb-1 text-[10px] text-neutral-700">
                  STATED REQUIREMENT
                </label>
                <input
                  type="text"
                  value={formStatedRequirement}
                  onChange={(e) => setFormStatedRequirement(e.target.value)}
                  placeholder="Sales automation & lead qualification workflow"
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold text-black focus:outline-none focus:bg-white sharp-border"
                />
              </div>

              {/* Row 4: INBOUND MESSAGE / CUSTOMER QUERY */}
              <div>
                <label className="block font-bold uppercase mb-1 text-[10px] text-neutral-700">
                  INBOUND MESSAGE / CUSTOMER QUERY
                </label>
                <textarea
                  rows={4}
                  value={formInboundMessage}
                  onChange={(e) => setFormInboundMessage(e.target.value)}
                  placeholder="We urgently need to automate our sales process to qualify leads faster."
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold text-black focus:outline-none focus:bg-white sharp-border"
                />
              </div>
            </div>
          </div>

          {/* RUN AI BUTTON — PROMINENT BLACK PILL BUTTON MATCHING SCREENSHOT */}
          <div className="pt-2">
            <button
              onClick={handleRunLeadIntelligence}
              disabled={analyzing}
              className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 sharp-border shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#12B76A]" />
                  ANALYZING LEAD WITH QWEN...
                </>
              ) : (
                <>
                  RUN LEAD INTELLIGENCE AGENT &rarr;
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL — INTELLIGENCE DECISIONS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 bg-white sharp-border p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header Box + RAW JSON Button */}
            <div className="flex items-start justify-between border-b border-black pb-3">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#12B76A]" /> INTELLIGENCE DECISIONS
                </h2>
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  ZOD VALIDATED OUTPUT &bull; AUDIT LOGGED IN PUBLIC.AI_RUNS
                </p>
              </div>

              {activeIntelligence && (
                <button
                  onClick={() => setShowRawJsonModal(true)}
                  className="px-3 py-1.5 bg-black text-white text-[10px] font-mono font-bold uppercase tracking-wider sharp-border hover:bg-neutral-800 cursor-pointer flex items-center gap-1"
                >
                  <Code className="w-3 h-3 text-[#12B76A]" /> RAW JSON
                </button>
              )}
            </div>

            {!activeIntelligence ? (
              /* UN-ANALYZED / EMPTY STATE FOR RIGHT PANEL */
              <div className="p-12 text-center space-y-3 bg-[#F1F2F3] sharp-border my-6">
                <Flame className="w-10 h-10 text-neutral-400 mx-auto" />
                <h3 className="text-lg font-black uppercase text-black">LEAD NOT ANALYZED</h3>
                <p className="text-xs text-neutral-600 font-mono max-w-xs mx-auto">
                  Click &quot;RUN LEAD INTELLIGENCE AGENT &rarr;&quot; to generate real-time AI classification, score, buying signals, and workflow recommendations.
                </p>
              </div>
            ) : (
              /* ACTIVE AI INTELLIGENCE OUTPUT — EXACT MATCH TO REFERENCE SCREENSHOT */
              <div className="space-y-5 font-mono">
                {/* TOP 3 STAT CARDS */}
                <div className="grid grid-cols-3 gap-3">
                  {/* CARD 1: AI LEAD SCORE */}
                  <div className="p-4 bg-white border border-black sharp-border text-center space-y-1">
                    <div className="text-[9px] font-bold text-neutral-500 uppercase">AI LEAD SCORE</div>
                    <div className="text-3xl md:text-4xl font-black text-black tracking-tight">
                      {activeIntelligence.lead_score}
                    </div>
                    <div className="text-[9px] font-bold text-neutral-400 uppercase">SCALE 0 - 100</div>
                  </div>

                  {/* CARD 2: CLASSIFICATION */}
                  <div className="p-4 bg-white border border-black sharp-border text-center space-y-1">
                    <div className="text-[9px] font-bold text-neutral-500 uppercase">CLASSIFICATION</div>
                    <div>
                      <span
                        className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-wider sharp-border ${
                          activeIntelligence.classification === "HOT"
                            ? "bg-[#12B76A] text-white"
                            : activeIntelligence.classification === "WARM"
                            ? "bg-[#F4B62A] text-black"
                            : activeIntelligence.classification === "SPAM"
                            ? "bg-red-600 text-white"
                            : "bg-neutral-200 text-black"
                        }`}
                      >
                        {activeIntelligence.classification === "HOT" && "🔥 "}
                        {activeIntelligence.classification}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-neutral-400 uppercase">HEAT LEVEL</div>
                  </div>

                  {/* CARD 3: URGENCY */}
                  <div className="p-4 bg-white border border-black sharp-border text-center space-y-1">
                    <div className="text-[9px] font-bold text-neutral-500 uppercase">URGENCY</div>
                    <div>
                      <span
                        className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-wider sharp-border ${
                          activeIntelligence.urgency === "HIGH"
                            ? "bg-red-600 text-white"
                            : activeIntelligence.urgency === "MEDIUM"
                            ? "bg-[#F4B62A] text-black"
                            : "bg-neutral-200 text-black"
                        }`}
                      >
                        {activeIntelligence.urgency}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-neutral-400 uppercase">
                      CONFIDENCE: {activeIntelligence.confidence}%
                    </div>
                  </div>
                </div>

                {/* RECOMMENDED WORKFLOW ACTION BOX */}
                <div className="p-4 bg-[#E8F8F0] border border-black sharp-border space-y-2">
                  <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                    RECOMMENDED WORKFLOW ACTION
                  </div>
                  <div className="text-sm font-black uppercase text-black flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#12B76A]" />
                    {activeIntelligence.recommended_action}
                  </div>
                  <div className="text-[11px] text-neutral-700 leading-snug">
                    <span className="font-bold uppercase text-[9px] block text-neutral-500 mb-0.5">DETECTED INTENT:</span>
                    {activeIntelligence.detected_intent}
                  </div>
                </div>

                {/* POSITIVE BUYING SIGNALS */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-black flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#12B76A]" /> POSITIVE BUYING SIGNALS
                  </div>
                  <div className="space-y-1.5">
                    {activeIntelligence.positive_buying_signals && activeIntelligence.positive_buying_signals.length > 0 ? (
                      activeIntelligence.positive_buying_signals.map((sig, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-[#F1F2F3] border border-neutral-300 text-xs font-medium text-black sharp-border flex items-start gap-2"
                        >
                          <span className="text-[#12B76A] font-bold">&check;</span>
                          <span>{sig}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 bg-[#F1F2F3] border border-neutral-300 text-xs text-neutral-500 sharp-border">
                        No strong buying signals detected.
                      </div>
                    )}
                  </div>
                </div>

                {/* IDENTIFIED RISKS & FRICTION POINTS */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-black flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> IDENTIFIED RISKS &amp; FRICTION POINTS
                  </div>
                  <div className="space-y-1.5">
                    {activeIntelligence.risks && activeIntelligence.risks.length > 0 ? (
                      activeIntelligence.risks.map((risk, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-amber-50 border border-amber-300 text-xs font-medium text-amber-900 sharp-border flex items-start gap-2"
                        >
                          <span className="text-amber-600 font-bold">&#9888;</span>
                          <span>{risk}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 bg-[#F1F2F3] border border-neutral-300 text-xs text-neutral-500 sharp-border">
                        No significant risks detected.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM MODEL & LATENCY FOOTER MATCHING REFERENCE SCREENSHOT */}
          {activeIntelligence && (
            <div className="pt-3 border-t border-black flex items-center justify-between text-[10px] font-mono font-bold text-neutral-600 uppercase">
              <div>MODEL: {activeIntelligence.modelUsed}</div>
              <div>LATENCY: {activeIntelligence.latency_ms}MS</div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PERSISTENT LEADS PIPELINE TABLE — (BELOW WORKSPACE) */}
      {/* ========================================================================= */}
      <div className="bg-white sharp-border p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-black pb-3">
          <h2 className="text-lg font-black uppercase text-black flex items-center gap-2">
            <User className="w-4 h-4 text-[#12B76A]" /> AUTHORIZED WORKSPACE LEADS PIPELINE ({leads.length})
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeads}
              className="px-3 py-1.5 border border-black bg-[#F1F2F3] hover:bg-neutral-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 sharp-border cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> REFRESH
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by name, email, or company..."
              className="w-full pl-9 pr-4 py-2 bg-[#F1F2F3] text-xs font-medium border border-black focus:outline-none focus:bg-white sharp-border"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1 text-xs font-mono font-bold uppercase">
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

        {/* Table View */}
        <div className="overflow-x-auto border-t border-black">
          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-neutral-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#12B76A]" /> Fetching workspace leads from Supabase...
            </div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <h3 className="text-xl font-black uppercase text-black">NO LEADS AVAILABLE</h3>
              <p className="text-xs text-neutral-600 font-mono max-w-sm mx-auto">
                No lead records found in your organization workspace. Create a lead to begin AI intelligence analysis.
              </p>
              <div>
                <button onClick={() => setShowCreateModal(true)} className="btn-pill-primary text-xs cursor-pointer">
                  + CREATE FIRST LEAD
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F2F3] border-b border-black text-xs font-mono font-bold uppercase tracking-wider text-black">
                  <th className="p-3">NAME &amp; CONTACT</th>
                  <th className="p-3">COMPANY &amp; INDUSTRY</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">PRIORITY</th>
                  <th className="p-3">AI SCORE</th>
                  <th className="p-3">SOURCE</th>
                  <th className="p-3">CREATED</th>
                  <th className="p-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs font-medium">
                {leads.map((lead) => {
                  const isSelected = lead.id === selectedLeadId;
                  return (
                    <tr
                      key={lead.id}
                      className={`transition-colors ${
                        isSelected ? "bg-[#12B76A]/10 border-l-4 border-l-[#12B76A]" : "hover:bg-[#F1F2F3]/60"
                      }`}
                    >
                      <td className="p-3 font-mono">
                        <div className="font-bold text-black uppercase">{lead.name}</div>
                        <div className="text-[10px] text-neutral-500 lowercase">{lead.email || "no-email@provided"}</div>
                      </td>

                      <td className="p-3 font-mono">
                        <div className="font-bold text-black">{lead.company || "Independent Lead"}</div>
                        <div className="text-[10px] text-neutral-500 uppercase">{lead.industry || "General"}</div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider sharp-border ${
                            lead.status === "NEW"
                              ? "bg-[#20C8E8] text-black"
                              : lead.status === "QUALIFIED"
                              ? "bg-[#12B76A] text-white"
                              : lead.status === "CONVERTED"
                              ? "bg-[#F4B62A] text-black"
                              : "bg-neutral-200 text-black"
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>

                      <td className="p-3 font-mono text-xs font-bold uppercase text-neutral-800">
                        {lead.priority || "NORMAL"}
                      </td>

                      <td className="p-3 font-mono">
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

                      <td className="p-3 font-mono text-xs uppercase text-neutral-700">
                        {lead.source || "WEBSITE"}
                      </td>

                      <td className="p-3 font-mono text-[11px] text-neutral-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>

                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => {
                            populateWorkspaceLead(lead);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="p-1.5 border border-black bg-white hover:bg-neutral-100 sharp-border cursor-pointer inline-flex items-center justify-center"
                          title="Select Lead & Load AI Intelligence"
                        >
                          <Eye className="w-3.5 h-3.5 text-black" />
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
          )}
        </div>
      </div>

      {/* RAW JSON MODAL */}
      {showRawJsonModal && activeIntelligence && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white sharp-border max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h3 className="text-lg font-black uppercase text-black flex items-center gap-2">
                <Code className="w-4 h-4 text-[#12B76A]" /> RAW ZOD-VALIDATED AI JSON RESPONSE
              </h3>
              <X className="w-5 h-5 cursor-pointer text-black hover:opacity-70" onClick={() => setShowRawJsonModal(false)} />
            </div>

            <pre className="p-4 bg-black text-[#12B76A] font-mono text-xs overflow-auto flex-1 sharp-border">
              {JSON.stringify(activeIntelligence, null, 2)}
            </pre>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowRawJsonModal(false)}
                className="px-6 py-2 border border-black bg-[#F1F2F3] text-xs font-mono font-bold uppercase sharp-border cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW LEAD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white sharp-border max-w-2xl w-full p-6 space-y-5 my-8">
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
                    placeholder="e.g. 200000"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                  />
                </div>
              </div>

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

              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase hover:bg-neutral-200 sharp-border cursor-pointer"
                >
                  CANCEL
                </button>
                <button type="submit" disabled={submitting} className="btn-pill-primary text-xs cursor-pointer">
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
