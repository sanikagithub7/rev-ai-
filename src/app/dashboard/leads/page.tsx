"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Flame, X, UserPlus, RefreshCw, AlertCircle, Sparkles, CheckCircle2, ShieldAlert, Target, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AIAnalysisResult {
  hot_lead: {
    result: boolean;
    confidence: number;
    reasoning: string;
    signals: string[];
  };
  spam_detection: {
    result: boolean;
    confidence: number;
    reasoning: string;
    signals: string[];
  };
  lead_qualification: {
    status: "QUALIFIED" | "PARTIALLY_QUALIFIED" | "NOT_QUALIFIED";
    confidence: number;
    reasoning: string;
    signals: string[];
  };
  modelUsed?: string;
}

interface LeadRecord {
  id: string;
  organization_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: "NEW" | "QUALIFIED" | "HOT" | "NURTURING" | "CONVERTED" | "LOST";
  score: number;
  metadata?: {
    website_url?: string;
    hot_lead?: AIAnalysisResult["hot_lead"];
    spam_detection?: AIAnalysisResult["spam_detection"];
    lead_qualification?: AIAnalysisResult["lead_qualification"];
  };
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

  // Website Lead Analysis state
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [prospectName, setProspectName] = useState("");
  const [prospectEmail, setProspectEmail] = useState("");
  const [prospectCompany, setProspectCompany] = useState("");
  const [analyzingUrl, setAnalyzingUrl] = useState(false);
  const [analysisOutput, setAnalysisOutput] = useState<AIAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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

  async function handleAnalyzeWebsite(e: React.FormEvent) {
    e.preventDefault();
    if (!websiteUrl.trim()) return;

    setAnalyzingUrl(true);
    setAnalysisError(null);
    setAnalysisOutput(null);

    try {
      const res = await fetch("/api/leads/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: websiteUrl.trim(),
          name: prospectName.trim(),
          email: prospectEmail.trim(),
          company: prospectCompany.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAnalysisError(data.error || "Website could not be analyzed.");
      } else if (data.analysis) {
        setAnalysisOutput(data.analysis);
        if (data.lead) {
          setLeads((prev) => [data.lead, ...prev]);
        }
      }
    } catch {
      setAnalysisError("Website could not be analyzed.");
    } finally {
      setAnalyzingUrl(false);
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
            // PIPELINE MANAGEMENT & AI LEAD INTELLIGENCE
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            LEADS & PROSPECTS
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Analyze company websites via Ollama Qwen AI to detect hot leads, verify spam, and generate qualification scores.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchLeads}
            className="px-3 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-bold uppercase sharp-border cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-600 text-xs font-bold uppercase text-red-900 flex items-center gap-2 sharp-border">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* 2. OLLAMA QWEN WEBSITE LEAD INTELLIGENCE SECTION */}
      <div className="bg-[#123B2D] text-white p-6 sharp-border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#12B76A]" />
            <h2 className="text-lg font-black uppercase tracking-tight text-white">
              OLLAMA QWEN AI LEAD INTELLIGENCE
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-300">
            // REAL WEBSITE CONTENT ANALYSIS
          </span>
        </div>

        <p className="text-xs text-emerald-100/80 font-mono">
          Enter any public company website URL. REV AI performs SSRF-safe content extraction and executes Ollama Qwen inference to generate 3 structured results.
        </p>

