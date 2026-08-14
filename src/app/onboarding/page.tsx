"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Briefcase,
  ShieldCheck,
  Brain,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { saveBusinessOnboardingAction } from "./actions";

interface ServiceItem {
  serviceName: string;
  description: string;
  startingPrice: string;
  deliveryTime: string;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business Information
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");

  // Step 2: Services
  const [services, setServices] = useState<ServiceItem[]>([
    { serviceName: "", description: "", startingPrice: "", deliveryTime: "" },
  ]);

  // Step 3: Business Policies
  const [workingHours, setWorkingHours] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [refundPolicy, setRefundPolicy] = useState("");
  const [serviceAreas, setServiceAreas] = useState("");

  // Step 4: Sales Intelligence & FAQs
  const [targetCustomers, setTargetCustomers] = useState("");
  const [typicalBudget, setTypicalBudget] = useState("");
  const [commonRequirements, setCommonRequirements] = useState("");
  const [faqs, setFaqs] = useState<FAQItem[]>([
    { question: "", answer: "", category: "General" },
  ]);

  // Service list handlers
  function addService() {
    setServices([
      ...services,
      { serviceName: "", description: "", startingPrice: "", deliveryTime: "" },
    ]);
  }

  function removeService(index: number) {
    setServices(services.filter((_, i) => i !== index));
  }

  function updateService(index: number, key: keyof ServiceItem, value: string) {
    const copy = [...services];
    copy[index][key] = value;
    setServices(copy);
  }

  // FAQ list handlers
  function addFAQ() {
    setFaqs([...faqs, { question: "", answer: "", category: "General" }]);
  }

  function removeFAQ(index: number) {
    setFaqs(faqs.filter((_, i) => i !== index));
  }

  function updateFAQ(index: number, key: keyof FAQItem, value: string) {
    const copy = [...faqs];
    copy[index][key] = value;
    setFaqs(copy);
  }

