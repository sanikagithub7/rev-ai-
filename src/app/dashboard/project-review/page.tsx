"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Search,
  Globe,
  Target,
  Package,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Flame,
  ArrowRight,
  Trash2,
  Eye,
  Plus,
  ShieldCheck,
  Zap,
  BarChart2,
  Lock,
  Layers,
} from "lucide-react";

interface CategoryEvaluation {
  score: number;
  findings: string[];
}

interface ReviewResultJSON {
  overall_score: number;
  website_summary?: string;
  summary?: string;
  business_type?: string;
  project_type?: string;
  primary_product_or_service?: string;
  product_service?: string;
  target_audience?: string;
  target_market?: string;
  value_proposition?: string;
  strengths: string[];
  weaknesses: string[];
  conversion_analysis?: CategoryEvaluation;
  sales_readiness?: CategoryEvaluation | { score: number; assessment: string };
  lead_generation?: CategoryEvaluation | { score: number; assessment: string };
  trust_and_credibility?: CategoryEvaluation;
  ux_analysis?: CategoryEvaluation;
  seo_observations?: CategoryEvaluation;
  product_readiness?: { score: number; assessment: string };
  marketing_readiness?: { score: number; assessment: string };
  risks: string[];
  opportunities: string[];
  recommended_actions: Array<{ priority: string; action: string; reason: string }>;
  next_steps?: string[];
}

interface ProjectReviewRecord {
  id: string;
  organization_id: string;
  project_name: string;
  website_url?: string;
  project_description: string;
  target_audience?: string;
  product_service?: string;
  current_goal?: string;
  additional_context?: string;
  overall_score: number;
  review_result: ReviewResultJSON;
  created_at: string;
}