        <form onSubmit={handleAnalyzeWebsite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6">
              <label className="block text-[10px] font-mono font-bold uppercase text-emerald-300 mb-1">
                Website URL *
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="url"
                  required
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-black/60 border border-emerald-700 text-xs font-mono text-white focus:outline-none focus:border-[#12B76A] sharp-border"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-[10px] font-mono font-bold uppercase text-emerald-300 mb-1">
                Prospect Name
              </label>
              <input
                type="text"
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
                placeholder="Optional name"
                className="w-full p-2.5 bg-black/60 border border-emerald-700 text-xs font-mono text-white focus:outline-none focus:border-[#12B76A] sharp-border"
              />
            </div>

            <div className="md:col-span-3 flex items-end">
              <button
                type="submit"
                disabled={analyzingUrl}
                className="w-full py-2.5 bg-[#12B76A] text-white font-black text-xs uppercase tracking-wider sharp-border hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {analyzingUrl ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching & Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-white" /> ANALYZE LEAD
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {analysisError && (
          <div className="p-4 bg-red-900/60 border border-red-500 text-xs font-mono text-red-200 flex items-center gap-2 sharp-border">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            {analysisError}
          </div>
        )}

        {/* DISPLAY EXACTLY 3 AI RESULTS */}
        {analysisOutput && (
          <div className="space-y-4 pt-4 border-t border-emerald-800 animate-fadeIn">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center justify-between">
              <span>● AI ANALYSIS RESULTS FOR {websiteUrl}</span>
              <span className="text-[10px] opacity-70">MODEL: {analysisOutput.modelUsed || "QWEN"}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* RESULT 1: HOT LEAD DETECTION */}
              <div className="bg-black/70 p-4 border border-emerald-600 sharp-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-black text-xs uppercase text-[#12B76A]">
                    <Flame className="w-4 h-4 fill-current text-[#12B76A]" /> 1. HOT LEAD DETECTION
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase sharp-border ${analysisOutput.hot_lead.result ? "bg-[#12B76A] text-white" : "bg-neutral-700 text-white"}`}>
                    {analysisOutput.hot_lead.result ? "HOT LEAD DETECTED" : "NORMAL LEAD"}
                  </span>
                </div>

                <div className="text-2xl font-black text-white font-mono">
                  {analysisOutput.hot_lead.confidence}% <span className="text-xs text-neutral-400 font-normal">confidence</span>
                </div>

                <div className="text-xs font-mono text-emerald-100/90 leading-relaxed">
                  <span className="font-bold text-emerald-400 uppercase">Reasoning: </span>
                  {analysisOutput.hot_lead.reasoning}
                </div>

                <div className="pt-2 border-t border-emerald-900/60 text-[10px] font-mono space-y-1">
                  <div className="text-emerald-400 font-bold uppercase">Evidence / Signals:</div>
                  <ul className="list-disc list-inside text-neutral-300 space-y-0.5">
                    {analysisOutput.hot_lead.signals.map((sig, idx) => (
                      <li key={idx}>{sig}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* RESULT 2: SPAM DETECTION */}
              <div className="bg-black/70 p-4 border border-emerald-600 sharp-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-black text-xs uppercase text-[#20C8E8]">
                    <ShieldAlert className="w-4 h-4 text-[#20C8E8]" /> 2. SPAM DETECTION
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase sharp-border ${analysisOutput.spam_detection.result ? "bg-red-600 text-white" : "bg-[#12B76A] text-white"}`}>
                    {analysisOutput.spam_detection.result ? "SUSPICIOUS / SPAM" : "LEGITIMATE"}
                  </span>
                </div>

                <div className="text-2xl font-black text-white font-mono">
                  {analysisOutput.spam_detection.confidence}% <span className="text-xs text-neutral-400 font-normal">confidence</span>
                </div>

                <div className="text-xs font-mono text-emerald-100/90 leading-relaxed">
                  <span className="font-bold text-[#20C8E8] uppercase">Reasoning: </span>
                  {analysisOutput.spam_detection.reasoning}
                </div>

                <div className="pt-2 border-t border-emerald-900/60 text-[10px] font-mono space-y-1">
                  <div className="text-[#20C8E8] font-bold uppercase">Suspicious Signals:</div>
                  <ul className="list-disc list-inside text-neutral-300 space-y-0.5">
                    {analysisOutput.spam_detection.signals.map((sig, idx) => (
                      <li key={idx}>{sig}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* RESULT 3: LEAD QUALIFICATION */}
              <div className="bg-black/70 p-4 border border-emerald-600 sharp-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-black text-xs uppercase text-[#F4B62A]">
                    <Target className="w-4 h-4 text-[#F4B62A]" /> 3. LEAD QUALIFICATION
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase sharp-border ${analysisOutput.lead_qualification.status === "QUALIFIED" ? "bg-[#12B76A] text-white" : analysisOutput.lead_qualification.status === "PARTIALLY_QUALIFIED" ? "bg-[#F4B62A] text-black" : "bg-neutral-700 text-white"}`}>
                    {analysisOutput.lead_qualification.status}
                  </span>
                </div>

                <div className="text-2xl font-black text-white font-mono">
                  {analysisOutput.lead_qualification.confidence}% <span className="text-xs text-neutral-400 font-normal">confidence</span>
                </div>

                <div className="text-xs font-mono text-emerald-100/90 leading-relaxed">
                  <span className="font-bold text-[#F4B62A] uppercase">Reasoning: </span>
                  {analysisOutput.lead_qualification.reasoning}
                </div>

                <div className="pt-2 border-t border-emerald-900/60 text-[10px] font-mono space-y-1">
                  <div className="text-[#F4B62A] font-bold uppercase">Detected Intent Signals:</div>
                  <ul className="list-disc list-inside text-neutral-300 space-y-0.5">
                    {analysisOutput.lead_qualification.signals.map((sig, idx) => (
                      <li key={idx}>{sig}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. SEARCH & FILTERS */}
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

      {/* 4. LEADS TABLE OR EMPTY STATE */}
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
              No lead records found in database matching your filters. Analyze a company URL above to create your first real lead.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F2F3] border-b border-black text-xs font-mono font-bold uppercase tracking-wider text-black">
                <th className="p-4">Lead Name</th>
                <th className="p-4">Company / Website</th>
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
                  <td className="p-4 text-neutral-700 font-mono text-xs">
                    <div>{lead.company || "—"}</div>
                    {lead.metadata?.website_url && (
                      <a href={lead.metadata.website_url} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 hover:underline">
                        {lead.metadata.website_url.replace(/^https?:\/\//, "")}
                      </a>
                    )}
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
    </div>
  );
}
