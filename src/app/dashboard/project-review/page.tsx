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
} from "lucide-react";

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
  review_result: {
    overall_score: number;
    summary: string;
    project_type: string;
    target_market: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    risks: string[];
    sales_readiness: { score: number; assessment: string };
    product_readiness: { score: number; assessment: string };
    marketing_readiness: { score: number; assessment: string };
    lead_generation: { score: number; assessment: string };
    recommended_actions: Array<{ priority: string; action: string; reason: string }>;
    next_steps: string[];
  };
  created_at: string;
}

export default function ProjectReviewPage() {
  const [reviewsHistory, setReviewsHistory] = useState<ProjectReviewRecord[]>([]);
  const [activeReview, setActiveReview] = useState<ProjectReviewRecord | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [websiteWarning, setWebsiteWarning] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form State
  const [projectName, setProjectName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [productService, setProductService] = useState("");
  const [currentGoal, setCurrentGoal] = useState("Generate Leads");
  const [additionalContext, setAdditionalContext] = useState("");

  const fetchReviews = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/project-review");
      const data = await res.json();
      if (res.ok) {
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

  // Handle Run AI Project Review
  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!projectName.trim()) {
      setError("Project / Company Name is required.");
      return;
    }
    if (!projectDescription.trim()) {
      setError("Project Description is required.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setWebsiteWarning(null);
    setAnalysisStage(1);

    // Simulate progress stages for user feedback
    const stageTimer1 = setTimeout(() => setAnalysisStage(2), 1200);
    const stageTimer2 = setTimeout(() => setAnalysisStage(3), 2500);
    const stageTimer3 = setTimeout(() => setAnalysisStage(4), 4500);

    try {
      const res = await fetch("/api/project-review", {
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

      setAnalysisStage(5);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "AI Project Review is currently unavailable — Ollama could not be reached.");
      } else if (data.review) {
        if (data.websiteWarning) {
          setWebsiteWarning(data.websiteWarning);
        }
        setToast(`AI Project Review completed for "${projectName}"!`);
        setActiveReview(data.review);
        fetchReviews();
        setTimeout(() => setToast(null), 5000);
      }
    } catch {
      setError("AI Project Review is currently unavailable — Ollama could not be reached.");
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setAnalyzing(false);
    }
  }

  // Delete Project Review
  async function handleDeleteReview(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete project review for "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/project-review/${id}`, { method: "DELETE" });
      if (res.ok) {
        setToast(`Review for "${name}" deleted.`);
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

  // Reset form to run a new review
  function handleRunNewReview() {
    setActiveReview(null);
    setProjectName("");
    setWebsiteUrl("");
    setProjectDescription("");
    setTargetAudience("");
    setProductService("");
    setCurrentGoal("Generate Leads");
    setAdditionalContext("");
    setError(null);
    setWebsiteWarning(null);
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#12B76A] text-white font-bold text-xs uppercase px-4 py-3 sharp-border shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* TOP HEADER CARD — REV AI DESIGN SYSTEM */}
      <div className="bg-white sharp-border p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-black text-white px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider sharp-border">
            <Sparkles className="w-3 h-3 text-[#12B76A]" />
            AI PROJECT INTELLIGENCE
          </div>

          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black">
            AI PROJECT REVIEW
          </h1>

          <p className="text-[11px] font-mono text-neutral-600 uppercase tracking-wider">
            AI-POWERED ANALYSIS FOR PRODUCT, SALES & GROWTH DECISIONS
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
        <div className="p-4 bg-red-50 border border-red-600 text-xs font-bold uppercase text-red-900 flex items-center gap-2 sharp-border">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {websiteWarning && (
        <div className="p-4 bg-[#F4B62A]/10 border border-[#F4B62A] text-xs font-mono font-bold text-black flex items-center gap-2 sharp-border">
          <AlertTriangle className="w-4 h-4 text-[#F4B62A] shrink-0" />
          {websiteWarning}
        </div>
      )}

      {/* ACTIVE REVIEW DISPLAY VS FORM CONTAINER */}
      {activeReview && activeReview.review_result ? (
        /* STRUCTURED REVIEW RESULT UI — MATCHING REQUIREMENT 8 */
        <div className="space-y-6">
          {/* Header Score Card */}
          <div className="bg-white sharp-border p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                  AI PROJECT REVIEW REPORT
                </span>
                <h2 className="text-2xl font-black uppercase text-black">
                  {activeReview.project_name}
                </h2>
                {activeReview.website_url && (
                  <a
                    href={activeReview.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-[#12B76A] hover:underline"
                  >
                    {activeReview.website_url}
                  </a>
                )}
              </div>

              {/* OVERALL SCORE BADGE FROM QWEN */}
              <div className="bg-black text-white p-4 sharp-border text-center min-w-[140px]">
                <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#12B76A]">
                  OVERALL SCORE
                </div>
                <div className="text-3xl font-black text-white">
                  {activeReview.overall_score} <span className="text-sm font-normal text-neutral-400">/ 100</span>
                </div>
              </div>
            </div>

            {/* EXECUTIVE SUMMARY */}
            <div className="space-y-1 bg-[#F1F2F3] p-4 sharp-border">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#12B76A]" /> EXECUTIVE SUMMARY
              </div>
              <p className="text-xs font-mono text-neutral-800 leading-relaxed">
                {activeReview.review_result.summary}
              </p>
            </div>
          </div>

          {/* 4 GRID CARDS: STRENGTHS, WEAKNESSES, OPPORTUNITIES, RISKS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* STRENGTHS */}
            <div className="bg-white p-5 sharp-border space-y-3">
              <div className="font-extrabold text-xs uppercase tracking-wider text-black flex items-center gap-2 border-b border-black pb-2">
                <CheckCircle2 className="w-4 h-4 text-[#12B76A]" /> PROJECT STRENGTHS
              </div>
              <ul className="space-y-2 text-xs font-mono text-neutral-700">
                {activeReview.review_result.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#12B76A] font-bold">&bull;</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* WEAKNESSES / GAPS */}
            <div className="bg-white p-5 sharp-border space-y-3">
              <div className="font-extrabold text-xs uppercase tracking-wider text-black flex items-center gap-2 border-b border-black pb-2">
                <AlertCircle className="w-4 h-4 text-red-600" /> WEAKNESSES / GAPS
              </div>
              <ul className="space-y-2 text-xs font-mono text-neutral-700">
                {activeReview.review_result.weaknesses.map((weak, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">&bull;</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* OPPORTUNITIES */}
            <div className="bg-white p-5 sharp-border space-y-3">
              <div className="font-extrabold text-xs uppercase tracking-wider text-black flex items-center gap-2 border-b border-black pb-2">
                <TrendingUp className="w-4 h-4 text-[#20C8E8]" /> OPPORTUNITIES
              </div>
              <ul className="space-y-2 text-xs font-mono text-neutral-700">
                {activeReview.review_result.opportunities.map((opp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#20C8E8] font-bold">&bull;</span>
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* RISKS */}
            <div className="bg-white p-5 sharp-border space-y-3">
              <div className="font-extrabold text-xs uppercase tracking-wider text-black flex items-center gap-2 border-b border-black pb-2">
                <AlertTriangle className="w-4 h-4 text-[#F4B62A]" /> RISKS
              </div>
              <ul className="space-y-2 text-xs font-mono text-neutral-700">
                {activeReview.review_result.risks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#F4B62A] font-bold">&bull;</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* READINESS SCORES (ROW OF 4 CARDS) */}
          <div className="bg-white sharp-border p-6 space-y-4">
            <h3 className="font-black text-sm uppercase text-black border-b border-black pb-2">
              READINESS EVALUATION SCORES
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sales Readiness */}
              <div className="p-4 border border-black bg-[#F1F2F3] sharp-border space-y-2">
                <div className="text-[10px] font-mono font-bold uppercase text-neutral-500">
                  SALES READINESS
                </div>
                <div className="text-2xl font-black text-black">
                  {activeReview.review_result.sales_readiness?.score || 0} / 100
                </div>
                <p className="text-[10px] font-mono text-neutral-700">
                  {activeReview.review_result.sales_readiness?.assessment}
                </p>
              </div>

              {/* Product Readiness */}
              <div className="p-4 border border-black bg-[#F1F2F3] sharp-border space-y-2">
                <div className="text-[10px] font-mono font-bold uppercase text-neutral-500">
                  PRODUCT READINESS
                </div>
                <div className="text-2xl font-black text-black">
                  {activeReview.review_result.product_readiness?.score || 0} / 100
                </div>
                <p className="text-[10px] font-mono text-neutral-700">
                  {activeReview.review_result.product_readiness?.assessment}
                </p>
              </div>

              {/* Marketing Readiness */}
              <div className="p-4 border border-black bg-[#F1F2F3] sharp-border space-y-2">
                <div className="text-[10px] font-mono font-bold uppercase text-neutral-500">
                  MARKETING READINESS
                </div>
                <div className="text-2xl font-black text-black">
                  {activeReview.review_result.marketing_readiness?.score || 0} / 100
                </div>
                <p className="text-[10px] font-mono text-neutral-700">
                  {activeReview.review_result.marketing_readiness?.assessment}
                </p>
              </div>

              {/* Lead Generation */}
              <div className="p-4 border border-black bg-[#F1F2F3] sharp-border space-y-2">
                <div className="text-[10px] font-mono font-bold uppercase text-neutral-500">
                  LEAD GENERATION
                </div>
                <div className="text-2xl font-black text-black">
                  {activeReview.review_result.lead_generation?.score || 0} / 100
                </div>
                <p className="text-[10px] font-mono text-neutral-700">
                  {activeReview.review_result.lead_generation?.assessment}
                </p>
              </div>
            </div>
          </div>

          {/* TOP RECOMMENDED ACTIONS (PRIORITIZED) */}
          <div className="bg-white sharp-border p-6 space-y-4">
            <h3 className="font-black text-sm uppercase text-black border-b border-black pb-2">
              TOP RECOMMENDED ACTIONS
            </h3>

            <div className="space-y-3 font-mono">
              {activeReview.review_result.recommended_actions.map((act, idx) => (
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

          {/* NEXT STEPS */}
          <div className="bg-white sharp-border p-6 space-y-3">
            <h3 className="font-black text-sm uppercase text-black border-b border-black pb-2">
              PRACTICAL NEXT STEPS
            </h3>
            <ol className="space-y-2 text-xs font-mono text-neutral-800 list-decimal list-inside">
              {activeReview.review_result.next_steps.map((step, idx) => (
                <li key={idx} className="font-bold">
                  <span className="font-normal text-neutral-700">{step}</span>
                </li>
              ))}
            </ol>
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
        /* PROJECT INPUT FORM CONTAINER — MATCHING REQUIREMENT 4 */
        <div className="bg-white sharp-border p-6 space-y-6">
          <div className="border-b border-black pb-4">
            <h2 className="text-xl font-black uppercase text-black">START PROJECT REVIEW</h2>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
              SUBMIT YOUR PROJECT INFORMATION FOR AUTOMATED QWEN INTEL ANALYSIS
            </p>
          </div>

          {analyzing ? (
            /* LOADING STAGE INDICATOR — REQUIREMENT 14 */
            <div className="p-12 text-center space-y-6 font-mono">
              <div className="w-12 h-12 border-4 border-black border-t-[#12B76A] rounded-full animate-spin mx-auto" />
              <h3 className="text-lg font-black uppercase text-black">
                ANALYZING PROJECT...
              </h3>

              <div className="max-w-md mx-auto space-y-2 text-left text-xs">
                <div className={`p-2 border sharp-border flex items-center gap-2 ${analysisStage >= 1 ? "bg-[#12B76A]/10 border-[#12B76A] font-bold" : "border-neutral-200 opacity-40"}`}>
                  <CheckCircle2 className="w-4 h-4 text-[#12B76A]" /> 1. Collecting project information
                </div>
                <div className={`p-2 border sharp-border flex items-center gap-2 ${analysisStage >= 2 ? "bg-[#12B76A]/10 border-[#12B76A] font-bold" : "border-neutral-200 opacity-40"}`}>
                  <Globe className="w-4 h-4 text-[#12B76A]" /> 2. Analyzing website (SSRF Safe)
                </div>
                <div className={`p-2 border sharp-border flex items-center gap-2 ${analysisStage >= 3 ? "bg-[#12B76A]/10 border-[#12B76A] font-bold" : "border-neutral-200 opacity-40"}`}>
                  <Zap className="w-4 h-4 text-[#12B76A]" /> 3. Running Qwen intelligence model
                </div>
                <div className={`p-2 border sharp-border flex items-center gap-2 ${analysisStage >= 4 ? "bg-[#12B76A]/10 border-[#12B76A] font-bold" : "border-neutral-200 opacity-40"}`}>
                  <Sparkles className="w-4 h-4 text-[#12B76A]" /> 4. Generating recommendations & readiness scores
                </div>
                <div className={`p-2 border sharp-border flex items-center gap-2 ${analysisStage >= 5 ? "bg-[#12B76A]/10 border-[#12B76A] font-bold" : "border-neutral-200 opacity-40"}`}>
                  <ShieldCheck className="w-4 h-4 text-[#12B76A]" /> 5. Saving review to Supabase
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4 font-mono text-xs">
              {/* Row 1: PROJECT / COMPANY NAME & WEBSITE URL */}
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
                  <label className="block font-bold uppercase mb-1">WEBSITE URL</label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                  />
                </div>
              </div>

              {/* Row 2: PROJECT DESCRIPTION * */}
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

              {/* Row 3: TARGET AUDIENCE & PRODUCT / SERVICE */}
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

              {/* Row 4: CURRENT GOAL */}
              <div>
                <label className="block font-bold uppercase mb-1">CURRENT GOAL</label>
                <select
                  value={currentGoal}
                  onChange={(e) => setCurrentGoal(e.target.value)}
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border cursor-pointer"
                >
                  <option value="Generate Leads">Generate Leads</option>
                  <option value="Improve Conversion">Improve Conversion</option>
                  <option value="Increase Sales">Increase Sales</option>
                  <option value="Improve Product">Improve Product</option>
                  <option value="Validate Idea">Validate Idea</option>
                  <option value="Launch Product">Launch Product</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Row 5: ADDITIONAL CONTEXT */}
              <div>
                <label className="block font-bold uppercase mb-1">ADDITIONAL CONTEXT (OPTIONAL)</label>
                <textarea
                  rows={2}
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Any additional background notes, pricing details, or target metrics..."
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={analyzing}
                  className="btn-pill-primary text-xs cursor-pointer w-full sm:w-auto"
                >
                  {analyzing ? "ANALYZING..." : "RUN AI PROJECT REVIEW"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* RECENT PROJECT REVIEWS HISTORY — REQUIREMENT 12 */}
      <div className="bg-white sharp-border p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-black pb-3">
          <h3 className="font-black text-sm uppercase text-black">RECENT PROJECT REVIEWS</h3>
          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">
            REAL SUPABASE HISTORY RECORDS
          </span>
        </div>

        {loadingHistory ? (
          <div className="p-8 text-center text-xs font-mono text-neutral-500">
            Loading saved project reviews...
          </div>
        ) : reviewsHistory.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-neutral-400 font-bold uppercase">
            NO PROJECT REVIEWS YET
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-[#F1F2F3] border-b border-black font-bold uppercase">
                  <th className="p-3">Project Name</th>
                  <th className="p-3">Overall Score</th>
                  <th className="p-3">Current Goal</th>
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
                      <td className="p-3 uppercase text-black font-bold">{rev.project_name}</td>
                      <td className="p-3">
                        <span className="bg-black text-white px-2 py-0.5 text-[10px] font-bold sharp-border">
                          {rev.overall_score} / 100
                        </span>
                      </td>
                      <td className="p-3 text-neutral-600 uppercase">{rev.current_goal || "General"}</td>
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
