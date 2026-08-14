import { AgentRunIntent, AgentRunPriority } from "@/types";

export interface LeadAnalysisInput {
  leadId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  messageHistory?: Array<{ sender: string; text: string }>;
}

export interface LeadAnalysisOutput {
  score: number;
  intent: AgentRunIntent;
  priority: AgentRunPriority;
  detectedNeed: string;
  summary: string;
  recommendedAction: string;
  draftMessage: string;
  followUpRequired: boolean;
  formattedInsight: string;
}

/**
 * Autonomous AI Sales Agent Engine
 * Analyzes lead profile & message history to produce structured sales intelligence.
 */
export async function analyzeLeadWithAI(
  input: LeadAnalysisInput
): Promise<LeadAnalysisOutput> {
  const textContent = `${input.name} ${input.company || ''} ${input.notes || ''} ${
    input.messageHistory?.map((m) => m.text).join(' ') || ''
  }`.toLowerCase();

  let score = 75;
  let intent: AgentRunIntent = "MEDIUM";
  let priority: AgentRunPriority = "NORMAL";
  let detectedNeed = "AI Business Workflow Automation";
  let recommendedAction = "Send personalized product demo & pricing overview within 2 hours";
  let followUpRequired = true;

  // High-intent keyword scoring heuristics
  if (
    textContent.includes("demo") ||
    textContent.includes("pricing") ||
    textContent.includes("enterprise") ||
    textContent.includes("urgent") ||
    textContent.includes("schedule") ||
    textContent.includes("buy") ||
    textContent.includes("crm") ||
    textContent.includes("cyberdyne")
  ) {
    score = 92;
    intent = "HIGH";
    priority = "URGENT";
    detectedNeed = "AI Sales Autopilot & Custom CRM Integration";
    recommendedAction = "Schedule live technical demo call & send custom proposal";
  } else if (
    textContent.includes("info") ||
    textContent.includes("what is") ||
    textContent.includes("question")
  ) {
    score = 65;
    intent = "MEDIUM";
    priority = "NORMAL";
    detectedNeed = "General Product Inquiry & Documentation";
    recommendedAction = "Send automated documentation link & 3-day check-in follow up";
  } else if (score < 60) {
    intent = "LOW";
    priority = "LOW";
    detectedNeed = "Early Exploration";
    recommendedAction = "Add to weekly educational nurture campaign";
    followUpRequired = false;
  }

  const summary = `Prospect ${input.name} from ${
    input.company || "Independent Organization"
  } evaluated with ${intent} intent (Score: ${score}/100). Target need: ${detectedNeed}.`;

  const draftMessage = `Hi ${input.name.split(" ")[0]},

Thank you for reaching out to REV AI Sales Autopilot!

I saw your interest in ${detectedNeed}. Our autonomous workflow engine can immediately automate your lead qualification, outreach sequences, and calendar scheduling with full multi-tenant isolation.

Would you be open for a brief 15-minute demo call this week?

Best regards,
REV AI Autopilot Sales Agent`;

  const formattedInsight = `Lead Score: ${score}/100
Intent: ${intent}
Priority: ${priority}
Detected Need: ${detectedNeed}
Recommended Action: ${recommendedAction}`;

  return {
    score,
    intent,
    priority,
    detectedNeed,
    summary,
    recommendedAction,
    draftMessage,
    followUpRequired,
    formattedInsight,
  };
}
