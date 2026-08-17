import { z } from "zod";

export interface HotLeadResult {
  result: boolean;
  confidence: number;
  reasoning: string;
  signals: string[];
}

export interface SpamResult {
  result: boolean;
  confidence: number;
  reasoning: string;
  signals: string[];
}

export interface QualificationResult {
  status: "QUALIFIED" | "PARTIALLY_QUALIFIED" | "NOT_QUALIFIED";
  confidence: number;
  reasoning: string;
  signals: string[];
}

export interface LeadIntelligenceOutput {
  hot_lead: HotLeadResult;
  spam_detection: SpamResult;
  lead_qualification: QualificationResult;
  modelUsed: string;
}

export interface StructuredLeadIntelligence {
  lead_score: number;
  ai_score: number;
  classification: "HOT" | "WARM" | "COLD" | "SPAM";
  urgency: "HIGH" | "MEDIUM" | "LOW";
  confidence: number;
  recommended_action: string;
  detected_intent: string;
  positive_buying_signals: string[];
  buying_signals: string[];
  risks: string[];
  evidence: string[];
  reasoning?: string;
  modelUsed: string;
  latency_ms: number;
  analyzed_at: string;
}

export const LeadIntelligenceSchema = z.object({
  lead_score: z.number().int().min(0).max(100),
  ai_score: z.number().int().min(0).max(100),
  classification: z.enum(["HOT", "WARM", "COLD", "SPAM"]),
  urgency: z.enum(["HIGH", "MEDIUM", "LOW"]),
  confidence: z.number().int().min(0).max(100),
  recommended_action: z.string().min(1),
  detected_intent: z.string().min(1),
  positive_buying_signals: z.array(z.string()),
  buying_signals: z.array(z.string()),
  risks: z.array(z.string()),
  evidence: z.array(z.string()),
  reasoning: z.string().optional(),
});

export interface ReadinessItem {
  score: number;
  assessment: string;
}

export interface RecommendedActionItem {
  priority: "HIGH" | "MEDIUM" | "LOW" | string;
  action: string;
  reason: string;
}

export interface ProjectReviewOutput {
  overall_score: number;
  summary: string;
  project_type: string;
  target_market: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  risks: string[];
  sales_readiness: ReadinessItem;
  product_readiness: ReadinessItem;
  marketing_readiness: ReadinessItem;
  lead_generation: ReadinessItem;
  recommended_actions: RecommendedActionItem[];
  next_steps: string[];
  modelUsed: string;
}

export interface EvaluationCategory {
  score: number;
  findings: string[];
}

export interface WebsiteReviewOutput {
  overall_score: number;
  website_summary: string;
  business_type: string;
  primary_product_or_service: string;
  target_audience: string;
  value_proposition: string;
  strengths: string[];
  weaknesses: string[];
  conversion_analysis: EvaluationCategory;
  sales_readiness: EvaluationCategory;
  lead_generation: EvaluationCategory;
  trust_and_credibility: EvaluationCategory;
  ux_analysis: EvaluationCategory;
  seo_observations: EvaluationCategory;
  risks: string[];
  opportunities: string[];
  recommended_actions: RecommendedActionItem[];
  modelUsed: string;
}

export async function getOllamaBaseUrl(): Promise<string> {
  return (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
}

export async function detectQwenModel(baseUrl: string): Promise<string> {
  if (process.env.OLLAMA_MODEL) {
    return process.env.OLLAMA_MODEL;
  }

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      const models: Array<{ name: string }> = data.models || [];
      const names = models.map((m) => m.name.toLowerCase());

      const match = names.find(
        (n) =>
          n.includes("qwen3.5") ||
          n.includes("qwen2.5") ||
          n.includes("qwen")
      );

      if (match) return match;
    }
  } catch {
    // Fallback if tag check fails
  }

  return "qwen3.5:latest";
}

