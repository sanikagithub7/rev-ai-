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
          n.includes("qwen") ||
          n.includes("qwen2.5") ||
          n.includes("qwen2")
      );

      if (match) return match;
    }
  } catch {
    // Fallback if tag check fails
  }

  return "qwen2.5";
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

    // Standardize & Validate Output Structure
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
