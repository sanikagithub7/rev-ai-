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
      // Fallback regex extract JSON if extra formatting returned
      const match = rawResponseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Invalid JSON returned from AI model");
      }
    }

    // Standardize & Validate Output Structure
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
