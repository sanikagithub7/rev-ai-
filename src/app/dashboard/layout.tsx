import Link from "next/link";
import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/supabase/tenant";
import { logoutAction } from "@/app/auth/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantContext = await getTenantContext();

  if (!tenantContext.user || !tenantContext.currentOrganization) {
    redirect("/auth");
  }

  const user = tenantContext.user;
  const currentOrg = tenantContext.currentOrganization;

  const userRole = tenantContext.role || "MEMBER";
  const displayEmail = (user.email || "").toUpperCase();

  return (
    <div className="min-h-screen swiss-grid-bg text-black flex flex-col justify-between selection:bg-[#12B76A] selection:text-white">
      {/* 1. EXACT TOP NAVBAR (~50px HEIGHT) */}
      <header className="h-[52px] border-b border-black bg-white px-4 md:px-8 flex items-center justify-between gap-4 sticky top-0 z-50">
        {/* Left Side Branding & Workspace Badge */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black text-white font-black text-xs sharp-border flex items-center justify-center tracking-tighter">
              RA
            </div>
            <span className="font-extrabold text-lg tracking-tight uppercase text-black">
              REV AI
            </span>
          </Link>

          {/* Org & Role Badge Box */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-white border border-black text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
            <span className="text-black">{currentOrg.name}</span>
            <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-mono tracking-widest">
              {userRole}
            </span>
          </div>
        </div>

        {/* Right Side User Identity & Sign Out Button */}
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-extrabold uppercase tracking-tight text-black">
              {displayEmail}
            </div>
            <div className="text-[9px] text-neutral-500 font-mono tracking-wider uppercase">
              TENANT ISOLATION ACTIVE
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="px-3 py-1.5 border border-black bg-white hover:bg-neutral-100 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sharp-border cursor-pointer"
            >
              [<span>&rarr;</span> SIGN OUT]
            </button>
          </form>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">
        {children}
      </main>

      {/* 3. FIXED BOTTOM-LEFT CIRCULAR BUTTON */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          type="button"
          aria-label="Rev AI Quick Info"
          className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center text-xs font-mono font-bold sharp-border shadow-lg hover:scale-105 transition-transform"
        >
          N
        </button>
      </div>
    </div>
  );
}
