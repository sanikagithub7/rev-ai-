"use client";

import { useState } from "react";
import Link from "next/link";
import { signUpAction } from "@/app/auth/actions";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const res = await signUpAction(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen swiss-grid-bg flex items-center justify-center p-6 text-black">
      <div className="w-full max-w-lg bg-white sharp-border p-8 relative">
        {/* Accent top block */}
        <div className="w-full h-3 bg-[#F5A7D7] mb-6" />

        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="font-black text-xl tracking-tighter uppercase">
            REV AI
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider bg-[#12B76A] text-white px-2 py-0.5">
            CREATE WORKSPACE
          </span>
        </div>

        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
          START AUTOPILOT
        </h1>
        <p className="text-xs text-neutral-600 mb-6">
          Create your multi-tenant organization workspace with OWNER role privileges.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-600 text-red-900 text-xs font-bold uppercase">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Organization / Business Name *
            </label>
            <input
              type="text"
              name="orgName"
              required
              placeholder="Acme Automation Corp"
              className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Your Full Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Sarah Connor"
              className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Work Email *
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="sarah@acme.com"
              className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Password *
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-pill-primary justify-center mt-6 text-sm"
          >
            {loading ? "Creating Organization..." : "Create Organization Workspace"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-200 flex items-center justify-between text-xs">
          <span className="text-neutral-500 font-medium">Already have a workspace?</span>
          <Link href="/auth/login" className="font-bold uppercase tracking-wider text-black hover:text-[#12B76A]">
            Log In →
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-2 text-[10px] text-neutral-400 uppercase font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-[#12B76A]" />
          Assigns OWNER Role & Enables Row-Level Security
        </div>
      </div>
    </div>
  );
}
