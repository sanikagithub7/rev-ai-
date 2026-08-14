"use server";

import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/supabase/tenant";
import { createClient } from "@/lib/supabase/server";

export async function saveBusinessOnboardingAction(payload: {
  businessName: string;
  industry?: string;
  website?: string;
  businessDescription?: string;
  businessEmail?: string;
  businessPhone?: string;
  workingHours?: string;
  paymentTerms?: string;
  refundPolicy?: string;
  serviceAreas?: string;
  targetCustomers?: string;
  typicalBudget?: string;
  commonRequirements?: string;
  services?: { serviceName: string; description?: string; startingPrice?: string; deliveryTime?: string }[];
  faqs?: { question: string; answer: string; category?: string }[];
}) {
  const tenantContext = await getTenantContext();

  if (!tenantContext.user) {
    return { error: "Authentication required." };
  }

  const currentOrg = tenantContext.currentOrganization;
  if (!currentOrg) {
    return { error: "Organization context required." };
  }

  const supabase = await createClient();

  // 1. Insert/Update Business Profile
  const { error: profileError } = await supabase.from("business_profiles").upsert(
    {
      organization_id: currentOrg.id,
      business_name: payload.businessName,
      industry: payload.industry || null,
      website: payload.website || null,
      business_description: payload.businessDescription || null,
      business_email: payload.businessEmail || null,
      business_phone: payload.businessPhone || null,
      working_hours: payload.workingHours || null,
      payment_terms: payload.paymentTerms || null,
      refund_policy: payload.refundPolicy || null,
      service_areas: payload.serviceAreas || null,
      target_customers: payload.targetCustomers || null,
      typical_budget: payload.typicalBudget || null,
      common_requirements: payload.commonRequirements || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" }
  );

  if (profileError) {
    console.error("Profile save error:", profileError);
  }

  // 2. Insert Services if provided
  if (payload.services && payload.services.length > 0) {
    for (const service of payload.services) {
      if (service.serviceName.trim()) {
        await supabase.from("services").insert({
          organization_id: currentOrg.id,
          service_name: service.serviceName,
          description: service.description || null,
          starting_price: service.startingPrice || null,
          delivery_time: service.deliveryTime || null,
        });
      }
    }
  }

  // 3. Insert FAQs if provided
  if (payload.faqs && payload.faqs.length > 0) {
    for (const faq of payload.faqs) {
      if (faq.question.trim() && faq.answer.trim()) {
        await supabase.from("business_faqs").insert({
          organization_id: currentOrg.id,
          question: faq.question,
          answer: faq.answer,
          category: faq.category || "General",
        });
      }
    }
  }

  redirect("/dashboard");
}
