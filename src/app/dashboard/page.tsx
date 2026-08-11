import Link from "next/link";
import { getTenantContext } from "@/lib/supabase/tenant";
import { logoutAction } from "@/app/auth/actions";
import {
  Users,
  Flame,
  Calendar,
  CheckCircle2,
  Bot,
  Zap,
  Building2,
  LogOut,
  Sliders,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

export default async function DashboardPage() {
  const tenantContext = await getTenantContext();

  const user = tenantContext.user || {
    id: "demo-user-id",
    email: "owner@company.com",
    name: "Workspace Owner",
  };

  const currentOrg = tenantContext.currentOrganization || {
    id: "demo-org-id",
    name: "Rev AI Autopilot Demo",
    industry: "B2B Sales Automation",
  };

  const userRole = tenantContext.role || "OWNER";
  const userOrganizations = tenantContext.organizations.length > 0
    ? tenantContext.organizations
    : [currentOrg];

  return (
    <div className="min-h-screen swiss-grid-bg text-black flex flex-col justify-between">
      {/* 1. DASHBOARD TOP HEADER */}
      <header className="border-b border-black bg-white px-6 md:px-12 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#12B76A] sharp-border flex items-center justify-center font-black text-xs text-white">
              R
            </div>
            <span className="font-extrabold text-xl tracking-tighter uppercase">
              REV AI
            </span>
          </Link>

          {/* Tenant Switcher Box */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F1F2F3] sharp-border">
            <Building2 className="w-4 h-4 text-[#123B2D]" />
            <select
              defaultValue={currentOrg.id}
              className="bg-transparent text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer"
            >
              {userOrganizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <span className="inline-flex items-center gap-1.5 bg-[#12B76A] text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest">
            {userRole} ROLE
          </span>
        </div>

        {/* User Identity & Logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold uppercase tracking-tight">
              {user.name || user.email.split("@")[0]}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono">
              {user.email}
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="btn-pill-secondary py-1.5 px-4 text-xs font-bold uppercase flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </form>
        </div>
      </header>

      {/* 2. SECONDARY PRODUCT NAVIGATION BAR */}
      <nav className="border-b border-black bg-[#F1F2F3] px-6 md:px-12 py-3 overflow-x-auto">
        <div className="flex items-center gap-8 min-w-max text-xs font-bold uppercase tracking-wider">
          <Link
            href="/dashboard"
            className="text-black border-b-2 border-[#12B76A] pb-1"
          >
            Dashboard
          </Link>
          <Link href="/dashboard" className="text-neutral-500 hover:text-black transition-colors">
            Leads
          </Link>
          <Link href="/dashboard" className="text-neutral-500 hover:text-black transition-colors">
            Conversations
          </Link>
          <Link href="/dashboard" className="text-neutral-500 hover:text-black transition-colors">
            Automations
          </Link>
          <Link href="/dashboard" className="text-neutral-500 hover:text-black transition-colors">
            Meetings
          </Link>
          <Link href="/dashboard" className="text-neutral-500 hover:text-black transition-colors">
            Analytics
          </Link>
          <Link href="/dashboard" className="text-neutral-500 hover:text-black transition-colors">
            AI Agents
          </Link>
          <Link href="/dashboard" className="text-neutral-500 hover:text-black transition-colors">
            Knowledge Base
          </Link>
          <Link href="/dashboard" className="text-neutral-500 hover:text-black transition-colors">
            Team
          </Link>
          <Link href="/dashboard" className="text-neutral-500 hover:text-black transition-colors">
            Settings
          </Link>
        </div>
      </nav>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 px-6 md:px-12 py-10 max-w-7xl mx-auto w-full space-y-10">
        {/* Workspace Title & Onboarding CTA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black pb-8">
          <div>
            <div className="text-xs font-mono text-[#123B2D] uppercase tracking-widest mb-1">
              // TENANT WORKSPACE: {currentOrg.name}
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
              SALES CONTROL CENTER
            </h1>
          </div>

          <Link
            href="/onboarding"
            className="btn-pill-primary text-xs self-start md:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#12B76A]" /> Configure AI Knowledge Base
          </Link>
        </div>

        {/* 4. DASHBOARD METRICS GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 sharp-border relative overflow-hidden">
            <div className="w-2 h-full bg-[#12B76A] absolute top-0 left-0" />
            <div className="pl-3">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Leads</span>
                <Users className="w-4 h-4 text-black" />
              </div>
              <div className="text-4xl font-black text-black">0</div>
              <div className="text-[10px] text-neutral-500 font-mono mt-2">
                No leads captured yet
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sharp-border relative overflow-hidden">
            <div className="w-2 h-full bg-[#F5A7D7] absolute top-0 left-0" />
            <div className="pl-3">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Hot Leads</span>
                <Flame className="w-4 h-4 text-[#12B76A]" />
              </div>
              <div className="text-4xl font-black text-black">0</div>
              <div className="text-[10px] text-neutral-500 font-mono mt-2">
                High-intent lead score &gt; 80
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sharp-border relative overflow-hidden">
            <div className="w-2 h-full bg-[#20C8E8] absolute top-0 left-0" />
            <div className="pl-3">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Meetings</span>
                <Calendar className="w-4 h-4 text-black" />
              </div>
              <div className="text-4xl font-black text-black">0</div>
              <div className="text-[10px] text-neutral-500 font-mono mt-2">
                Booked calendar slots
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sharp-border relative overflow-hidden">
            <div className="w-2 h-full bg-[#F4B62A] absolute top-0 left-0" />
            <div className="pl-3">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Conversions</span>
                <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
              </div>
              <div className="text-4xl font-black text-black">0.0%</div>
              <div className="text-[10px] text-neutral-500 font-mono mt-2">
                Lead-to-opportunity rate
              </div>
            </div>
          </div>
        </section>

        {/* 5. AUTOMATION STATUS & SYSTEM PIPELINE PANEL */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Automation Engines */}
          <div className="lg:col-span-7 bg-white p-8 sharp-border">
            <div className="flex items-center justify-between border-b border-black pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#12B76A]" />
                <h2 className="text-lg font-black uppercase tracking-tight">
                  AUTOMATION STATUS
                </h2>
              </div>
              <span className="text-xs font-mono uppercase text-neutral-400">
                // SYSTEM ENGINE
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#F1F2F3] sharp-border">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide">
                    Lead Capture Trigger
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Monitors inbound form webhooks and API events
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 bg-[#12B76A] text-white px-2.5 py-1 text-[10px] font-bold uppercase">
                  ACTIVE
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#F1F2F3] sharp-border">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide">
                    AI Lead Scoring Engine
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Evaluates leads against business profile knowledge
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 bg-[#F4B62A] text-black px-2.5 py-1 text-[10px] font-bold uppercase">
                  NOT CONFIGURED
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#F1F2F3] sharp-border">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide">
                    Follow-Up Workflow
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Automated multi-channel response sequences
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 bg-neutral-300 text-black px-2.5 py-1 text-[10px] font-bold uppercase">
                  NOT CONFIGURED
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#F1F2F3] sharp-border">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide">
                    Calendar Integration
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Direct meeting booking sync
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 bg-neutral-300 text-black px-2.5 py-1 text-[10px] font-bold uppercase">
                  NOT CONNECTED
                </span>
              </div>
            </div>
          </div>

          {/* AI Run Observer Feed */}
          <div className="lg:col-span-5 bg-[#123B2D] text-white p-8 sharp-border">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#12B76A]" />
                <h2 className="text-lg font-black uppercase tracking-tight text-white">
                  AI RUN OBSERVATION
                </h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase">
                // LIVE AUDIT LOG
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-black/40 sharp-border-dark space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-400">ORG_TENANT_READY</span>
                  <span className="text-[10px] text-neutral-400">Just now</span>
                </div>
                <p className="text-xs text-neutral-300">
                  Organization <span className="font-bold text-white">{currentOrg.name}</span> initialized with Row-Level Security isolation.
                </p>
              </div>

              <div className="p-4 bg-black/40 sharp-border-dark text-center py-8">
                <Sliders className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <div className="text-xs font-bold uppercase text-white">
                  Waiting for First Lead Event
                </div>
                <p className="text-[11px] text-emerald-200/70 mt-1 max-w-xs mx-auto">
                  AI runs and workflow executions will stream here in real time.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. DASHBOARD FOOTER */}
      <footer className="border-t border-black py-4 px-6 md:px-12 bg-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-between text-neutral-500">
        <div>
          REV AI DASHBOARD &mdash; TENANT ID: {currentOrg.id.slice(0, 8)}...
        </div>
        <div className="flex items-center gap-4">
          <Link href="/docs/architecture" className="hover:text-black flex items-center gap-1">
            System Docs <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
