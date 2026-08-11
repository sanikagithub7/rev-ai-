"use client";

import { useState } from "react";
import Link from "next/link";
import { createOrganizationAction } from "@/app/auth/actions";
import { ArrowRight, Building2 } from "lucide-react";

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const res = await createOrganizationAction(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen swiss-grid-bg flex items-center justify-center p-6 text-black">
      <div className="w-full max-w-lg bg-white sharp-border p-8 relative">
        <div className="w-full h-3 bg-[#20C8E8] mb-6" />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-black text-white sharp-border flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              SETUP WORKSPACE
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight">
              Create Your Organization
            </h1>
          </div>
        </div>

        <p className="text-xs text-neutral-600 mb-6">
          To get started with Rev AI Sales Autopilot, initialize your company tenant workspace.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-600 text-red-900 text-xs font-bold uppercase">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Organization Name *
            </label>
            <input
              type="text"
              name="orgName"
              required
              placeholder="e.g. Apex Global Sales"
              className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Industry Domain
            </label>
            <input
              type="text"
              name="industry"
              placeholder="e.g. B2B Software / Real Estate"
              className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-pill-primary justify-center mt-6 text-sm"
          >
            {loading ? "Initializing..." : "Launch Organization Workspace"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-neutral-200 text-center">
          <Link href="/dashboard" className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black">
            Skip for now (go to dashboard) →
          </Link>
        </div>
      </div>
    </div>
  );
}
