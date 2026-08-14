"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Zap, Sparkles } from "lucide-react";
import { TriggerType } from "@/types";

const TRIGGER_OPTIONS: { type: TriggerType; label: string; description: string }[] = [
  {
    type: "LEAD_CREATED",
    label: "Lead Created",
    description: "Triggers immediately when a new prospective lead enters the system.",
  },
  {
    type: "LEAD_UPDATED",
    label: "Lead Status Updated",
    description: "Triggers when a lead status or qualification score changes.",
  },
  {
    type: "FORM_SUBMITTED",
    label: "Form Submitted",
    description: "Triggers when a prospect submits an inbound website form.",
  },
  {
    type: "MESSAGE_RECEIVED",
    label: "Message Received",
    description: "Triggers upon receiving a new prospect message across chat/email.",
  },
  {
    type: "MEETING_COMPLETED",
    label: "Meeting Completed",
    description: "Triggers after a scheduled sales meeting finishes.",
  },
  {
    type: "PAYMENT_RECEIVED",
    label: "Payment Received",
    description: "Triggers upon confirmed payment event.",
  },
  {
    type: "WEBHOOK_RECEIVED",
    label: "Webhook Received",
    description: "Triggers via an external API or n8n webhook HTTP payload.",
  },
  {
    type: "SCHEDULED",
    label: "Scheduled Timer",
    description: "Triggers periodically on a defined cron schedule.",
  },
];

export default function CreateWorkflowPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType>("LEAD_CREATED");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Workflow name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          triggerType: selectedTrigger,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to create workflow.");
        setLoading(false);
        return;
      }

      const newId = data.workflow.id;
      router.push(`/dashboard/workflows/${newId}`);
    } catch {
      setError("Network error creating workflow.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div>
        <Link
          href="/dashboard/workflows"
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Workflows
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#12B76A] text-white sharp-border flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono text-[#123B2D] uppercase tracking-widest">
              // CREATE WORKFLOW DEFINITION
            </span>
            <h1 className="text-3xl font-black uppercase tracking-tight">
              NEW AUTOMATED WORKFLOW
            </h1>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-600 text-red-900 text-xs font-bold uppercase">
          {error}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 sharp-border">
        {/* Name & Description */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-black">
              Workflow Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lead Scoring & Fast Sales Qualification"
              className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-black">
              Description / Business Intent
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Evaluates incoming leads using AI scoring, checks score > 80, and notifies sales reps."
              className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
            />
          </div>
        </div>

        {/* Trigger Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-black">
            Select Workflow Trigger Event *
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TRIGGER_OPTIONS.map((trig) => {
              const isSelected = selectedTrigger === trig.type;
              return (
                <div
                  key={trig.type}
                  onClick={() => setSelectedTrigger(trig.type)}
                  className={`p-4 cursor-pointer sharp-border transition-all ${
                    isSelected
                      ? "bg-[#123B2D] text-white border-black"
                      : "bg-[#F1F2F3] hover:bg-neutral-200 text-black border-black/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm uppercase tracking-tight flex items-center gap-1.5">
                      <Zap className={`w-4 h-4 ${isSelected ? "text-[#12B76A]" : "text-black"}`} />
                      {trig.label}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#12B76A]" />
                    )}
                  </div>
                  <p className={`text-xs ${isSelected ? "text-emerald-100/70" : "text-neutral-600"}`}>
                    {trig.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-4">
          <Link href="/dashboard/workflows" className="btn-pill-secondary text-xs">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-pill-primary text-xs"
          >
            {loading ? "Creating Workflow..." : "Create & Build Workflow"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
