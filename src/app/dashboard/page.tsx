import Link from "next/link";
import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/supabase/tenant";
import { createClient } from "@/lib/supabase/server";
import { checkSystemHealth } from "@/lib/services/health";
import {
  LayoutDashboard,
  Zap,
  Users,
  MessageSquare,
  Calendar,
  BarChart3,
  BookOpen,
  ShieldCheck,
  Flame,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Bot,
  AlertTriangle,
} from "lucide-react";

export default async function DashboardPage() {
  const tenantContext = await getTenantContext();

  if (!tenantContext.user || !tenantContext.currentOrganization) {
    redirect("/auth");
  }

  const user = tenantContext.user;
  const currentOrg = tenantContext.currentOrganization;
  const displayEmail = (user.email || "").toLowerCase();

  // Query real metrics from Supabase
  const supabase = await createClient();
  let totalLeadsCount = 0;
  let hotLeadsCount = 0;
  let scheduledMeetingsCount = 0;
  let dealsConvertedCount = 0;
  let projectReviewsCount = 0;

  try {
    const { count: leadCount } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", currentOrg.id);
    if (leadCount !== null) totalLeadsCount = leadCount;

    const { count: hotCount } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", currentOrg.id)
      .or("heat_level.eq.HOT,score.gte.80");
    if (hotCount !== null) hotLeadsCount = hotCount;

    const { count: meetingsCount } = await supabase
      .from("meetings")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", currentOrg.id)
      .eq("status", "CONFIRMED");
    if (meetingsCount !== null) scheduledMeetingsCount = meetingsCount;

    const { count: convertedCount } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", currentOrg.id)
      .or("status.eq.CONVERTED,status.eq.WON");
    if (convertedCount !== null) dealsConvertedCount = convertedCount;

    const { count: reviewCount } = await supabase
      .from("project_reviews")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", currentOrg.id);
    if (reviewCount !== null) projectReviewsCount = reviewCount;
  } catch {
    // Fallback to 0 on database query failure
  }

  // Real backend system health verification
  const systemHealth = await checkSystemHealth(supabase, currentOrg.id);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* 3. EXACT LEFT SIDEBAR (~225px WIDE) */}
      <aside className="w-full lg:w-[225px] bg-white sharp-border p-4 space-y-6 shrink-0">
        {/* Section 1: MAIN PIPELINE */}
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 mb-2">
            MAIN PIPELINE
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            {/* Dashboard */}
            <Link
              href="/dashboard"
              className="flex items-center justify-between p-2 bg-[#E8E9EA] border border-black font-extrabold text-black sharp-border"
            >
              <span className="flex items-center gap-2">
                <LayoutDashboard className="w-3.5 h-3.5 text-[#12B76A]" />
                DASHBOARD
              </span>
            </Link>

            {/* Workflows */}
            <Link
              href="/dashboard/workflows"
              className="flex items-center justify-between p-2 bg-black text-white font-extrabold sharp-border hover:bg-neutral-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#12B76A] fill-current" />
                WORKFLOWS
              </span>
              <span className="bg-[#12B76A] text-white px-1 py-0.2 text-[9px] font-bold">
                {systemHealth.workflowEngine.status}
              </span>
            </Link>

            {/* AI Autopilot Agent */}
            <Link
              href="/dashboard/agent"
              className="flex items-center justify-between p-2 text-neutral-700 hover:bg-neutral-100 sharp-border transition-colors font-bold"
            >
              <span className="flex items-center gap-2">
                <Bot className="w-3.5 h-3.5 text-[#12B76A]" />
                AI AGENT
              </span>
              <span className={`px-1 text-[9px] font-bold ${systemHealth.aiIntelligence.status === "ACTIVE" ? "bg-[#12B76A] text-white" : "bg-neutral-200 text-black"}`}>
                {systemHealth.aiIntelligence.status}
              </span>
            </Link>

            {/* Leads */}
            <Link
              href="/dashboard/leads"
              className="flex items-center justify-between p-2 text-neutral-700 hover:bg-neutral-100 sharp-border transition-colors font-bold"
            >
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#12B76A]" />
                LEADS
              </span>
              <span className="bg-black text-white px-1.5 text-[9px] font-bold">
                {totalLeadsCount}
              </span>
            </Link>

            {/* Conversations */}
            <Link
              href="/dashboard/conversations"
              className="flex items-center justify-between p-2 text-neutral-700 hover:bg-neutral-100 sharp-border transition-colors font-bold"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#12B76A]" />
                CONVERSATIONS
              </span>
              <span className="bg-[#12B76A] text-white px-1 text-[9px] font-bold">
                LIVE
              </span>
            </Link>

            {/* Meetings */}
            <Link
              href="/dashboard/meetings"
              className="flex items-center justify-between p-2 text-neutral-700 hover:bg-neutral-100 sharp-border transition-colors font-bold"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#12B76A]" />
                MEETINGS
              </span>
              <span className="bg-black text-white px-1.5 text-[9px] font-bold">
                {scheduledMeetingsCount}
              </span>
            </Link>

            {/* Project Review */}
            <Link
              href="/dashboard/project-review"
              className="flex items-center justify-between p-2 text-neutral-700 hover:bg-neutral-100 sharp-border transition-colors font-bold"
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#12B76A]" />
                PROJECT REVIEW
              </span>
              <span className="bg-[#12B76A] text-white px-1 text-[9px] font-bold">
                {projectReviewsCount > 0 ? projectReviewsCount : "NEW"}
              </span>
            </Link>

            {/* Analytics */}
            <Link
              href="/dashboard/analytics"
              className="flex items-center justify-between p-2 text-neutral-700 hover:bg-neutral-100 sharp-border transition-colors font-bold"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-[#12B76A]" />
                ANALYTICS
              </span>
              <span className="bg-[#12B76A] text-white px-1 text-[9px] font-bold">
                LIVE
              </span>
            </Link>
          </div>
        </div>

        {/* Section 2: KNOWLEDGE & RULES */}
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 mb-2">
            KNOWLEDGE & RULES
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            <Link
              href="/dashboard/knowledge"
              className="flex items-center justify-between p-2 text-neutral-700 hover:text-black hover:bg-neutral-100 sharp-border transition-colors font-bold"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#12B76A]" />
                KNOWLEDGE BASE
              </span>
              <span className="bg-[#12B76A] text-white px-1 text-[9px] font-bold">
                ACTIVE
              </span>
            </Link>

            <Link
              href="/dashboard/team"
              className="flex items-center justify-between p-2 border border-neutral-300 text-black font-bold sharp-border hover:bg-neutral-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#12B76A]" />
                TEAM & SECURITY
              </span>
              <span className="bg-[#12B76A] text-white px-1 text-[9px] font-bold">
                ACTIVE
              </span>
            </Link>
          </div>
        </div>
      </aside>

      {/* 4. MAIN CONTENT AREA */}
      <div className="flex-1 space-y-6 w-full min-w-0">
        {/* WORKSPACE HEADER CARD */}
        <div className="bg-white sharp-border p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 z-10 max-w-xl">
            {/* Top Black Badge */}
            <div className="inline-flex items-center gap-1.5 bg-black text-white px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider sharp-border">
              <ShieldCheck className="w-3 h-3 text-[#12B76A]" />
              MULTI-TENANT ISOLATED WORKSPACE
            </div>

            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black">
              {currentOrg.name}
            </h1>

            <p className="text-[11px] font-mono text-neutral-600 uppercase tracking-wider">
              INDUSTRY: {currentOrg.industry || "SALES AUTOMATION"} &bull; TENANT SECURITY STATUS: ACTIVE RLS
            </p>
          </div>

          {/* Far-Right Green Block with User Identity Box */}
          <div className="relative md:self-stretch flex items-center justify-end">
            <div className="hidden md:block w-28 bg-[#12B76A] absolute right-0 top-0 bottom-0 sharp-border" />
            <div className="bg-white border border-black p-2.5 relative z-10 sharp-border shadow-sm text-right">
              <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-neutral-500">
                USER IDENTITY
              </div>
              <div className="text-xs font-mono font-bold text-black lowercase">
                {displayEmail}
              </div>
            </div>
          </div>
        </div>

        {/* METRIC CARDS (ROW OF 4) — CALCULATED FROM REAL SUPABASE QUERIES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: TOTAL LEADS */}
          <div className="bg-white p-4 sharp-border space-y-3">
            <div className="flex items-center justify-between text-neutral-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                TOTAL LEADS
              </span>
              <Users className="w-4 h-4 text-black" />
            </div>
            <div className="text-4xl font-black text-black">
              {totalLeadsCount}
            </div>
            <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
              DATABASE REAL METRIC
            </div>
          </div>

          {/* Card 2: HOT LEADS */}
          <div className="bg-white p-4 sharp-border space-y-3">
            <div className="flex items-center justify-between text-neutral-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                HOT LEADS
              </span>
              <Flame className="w-4 h-4 text-[#12B76A]" />
            </div>
            <div className="text-4xl font-black text-[#12B76A]">
              {hotLeadsCount}
            </div>
            <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
              SCORE &ge; 80 OR HEAT: HOT
            </div>
          </div>

          {/* Card 3: SCHEDULED MEETINGS */}
          <div className="bg-white p-4 sharp-border space-y-3">
            <div className="flex items-center justify-between text-neutral-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                SCHEDULED MEETINGS
              </span>
              <Calendar className="w-4 h-4 text-[#20C8E8]" />
            </div>
            <div className="text-4xl font-black text-black">
              {scheduledMeetingsCount}
            </div>
            <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
              CONFIRMED CALENDAR SLOTS
            </div>
          </div>

          {/* Card 4: DEALS CONVERTED */}
          <div className="bg-white p-4 sharp-border space-y-3">
            <div className="flex items-center justify-between text-neutral-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                DEALS CONVERTED
              </span>
              <TrendingUp className="w-4 h-4 text-[#F4B62A]" />
            </div>
            <div className="text-4xl font-black text-black">
              {dealsConvertedCount}
            </div>
            <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
              STATUS: CONVERTED / WON
            </div>
          </div>
        </div>

        {/* SYSTEM AUTOMATION STATUS SECTION — DYNAMIC REAL BACKEND HEALTH */}
        <div className="bg-white sharp-border p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black pb-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                SYSTEM AUTOMATION STATUS
              </h2>
              <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                REAL-TIME PIPELINE ENGINE OPERATIONAL STATUS
              </p>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider sharp-border self-start sm:self-auto ${
                systemHealth.overallStatus === "ENGINE OPERATIONAL"
                  ? "bg-[#12B76A]"
                  : systemHealth.overallStatus === "PARTIALLY OPERATIONAL"
                  ? "bg-[#F4B62A] text-black"
                  : "bg-red-600"
              }`}
            >
              {systemHealth.overallStatus === "ENGINE OPERATIONAL" ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              {systemHealth.overallStatus}
            </div>
          </div>

          {/* 2 x 2 Grid of Real Automation Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: LEAD INGESTION API */}
            <div className="p-4 border border-black bg-white sharp-border flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${systemHealth.database.status === "ACTIVE" ? "text-[#12B76A]" : "text-red-600"}`} />
                  <span className="font-extrabold text-xs uppercase text-black">
                    LEAD INGESTION API
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  {systemHealth.database.message}
                </div>
              </div>
              <span
                className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sharp-border ${
                  systemHealth.database.status === "ACTIVE"
                    ? "bg-[#12B76A] text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {systemHealth.database.status}
              </span>
            </div>

            {/* Card 2: AI LEAD INTELLIGENCE (OLLAMA QWEN) */}
            <div className="p-4 border border-black bg-white sharp-border flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {systemHealth.aiIntelligence.status === "ACTIVE" ? (
                    <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#F4B62A]" />
                  )}
                  <span className="font-bold text-xs uppercase text-black">
                    AI LEAD INTELLIGENCE
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  {systemHealth.aiIntelligence.message}
                </div>
              </div>
              <span
                className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sharp-border ${
                  systemHealth.aiIntelligence.status === "ACTIVE"
                    ? "bg-[#12B76A] text-white"
                    : "bg-[#F4B62A] text-black"
                }`}
              >
                {systemHealth.aiIntelligence.status}
              </span>
            </div>

            {/* Card 3: AUTOMATED FOLLOW-UPS & WORKFLOWS */}
            <div className="p-4 border border-black bg-white sharp-border flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${systemHealth.workflowEngine.status === "ACTIVE" ? "text-[#12B76A]" : "text-neutral-400"}`} />
                  <span className="font-bold text-xs uppercase text-black">
                    AUTOMATED FOLLOW-UPS
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  {systemHealth.workflowEngine.message}
                </div>
              </div>
              <span
                className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sharp-border ${
                  systemHealth.workflowEngine.status === "ACTIVE"
                    ? "bg-[#12B76A] text-white"
                    : "bg-neutral-200 text-black"
                }`}
              >
                {systemHealth.workflowEngine.status}
              </span>
            </div>

            {/* Card 4: CALENDAR & MEETINGS ENGINE (GOOGLE OAUTH) */}
            <div className="p-4 border border-black bg-white sharp-border flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {systemHealth.calendarEngine.status === "READY" ? (
                    <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#F4B62A]" />
                  )}
                  <span className="font-bold text-xs uppercase text-black">
                    CALENDAR & MEETINGS ENGINE
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  {systemHealth.calendarEngine.message}
                </div>
              </div>
              <span
                className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sharp-border ${
                  systemHealth.calendarEngine.status === "READY"
                    ? "bg-[#12B76A] text-white"
                    : "bg-[#F4B62A] text-black"
                }`}
              >
                {systemHealth.calendarEngine.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
