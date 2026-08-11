import Link from "next/link";
import { ArrowRight, Bot, Zap, ShieldCheck, BarChart3, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen swiss-grid-bg text-black selection:bg-[#12B76A] selection:text-white flex flex-col justify-between">
      {/* 1. EDITORIAL NAVIGATION */}
      <header className="border-b border-black py-4 px-6 md:px-12 flex items-center justify-between bg-[#F1F2F3]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-[#12B76A] sharp-border flex items-center justify-center font-black text-xs text-white">
            R
          </div>
          <span className="font-extrabold tracking-tighter text-xl text-black uppercase">
            REV AI
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-bold tracking-tight uppercase">
          <a href="#features" className="hover:text-[#12B76A] transition-colors">
            Product
          </a>
          <a href="#pipeline" className="hover:text-[#12B76A] transition-colors">
            AI Pipeline
          </a>
          <a href="#stats" className="hover:text-[#12B76A] transition-colors">
            Performance
          </a>
          <Link href="/docs/architecture" className="hover:text-[#12B76A] transition-colors">
            Architecture
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-xs font-bold uppercase tracking-tight hover:underline px-3 py-1.5"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="btn-pill-primary text-xs"
          >
            Sign Up <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. HERO SECTION WITH OVERSIZED TYPOGRAPHY & ASYMMETRIC GEOMETRIC BLOCKS */}
      <main className="flex-1">
        <section className="relative px-6 md:px-12 pt-12 pb-24 border-b border-black overflow-hidden">
          {/* Geometric Background Color Blocks */}
          <div className="absolute top-8 right-12 w-64 md:w-96 h-32 bg-[#12B76A] opacity-90 -z-10" />
          <div className="absolute top-48 left-1/3 w-48 md:w-80 h-24 bg-[#F5A7D7] opacity-85 -z-10" />
          <div className="absolute bottom-12 right-1/4 w-56 md:w-72 h-20 bg-[#20C8E8] opacity-80 -z-10" />

          <div className="max-w-7xl mx-auto">
            {/* Top Micro Tag */}
            <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-wider mb-6 sharp-border">
              <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
              Event-Driven Multi-Tenant Sales Autopilot
            </div>

            {/* Oversized Headline */}
            <div className="relative mb-8">
              <div className="text-[#123B2D] font-extrabold text-2xl md:text-3xl tracking-tight uppercase mb-2">
                Meet Your AI Sales Team
              </div>
              <h1 className="hero-headline text-black drop-shadow-sm">
                REV AI
              </h1>
              <div className="hero-headline text-black relative -mt-3 md:-mt-8">
                <span className="bg-[#12B76A] text-white px-4 inline-block">SALES</span>{" "}
                AUTOPILOT
              </div>
            </div>

            {/* Sub-description and Primary Call-to-Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pt-6">
              <div className="lg:col-span-7">
                <p className="text-xl md:text-2xl font-medium tracking-tight text-neutral-900 leading-snug max-w-2xl">
                  Turn leads into conversations, conversations into qualified opportunities, and opportunities into predictable revenue — completely hands-free.
                </p>
              </div>

              <div className="lg:col-span-5 flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signup" className="btn-pill-primary text-base justify-center">
                  Start Automating <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/auth/login" className="btn-pill-secondary text-base justify-center">
                  View Demo Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3. STATISTICS SECTION (EDITORIAL MINIMALISM) */}
        <section id="stats" className="border-b border-black bg-white">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black">
            <div className="p-8 md:p-12">
              <div className="text-6xl md:text-7xl font-black tracking-tighter text-black mb-2">
                10x
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#123B2D]">
                Faster Lead Response Speed
              </div>
              <p className="text-xs text-neutral-600 mt-2">
                Sub-second initial AI context processing & immediate multichannel outreach.
              </p>
            </div>

            <div className="p-8 md:p-12 bg-[#F1F2F3]/50">
              <div className="text-6xl md:text-7xl font-black tracking-tighter text-[#12B76A] mb-2">
                24/7
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#123B2D]">
                AI Agent Coverage
              </div>
              <p className="text-xs text-neutral-600 mt-2">
                Continuous qualification, personalized messaging, and instant booking calendar sync.
              </p>
            </div>

            <div className="p-8 md:p-12">
              <div className="text-6xl md:text-7xl font-black tracking-tighter text-black mb-2">
                100%
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#123B2D]">
                Automated Workflows
              </div>
              <p className="text-xs text-neutral-600 mt-2">
                Seamless n8n integration event triggers connecting CRM, email, and internal memory.
              </p>
            </div>
          </div>
        </section>

        {/* 4. ASYMMETRICAL FEATURE LAYOUT & ACCENT BLOCKS */}
        <section id="features" className="py-20 px-6 md:px-12 border-b border-black">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-12">
              <span className="w-8 h-8 bg-[#F4B62A] sharp-border flex items-center justify-center font-bold text-sm">
                01
              </span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black">
                CORE CAPABILITIES
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Feature 1 */}
              <div className="md:col-span-7 bg-white p-8 md:p-10 sharp-border relative group">
                <div className="w-12 h-12 bg-[#12B76A] text-white sharp-border flex items-center justify-center mb-6">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">
                  AI Lead Intelligence Agent
                </h3>
                <p className="text-neutral-700 text-sm leading-relaxed mb-6">
                  Deeply analyzes incoming lead signals, scores readiness, extracts key intent parameters, and updates your multi-tenant CRM context in real time.
                </p>
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#12B76A]">
                  <CheckCircle2 className="w-4 h-4" /> Multi-Tenant RLS Isolated Memory
                </div>
              </div>

              {/* Feature 2 */}
              <div className="md:col-span-5 bg-[#20C8E8] p-8 md:p-10 sharp-border flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-black text-white sharp-border flex items-center justify-center mb-6">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold uppercase tracking-tight mb-3 text-black">
                    n8n Automation Engine
                  </h3>
                  <p className="text-black/80 text-sm leading-relaxed mb-6">
                    Trigger event-based actions: LEAD_CREATED, LEAD_QUALIFIED, MEETING_BOOKED. Connect your external tools seamlessly.
                  </p>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-black">
                  HMAC Signed Webhooks
                </div>
              </div>

              {/* Feature 3 */}
              <div className="md:col-span-5 bg-[#F5A7D7] p-8 md:p-10 sharp-border flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-black text-white sharp-border flex items-center justify-center mb-6">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold uppercase tracking-tight mb-3 text-black">
                    Enterprise Tenant Security
                  </h3>
                  <p className="text-black/80 text-sm leading-relaxed mb-6">
                    PostgreSQL Row-Level Security ensures Organization A never touches Organization B’s data.
                  </p>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-black">
                  Role Access (OWNER, ADMIN, SALES)
                </div>
              </div>

              {/* Feature 4 */}
              <div className="md:col-span-7 bg-black text-white p-8 md:p-10 sharp-border">
                <div className="w-12 h-12 bg-[#12B76A] text-white sharp-border flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold uppercase tracking-tight mb-3 text-white">
                  Real-time Analytics & Observability
                </h3>
                <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                  Track full AI execution runs (`ai_runs`) and automation workflow executions (`automation_runs`) with precise token accounting and error monitoring.
                </p>
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#12B76A]">
                  <CheckCircle2 className="w-4 h-4" /> Full Execution Auditing
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. DARK GREEN PIPELINE STORYTELLING SECTION */}
        <section id="pipeline" className="swiss-grid-dark py-24 px-6 md:px-12 text-white border-b border-black">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-block bg-[#12B76A] text-white px-3 py-1 text-xs font-bold uppercase tracking-wider">
                System Flow
              </div>
              <h2 className="text-4xl md:text-6xl font-black uppercase leading-tight tracking-tight">
                YOUR SALES PIPELINE IS ALWAYS MOVING.
              </h2>
              <p className="text-emerald-100/80 text-base md:text-lg leading-relaxed">
                From the moment a prospective buyer arrives on your form or landing page, Rev AI triggers instant intelligence workflows, qualifies intent against your custom business knowledge base, and schedules sales meetings autonomously.
              </p>
              <div className="pt-4">
                <Link href="/auth/signup" className="btn-pill-primary bg-[#12B76A] text-white hover:bg-white hover:text-black">
                  Build Your AI Team <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 bg-black/60 p-6 md:p-8 sharp-border-dark space-y-4">
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest border-b border-emerald-900 pb-2">
                // LIVE PIPELINE DISPATCHER
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-3 bg-neutral-900 sharp-border-dark">
                  <span className="text-neutral-400">EVENT: LEAD_CREATED</span>
                  <span className="text-emerald-400 font-bold">DISPATCHED</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-900 sharp-border-dark">
                  <span className="text-neutral-400">AI AGENT: LEAD_SCORE</span>
                  <span className="text-[#20C8E8] font-bold">SCORE = 92 (HOT)</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-900 sharp-border-dark">
                  <span className="text-neutral-400">AUTOMATION: CALENDAR_SYNC</span>
                  <span className="text-[#F5A7D7] font-bold">INVITE SENT</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. EDITORIAL FOOTER */}
      <footer className="border-t border-black py-8 px-6 md:px-12 bg-[#F1F2F3] text-xs font-bold uppercase tracking-wider flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          REV AI — AI SALES AUTOPILOT &copy; {new Date().getFullYear()}
        </div>
        <div className="flex items-center gap-6">
          <Link href="/docs/architecture" className="hover:underline">Docs</Link>
          <Link href="/auth/login" className="hover:underline">Login</Link>
          <Link href="/auth/signup" className="hover:underline">Sign Up</Link>
        </div>
      </footer>
    </div>
  );
}
