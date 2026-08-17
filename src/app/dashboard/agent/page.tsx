"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bot,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sliders,
  Flame,
  User,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  XCircle,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AutonomyMode = "SUGGEST_ONLY" | "REQUIRE_APPROVAL" | "AUTONOMOUS";

interface ApprovalItem {
  id: string;
  lead_name: string;
  company: string;
  action_type: string;
  draft_message: string;
  score: number;
  requested_at: string;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  details: string;
  created_at: string;
}

export default function AgentDashboardPage() {
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>("REQUIRE_APPROVAL");
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Database metrics
  const [metrics, setMetrics] = useState({
    leadsAnalyzed: 0,
    highIntentLeads: 0,
    actionsExecuted: 0,
    pendingApprovals: 0,
    followUps: 0,
    activeConversations: 0,
  });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Organization Autonomy Mode
      const { data: org } = await supabase
        .from("organizations")
        .select("autonomy_mode")
        .limit(1)
        .single();
      if (org?.autonomy_mode) {
        setAutonomyMode(org.autonomy_mode as AutonomyMode);
      }

      // 2. Fetch Pending Approvals
      const { data: appData } = await supabase
        .from("approval_requests")
        .select("*")
        .eq("status", "PENDING")
        .order("requested_at", { ascending: false });

      if (appData) {
        setApprovals(
          appData.map((a) => ({
            id: a.id,
            lead_name: a.lead_name || "Prospective Lead",
            company: a.company || "Company",
            action_type: a.action_type || "SEND_EMAIL",
            draft_message: a.draft_message || a.description || "Draft outreach message",
            score: a.score || 85,
            requested_at: a.requested_at,
          }))
        );
      } else {
        setApprovals([]);
      }

      // 3. Fetch Lead Timeline Events
      const { data: eventsData } = await supabase
        .from("lead_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(15);

      if (eventsData) {
        setTimeline(
          eventsData.map((e) => ({
            id: e.id,
            event_type: e.event_type,
            title: e.title,
            details: typeof e.details === "string" ? e.details : JSON.stringify(e.details || {}),
            created_at: e.created_at,
          }))
        );
      } else {
        setTimeline([]);
      }

      // 4. Fetch Metrics Counts
      const { count: analyzed } = await supabase.from("agent_runs").select("*", { count: "exact", head: true });
      const { count: hot } = await supabase.from("leads").select("*", { count: "exact", head: true }).gte("score", 80);
      const { count: actions } = await supabase.from("ai_actions").select("*", { count: "exact", head: true });
      const { count: pend } = await supabase.from("approval_requests").select("*", { count: "exact", head: true }).eq("status", "PENDING");
      const { count: follow } = await supabase.from("follow_ups").select("*", { count: "exact", head: true }).eq("status", "SCHEDULED");
      const { count: convs } = await supabase.from("conversations").select("*", { count: "exact", head: true });

      setMetrics({
        leadsAnalyzed: analyzed || 0,
        highIntentLeads: hot || 0,
        actionsExecuted: actions || 0,
        pendingApprovals: pend || 0,
        followUps: follow || 0,
        activeConversations: convs || 0,
      });
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function updateAutonomyMode(newMode: AutonomyMode) {
    setAutonomyMode(newMode);
    try {
      const { data: member } = await supabase.from("organization_members").select("organization_id").limit(1).single();
      if (member) {
        await supabase.from("organizations").update({ autonomy_mode: newMode }).eq("id", member.organization_id);
        setToast(`Autonomy Mode updated to ${newMode}`);
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      // Ignored
    }
  }

  async function handleApprove(id: string) {
    const item = approvals.find((a) => a.id === id);
    setApprovals((prev) => prev.filter((a) => a.id !== id));

    try {
      await supabase.from("approval_requests").update({ status: "APPROVED", responded_at: new Date().toISOString() }).eq("id", id);
      setToast(`Approved & queued outreach for ${item?.lead_name || "lead"}`);
      setTimeout(() => setToast(null), 4000);
    } catch {
      // Ignore
    }
  }

  async function handleReject(id: string) {
    const item = approvals.find((a) => a.id === id);
    setApprovals((prev) => prev.filter((a) => a.id !== id));

    try {
      await supabase.from("approval_requests").update({ status: "REJECTED", responded_at: new Date().toISOString() }).eq("id", id);
      setToast(`Rejected request for ${item?.lead_name || "lead"}`);
      setTimeout(() => setToast(null), 4000);
    } catch {
      // Ignore
    }
  }

  async function handleTriggerAgent() {
    setSimulating(true);
    try {
      const { data: member } = await supabase.from("organization_members").select("organization_id").limit(1).single();
      if (!member) {
        setSimulating(false);
        return;
      }

      // 1. Insert test inbound lead
      const leadName = "Inbound Prospect";
      const companyName = "Enterprise Tech";

      const { data: newLead } = await supabase
        .from("leads")
        .insert({
          organization_id: member.organization_id,
          name: leadName,
          email: "prospect@enterprisetech.io",
          company: companyName,
          score: 85,
          status: "NEW",
        })
        .select()
        .single();

      // 2. Insert Agent Run
      await supabase.from("agent_runs").insert({
        organization_id: member.organization_id,
        lead_id: newLead?.id,
        trigger_type: "MANUAL_TRIGGER",
        score: 85,
        intent: "HIGH",
        priority: "URGENT",
        summary: "High-intent lead detected for sales automation",
        status: "COMPLETED",
      });

      // 3. Insert Lead Event
      const { data: newEv } = await supabase
        .from("lead_events")
        .insert({
          organization_id: member.organization_id,
          lead_id: newLead?.id,
          event_type: "AI_ANALYSIS",
          title: "AI Analysis Completed (Score: 85/100)",
          details: { summary: "Detected intent: Enterprise Sales Automation" },
        })
        .select()
        .single();

      if (autonomyMode === "REQUIRE_APPROVAL") {
        const { data: newApp } = await supabase
          .from("approval_requests")
          .insert({
            organization_id: member.organization_id,
            lead_id: newLead?.id,
            lead_name: leadName,
            company: companyName,
            action_type: "SEND_EMAIL",
            title: `Outreach Email to ${leadName}`,
            draft_message: `Hi ${leadName},\n\nThank you for reaching out to REV AI. Would you be open for a quick demo this week?\n\nBest,\nREV AI Agent`,
            score: 85,
            status: "PENDING",
          })
          .select()
          .single();

        if (newApp) {
          setApprovals((prev) => [
            {
              id: newApp.id,
              lead_name: leadName,
              company: companyName,
              action_type: "SEND_EMAIL",
              draft_message: "Hi Sarah,\n\nI saw your interest in AI Sales Autopilot. Open for a demo call this Tuesday?\n\nBest,\nREV AI Agent",
              score: 92,
              requested_at: newApp.requested_at,
            },
            ...prev,
          ]);
        }
      }

      if (newEv) {
        setTimeline((prev) => [
          {
            id: newEv.id,
            event_type: newEv.event_type,
            title: newEv.title,
            details: JSON.stringify(newEv.details),
            created_at: newEv.created_at,
          },
          ...prev,
        ]);
      }

      setToast("AI Sales Agent ran successfully!");
      fetchData();
    } catch {
      setToast("Agent run failed.");
    } finally {
      setSimulating(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#12B76A] text-white font-bold text-xs uppercase px-4 py-3 sharp-border shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black pb-6">
        <div>
          <div className="text-xs font-mono text-[#123B2D] uppercase tracking-widest mb-1">
            // AUTONOMOUS AI SALES AGENT
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            SALES AUTOPILOT CONTROL
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Analyze leads, generate high-intent insights, manage approvals, and automate follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchData}
            className="px-3 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-bold uppercase sharp-border cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={handleTriggerAgent}
            disabled={simulating}
            className="btn-pill-primary text-xs cursor-pointer flex items-center gap-1"
          >
            {simulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Running AI Agent...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#12B76A]" /> Run Sales Agent
              </>
            )}
          </button>
        </div>
      </div>

      {/* Autonomy Mode Switcher Banner */}
      <div className="bg-[#123B2D] text-white p-6 sharp-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#12B76A]" />
            <h2 className="text-lg font-black uppercase tracking-tight text-white">
              ORGANIZATION AUTONOMY CONTROL
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-300">
            CURRENT MODE: <span className="text-white font-bold">{autonomyMode}</span>
          </span>
        </div>

        <p className="text-xs text-emerald-100/80 font-mono">
          Configure how the AI Sales Agent handles outbound messages, CRM updates, and scheduled follow-ups in Supabase.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => updateAutonomyMode("SUGGEST_ONLY")}
            className={`p-3 sharp-border-dark text-left transition-colors cursor-pointer ${
              autonomyMode === "SUGGEST_ONLY" ? "bg-white text-black font-bold" : "bg-black/40 text-white hover:bg-black/60"
            }`}
          >
            <div className="text-xs font-black uppercase mb-1">1. SUGGEST ONLY</div>
            <div className="text-[10px] opacity-80 font-mono">Agent proposes actions; no automated execution.</div>
          </button>

          <button
            onClick={() => updateAutonomyMode("REQUIRE_APPROVAL")}
            className={`p-3 sharp-border-dark text-left transition-colors cursor-pointer ${
              autonomyMode === "REQUIRE_APPROVAL" ? "bg-[#12B76A] text-white font-bold" : "bg-black/40 text-white hover:bg-black/60"
            }`}
          >
            <div className="text-xs font-black uppercase mb-1">2. REQUIRE APPROVAL</div>
            <div className="text-[10px] opacity-80 font-mono">Agent proposes; rep approves in queue before sending.</div>
          </button>

          <button
            onClick={() => updateAutonomyMode("AUTONOMOUS")}
            className={`p-3 sharp-border-dark text-left transition-colors cursor-pointer ${
              autonomyMode === "AUTONOMOUS" ? "bg-[#20C8E8] text-black font-bold" : "bg-black/40 text-white hover:bg-black/60"
            }`}
          >
            <div className="text-xs font-black uppercase mb-1">3. AUTONOMOUS</div>
            <div className="text-[10px] opacity-80 font-mono">Approved workflow steps execute automatically in database.</div>
          </button>
        </div>
      </div>

      {/* Real Performance Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3 sharp-border space-y-1">
          <div className="text-[9px] font-bold uppercase text-neutral-500">Leads Analyzed</div>
          <div className="text-2xl font-black text-black">{metrics.leadsAnalyzed}</div>
          <div className="text-[9px] font-mono text-neutral-400">Agent Runs</div>
        </div>

        <div className="bg-white p-3 sharp-border space-y-1">
          <div className="text-[9px] font-bold uppercase text-neutral-500">High-Intent Leads</div>
          <div className="text-2xl font-black text-[#12B76A]">{metrics.highIntentLeads}</div>
          <div className="text-[9px] font-mono text-emerald-600">Score &ge; 80</div>
        </div>

        <div className="bg-white p-3 sharp-border space-y-1">
          <div className="text-[9px] font-bold uppercase text-neutral-500">Actions Executed</div>
          <div className="text-2xl font-black text-black">{metrics.actionsExecuted}</div>
          <div className="text-[9px] font-mono text-neutral-400">Total</div>
        </div>

        <div className="bg-white p-3 sharp-border space-y-1">
          <div className="text-[9px] font-bold uppercase text-neutral-500">Pending Approvals</div>
          <div className="text-2xl font-black text-[#F4B62A]">{approvals.length}</div>
          <div className="text-[9px] font-mono text-neutral-400">In Queue</div>
        </div>

        <div className="bg-white p-3 sharp-border space-y-1">
          <div className="text-[9px] font-bold uppercase text-neutral-500">Follow-ups</div>
          <div className="text-2xl font-black text-black">{metrics.followUps}</div>
          <div className="text-[9px] font-mono text-neutral-400">Scheduled</div>
        </div>

        <div className="bg-white p-3 sharp-border space-y-1">
          <div className="text-[9px] font-bold uppercase text-neutral-500">Conversations</div>
          <div className="text-2xl font-black text-[#20C8E8]">{metrics.activeConversations}</div>
          <div className="text-[9px] font-mono text-neutral-400">Active</div>
        </div>
      </div>

      {/* Two Column Layout: Approvals Queue (Left) & Activity Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Pending Approvals Queue */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-black pb-2">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#F4B62A]" /> PENDING HUMAN APPROVALS ({approvals.length})
            </h2>
            <span className="text-[10px] font-mono text-neutral-500 uppercase">MODE: {autonomyMode}</span>
          </div>

          {loading ? (
            <div className="bg-white p-8 sharp-border text-center text-xs font-mono text-neutral-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#12B76A]" /> Loading pending approvals...
            </div>
          ) : approvals.length === 0 ? (
            <div className="bg-white p-8 sharp-border text-center text-xs font-mono text-neutral-500 space-y-1">
              <div>✓ No pending approvals in queue.</div>
              <div className="text-[10px] text-neutral-400">Click &quot;Run Sales Agent&quot; to analyze a lead and generate an approval request.</div>
            </div>
          ) : (
            approvals.map((app) => (
              <div key={app.id} className="bg-white p-5 sharp-border space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <div>
                    <span className="font-extrabold text-sm uppercase text-black">{app.lead_name}</span>
                    <span className="text-xs font-mono text-neutral-500 ml-2">({app.company})</span>
                  </div>
                  <span className="bg-[#12B76A] text-white px-2 py-0.5 text-[10px] font-bold font-mono">
                    🔥 Score: {app.score}/100
                  </span>
                </div>

                <div className="bg-[#F1F2F3] p-3 sharp-border text-xs font-mono whitespace-pre-wrap leading-relaxed text-neutral-800">
                  {app.draft_message}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-mono text-neutral-400">
                    {new Date(app.requested_at).toLocaleTimeString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(app.id)}
                      className="px-3 py-1.5 border border-black bg-white text-black font-bold text-xs uppercase flex items-center gap-1 hover:bg-neutral-200 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 text-red-600" /> Reject
                    </button>

                    <button
                      onClick={() => handleApprove(app.id)}
                      className="btn-pill-primary text-xs py-1.5 px-4 flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-[#12B76A]" /> Approve & Send
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Per-Lead Activity Timeline */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-black pb-2">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#12B76A]" /> PER-LEAD ACTIVITY TIMELINE (lead_events)
            </h2>
          </div>

          <div className="bg-white p-6 sharp-border space-y-6">
            {timeline.length === 0 ? (
              <div className="text-center py-8 text-xs font-mono text-neutral-400">
                No activity timeline events recorded in database yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-black">
                {timeline.map((ev) => (
                  <div key={ev.id} className="relative group">
                    <div className="absolute -left-[23px] top-1 w-3 h-3 bg-black border-2 border-white rounded-full" />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs uppercase tracking-tight text-black">
                          {ev.title}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {new Date(ev.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-neutral-600 bg-[#F1F2F3] p-2 sharp-border">
                        {ev.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
