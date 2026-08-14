import Link from 'next/link';
import { logoutAction } from '../auth/actions';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { LayoutDashboard, Users, MessageSquare, Zap, Calendar, BarChart3, Database, Shield, LogOut } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Retrieve user organization details
  let orgName = 'Rev AI Workspace';
  let userRole = 'OWNER';

  if (user) {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (profile) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('role, organizations(name)')
          .eq('user_id', profile.id)
          .single();

        if (member) {
          userRole = member.role;
          if (member.organizations) {
            const org = member.organizations as unknown as { name?: string };
            orgName = org.name || orgName;
          }
        }
      }
    } catch {
      // Offline / placeholder mode fallback
    }
  }

  return (
    <div className="min-h-screen bg-swiss-grid text-black flex flex-col selection:bg-[#12B76A]">
      {/* Top Header Navigation */}
      <header className="border-b border-black bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black text-white font-black text-xs flex items-center justify-center">
                RA
              </div>
              <span className="font-extrabold text-lg uppercase tracking-tight">REV AI</span>
            </Link>

            {/* Active Tenant Organization Badge */}
            <div className="hidden sm:flex items-center gap-2 border-sharp px-3 py-1 bg-[#F1F2F3] text-xs font-bold uppercase">
              <span className="w-2 h-2 rounded-full bg-[#12B76A]" />
              <span className="text-black">{orgName}</span>
              <span className="bg-black text-white text-[10px] px-1.5 py-0.5 ml-1">{userRole}</span>
            </div>
          </div>

          {/* User Profile & Logout Form */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-black uppercase">{user?.email || 'authenticated_user'}</span>
              <span className="text-[10px] text-black/60 uppercase font-mono">Tenant Isolation Active</span>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="btn-editorial-secondary py-1.5 px-3 text-xs uppercase flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Workspace Grid Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Editorial Sidebar */}
        <aside className="md:col-span-3 space-y-6">
          <div className="border-sharp bg-white p-4">
            <div className="text-[10px] font-extrabold text-black/50 uppercase tracking-widest mb-3 px-2">
              Main Pipeline
            </div>
            <nav className="space-y-1">
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-xs font-extrabold uppercase bg-black text-white border-sharp">
                <LayoutDashboard className="w-4 h-4 text-[#12B76A]" /> Dashboard
              </Link>
              <Link href="/dashboard/leads" className="flex items-center justify-between px-3 py-2 text-xs font-bold uppercase text-black hover:bg-neutral-100 border-sharp">
                <span className="flex items-center gap-3"><Users className="w-4 h-4 text-[#12B76A]" /> Leads</span>
                <span className="text-[10px] bg-black text-white px-1.5 py-0.5 font-bold">ACTIVE</span>
              </Link>
              <Link href="/dashboard/conversations" className="flex items-center justify-between px-3 py-2 text-xs font-bold uppercase text-black hover:bg-neutral-100 border-sharp">
                <span className="flex items-center gap-3"><MessageSquare className="w-4 h-4 text-[#12B76A]" /> Conversations</span>
                <span className="text-[10px] bg-[#12B76A] text-white px-1.5 py-0.5 font-bold">ACTIVE</span>
              </Link>
              <Link href="/dashboard/workflows" className="flex items-center justify-between px-3 py-2 text-xs font-bold uppercase text-black hover:bg-neutral-100 border-sharp">
                <span className="flex items-center gap-3"><Zap className="w-4 h-4 text-[#12B76A]" /> Workflows</span>
                <span className="text-[10px] bg-black text-white px-1.5 py-0.5 font-bold">ACTIVE</span>
              </Link>
              <Link href="/dashboard/meetings" className="flex items-center justify-between px-3 py-2 text-xs font-bold uppercase text-black hover:bg-neutral-100 border-sharp">
                <span className="flex items-center gap-3"><Calendar className="w-4 h-4 text-[#12B76A]" /> Meetings</span>
                <span className="text-[10px] bg-[#12B76A] text-white px-1.5 py-0.5 font-bold">ACTIVE</span>
              </Link>
              <Link href="/dashboard/analytics" className="flex items-center justify-between px-3 py-2 text-xs font-bold uppercase text-black hover:bg-neutral-100 border-sharp">
                <span className="flex items-center gap-3"><BarChart3 className="w-4 h-4 text-[#12B76A]" /> Analytics</span>
                <span className="text-[10px] bg-black text-white px-1.5 py-0.5 font-bold">REAL-TIME</span>
              </Link>
            </nav>

            <div className="text-[10px] font-extrabold text-black/50 uppercase tracking-widest mt-6 mb-3 px-2">
              Knowledge & Rules
            </div>
            <nav className="space-y-1">
              <Link href="/dashboard/knowledge" className="flex items-center justify-between px-3 py-2 text-xs font-bold uppercase text-black hover:bg-neutral-100 border-sharp">
                <span className="flex items-center gap-3"><Database className="w-4 h-4 text-[#12B76A]" /> Knowledge Base</span>
                <span className="text-[10px] bg-[#12B76A] text-white px-1.5 py-0.5 font-bold">ACTIVE</span>
              </Link>
              <Link href="/dashboard/team" className="flex items-center justify-between px-3 py-2 text-xs font-bold uppercase text-black hover:bg-neutral-100 border-sharp">
                <span className="flex items-center gap-3"><Shield className="w-4 h-4 text-[#12B76A]" /> Security & Team</span>
                <span className="text-[10px] bg-black text-white px-1.5 py-0.5 font-bold">ACTIVE</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="md:col-span-9 space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
