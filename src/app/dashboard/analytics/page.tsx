import { Bot, Zap, ShieldCheck, Flame, CheckCircle2, BarChart3 } from "lucide-react";
import { getTenantContext } from "@/lib/supabase/tenant";
import { createClient } from "@/lib/supabase/server";

export default async function AnalyticsPage() {
  const tenantContext = await getTenantContext();
  const currentOrg = tenantContext.currentOrganization || {
    id: "demo-org",
    name: "REV AI WORKSPACE",
  };

  const supabase = await createClient();

  let totalLeadsCount = 0;
  let convertedLeadsCount = 0;
  let totalTokensCount = 0;
  let workflowRunsCount = 0;
  let aiRuns: Array<{
    id: string;
    type: string;
    model: string;
    tokens: number;
    status: string;
    created_at: string;
  }> = [];

  try {
    // 1. Leads Conversion Rate
    const { count: leadCount } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", currentOrg.id);
    if (leadCount !== null) totalLeadsCount = leadCount;

    const { count: convertedCount } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", currentOrg.id)
      .eq("status", "CONVERTED");
    if (convertedCount !== null) convertedLeadsCount = convertedCount;

    // 2. Workflow runs
    const { count: wfCount } = await supabase
      .from("workflow_runs")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", currentOrg.id);
    if (wfCount !== null) workflowRunsCount = wfCount;

    // 3. AI Runs & Tokens
    const { data: runs } = await supabase
      .from("ai_runs")
      .select("id, type, model, tokens, status, created_at")
      .eq("organization_id", currentOrg.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (runs) {
      aiRuns = runs.map((r) => ({
        id: r.id,
        type: r.type,
        model: r.model,
        tokens: r.tokens || 0,
        status: r.status,
        created_at: r.created_at,
      }));
      totalTokensCount = aiRuns.reduce((acc, curr) => acc + (curr.tokens || 0), 0);
    }
  } catch {
    // Graceful fallback to 0
  }

  const conversionRate = totalLeadsCount > 0
    ? ((convertedLeadsCount / totalLeadsCount) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-8">
      <div className="border-b border-black pb-4">
        <div className="text-xs font-mono text-[#123B2D] uppercase tracking-widest mb-1">
          // PERFORMANCE OBSERVABILITY
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight">
          PIPELINE ANALYTICS & AUDIT LOGS
        </h1>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sharp-border space-y-2">
          <div className="text-xs font-bold uppercase text-neutral-500">Lead Conversion Rate</div>
          <div className="text-3xl font-black text-black">{conversionRate}%</div>
          <div className="text-[10px] font-mono text-neutral-400">{convertedLeadsCount} of {totalLeadsCount} converted</div>
        </div>

        <div className="bg-white p-4 sharp-border space-y-2">
          <div className="text-xs font-bold uppercase text-neutral-500">AI Response Latency</div>
          <div className="text-3xl font-black text-[#12B76A]">Sub-sec</div>
          <div className="text-[10px] font-mono text-neutral-400">Database-backed agent latency</div>
        </div>

        <div className="bg-white p-4 sharp-border space-y-2">
          <div className="text-xs font-bold uppercase text-neutral-500">Total Tokens Processed</div>
          <div className="text-3xl font-black text-[#20C8E8]">{totalTokensCount.toLocaleString()}</div>
          <div className="text-[10px] font-mono text-neutral-400">LLM tokens across runs</div>
        </div>

        <div className="bg-white p-4 sharp-border space-y-2">
          <div className="text-xs font-bold uppercase text-neutral-500">Workflow Runs</div>
          <div className="text-3xl font-black text-black">{workflowRunsCount}</div>
          <div className="text-[10px] font-mono text-emerald-600">Active engine executions</div>
        </div>
      </div>

      {/* AI Runs Audit Log Table */}
      <div className="bg-[#123B2D] text-white p-6 sharp-border space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#12B76A]" />
            <h2 className="text-lg font-black uppercase tracking-tight text-white">
              AI RUN AUDIT TRACKER (ai_runs)
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            // RLS ISOLATED TENANT AUDIT LOG
          </span>
        </div>

        <div className="bg-black/50 sharp-border-dark overflow-hidden">
          {aiRuns.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-emerald-300">
              No AI execution logs found in database. Runs will be recorded here automatically.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-emerald-900 text-emerald-400 font-bold uppercase">
                  <th className="p-3">Run ID</th>
                  <th className="p-3">Operation Type</th>
                  <th className="p-3">Model Engine</th>
                  <th className="p-3">Tokens</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950 text-neutral-200">
                {aiRuns.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 text-emerald-300">{r.id.slice(0, 10)}...</td>
                    <td className="p-3 uppercase">{r.type}</td>
                    <td className="p-3">{r.model}</td>
                    <td className="p-3">{r.tokens}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold ${r.status === 'SUCCESS' ? 'bg-[#12B76A] text-white' : 'bg-red-600 text-white'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-400">
                      {new Date(r.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