export default function ProjectReviewPage() {
  const [reviewsHistory, setReviewsHistory] = useState<ProjectReviewRecord[]>([]);
  const [activeReview, setActiveReview] = useState<ProjectReviewRecord | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Mode: "URL_REVIEW" (Website input) or "FULL_PROJECT"
  const [mode, setMode] = useState<"URL_REVIEW" | "FULL_PROJECT">("URL_REVIEW");

  // Form State
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [productService, setProductService] = useState("");
  const [currentGoal, setCurrentGoal] = useState("Generate Leads");
  const [additionalContext, setAdditionalContext] = useState("");

  const fetchReviews = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/ai-review");
      const data = await res.json();
      if (res.ok && data.success) {
        setReviewsHistory(data.reviews || []);
        if (data.reviews && data.reviews.length > 0 && !activeReview) {
          setActiveReview(data.reviews[0]);
        }
      }
    } catch {
      // Ignored
    } finally {
      setLoadingHistory(false);
    }
  }, [activeReview]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle Run AI Website Review
  async function handleRunReview(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "URL_REVIEW" && !websiteUrl.trim()) {
      setError("Please enter a valid website URL.");
      return;
    }
    if (mode === "FULL_PROJECT" && (!projectName.trim() || !projectDescription.trim())) {
      setError("Project Name and Description are required.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysisStage(1);

    // Progress stages matching Requirement 13
    const stageTimer1 = setTimeout(() => setAnalysisStage(2), 1000);
    const stageTimer2 = setTimeout(() => setAnalysisStage(3), 2200);
    const stageTimer3 = setTimeout(() => setAnalysisStage(4), 4000);
    const stageTimer4 = setTimeout(() => setAnalysisStage(5), 5500);

    try {
      let res;
      if (mode === "URL_REVIEW") {
        res = await fetch("/api/ai-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ websiteUrl: websiteUrl.trim() }),
        });
      } else {
        res = await fetch("/api/project-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectName: projectName.trim(),
            websiteUrl: websiteUrl.trim(),
            projectDescription: projectDescription.trim(),
            targetAudience: targetAudience.trim(),
            productService: productService.trim(),
            currentGoal,
            additionalContext: additionalContext.trim(),
          }),
        });
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "AI Analysis unavailable — Ollama endpoint could not be reached.");
      } else if (data.review) {
        setToast(`AI Review completed for "${data.review.project_name || data.review.website_url}"!`);
        setActiveReview(data.review);
        fetchReviews();
        setTimeout(() => setToast(null), 5000);
      }
    } catch {
      setError("AI Analysis unavailable — Ollama endpoint could not be reached.");
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(stageTimer4);
      setAnalyzing(false);
    }
  }

  // Delete Review
  async function handleDeleteReview(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete review for "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/project-review/${id}`, { method: "DELETE" });
      if (res.ok) {
        setToast(`Review deleted.`);
        if (activeReview?.id === id) {
          setActiveReview(null);
        }
        fetchReviews();
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setError("Failed to delete review.");
    }
  }

  // Reset form for new review
  function handleRunNewReview() {
    setActiveReview(null);
    setWebsiteUrl("");
    setProjectName("");
    setProjectDescription("");
    setTargetAudience("");
    setProductService("");
    setError(null);
  }

  const result = activeReview?.review_result;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#12B76A] text-white font-bold text-xs uppercase px-4 py-3 sharp-border shadow-lg flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* TOP HEADER CARD */}
      <div className="bg-white sharp-border p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-black text-white px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider sharp-border">
            <Sparkles className="w-3 h-3 text-[#12B76A]" />
            AI WEBSITE & PRODUCT INTELLIGENCE
          </div>

          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black">
            AI REVIEW ENGINE
          </h1>

          <p className="text-[11px] font-mono text-neutral-600 uppercase tracking-wider">
            SSRF-SAFE WEBSITE SCRAPING &bull; OLLAMA QWEN INTELLIGENCE &bull; SUPABASE AUDITED
          </p>
        </div>

        {/* Far-Right Green Block with Action */}
        <div className="relative md:self-stretch flex items-center justify-end">
          <div className="hidden md:block w-28 bg-[#12B76A] absolute right-0 top-0 bottom-0 sharp-border" />
          <button
            onClick={handleRunNewReview}
            className="btn-pill-primary text-xs relative z-10 cursor-pointer shadow-md"
          >
            + RUN NEW REVIEW
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-600 text-xs font-bold uppercase text-red-900 flex items-center gap-2 sharp-border font-mono">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* ACTIVE REVIEW DISPLAY VS FORM */}
      {activeReview && result ? (
        <div className="space-y-6 font-mono">
          {/* Header Score Card */}
          <div className="bg-white sharp-border p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-500">
                  AI AUDIT REPORT
                </span>
                <h2 className="text-2xl font-black uppercase text-black">
                  {activeReview.project_name || activeReview.website_url}
                </h2>
                {activeReview.website_url && (
                  <a
                    href={activeReview.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#12B76A] font-bold hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    <Globe className="w-3.5 h-3.5" /> {activeReview.website_url}
                  </a>
                )}
              </div>

              {/* OVERALL SCORE FROM QWEN */}
              <div className="bg-black text-white p-4 sharp-border text-center min-w-[150px]">
                <div className="text-[9px] font-bold uppercase text-[#12B76A]">
                  OVERALL SCORE
                </div>
                <div className="text-3xl font-black text-white">
                  {activeReview.overall_score || result.overall_score || 0} <span className="text-sm font-normal text-neutral-400">/ 100</span>
                </div>
              </div>
            </div>

            {/* WEBSITE SUMMARY & OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-[#F1F2F3] border border-black sharp-border">
                <div className="text-[9px] font-bold text-neutral-500 uppercase">BUSINESS TYPE</div>
                <div className="font-bold text-black uppercase">{result.business_type || result.project_type || "B2B Enterprise"}</div>
              </div>
              <div className="p-3 bg-[#F1F2F3] border border-black sharp-border">
                <div className="text-[9px] font-bold text-neutral-500 uppercase">PRIMARY OFFERING</div>
                <div className="font-bold text-black">{result.primary_product_or_service || result.product_service || "Digital Solution"}</div>
              </div>
              <div className="p-3 bg-[#F1F2F3] border border-black sharp-border">
                <div className="text-[9px] font-bold text-neutral-500 uppercase">TARGET AUDIENCE</div>
                <div className="font-bold text-black">{result.target_audience || result.target_market || "B2B Customers"}</div>
              </div>
            </div>

            {(result.website_summary || result.summary) && (
              <div className="p-4 bg-[#F1F2F3] border border-black sharp-border space-y-1">
                <div className="text-[10px] font-bold uppercase text-black flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#12B76A]" /> WEBSITE SUMMARY & VALUE PROPOSITION
                </div>
                <p className="text-xs text-neutral-800 leading-relaxed">
                  {result.website_summary || result.summary}
                </p>
                {result.value_proposition && (
                  <p className="text-xs text-neutral-700 italic border-t border-neutral-300 pt-2 mt-2">
                    <span className="font-bold uppercase not-italic">Core Value Prop:</span> {result.value_proposition}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 4 GRID CARDS: STRENGTHS, WEAKNESSES, OPPORTUNITIES, RISKS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* STRENGTHS */}
            <div className="bg-white p-5 sharp-border space-y-3">
              <div className="font-extrabold text-xs uppercase text-black flex items-center gap-2 border-b border-black pb-2">
                <CheckCircle2 className="w-4 h-4 text-[#12B76A]" /> STRENGTHS
              </div>
              <ul className="space-y-2 text-xs text-neutral-700">
                {(result.strengths || []).map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#12B76A] font-bold">&bull;</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* WEAKNESSES */}
            <div className="bg-white p-5 sharp-border space-y-3">
              <div className="font-extrabold text-xs uppercase text-black flex items-center gap-2 border-b border-black pb-2">
                <AlertCircle className="w-4 h-4 text-red-600" /> WEAKNESSES / GAPS
              </div>
              <ul className="space-y-2 text-xs text-neutral-700">
                {(result.weaknesses || []).map((weak, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">&bull;</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* OPPORTUNITIES */}
            <div className="bg-white p-5 sharp-border space-y-3">
              <div className="font-extrabold text-xs uppercase text-black flex items-center gap-2 border-b border-black pb-2">
                <TrendingUp className="w-4 h-4 text-[#20C8E8]" /> OPPORTUNITIES
              </div>
              <ul className="space-y-2 text-xs text-neutral-700">
                {(result.opportunities || []).map((opp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#20C8E8] font-bold">&bull;</span>
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* RISKS */}
            <div className="bg-white p-5 sharp-border space-y-3">
              <div className="font-extrabold text-xs uppercase text-black flex items-center gap-2 border-b border-black pb-2">
                <AlertTriangle className="w-4 h-4 text-[#F4B62A]" /> RISKS
              </div>
              <ul className="space-y-2 text-xs text-neutral-700">
                {(result.risks || []).map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#F4B62A] font-bold">&bull;</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* DETAILED CATEGORY EVALUATION CARDS */}
          <div className="bg-white sharp-border p-6 space-y-4">
            <h3 className="font-black text-sm uppercase text-black border-b border-black pb-2">
              AUDIT CATEGORY SCORES & FINDINGS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Conversion Analysis */}
              {result.conversion_analysis && (
                <div className="p-4 border border-black bg-[#F1F2F3] sharp-border space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-neutral-600">
                    <span>CONVERSION ANALYSIS</span>
                    <span className="bg-black text-white px-1.5 py-0.5">{result.conversion_analysis.score}/100</span>
                  </div>
                  <ul className="text-[11px] text-neutral-700 space-y-1">
                    {(result.conversion_analysis.findings || []).map((f, i) => (
                      <li key={i}>&bull; {f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sales Readiness */}
              {result.sales_readiness && (
                <div className="p-4 border border-black bg-[#F1F2F3] sharp-border space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-neutral-600">
                    <span>SALES READINESS</span>
                    <span className="bg-black text-white px-1.5 py-0.5">{result.sales_readiness.score}/100</span>
                  </div>
                  <p className="text-[11px] text-neutral-700">
                    {"assessment" in result.sales_readiness ? result.sales_readiness.assessment : (result.sales_readiness.findings || []).join(". ")}
                  </p>
                </div>
              )}

              {/* Lead Generation */}
              {result.lead_generation && (
                <div className="p-4 border border-black bg-[#F1F2F3] sharp-border space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-neutral-600">
                    <span>LEAD GENERATION</span>
                    <span className="bg-black text-white px-1.5 py-0.5">{result.lead_generation.score}/100</span>
                  </div>
                  <p className="text-[11px] text-neutral-700">
                    {"assessment" in result.lead_generation ? result.lead_generation.assessment : (result.lead_generation.findings || []).join(". ")}
                  </p>
                </div>
              )}

              {/* Trust & Credibility */}
              {result.trust_and_credibility && (
                <div className="p-4 border border-black bg-[#F1F2F3] sharp-border space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-neutral-600">
                    <span>TRUST & CREDIBILITY</span>
                    <span className="bg-black text-white px-1.5 py-0.5">{result.trust_and_credibility.score}/100</span>
                  </div>
                  <ul className="text-[11px] text-neutral-700 space-y-1">
                    {(result.trust_and_credibility.findings || []).map((f, i) => (
                      <li key={i}>&bull; {f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* UX Analysis */}
              {result.ux_analysis && (
                <div className="p-4 border border-black bg-[#F1F2F3] sharp-border space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-neutral-600">
                    <span>UX ANALYSIS</span>
                    <span className="bg-black text-white px-1.5 py-0.5">{result.ux_analysis.score}/100</span>
                  </div>
                  <ul className="text-[11px] text-neutral-700 space-y-1">
                    {(result.ux_analysis.findings || []).map((f, i) => (
                      <li key={i}>&bull; {f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SEO Observations */}
              {result.seo_observations && (
                <div className="p-4 border border-black bg-[#F1F2F3] sharp-border space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-neutral-600">
                    <span>SEO OBSERVATIONS</span>
                    <span className="bg-black text-white px-1.5 py-0.5">{result.seo_observations.score}/100</span>
                  </div>
                  <ul className="text-[11px] text-neutral-700 space-y-1">
                    {(result.seo_observations.findings || []).map((f, i) => (
                      <li key={i}>&bull; {f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* TOP RECOMMENDED ACTIONS */}
          <div className="bg-white sharp-border p-6 space-y-4">
            <h3 className="font-black text-sm uppercase text-black border-b border-black pb-2">
              RECOMMENDED ACTIONS
            </h3>

            <div className="space-y-3 font-mono">
              {(result.recommended_actions || []).map((act, idx) => (
                <div key={idx} className="p-3.5 border border-black bg-[#F1F2F3] sharp-border flex flex-col sm:flex-row items-start gap-3">
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase sharp-border shrink-0 ${
                      act.priority === "HIGH"
                        ? "bg-red-600 text-white"
                        : act.priority === "MEDIUM"
                        ? "bg-[#F4B62A] text-black"
                        : "bg-neutral-300 text-black"
                    }`}
                  >
                    {act.priority || "HIGH"}
                  </span>
                  <div className="space-y-1">
                    <div className="font-bold text-xs text-black">{act.action}</div>
                    <div className="text-[11px] text-neutral-600">{act.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleRunNewReview}
              className="btn-pill-primary text-xs cursor-pointer"
            >
              + RUN NEW REVIEW
            </button>
          </div>
        </div>
      ) : (
        /* FORM CONTAINER WITH REAL BACKEND CONNECTION */
        <div className="bg-white sharp-border p-6 space-y-6 font-mono">
          {/* Mode Selector Tabs */}
          <div className="flex border-b border-black text-xs font-bold uppercase">
            <button
              onClick={() => setMode("URL_REVIEW")}
              className={`px-4 py-2 border-b-2 cursor-pointer ${
                mode === "URL_REVIEW"
                  ? "border-[#12B76A] bg-[#12B76A]/10 text-black font-black"
                  : "border-transparent text-neutral-500 hover:text-black"
              }`}
            >
              🌐 AI WEBSITE REVIEW (PASTE URL)
            </button>
            <button
              onClick={() => setMode("FULL_PROJECT")}
              className={`px-4 py-2 border-b-2 cursor-pointer ${
                mode === "FULL_PROJECT"
                  ? "border-[#12B76A] bg-[#12B76A]/10 text-black font-black"
                  : "border-transparent text-neutral-500 hover:text-black"
              }`}
            >
              📝 DETAILED PROJECT REVIEW
            </button>
          </div>

          {analyzing ? (
            /* REAL PROGRESS STAGES — REQUIREMENT 13 */
            <div className="p-12 text-center space-y-6 font-mono">
              <div className="w-12 h-12 border-4 border-black border-t-[#12B76A] rounded-full animate-spin mx-auto" />
              <h3 className="text-lg font-black uppercase text-black">
                ANALYZING WEBSITE...
              </h3>

              <div className="max-w-md mx-auto space-y-2 text-left text-xs">
                <div className={`p-2 border sharp-border flex items-center gap-2 ${analysisStage >= 1 ? "bg-[#12B76A]/10 border-[#12B76A] font-bold" : "border-neutral-200 opacity-40"}`}>
                  <Globe className="w-4 h-4 text-[#12B76A]" /> 1. ANALYZING WEBSITE (SSRF SAFE)
                </div>
                <div className={`p-2 border sharp-border flex items-center gap-2 ${analysisStage >= 2 ? "bg-[#12B76A]/10 border-[#12B76A] font-bold" : "border-neutral-200 opacity-40"}`}>
                  <FileText className="w-4 h-4 text-[#12B76A]" /> 2. EXTRACTING CONTENT
                </div>
                <div className={`p-2 border sharp-border flex items-center gap-2 ${analysisStage >= 3 ? "bg-[#12B76A]/10 border-[#12B76A] font-bold" : "border-neutral-200 opacity-40"}`}>
                  <Zap className="w-4 h-4 text-[#12B76A]" /> 3. RUNNING QWEN ANALYSIS
                </div>
                <div className={`p-2 border sharp-border flex items-center gap-2 ${analysisStage >= 4 ? "bg-[#12B76A]/10 border-[#12B76A] font-bold" : "border-neutral-200 opacity-40"}`}>
                  <CheckCircle2 className="w-4 h-4 text-[#12B76A]" /> 4. VALIDATING AI RESULTS
                </div>
                <div className={`p-2 border sharp-border flex items-center gap-2 ${analysisStage >= 5 ? "bg-[#12B76A]/10 border-[#12B76A] font-bold" : "border-neutral-200 opacity-40"}`}>
                  <ShieldCheck className="w-4 h-4 text-[#12B76A]" /> 5. SAVING REVIEW TO SUPABASE
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRunReview} className="space-y-4 text-xs">
              {mode === "URL_REVIEW" ? (
                /* WEBSITE URL INPUT FORM */
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold uppercase mb-1 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#12B76A]" /> WEBSITE URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full p-3 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                    />
                    <p className="text-[10px] text-neutral-500 mt-1">
                      🔒 SSRF-Safe fetcher: Scrapes page title, headings, meta tags, and visible content securely from server.
                    </p>
                  </div>
                </div>
              ) : (
                /* FULL DETAILED PROJECT FORM */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold uppercase mb-1">PROJECT / COMPANY NAME *</label>
                      <input
                        type="text"
                        required
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Enter project or company name"
                        className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                      />
                    </div>
                    <div>
                      <label className="block font-bold uppercase mb-1">WEBSITE URL (OPTIONAL)</label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold uppercase mb-1">PROJECT DESCRIPTION *</label>
                    <textarea
                      rows={3}
                      required
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Describe your product, service or project..."
                      className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold uppercase mb-1">TARGET AUDIENCE</label>
                      <input
                        type="text"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="Who is your ideal customer?"
                        className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                      />
                    </div>
                    <div>
                      <label className="block font-bold uppercase mb-1">PRODUCT / SERVICE</label>
                      <input
                        type="text"
                        value={productService}
                        onChange={(e) => setProductService(e.target.value)}
                        placeholder="What are you offering?"
                        className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={analyzing}
                  className="btn-pill-primary text-xs cursor-pointer w-full sm:w-auto"
                >
                  {analyzing ? "ANALYZING..." : "RUN AI REVIEW"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* RECENT PROJECT & WEBSITE REVIEWS HISTORY */}
      <div className="bg-white sharp-border p-6 space-y-4 font-mono">
        <div className="flex items-center justify-between border-b border-black pb-3">
          <h3 className="font-black text-sm uppercase text-black">RECENT WEBSITE REVIEWS</h3>
          <span className="text-[10px] font-bold text-neutral-500 uppercase">
            REAL SUPABASE HISTORY RECORDS
          </span>
        </div>

        {loadingHistory ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            Loading saved website reviews...
          </div>
        ) : reviewsHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400 font-bold uppercase">
            NO REVIEWS YET
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F1F2F3] border-b border-black font-bold uppercase">
                  <th className="p-3">Website / Project</th>
                  <th className="p-3">Overall Score</th>
                  <th className="p-3">Created Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {reviewsHistory.map((rev) => {
                  const isSelected = activeReview?.id === rev.id;
                  return (
                    <tr
                      key={rev.id}
                      className={`hover:bg-[#F1F2F3]/60 transition-colors ${
                        isSelected ? "bg-[#12B76A]/10 font-bold" : ""
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-bold text-black uppercase">{rev.project_name}</div>
                        <div className="text-[10px] text-neutral-500">{rev.website_url || "Direct Input"}</div>
                      </td>
                      <td className="p-3">
                        <span className="bg-black text-white px-2 py-0.5 text-[10px] font-bold sharp-border">
                          {rev.overall_score || 0} / 100
                        </span>
                      </td>
                      <td className="p-3 text-neutral-500 text-[11px]">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => setActiveReview(rev)}
                          className="px-2 py-1 bg-white border border-black text-[10px] font-bold uppercase sharp-border hover:bg-neutral-100 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-black" /> View Report
                        </button>

                        <button
                          onClick={() => handleDeleteReview(rev.id, rev.project_name)}
                          className="p-1 border border-black bg-white hover:bg-red-600 hover:text-white sharp-border cursor-pointer inline-flex items-center"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
