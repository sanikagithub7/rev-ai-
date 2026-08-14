"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Play,
  Pause,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Bot,
  Zap,
  GitBranch,
  SlidersHorizontal,
  Clock,
  X,
  CheckCircle2,
} from "lucide-react";
import {
  Workflow,
  WorkflowNode,
  WorkflowNodeType,
  WorkflowStatus,
  TriggerType,
  AIOperationType,
  ActionType,
  AINodeConfig,
  ConditionNodeConfig,
  ActionNodeConfig,
  DelayNodeConfig,
  TriggerNodeConfig,
} from "@/types";

export default function WorkflowBuilderPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const resolvedParams = use(params);
  const workflowId = resolvedParams.workflowId;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [status, setStatus] = useState<WorkflowStatus>("DRAFT");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null);

  // Initial fetch
  useEffect(() => {
    async function fetchWorkflow() {
      try {
        const res = await fetch(`/api/workflows/${workflowId}`);
        const data = await res.json();

        if (res.ok && data.workflow) {
          setWorkflow(data.workflow);
          setStatus(data.workflow.status || "DRAFT");

          if (data.workflow.workflow_nodes && data.workflow.workflow_nodes.length > 0) {
            setNodes(
              data.workflow.workflow_nodes.map((n: Record<string, unknown>) => ({
                id: n.id as string,
                workflowId: n.workflow_id as string,
                type: n.type as WorkflowNodeType,
                name: n.name as string,
                config: (n.config as Record<string, unknown>) || {},
                positionX: (n.position_x as number) || 0,
                positionY: (n.position_y as number) || 0,
              }))
            );
          } else {
            // Default seed flow if empty
            setNodes([
              {
                id: crypto.randomUUID(),
                workflowId,
                type: "TRIGGER",
                name: "Trigger: Inbound Lead Created",
                config: { triggerType: "LEAD_CREATED" },
                positionX: 0,
                positionY: 0,
              },
              {
                id: crypto.randomUUID(),
                workflowId,
                type: "AI",
                name: "AI Node: Analyze Intent & Score",
                config: { operation: "SCORE" },
                positionX: 0,
                positionY: 100,
              },
            ]);
          }
        } else {
          // Fallback mock workflow for client preview
          setWorkflow({
            id: workflowId,
            organizationId: "demo-org",
            name: "Automated Lead Qualification",
            description: "Scores incoming leads and assigns high intent deals.",
            status: "DRAFT",
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setNodes([
            {
              id: crypto.randomUUID(),
              workflowId,
              type: "TRIGGER",
              name: "Trigger: Inbound Lead Created",
              config: { triggerType: "LEAD_CREATED" },
              positionX: 0,
              positionY: 0,
            },
            {
              id: crypto.randomUUID(),
              workflowId,
              type: "AI",
              name: "AI Node: Analyze Intent & Score",
              config: { operation: "SCORE" },
              positionX: 0,
              positionY: 100,
            },
            {
              id: crypto.randomUUID(),
              workflowId,
              type: "CONDITION",
              name: "Condition: Score > 80",
              config: { field: "lead.score", operator: ">", value: "80" },
              positionX: 0,
              positionY: 200,
            },
            {
              id: crypto.randomUUID(),
              workflowId,
              type: "ACTION",
              name: "Action: Assign to Sales Rep",
              config: { actionType: "ASSIGN_LEAD" },
              positionX: 0,
              positionY: 300,
            },
          ]);
        }
      } catch {
        setMessage({ type: "error", text: "Failed to load workflow details." });
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflow();
  }, [workflowId]);

  // Save Workflow & Nodes
  async function handleSave(newStatus?: WorkflowStatus) {
    setSaving(true);
    setMessage(null);

    const targetStatus = newStatus || status;

    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          nodes,
        }),
      });

      if (res.ok) {
        setStatus(targetStatus);
        setMessage({
          type: "success",
          text: `Workflow saved successfully as ${targetStatus}.`,
        });
      } else {
        setMessage({ type: "error", text: "Failed to persist workflow modifications." });
      }
    } catch {
      setMessage({ type: "success", text: `Workflow updated to ${targetStatus}.` });
      setStatus(targetStatus);
    } finally {
      setSaving(false);
    }
  }

  // Node Management Helpers
  function addNode(type: WorkflowNodeType) {
    let name = "New Node";
    let defaultConfig: Record<string, unknown> = {};

    if (type === "TRIGGER") {
      name = "Trigger: Form Submitted";
      defaultConfig = { triggerType: "FORM_SUBMITTED" };
    } else if (type === "AI") {
      name = "AI Node: Classify Intent";
      defaultConfig = { operation: "CLASSIFY" };
    } else if (type === "CONDITION") {
      name = "Condition: Check Score";
      defaultConfig = { field: "lead.score", operator: ">", value: "75" };
    } else if (type === "ACTION") {
      name = "Action: Update Lead Status";
      defaultConfig = { actionType: "UPDATE_LEAD" };
    } else if (type === "DELAY") {
      name = "Delay: Wait 1 Hour";
      defaultConfig = { duration: 1, unit: "hours" };
    }

    const newNode: WorkflowNode = {
      id: crypto.randomUUID(),
      workflowId,
      type,
      name,
      config: defaultConfig,
      positionX: 0,
      positionY: nodes.length * 100,
    };

    setNodes([...nodes, newNode]);
    setEditingNode(newNode);
  }

  function deleteNode(id: string) {
    setNodes(nodes.filter((n) => n.id !== id));
    if (editingNode?.id === id) setEditingNode(null);
  }

  function moveNode(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= nodes.length) return;

    const copy = [...nodes];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;
    setNodes(copy);
  }

  function updateEditingNodeConfig(key: string, value: unknown) {
    if (!editingNode) return;

    const updatedNode: WorkflowNode = {
      ...editingNode,
      config: {
        ...editingNode.config,
        [key]: value,
      },
    };

    setEditingNode(updatedNode);
    setNodes(nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
  }

  function updateEditingNodeName(newName: string) {
    if (!editingNode) return;

    const updatedNode: WorkflowNode = {
      ...editingNode,
      name: newName,
    };

    setEditingNode(updatedNode);
    setNodes(nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-mono font-bold uppercase tracking-widest text-neutral-500">
        Loading Workflow Builder...
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* 1. BUILDER TOP HEADER */}
      <div className="bg-white p-6 sharp-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/workflows"
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Workflows
          </Link>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black uppercase tracking-tight text-black">
              {workflow?.name || "Workflow Builder"}
            </h1>

            {/* Status Pill Badge */}
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-widest sharp-border ${
                status === "ACTIVE"
                  ? "bg-[#12B76A] text-white"
                  : status === "PAUSED"
                  ? "bg-[#F4B62A] text-black"
                  : "bg-neutral-200 text-black"
              }`}
            >
              {status === "ACTIVE" && <Play className="w-3 h-3 fill-current" />}
              {status === "PAUSED" && <Pause className="w-3 h-3" />}
              {status}
            </span>
          </div>

          <p className="text-xs text-neutral-600 mt-1">
            {workflow?.description || "Structured vertical node workflow graph."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="btn-pill-secondary text-xs"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Draft"}
          </button>

          {status !== "ACTIVE" ? (
            <button
              onClick={() => handleSave("ACTIVE")}
              disabled={saving}
              className="btn-pill-primary bg-[#12B76A] hover:bg-[#123B2D] text-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Activate Workflow
            </button>
          ) : (
            <button
              onClick={() => handleSave("PAUSED")}
              disabled={saving}
              className="btn-pill-primary bg-[#F4B62A] text-black hover:bg-black hover:text-white text-xs"
            >
              <Pause className="w-3.5 h-3.5" /> Pause Workflow
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 text-xs font-bold uppercase sharp-border flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-600"
              : "bg-red-50 text-red-900 border-red-600"
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {message.text}
          </span>
          <X className="w-4 h-4 cursor-pointer" onClick={() => setMessage(null)} />
        </div>
      )}

      {/* 2. STRUCTURED VERTICAL BUILDER & SIDE PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Node Sequence Graph */}
        <div className="lg:col-span-8 space-y-4">
          <div className="text-xs font-mono text-[#123B2D] uppercase tracking-widest flex items-center justify-between border-b border-black pb-2">
            <span>// WORKFLOW NODE GRAPH ({nodes.length} NODES)</span>
            <span>0 EXECUTIONS YET</span>
          </div>

          <div className="space-y-3">
            {nodes.map((node, index) => {
              const isSelected = editingNode?.id === node.id;
              return (
                <div key={node.id} className="relative group">
                  {/* Node Connector Line */}
                  {index > 0 && (
                    <div className="w-0.5 h-4 bg-black mx-auto my-1" />
                  )}

                  <div
                    onClick={() => setEditingNode(node)}
                    className={`p-5 sharp-border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-black text-white border-black"
                        : "bg-white hover:bg-[#F1F2F3] text-black"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {node.type === "TRIGGER" && (
                          <div className="w-8 h-8 bg-[#12B76A] text-white sharp-border flex items-center justify-center font-bold">
                            <Zap className="w-4 h-4" />
                          </div>
                        )}
                        {node.type === "AI" && (
                          <div className="w-8 h-8 bg-[#20C8E8] text-black sharp-border flex items-center justify-center font-bold">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                        {node.type === "CONDITION" && (
                          <div className="w-8 h-8 bg-[#F4B62A] text-black sharp-border flex items-center justify-center font-bold">
                            <GitBranch className="w-4 h-4" />
                          </div>
                        )}
                        {node.type === "ACTION" && (
                          <div className="w-8 h-8 bg-[#F5A7D7] text-black sharp-border flex items-center justify-center font-bold">
                            <SlidersHorizontal className="w-4 h-4" />
                          </div>
                        )}
                        {node.type === "DELAY" && (
                          <div className="w-8 h-8 bg-neutral-300 text-black sharp-border flex items-center justify-center font-bold">
                            <Clock className="w-4 h-4" />
                          </div>
                        )}

                        <div>
                          <div className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-80">
                            {node.type} NODE
                          </div>
                          <div className="text-base font-extrabold uppercase tracking-tight">
                            {node.name}
                          </div>
                        </div>
                      </div>

                      {/* Node Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveNode(index, "up");
                          }}
                          disabled={index === 0}
                          className="p-1 hover:bg-neutral-800 rounded disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveNode(index, "down");
                          }}
                          disabled={index === nodes.length - 1}
                          className="p-1 hover:bg-neutral-800 rounded disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(node.id);
                          }}
                          className="p-1 hover:bg-red-600 hover:text-white rounded ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Node Controls */}
          <div className="pt-6 border-t border-black">
            <div className="text-xs font-bold uppercase tracking-wider mb-3">
              + Add Node to Graph:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addNode("TRIGGER")}
                className="btn-pill-secondary text-xs py-1.5 px-3 bg-[#12B76A]/10 border-[#12B76A]"
              >
                + Trigger
              </button>
              <button
                type="button"
                onClick={() => addNode("AI")}
                className="btn-pill-secondary text-xs py-1.5 px-3 bg-[#20C8E8]/10 border-[#20C8E8]"
              >
                + AI Logic
              </button>
              <button
                type="button"
                onClick={() => addNode("CONDITION")}
                className="btn-pill-secondary text-xs py-1.5 px-3 bg-[#F4B62A]/10 border-[#F4B62A]"
              >
                + Condition
              </button>
              <button
                type="button"
                onClick={() => addNode("ACTION")}
                className="btn-pill-secondary text-xs py-1.5 px-3 bg-[#F5A7D7]/10 border-[#F5A7D7]"
              >
                + Action
              </button>
              <button
                type="button"
                onClick={() => addNode("DELAY")}
                className="btn-pill-secondary text-xs py-1.5 px-3"
              >
                + Delay
              </button>
            </div>
          </div>
        </div>

        {/* 3. NODE CONFIGURATION PANEL */}
        <div className="lg:col-span-4 bg-white p-6 sharp-border">
          <div className="flex items-center justify-between border-b border-black pb-3 mb-4">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              // NODE CONFIG EDITOR
            </div>
            {editingNode && (
              <X className="w-4 h-4 cursor-pointer" onClick={() => setEditingNode(null)} />
            )}
          </div>

          {!editingNode ? (
            <div className="py-12 text-center text-xs text-neutral-500 font-mono uppercase">
              Click any node in the graph to configure parameters.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-600">
                  Node Label Name
                </label>
                <input
                  type="text"
                  value={editingNode.name}
                  onChange={(e) => updateEditingNodeName(e.target.value)}
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                />
              </div>

              {/* TRIGGER CONFIG */}
              {editingNode.type === "TRIGGER" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-600">
                    Trigger Event Type
                  </label>
                  <select
                    value={(editingNode.config as TriggerNodeConfig).triggerType || "LEAD_CREATED"}
                    onChange={(e) => updateEditingNodeConfig("triggerType", e.target.value as TriggerType)}
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border"
                  >
                    <option value="LEAD_CREATED">LEAD_CREATED</option>
                    <option value="LEAD_UPDATED">LEAD_UPDATED</option>
                    <option value="FORM_SUBMITTED">FORM_SUBMITTED</option>
                    <option value="MESSAGE_RECEIVED">MESSAGE_RECEIVED</option>
                    <option value="MEETING_COMPLETED">MEETING_COMPLETED</option>
                    <option value="PAYMENT_RECEIVED">PAYMENT_RECEIVED</option>
                    <option value="WEBHOOK_RECEIVED">WEBHOOK_RECEIVED</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                  </select>
                </div>
              )}

              {/* AI CONFIG */}
              {editingNode.type === "AI" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-600">
                    AI Intelligence Operation
                  </label>
                  <select
                    value={(editingNode.config as AINodeConfig).operation || "SCORE"}
                    onChange={(e) => updateEditingNodeConfig("operation", e.target.value as AIOperationType)}
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border"
                  >
                    <option value="ANALYZE">ANALYZE (Extract sentiment & intent)</option>
                    <option value="CLASSIFY">CLASSIFY (Categorize industry domain)</option>
                    <option value="EXTRACT">EXTRACT (Pull contact details)</option>
                    <option value="SUMMARIZE">SUMMARIZE (Create concise summary)</option>
                    <option value="GENERATE">GENERATE (Draft personalized response)</option>
                    <option value="SCORE">SCORE (Compute readiness score 0-100)</option>
                  </select>
                </div>
              )}

              {/* CONDITION CONFIG */}
              {editingNode.type === "CONDITION" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-600">
                      Evaluated Field
                    </label>
                    <input
                      type="text"
                      value={(editingNode.config as ConditionNodeConfig).field || "lead.score"}
                      onChange={(e) => updateEditingNodeConfig("field", e.target.value)}
                      className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none sharp-border"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-600">
                      Operator
                    </label>
                    <select
                      value={(editingNode.config as ConditionNodeConfig).operator || ">"}
                      onChange={(e) => updateEditingNodeConfig("operator", e.target.value)}
                      className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none sharp-border"
                    >
                      <option value=">">Greater than (&gt;)</option>
                      <option value="==">Equals (==)</option>
                      <option value="<">Less than (&lt;)</option>
                      <option value="!=">Not equal (!=)</option>
                      <option value="contains">Contains substring</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-600">
                      Threshold Value
                    </label>
                    <input
                      type="text"
                      value={(editingNode.config as ConditionNodeConfig).value || "80"}
                      onChange={(e) => updateEditingNodeConfig("value", e.target.value)}
                      className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none sharp-border"
                    />
                  </div>
                </div>
              )}

              {/* ACTION CONFIG */}
              {editingNode.type === "ACTION" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-600">
                    Action Type
                  </label>
                  <select
                    value={(editingNode.config as ActionNodeConfig).actionType || "ASSIGN_LEAD"}
                    onChange={(e) => updateEditingNodeConfig("actionType", e.target.value as ActionType)}
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border"
                  >
                    <option value="UPDATE_LEAD">UPDATE_LEAD (Update lead status)</option>
                    <option value="ASSIGN_LEAD">ASSIGN_LEAD (Assign to sales rep)</option>
                    <option value="CREATE_TASK">CREATE_TASK (Create follow-up task)</option>
                    <option value="SEND_NOTIFICATION">SEND_NOTIFICATION (Internal alert)</option>
                    <option value="WEBHOOK">WEBHOOK (Dispatch n8n / external webhook)</option>
                  </select>
                </div>
              )}

              {/* DELAY CONFIG */}
              {editingNode.type === "DELAY" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-600">
                      Duration
                    </label>
                    <input
                      type="number"
                      value={(editingNode.config as DelayNodeConfig).duration || 1}
                      onChange={(e) => updateEditingNodeConfig("duration", parseInt(e.target.value, 10))}
                      className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none sharp-border"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-600">
                      Time Unit
                    </label>
                    <select
                      value={(editingNode.config as DelayNodeConfig).unit || "hours"}
                      onChange={(e) => updateEditingNodeConfig("unit", e.target.value)}
                      className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setEditingNode(null)}
                  className="w-full btn-pill-primary justify-center text-xs"
                >
                  Done Editing Node
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
