import Link from "next/link";
import { BookOpen, Sparkles, Plus, ArrowRight } from "lucide-react";
import { getTenantContext } from "@/lib/supabase/tenant";

export default async function KnowledgeBaseDashboardPage() {
  const tenantContext = await getTenantContext();
  const currentOrg = tenantContext.currentOrganization || {
    id: "demo-org",
    name: "REV AI WORKSPACE",
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black pb-6">
        <div>
          <div className="text-xs font-mono text-[#123B2D] uppercase tracking-widest mb-1">
            // BUSINESS INTELLIGENCE MEMORY
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            KNOWLEDGE BASE & RULES
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage company profile, service catalogs, FAQs, and qualification rules used by AI Agents.
          </p>
        </div>

        <Link href="/onboarding" className="btn-pill-primary text-xs self-start sm:self-auto">
          <Sparkles className="w-4 h-4 text-[#12B76A]" /> Open Knowledge Configurator
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 sharp-border space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono font-bold text-[#12B76A] uppercase mb-2">
              ● BUSINESS PROFILE
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-black mb-2">
              Company Context & Overview
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Core company value proposition, working hours, payment terms, refund policy, and service geographical regions.
            </p>
          </div>
          <Link href="/onboarding" className="btn-pill-secondary text-xs py-1.5 px-3">
            Edit Business Info &rarr;
          </Link>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 sharp-border space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono font-bold text-[#20C8E8] uppercase mb-2">
              ● SERVICE CATALOG
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-black mb-2">
              Services & Products Config
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Service names, pricing tiers, delivery windows, and key deliverables provided to prospective buyers.
            </p>
          </div>
          <Link href="/onboarding" className="btn-pill-secondary text-xs py-1.5 px-3">
            Manage Services &rarr;
          </Link>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 sharp-border space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono font-bold text-[#F4B62A] uppercase mb-2">
              ● FAQS & RULES
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-black mb-2">
              AI Sales Question & Answer Bank
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Common buyer questions and structured AI response rules for automated conversation handling.
            </p>
          </div>
          <Link href="/onboarding" className="btn-pill-secondary text-xs py-1.5 px-3">
            Update FAQs &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