  async function handleFinalSubmit() {
    if (!businessName.trim()) {
      setError("Business Name is required.");
      setStep(1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await saveBusinessOnboardingAction({
        businessName,
        industry,
        website,
        businessDescription,
        businessEmail,
        businessPhone,
        workingHours,
        paymentTerms,
        refundPolicy,
        serviceAreas,
        targetCustomers,
        typicalBudget,
        commonRequirements,
        services,
        faqs,
      });
    } catch {
      setError("Error saving business profile knowledge.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen swiss-grid-bg py-12 px-6 text-black flex flex-col justify-between">
      <div className="w-full max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#12B76A] text-white sharp-border flex items-center justify-center font-black">
              R
            </div>
            <span className="font-extrabold text-xl tracking-tighter uppercase">
              REV AI ONBOARDING
            </span>
          </div>

          <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
            STEP {step} OF 4
          </div>
        </div>

        {/* Step Progress Indicator Bar */}
        <div className="grid grid-cols-4 gap-2">
          <div
            onClick={() => setStep(1)}
            className={`h-2 sharp-border cursor-pointer ${
              step >= 1 ? "bg-[#12B76A]" : "bg-neutral-300"
            }`}
          />
          <div
            onClick={() => setStep(2)}
            className={`h-2 sharp-border cursor-pointer ${
              step >= 2 ? "bg-[#12B76A]" : "bg-neutral-300"
            }`}
          />
          <div
            onClick={() => setStep(3)}
            className={`h-2 sharp-border cursor-pointer ${
              step >= 3 ? "bg-[#12B76A]" : "bg-neutral-300"
            }`}
          />
          <div
            onClick={() => setStep(4)}
            className={`h-2 sharp-border cursor-pointer ${
              step >= 4 ? "bg-[#12B76A]" : "bg-neutral-300"
            }`}
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-600 text-red-900 text-xs font-bold uppercase">
            {error}
          </div>
        )}

        {/* STEP 1: BUSINESS INFORMATION */}
        {step === 1 && (
          <div className="bg-white p-8 sharp-border space-y-6">
            <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
              <div className="w-8 h-8 bg-black text-white sharp-border flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-mono text-[#123B2D] uppercase tracking-widest">
                  // STEP 1 OF 4
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  Business Information
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Business / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Acme Tech Solutions"
                  className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Industry Sector
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. B2B SaaS / Real Estate"
                  className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://acme.com"
                  className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Business Email
                </label>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder="contact@acme.com"
                  className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Business Phone
                </label>
                <input
                  type="tel"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Business Overview & Value Proposition
                </label>
                <textarea
                  rows={3}
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="Describe your core offering, key advantages, and primary value prop for prospective buyers."
                  className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-pill-primary text-xs"
              >
                Continue to Services <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: MULTI-SERVICE CONFIGURATOR */}
        {step === 2 && (
          <div className="bg-white p-8 sharp-border space-y-6">
            <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
              <div className="w-8 h-8 bg-[#20C8E8] text-black sharp-border flex items-center justify-center font-bold">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-mono text-[#123B2D] uppercase tracking-widest">
                  // STEP 2 OF 4
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  Services & Products
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="p-4 bg-[#F1F2F3] sharp-border space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-black">
                      Service #{index + 1}
                    </span>
                    {services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Service Name (e.g. Enterprise Automation Setup)"
                        value={service.serviceName}
                        onChange={(e) => updateService(index, "serviceName", e.target.value)}
                        className="w-full p-2.5 border border-black bg-white text-xs font-bold focus:outline-none sharp-border"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Starting Price (e.g. $2,500/mo)"
                        value={service.startingPrice}
                        onChange={(e) => updateService(index, "startingPrice", e.target.value)}
                        className="w-full p-2.5 border border-black bg-white text-xs focus:outline-none sharp-border"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Delivery Time (e.g. 2-3 weeks)"
                        value={service.deliveryTime}
                        onChange={(e) => updateService(index, "deliveryTime", e.target.value)}
                        className="w-full p-2.5 border border-black bg-white text-xs focus:outline-none sharp-border"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <textarea
                        rows={2}
                        placeholder="Service Description & Key Deliverables..."
                        value={service.description}
                        onChange={(e) => updateService(index, "description", e.target.value)}
                        className="w-full p-2.5 border border-black bg-white text-xs focus:outline-none sharp-border"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addService}
                className="btn-pill-secondary text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Service
              </button>
            </div>

            <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-pill-secondary text-xs"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn-pill-primary text-xs"
              >
                Continue to Policies <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: BUSINESS POLICIES */}
        {step === 3 && (
          <div className="bg-white p-8 sharp-border space-y-6">
            <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
              <div className="w-8 h-8 bg-[#F4B62A] text-black sharp-border flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-mono text-[#123B2D] uppercase tracking-widest">
                  // STEP 3 OF 4
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  Business Policies
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Working Hours & Availability
                </label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="e.g. Mon-Fri 9:00 AM - 6:00 PM EST"
                  className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Service Areas / Geography
                </label>
                <input
                  type="text"
                  value={serviceAreas}
                  onChange={(e) => setServiceAreas(e.target.value)}
                  placeholder="e.g. North America, Global Remote"
                  className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Payment Terms
                </label>
                <textarea
                  rows={3}
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g. 50% upfront deposit, 50% upon final deliverable acceptance."
                  className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Refund & Guarantee Policy
                </label>
                <textarea
                  rows={3}
                  value={refundPolicy}
                  onChange={(e) => setRefundPolicy(e.target.value)}
                  placeholder="e.g. 14-day money-back guarantee if SLA performance metrics are unmet."
                  className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-pill-secondary text-xs"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="btn-pill-primary text-xs"
              >
                Continue to Knowledge <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SALES INTELLIGENCE & FAQS */}
        {step === 4 && (
          <div className="bg-white p-8 sharp-border space-y-6">
            <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
              <div className="w-8 h-8 bg-[#F5A7D7] text-black sharp-border flex items-center justify-center font-bold">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-mono text-[#123B2D] uppercase tracking-widest">
                  // STEP 4 OF 4
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  AI Sales Knowledge Base
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                    Target Customers Persona
                  </label>
                  <input
                    type="text"
                    value={targetCustomers}
                    onChange={(e) => setTargetCustomers(e.target.value)}
                    placeholder="e.g. VP Sales, B2B Founders, Marketing Leads"
                    className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                    Typical Deal Budget Range
                  </label>
                  <input
                    type="text"
                    value={typicalBudget}
                    onChange={(e) => setTypicalBudget(e.target.value)}
                    placeholder="e.g. $5,000 - $50,000 ARR"
                    className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                    Common Qualification Criteria & Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={commonRequirements}
                    onChange={(e) => setCommonRequirements(e.target.value)}
                    placeholder="e.g. Must have at least 5 sales reps, active inbound lead volume > 50/mo."
                    className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                  />
                </div>
              </div>

              {/* FAQs Section */}
              <div className="pt-4 border-t border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-black">
                    Common Questions & AI Answers (FAQs)
                  </span>
                  <button
                    type="button"
                    onClick={addFAQ}
                    className="btn-pill-secondary text-xs py-1 px-3"
                  >
                    + Add FAQ
                  </button>
                </div>

                {faqs.map((faq, index) => (
                  <div key={index} className="p-3 bg-[#F1F2F3] sharp-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-neutral-500">
                        FAQ #{index + 1}
                      </span>
                      {faqs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFAQ(index)}
                          className="text-red-600 text-xs font-bold"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Question (e.g. How quickly can we launch?)"
                      value={faq.question}
                      onChange={(e) => updateFAQ(index, "question", e.target.value)}
                      className="w-full p-2 border border-black bg-white text-xs font-bold focus:outline-none sharp-border"
                    />
                    <textarea
                      rows={2}
                      placeholder="Answer for AI Agent..."
                      value={faq.answer}
                      onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                      className="w-full p-2 border border-black bg-white text-xs focus:outline-none sharp-border"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn-pill-secondary text-xs"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="btn-pill-primary bg-[#12B76A] hover:bg-[#123B2D] text-xs"
              >
                {loading ? "Saving Knowledge Base..." : "Complete Onboarding"} <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="text-center pt-4">
          <Link
            href="/dashboard"
            className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black"
          >
            Skip Onboarding (go to Dashboard) &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