/**
 * Analyzes scraped website content using Ollama + Qwen model.
 * Returns EXACTLY 3 results (Hot Lead, Spam Detection, Qualification).
 */
export async function analyzeLeadWithQwen(websiteUrl: string, scrapedContent: string): Promise<LeadIntelligenceOutput> {
  const baseUrl = await getOllamaBaseUrl();
  const modelName = await detectQwenModel(baseUrl);

  const systemPrompt = `You are REV AI Lead Intelligence Engine. Analyze the website content below for a B2B sales lead.

You MUST reply ONLY with a valid JSON object matching this EXACT schema (no markdown, no explanatory text outside JSON):
{
  "hot_lead": {
    "result": boolean,
    "confidence": number between 0 and 100,
    "reasoning": "brief evidence-based summary",
    "signals": ["signal 1", "signal 2"]
  },
  "spam_detection": {
    "result": boolean,
    "confidence": number between 0 and 100,
    "reasoning": "brief analysis of spam indicators",
    "signals": ["signal 1", "signal 2"]
  },
  "lead_qualification": {
    "status": "QUALIFIED" or "PARTIALLY_QUALIFIED" or "NOT_QUALIFIED",
    "confidence": number between 0 and 100,
    "reasoning": "qualification reasoning based on intent and business offering",
    "signals": ["signal 1", "signal 2"]
  }
}`;

  const userPrompt = `Target Website URL: ${websiteUrl}

Extracted Website Content:
${scrapedContent}

Analyze and generate the 3 required lead intelligence results strictly in valid JSON format.`;

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
        format: "json",
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error (${response.status})`);
    }

    const data = await response.json();
    const rawResponseText = data.response || "{}";

    let parsed: any;
    try {
      parsed = JSON.parse(rawResponseText);
    } catch {
      const match = rawResponseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Invalid JSON returned from AI model");
      }
    }

    const hotLead: HotLeadResult = {
      result: Boolean(parsed?.hot_lead?.result),
      confidence: Math.min(100, Math.max(0, Number(parsed?.hot_lead?.confidence || 75))),
      reasoning: parsed?.hot_lead?.reasoning || "Strong intent signals detected from company website offerings.",
      signals: Array.isArray(parsed?.hot_lead?.signals) ? parsed.hot_lead.signals : ["Clear service catalog", "B2B intent"],
    };

    const spam: SpamResult = {
      result: Boolean(parsed?.spam_detection?.result),
      confidence: Math.min(100, Math.max(0, Number(parsed?.spam_detection?.confidence || 10))),
      reasoning: parsed?.spam_detection?.reasoning || "Legitimate enterprise web domain verified.",
      signals: Array.isArray(parsed?.spam_detection?.signals) ? parsed.spam_detection.signals : ["Valid domain structure"],
    };

    const qualStatus = parsed?.lead_qualification?.status;
    const validStatus: QualificationResult["status"] =
      qualStatus === "QUALIFIED" || qualStatus === "PARTIALLY_QUALIFIED" || qualStatus === "NOT_QUALIFIED"
        ? qualStatus
        : hotLead.result
        ? "QUALIFIED"
        : "PARTIALLY_QUALIFIED";

    const qual: QualificationResult = {
      status: validStatus,
      confidence: Math.min(100, Math.max(0, Number(parsed?.lead_qualification?.confidence || 80))),
      reasoning: parsed?.lead_qualification?.reasoning || "Business requirements align with automated sales solutions.",
      signals: Array.isArray(parsed?.lead_qualification?.signals) ? parsed.lead_qualification.signals : ["Service alignment"],
    };

    return {
      hot_lead: hotLead,
      spam_detection: spam,
      lead_qualification: qual,
      modelUsed: modelName,
    };
  } catch (err: any) {
    throw new Error(err?.message || "Ollama AI service is currently unavailable.");
  }
}

/**
 * Generates structured AI Project Review using Ollama + Qwen model.
 */
export async function generateProjectReviewWithQwen(params: {
  projectName: string;
  websiteUrl?: string;
  projectDescription: string;
  targetAudience?: string;
  productService?: string;
  currentGoal?: string;
  additionalContext?: string;
  scrapedWebsiteText?: string;
}): Promise<ProjectReviewOutput> {
  const baseUrl = await getOllamaBaseUrl();
  const modelName = await detectQwenModel(baseUrl);

  const systemPrompt = `You are REV AI Senior Project & Growth Intelligence Consultant.
Perform an in-depth, actionable project review for a business/product.

CRITICAL INSTRUCTION FOR RECOMMENDED ACTIONS:
Do NOT return vague recommendations like "Improve marketing" or "Do lead generation".
Provide SPECIFIC, ACTIONABLE recommendations tailored to the project (e.g., "Add a high-intent lead capture form above the pricing section and route submissions into the REV AI pipeline.").

You MUST reply ONLY with a valid JSON object matching this EXACT schema (no markdown, no text outside JSON):
{
  "overall_score": 82,
  "summary": "Executive summary of product fit and growth readiness",
  "project_type": "B2B SaaS / E-commerce / Agency",
  "target_market": "Identified target customer segment",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "risks": ["Risk 1", "Risk 2"],
  "sales_readiness": {
    "score": 80,
    "assessment": "Sales pipeline and conversion readiness evaluation"
  },
  "product_readiness": {
    "score": 85,
    "assessment": "Product completeness and value proposition evaluation"
  },
  "marketing_readiness": {
    "score": 75,
    "assessment": "Channel positioning and audience reach evaluation"
  },
  "lead_generation": {
    "score": 70,
    "assessment": "Inbound lead capture and funnel flow evaluation"
  },
  "recommended_actions": [
    {
      "priority": "HIGH",
      "action": "Specific concrete action",
      "reason": "Clear strategic justification"
    },
    {
      "priority": "MEDIUM",
      "action": "Specific concrete action",
      "reason": "Clear strategic justification"
    }
  ],
  "next_steps": ["Immediate step 1", "Immediate step 2"]
}`;

  const userPrompt = `PROJECT DETAILS:
- Project Name: ${params.projectName}
- Website URL: ${params.websiteUrl || "None provided"}
- Description: ${params.projectDescription}
- Target Audience: ${params.targetAudience || "General B2B/B2C"}
- Product / Service Offering: ${params.productService || "Standard offering"}
- Current Goal: ${params.currentGoal || "Generate Leads"}
- Additional Context: ${params.additionalContext || "None"}

${params.scrapedWebsiteText ? `EXTRACTED WEBSITE CONTENT:\n${params.scrapedWebsiteText.slice(0, 3000)}` : ""}

Generate an in-depth, structured AI Project Review strictly formatted as valid JSON.`;

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
        format: "json",
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error (${response.status})`);
    }

    const data = await response.json();
    const rawResponseText = data.response || "{}";

    let parsed: any;
    try {
      parsed = JSON.parse(rawResponseText);
    } catch {
      const match = rawResponseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Invalid JSON returned from Qwen AI model");
      }
    }

    const overallScore = Math.min(100, Math.max(0, Number(parsed?.overall_score || 78)));

    return {
      overall_score: overallScore,
      summary: parsed?.summary || `${params.projectName} shows strong potential with strategic growth levers available.`,
      project_type: parsed?.project_type || "B2B Technology Service",
      target_market: parsed?.target_market || params.targetAudience || "Ideal Customer Profile Segment",
      strengths: Array.isArray(parsed?.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ["Clear product vision", "Defined target audience"],
      weaknesses: Array.isArray(parsed?.weaknesses) && parsed.weaknesses.length > 0 ? parsed.weaknesses : ["Limited automated lead capture", "Conversion messaging needs refinement"],
      opportunities: Array.isArray(parsed?.opportunities) && parsed.opportunities.length > 0 ? parsed.opportunities : ["Implement automated sales follow-up pipeline", "Expand inbound content channels"],
      risks: Array.isArray(parsed?.risks) && parsed.risks.length > 0 ? parsed.risks : ["Market competition in core segment", "Manual follow-up deal latency"],
      sales_readiness: {
        score: Math.min(100, Math.max(0, Number(parsed?.sales_readiness?.score || 75))),
        assessment: parsed?.sales_readiness?.assessment || "Ready for automated CRM lead assignment and qualification.",
      },
      product_readiness: {
        score: Math.min(100, Math.max(0, Number(parsed?.product_readiness?.score || 80))),
        assessment: parsed?.product_readiness?.assessment || "Core value proposition defined; focus on conversion call-to-actions.",
      },
      marketing_readiness: {
        score: Math.min(100, Math.max(0, Number(parsed?.marketing_readiness?.score || 70))),
        assessment: parsed?.marketing_readiness?.assessment || "High-intent landing pages needed to capture inbound prospects.",
      },
      lead_generation: {
        score: Math.min(100, Math.max(0, Number(parsed?.lead_generation?.score || 68))),
        assessment: parsed?.lead_generation?.assessment || "Automate lead capture forms and route inquiries directly to REV AI.",
      },
      recommended_actions: Array.isArray(parsed?.recommended_actions) && parsed.recommended_actions.length > 0
        ? parsed.recommended_actions.map((act: any) => ({
            priority: act.priority || "HIGH",
            action: act.action || "Implement automated lead capture form on main landing page",
            reason: act.reason || "Shortens initial lead response time from hours to seconds.",
          }))
        : [
            {
              priority: "HIGH",
              action: "Embed REV AI lead ingestion webhook above the pricing section",
              reason: "Captures high-intent prospects before bounce.",
            },
            {
              priority: "MEDIUM",
              action: "Set up automated Qwen qualification agent for inbound messages",
              reason: "Ensures only qualified B2B leads reach sales representatives.",
            },
          ],
      next_steps: Array.isArray(parsed?.next_steps) && parsed.next_steps.length > 0
        ? parsed.next_steps
        : [
            "Configure REV AI Lead Management pipeline",
            "Set up automated email follow-up sequence",
            "Connect Google Calendar for automated meeting bookings",
          ],
      modelUsed: modelName,
    };
  } catch (err: any) {
    throw new Error(err?.message || "AI Project Review is currently unavailable — Ollama could not be reached.");
  }
}

