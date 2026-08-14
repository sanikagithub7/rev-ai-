"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Bot,
  Sliders,
  Mail,
  Clock,
  Database,
  Bell,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Play,
  Save,
  ArrowRight,
  ArrowDown,
} from "lucide-react";
import { WorkflowNodeType } from "@/types";

interface BuilderNode {
  id: string;
  type: WorkflowNodeType;
  title: string;
  subtitle: string;
  config: Record<string, string>;
}

export default function WorkflowBuilderPage() {
  const [workflowName, setWorkflowName] = useState("AI Lead Qualification & Autonomous Outreach");
  const [nodes, setNodes] = useState<BuilderNode[]>([
    {
      id: "node-1",
      type: "TRIGGER",
      title: "TRIGGER: New Lead Created",
      subtitle: "Inbound webhook or web form submission event",
      config: { event: "NEW_LEAD" },
    },
    {
      id: "node-2",
      type: "AI_ANALYSIS",
      title: "AI ACTION: Analyze Lead",
      subtitle: "Generate lead score (0-100), intent, and summary",
      config: { model: "gpt-4o" },
    },
    {
      id: "node-3",
      type: "CONDITION",
      title: "CONDITION: Lead Score > 80?",
      subtitle: "Branch YES (Hot Lead) vs NO (Nurture)",
      config: { condition: "score > 80" },
    },
    {
      id: "node-4",
      type: "HUMAN_APPROVAL",
      title: "APPROVAL: Check Autonomy Setting",
      subtitle: "Pause for approval if Require Approval mode is active",
      config: { mode: "REQUIRE_APPROVAL" },
    },
    {
      id: "node-5",
      type: "SEND_EMAIL",
      title: "ACTION: Send Personalized Outreach",
      subtitle: "[DEMO / SIMULATED] Deliver AI drafted outreach email",
      config: { channel: "EMAIL" },
    },
    {
      id: "node-6",
      type: "FOLLOW_UP",
      title: "FOLLOW UP: Schedule Check-in",
      subtitle: "Schedule 48-hour automated follow-up check",
      config: { delayHours: "48" },
    },
    {
      id: "node-7",
      type: "END",
      title: "END: Execution Completed",
      subtitle: "Log workflow completion in workflow_executions",
      config: {},
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  function handleAddNode(type: WorkflowNodeType) {
    const newId = `node-${Date.now()}`;
    let title = "New Step";
    let subtitle = "Configurable node step";

    switch (type) {
      case "CRM_UPDATE":
        title = "CRM UPDATE: Sync Lead Data";
        subtitle = "Update lead status to QUALIFIED or HOT in database";
        break;
      case "NOTIFICATION":
        title = "NOTIFICATION: Alert Sales Rep";
        subtitle = "Send instant slack/system alert to assigned account rep";
        break;
      case "DELAY":
        title = "DELAY: Pause Execution";
        subtitle = "Wait 24 hours before next step";
        break;
    }

    const newNode: BuilderNode = {
      id: newId,
      type,
      title,
      subtitle,
      config: {},
    };

    // Insert before END node
    const endIdx = nodes.findIndex((n) => n.type === "END");
    if (endIdx !== -1) {
      const updated = [...nodes];
      updated.splice(endIdx, 0, newNode);
      setNodes(updated);
    } else {
      setNodes([...nodes, newNode]);
    }
  }

  async function handleSaveWorkflow() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  }

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {savedSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-[#12B76A] text-white font-bold text-xs uppercase px-4 py-3 sharp-border shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Workflow Definition Saved to Database!
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black pb-6">
        <div>
          <div className="text-xs font-mono text-[#123B2D] uppercase tracking-widest mb-1">
            // VISUAL WORKFLOW BUILDER ENGINE
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            WORKFLOW CANVAS & NODES
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Build and configure event-driven node execution graphs (`TRIGGER &rarr; AI &rarr; CONDITION &rarr; ACTION`).
          </p>
        </div>

        <div className="flex gap-2 self-start sm:self-auto">
          <Link href="/dashboard/workflows" className="btn-pill-secondary text-xs">
            &larr; Back to Workflows
          </Link>
          <button onClick={handleSaveWorkflow} disabled={saving} className="btn-pill-primary text-xs cursor-pointer">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Workflow Graph"}
          </button>
        </div>
      </div>

      {/* Workflow Name Editor */}
      <div className="bg-white p-4 sharp-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
            Workflow Name
          </label>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="w-full p-2.5 border border-black bg-[#F1F2F3] text-sm font-bold focus:outline-none focus:bg-white sharp-border"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-[#12B76A] text-white px-3 py-1.5 text-xs font-bold uppercase sharp-border">
            STATUS: ACTIVE
          </span>
          <span className="bg-black text-white px-3 py-1.5 text-xs font-bold uppercase font-mono sharp-border">
            v1.2
          </span>
        </div>
      </div>

      {/* Node Palette Bar */}
      <div className="bg-white p-4 sharp-border space-y-2">
        <div className="text-[10px] font-mono font-bold uppercase text-neutral-500">
          // ADD NODE TO CANVAS
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold uppercase">
          <button
            onClick={() => handleAddNode("CRM_UPDATE")}
            className="px-3 py-1.5 border border-black bg-[#F1F2F3] hover:bg-black hover:text-white transition-colors sharp-border cursor-pointer flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5 text-[#12B76A]" /> + CRM Update Node
          </button>

          <button
            onClick={() => handleAddNode("NOTIFICATION")}
            className="px-3 py-1.5 border border-black bg-[#F1F2F3] hover:bg-black hover:text-white transition-colors sharp-border cursor-pointer flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-[#20C8E8]" /> + Notification Node
          </button>

          <button
            onClick={() => handleAddNode("DELAY")}
            className="px-3 py-1.5 border border-black bg-[#F1F2F3] hover:bg-black hover:text-white transition-colors sharp-border cursor-pointer flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-[#F4B62A]" /> + Delay Node
          </button>
        </div>
      </div>

      {/* Vertical Workflow Node Flow */}
      <div className="max-w-2xl mx-auto space-y-3">
        {nodes.map((node, index) => {
          let nodeBg = "bg-white";
          let badgeColor = "bg-black text-white";

          if (node.type === "TRIGGER") {
            nodeBg = "bg-[#123B2D] text-white";
            badgeColor = "bg-[#12B76A] text-white";
          } else if (node.type === "AI_ANALYSIS" || node.type === "AI_AGENT_ACTION") {
            nodeBg = "bg-white border-l-4 border-l-[#12B76A]";
            badgeColor = "bg-[#12B76A] text-white";
          } else if (node.type === "CONDITION") {
            nodeBg = "bg-white border-l-4 border-l-[#20C8E8]";
            badgeColor = "bg-[#20C8E8] text-black";
          } else if (node.type === "HUMAN_APPROVAL") {
            nodeBg = "bg-white border-l-4 border-l-[#F4B62A]";
            badgeColor = "bg-[#F4B62A] text-black";
          } else if (node.type === "END") {
            nodeBg = "bg-black text-white";
            badgeColor = "bg-neutral-800 text-white";
          }

          return (
            <div key={node.id} className="space-y-3">
              <div className={`p-5 sharp-border space-y-2 relative ${nodeBg}`}>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${badgeColor}`}>
                    STEP {index + 1}: {node.type}
                  </span>
                  <span className="text-[10px] font-mono opacity-60">ID: {node.id}</span>
                </div>

                <h3 className="text-lg font-black uppercase tracking-tight">
                  {node.title}
                </h3>
                <p className="text-xs font-mono opacity-80 leading-relaxed">
                  {node.subtitle}
                </p>
              </div>

              {index < nodes.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="w-5 h-5 text-black" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
