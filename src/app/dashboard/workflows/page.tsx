import Link from "next/link";
import { getTenantContext } from "@/lib/supabase/tenant";
import { createClient } from "@/lib/supabase/server";
import { Workflow } from "@/types";
import { Plus, Search, GitBranch, ArrowRight, Play, Pause, FileCode } from "lucide-react";

export default async function WorkflowsPage() {
  const tenantContext = await getTenantContext();

  const currentOrg = tenantContext.currentOrganization || {
    id: "demo-org-id",
    name: "Rev AI Autopilot Workspace",
  };

  const supabase = await createClient();

  let workflows: Workflow[] = [];

  try {
    const { data, error } = await supabase
      .from("workflows")
      .select("*, workflow_nodes(*)")
      .eq("organization_id", currentOrg.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      workflows = data.map((w) => ({
        id: w.id,
        organizationId: w.organization_id,
        name: w.name,
        description: w.description,
        status: w.status as Workflow["status"],
        version: w.version,
        createdAt: w.created_at,
        updatedAt: w.updated_at,
        nodes: w.workflow_nodes,
        executionCount: 0,
      }));
    }
  } catch {
    workflows = [];
  }

  return (
    <div className="space-y-8">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black pb-6">
        <div>
          <div className="text-xs font-mono text-[#123B2D] uppercase tracking-widest mb-1">
            // WORKFLOW AUTOMATION ENGINE
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
            WORKFLOWS
          </h1>
          <p className="text-sm font-medium text-neutral-700 mt-2 max-w-2xl">
            Automate repetitive business processes with AI-powered workflows. Trigger smart qualification, decision logic, and automated operations.
          </p>
        </div>

        <Link href="/dashboard/workflows/new" className="btn-pill-primary text-xs self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Create Workflow
        </Link>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 sharp-border">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search workflows by name or trigger..."
            className="w-full pl-9 pr-4 py-2 bg-[#F1F2F3] text-xs font-medium border border-black focus:outline-none focus:bg-white sharp-border"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold uppercase">
          <span className="bg-black text-white px-3 py-1.5 sharp-border cursor-pointer">
            All ({workflows.length})
          </span>
          <span className="bg-[#F1F2F3] hover:bg-neutral-200 text-black px-3 py-1.5 sharp-border cursor-pointer">
            Active ({workflows.filter((w) => w.status === "ACTIVE").length})
          </span>
          <span className="bg-[#F1F2F3] hover:bg-neutral-200 text-black px-3 py-1.5 sharp-border cursor-pointer">
            Draft ({workflows.filter((w) => w.status === "DRAFT").length})
          </span>
          <span className="bg-[#F1F2F3] hover:bg-neutral-200 text-black px-3 py-1.5 sharp-border cursor-pointer">
            Paused ({workflows.filter((w) => w.status === "PAUSED").length})
          </span>
        </div>
      </div>

      {/* 3. WORKFLOW CARDS GRID OR EMPTY STATE */}
      {workflows.length === 0 ? (
        <div className="bg-white p-12 text-center sharp-border space-y-4 max-w-2xl mx-auto my-8">
          <div className="w-12 h-12 bg-[#12B76A] text-white sharp-border flex items-center justify-center mx-auto">
            <GitBranch className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">
            NO WORKFLOWS YET
          </h2>
          <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
            Create your first automated workflow to turn incoming leads into scored, qualified opportunities autonomously.
          </p>
          <div className="pt-2">
            <Link href="/dashboard/workflows/new" className="btn-pill-primary text-xs">
              <Plus className="w-4 h-4" /> Create First Workflow
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((wf) => {
            const isDraft = wf.status === "DRAFT";
            const isActive = wf.status === "ACTIVE";
            const isPaused = wf.status === "PAUSED";

            return (
              <div key={wf.id} className="bg-white p-6 sharp-border flex flex-col justify-between space-y-6">
                <div>
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sharp-border ${
                        isActive
                          ? "bg-[#12B76A] text-white"
                          : isPaused
                          ? "bg-[#F4B62A] text-black"
                          : "bg-neutral-200 text-black"
                      }`}
                    >
                      {isActive && <Play className="w-2.5 h-2.5 fill-current" />}
                      {isPaused && <Pause className="w-2.5 h-2.5" />}
                      {isDraft && <FileCode className="w-2.5 h-2.5" />}
                      {wf.status}
                    </span>

                    <span className="text-[10px] font-mono text-neutral-400">
                      v{wf.version || 1}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold uppercase tracking-tight text-black mb-1">
                    {wf.name}
                  </h3>
                  <p className="text-xs text-neutral-600 line-clamp-2 mb-4">
                    {wf.description || "No description provided."}
                  </p>

                  {/* Flow Graph Preview */}
                  <div className="p-3 bg-[#F1F2F3] sharp-border text-[11px] font-mono space-y-1 text-neutral-800">
                    <div className="font-bold text-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#12B76A] rounded-full" /> Node Flow:
                    </div>
                    <div className="text-neutral-600 truncate">
                      Lead Created &rarr; AI Analyze &rarr; Condition &rarr; Action
                    </div>
                  </div>
                </div>

                {/* Footer Stats & Open Action */}
                <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-neutral-500">
                    <div>0 executions</div>
                    <div className="text-[9px] text-neutral-400">No runs yet</div>
                  </div>

                  <Link
                    href={`/dashboard/workflows/${wf.id}`}
                    className="btn-pill-secondary text-xs py-1.5 px-4"
                  >
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