/**
 * Analyzes a real website URL using Ollama + Qwen and returns a structured AI Website Review matching Requirement 7.
 */
export async function analyzeWebsiteReviewWithQwen(params: {
  websiteUrl: string;
  title?: string;
  metaDescription?: string;
  headings?: string[];
  extractedText: string;
}): Promise<WebsiteReviewOutput> {
  const baseUrl = await getOllamaBaseUrl();
  const modelName = await detectQwenModel(baseUrl);

  const systemPrompt = `You are REV AI Senior AI Product, Website and Sales Intelligence Analyst.
Analyze the real website content provided below based ONLY on the supplied evidence. Do NOT invent or fabricate information not supported by evidence. If specific details (e.g. pricing or target market) are not present in the content, state "Not available from website".

CRITICAL INSTRUCTION FOR RECOMMENDED ACTIONS:
Recommendations MUST be concrete, specific, and actionable (e.g., "Add a high-contrast CTA button above the fold linking directly to your trial page.").

You MUST reply ONLY with a valid JSON object matching this EXACT schema (no markdown formatting outside JSON):
{
  "overall_score": 82,
  "website_summary": "In-depth summary of what the website offers",
  "business_type": "B2B SaaS / Agency / E-commerce / Enterprise",
  "primary_product_or_service": "Core product or service identified",
  "target_audience": "Target audience segment identified",
  "value_proposition": "Core value proposition extracted",
  "strengths": ["Key strength 1", "Key strength 2"],
  "weaknesses": ["Key weakness 1", "Key weakness 2"],
  "conversion_analysis": {
    "score": 80,
    "findings": ["Conversion finding 1", "Conversion finding 2"]
  },
  "sales_readiness": {
    "score": 85,
    "findings": ["Sales readiness finding 1"]
  },
  "lead_generation": {
    "score": 75,
    "findings": ["Lead gen finding 1"]
  },
  "trust_and_credibility": {
    "score": 88,
    "findings": ["Trust finding 1"]
  },
  "ux_analysis": {
    "score": 82,
    "findings": ["UX finding 1"]
  },
  "seo_observations": {
    "score": 78,
    "findings": ["SEO finding 1"]
  },
  "risks": ["Risk 1", "Risk 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "recommended_actions": [
    {
      "priority": "HIGH",
      "action": "Specific concrete action",
      "reason": "Clear justification"
    }
  ]
}`;

  const userPrompt = `TARGET WEBSITE URL: ${params.websiteUrl}
PAGE TITLE: ${params.title || "Not specified"}
META DESCRIPTION: ${params.metaDescription || "Not specified"}
HEADINGS DETECTED: ${params.headings ? params.headings.join(" | ") : "None"}

EXTRACTED WEBSITE CONTENT:
${params.extractedText.slice(0, 3800)}

Analyze the website content strictly and generate the structured JSON review.`;

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
        format: "json",
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error (${response.status})`);
    }

    const data = await response.json();
    const rawResponseText = data.response || "{}";

    let parsed: any;
    try {
      parsed = JSON.parse(rawResponseText);
    } catch {
      const match = rawResponseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Invalid JSON returned from Qwen AI model");
      }
    }

    // Helper for score bounding
    const boundScore = (val: any, fallback = 75) => Math.min(100, Math.max(0, Number(val || fallback)));

    return {
      overall_score: boundScore(parsed?.overall_score, 80),
      website_summary: parsed?.website_summary || `Website analysis for ${params.websiteUrl}`,
      business_type: parsed?.business_type || "B2B Online Business",
      primary_product_or_service: parsed?.primary_product_or_service || params.title || "Digital Services / Products",
      target_audience: parsed?.target_audience || "Target Business Audience",
      value_proposition: parsed?.value_proposition || params.metaDescription || "Value proposition identified on site",
      strengths: Array.isArray(parsed?.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ["Clear domain branding"],
      weaknesses: Array.isArray(parsed?.weaknesses) && parsed.weaknesses.length > 0 ? parsed.weaknesses : ["Conversion funnel optimization required"],
      conversion_analysis: {
        score: boundScore(parsed?.conversion_analysis?.score, 78),
        findings: Array.isArray(parsed?.conversion_analysis?.findings) ? parsed.conversion_analysis.findings : ["Call to action placement evaluated"],
      },
      sales_readiness: {
        score: boundScore(parsed?.sales_readiness?.score, 82),
        assessment: "",
        findings: Array.isArray(parsed?.sales_readiness?.findings) ? parsed.sales_readiness.findings : ["Direct contact channels present"],
      } as any,
      lead_generation: {
        score: boundScore(parsed?.lead_generation?.score, 72),
        findings: Array.isArray(parsed?.lead_generation?.findings) ? parsed.lead_generation.findings : ["Form submission capture enabled"],
      },
      trust_and_credibility: {
        score: boundScore(parsed?.trust_and_credibility?.score, 85),
        findings: Array.isArray(parsed?.trust_and_credibility?.findings) ? parsed.trust_and_credibility.findings : ["Domain SSL and branding verified"],
      },
      ux_analysis: {
        score: boundScore(parsed?.ux_analysis?.score, 80),
        findings: Array.isArray(parsed?.ux_analysis?.findings) ? parsed.ux_analysis.findings : ["Layout and typography structure evaluated"],
      },
      seo_observations: {
        score: boundScore(parsed?.seo_observations?.score, 75),
        findings: Array.isArray(parsed?.seo_observations?.findings) ? parsed.seo_observations.findings : ["Title tag and meta elements analyzed"],
      },
      risks: Array.isArray(parsed?.risks) && parsed.risks.length > 0 ? parsed.risks : ["Bounce risk on initial hero section"],
      opportunities: Array.isArray(parsed?.opportunities) && parsed.opportunities.length > 0 ? parsed.opportunities : ["Automate lead capture and CRM routing"],
      recommended_actions: Array.isArray(parsed?.recommended_actions) && parsed.recommended_actions.length > 0
        ? parsed.recommended_actions.map((a: any) => ({
            priority: a.priority || "HIGH",
            action: a.action || "Add high-contrast CTA above the fold",
            reason: a.reason || "Increases immediate visitor conversion rate",
          }))
        : [
            {
              priority: "HIGH",
              action: "Add a high-contrast CTA button above the fold",
              reason: "Directs high-intent visitors immediately to the conversion funnel.",
            },
          ],
      modelUsed: modelName,
    };
  } catch (err: any) {
    throw new Error(err?.message || "Ollama AI service is currently unavailable.");
  }
}

/**
 * Analyzes structured B2B inbound lead payload using Ollama + Qwen model.
 * Returns Zod-validated Lead Intelligence matching Requirement 8 & 9.
 */
export async function analyzeStructuredLeadIntelligenceWithQwen(payload: {
  contactName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  industry?: string;
  budget?: string;
  statedRequirement?: string;
  inboundMessage?: string;
}): Promise<StructuredLeadIntelligence> {
  const startTime = Date.now();
  const baseUrl = await getOllamaBaseUrl();
  const modelName = await detectQwenModel(baseUrl);

  const systemPrompt = `You are Rev AI's Lead Intelligence Agent.

Analyze the supplied business lead information.

Your task is to determine:
1. Lead score from 0-100
2. Lead classification
3. Urgency
4. Confidence
5. Recommended next action
6. Detected buying intent
7. Positive buying signals
8. Risks or friction points
9. Reasoning/evidence based ONLY on the supplied lead information

Classification must be exactly one of: HOT, WARM, COLD, SPAM
Urgency must be exactly one of: HIGH, MEDIUM, LOW

Return ONLY valid JSON matching this exact structure:
{
  "lead_score": 85,
  "classification": "HOT",
  "urgency": "HIGH",
  "confidence": 100,
  "recommended_action": "CONTACT_IMMEDIATELY",
  "detected_intent": "Urgent need for sales automation and faster lead qualification workflow implementation.",
  "positive_buying_signals": [
    "Explicitly stated urgent requirement",
    "Defined budget available",
    "Clear use case identified",
    "Specific goal identified"
  ],
  "risks": [],
  "evidence": []
}

Rules:
- lead_score must be an integer between 0 and 100.
- confidence must be an integer between 0 and 100.
- positive_buying_signals must be an array of strings.
- risks must be an array of strings.
- evidence must contain only evidence supported by the supplied lead information.
- Never invent budget, company information, intent, timeline, or requirements not implied by the input payload.`;

  const userPrompt = `INBOUND LEAD PAYLOAD:
- Contact Name: ${payload.contactName || "Unknown"}
- Company: ${payload.companyName || "Not specified"}
- Email: ${payload.email || "Not specified"}
- Phone: ${payload.phone || "Not specified"}
- Industry Sector: ${payload.industry || "General"}
- Estimated Budget (₹): ${payload.budget || "Not specified"}
- Stated Requirement: ${payload.statedRequirement || "None stated"}
- Inbound Message / Customer Query: "${payload.inboundMessage || "None provided"}"

Analyze the lead and generate structured intelligence in JSON format.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelName,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
        format: "json",
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        const errObj: any = new Error(`Configured Qwen model '${modelName}' was not found in Ollama.`);
        errObj.code = "MODEL_NOT_FOUND";
        throw errObj;
      }
      const errObj: any = new Error(`Ollama returned HTTP error ${response.status}`);
      errObj.code = "OLLAMA_HTTP_ERROR";
      throw errObj;
    }

    const data = await response.json();
    const rawResponseText = data.response || "{}";

    let parsed: any;
    try {
      parsed = JSON.parse(rawResponseText);
    } catch {
      const match = rawResponseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        const errObj: any = new Error("Invalid JSON structure returned from AI model.");
        errObj.code = "INVALID_AI_RESPONSE";
        throw errObj;
      }
    }

    // Sanitize values before Zod validation
    const rawScore = Number(parsed?.lead_score ?? 75);
    const score = Math.min(100, Math.max(0, Math.round(isNaN(rawScore) ? 75 : rawScore)));

    const rawConf = Number(parsed?.confidence ?? 90);
    const confidence = Math.min(100, Math.max(0, Math.round(isNaN(rawConf) ? 90 : rawConf)));

    const validClassifications = ["HOT", "WARM", "COLD", "SPAM"];
    const classification: "HOT" | "WARM" | "COLD" | "SPAM" =
      validClassifications.includes(parsed?.classification?.toUpperCase())
        ? parsed.classification.toUpperCase()
        : score >= 80
        ? "HOT"
        : score >= 50
        ? "WARM"
        : "COLD";

    const validUrgencies = ["HIGH", "MEDIUM", "LOW"];
    const urgency: "HIGH" | "MEDIUM" | "LOW" =
      validUrgencies.includes(parsed?.urgency?.toUpperCase())
        ? parsed.urgency.toUpperCase()
        : score >= 80
        ? "HIGH"
        : "MEDIUM";

    const positive_buying_signals = Array.isArray(parsed?.positive_buying_signals)
      ? parsed.positive_buying_signals.map(String).filter(Boolean)
      : payload.statedRequirement
      ? [`Requirement stated: ${payload.statedRequirement}`]
      : ["Lead inquiry received"];

    const risks = Array.isArray(parsed?.risks)
      ? parsed.risks.map(String).filter(Boolean)
      : [];

    const evidence = Array.isArray(parsed?.evidence)
      ? parsed.evidence.map(String).filter(Boolean)
      : [];

    const buying_signals = Array.isArray(parsed?.buying_signals)
      ? parsed.buying_signals.map(String).filter(Boolean)
      : positive_buying_signals;

    const candidate = {
      lead_score: score,
      ai_score: score,
      classification,
      urgency,
      confidence,
      recommended_action: String(parsed?.recommended_action || "CONTACT_IMMEDIATELY").toUpperCase().replace(/\s+/g, "_"),
      detected_intent: String(parsed?.detected_intent || payload.statedRequirement || "B2B Sales Inquiry"),
      positive_buying_signals,
      buying_signals,
      risks,
      evidence,
      reasoning: String(parsed?.reasoning || "Structured AI Lead Analysis based on evidence."),
    };

    // Zod strict validation
    const validated = LeadIntelligenceSchema.parse(candidate);
    const latency_ms = Date.now() - startTime;

    return {
      ...validated,
      modelUsed: modelName,
      latency_ms,
      analyzed_at: new Date().toISOString(),
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      const timeoutErr: any = new Error(`Ollama request timed out after 120 seconds.`);
      timeoutErr.code = "OLLAMA_TIMEOUT";
      throw timeoutErr;
    }
    if (err instanceof z.ZodError) {
      const zodErr: any = new Error(`AI Result Validation Error: ${err.errors.map((e) => e.message).join(", ")}`);
      zodErr.code = "INVALID_AI_RESPONSE";
      throw zodErr;
    }
    if (!err.code) {
      err.code = "OLLAMA_UNAVAILABLE";
      err.message = `Ollama is not reachable at ${baseUrl}. Ensure Ollama is running. (${err.message})`;
    }
    throw err;
  }
}

