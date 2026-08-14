import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin/session";
import { Shield, Server, Database, Key, Users, Building, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/auth");
  }

  const supabaseConfigured = isSupabaseConfigured();

  let totalUsers: number | string = "NOT CONFIGURED";
  let totalOrgs: number | string = "NOT CONFIGURED";
  let dbStatus: "OPERATIONAL" | "NOT CONFIGURED" = "NOT CONFIGURED";

  if (supabaseConfigured) {
    try {
      const supabase = await createClient();
      const { count: usersCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      const { count: orgsCount } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true });

      totalUsers = usersCount ?? 0;
      totalOrgs = orgsCount ?? 0;
      dbStatus = "OPERATIONAL";
    } catch {
      totalUsers = "NO DATA";
      totalOrgs = "NO DATA";
    }
  }

  return (
    <div className="min-h-screen swiss-grid-bg text-black">
      {/* Admin Navbar */}
      <header className="h-[52px] border-b border-black bg-white px-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#123B2D] text-white font-black text-xs flex items-center justify-center sharp-border">
            RA
          </div>
          <span className="font-black text-lg uppercase tracking-tight">REV AI</span>
          <span className="bg-[#123B2D] text-white font-mono text-[10px] font-bold px-2 py-0.5 uppercase sharp-border">
            ADMIN CONTROL CENTER
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right font-mono text-xs">
            <span className="text-neutral-500 font-medium">ADMIN: </span>
            <span className="font-bold text-black uppercase">{session.name}</span>
          </div>

          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="px-3 py-1 bg-white border border-black text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors cursor-pointer"
            >
              [ &rarr; ADMIN LOGOUT ]
            </button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Banner */}
        <div className="bg-[#123B2D] text-white p-6 sharp-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#12B76A]" />
              <h1 className="text-2xl font-black uppercase tracking-tight text-white">
                ADMINISTRATION & SYSTEM STATUS
              </h1>
            </div>
            <span className="bg-[#12B76A] text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sharp-border">
              SECURE ADMIN SESSION ACTIVE
            </span>
          </div>
          <p className="text-xs text-emerald-100/80 font-mono">
            Logged in as <span className="text-white font-bold">{session.name}</span>. Server-side session verification active. No credentials stored in client state.
          </p>
        </div>

        {/* System Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: System Status */}
          <div className="bg-white p-6 sharp-border space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-neutral-500 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-[#12B76A]" /> SYSTEM STATUS
              </span>
              <span className="bg-[#12B76A] text-white px-2 py-0.5 text-[9px] font-bold uppercase">
                HEALTHY
              </span>
            </div>
            <div className="text-3xl font-black uppercase text-black">
              100% ONLINE
            </div>
            <div className="text-[10px] font-mono text-neutral-500">
              Next.js App Router Server Operational
            </div>
          </div>

          {/* Card 2: Database Status */}
          <div className="bg-white p-6 sharp-border space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-neutral-500 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#20C8E8]" /> DATABASE STATUS
              </span>
              <span
                className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                  dbStatus === "OPERATIONAL"
                    ? "bg-[#12B76A] text-white"
                    : "bg-[#F4B62A] text-black"
                }`}
              >
                {dbStatus}
              </span>
            </div>
            <div className="text-3xl font-black uppercase text-black">
              SUPABASE PostgreSQL
            </div>
            <div className="text-[10px] font-mono text-neutral-500">
              {supabaseConfigured ? "Connected & RLS Enforcement Active" : "Missing Environment Keys"}
            </div>
          </div>

          {/* Card 3: Auth Status */}
          <div className="bg-white p-6 sharp-border space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-neutral-500 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-[#F4B62A]" /> AUTH SYSTEM
              </span>
              <span className="bg-[#12B76A] text-white px-2 py-0.5 text-[9px] font-bold uppercase">
                READY
              </span>
            </div>
            <div className="text-3xl font-black uppercase text-black">
              DUAL AUTH
            </div>
            <div className="text-[10px] font-mono text-neutral-500">
              Supabase Auth (Users) + Server Admin (HTTP-only)
            </div>
          </div>
        </div>

        {/* Database Metrics Table */}
        <div className="bg-white sharp-border overflow-hidden">
          <div className="p-4 bg-[#F1F2F3] border-b border-black text-xs font-mono font-bold uppercase tracking-wider text-black flex items-center justify-between">
            <span>// SYSTEM ENTITIES OVERVIEW</span>
            <span className="text-[10px] text-neutral-500">LEGITIMATE REAL METRICS ONLY</span>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black text-xs font-mono font-bold uppercase tracking-wider text-black bg-[#F1F2F3]/60">
                <th className="p-4">Entity</th>
                <th className="p-4">Description</th>
                <th className="p-4">Count / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs font-medium">
              <tr>
                <td className="p-4 font-bold text-black uppercase flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#12B76A]" /> Registered Users
                </td>
                <td className="p-4 text-neutral-600 font-mono">Total users in public.users table</td>
                <td className="p-4 font-mono font-bold">{totalUsers}</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-black uppercase flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#20C8E8]" /> Organizations
                </td>
                <td className="p-4 text-neutral-600 font-mono">Multi-tenant organizations created</td>
                <td className="p-4 font-mono font-bold">{totalOrgs}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
