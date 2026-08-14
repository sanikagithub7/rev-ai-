import { getOllamaBaseUrl, detectQwenModel } from "@/lib/ai/ollama";

export interface SystemHealthStatus {
  database: { status: "ACTIVE" | "ERROR"; message: string };
  aiIntelligence: { status: "ACTIVE" | "UNAVAILABLE"; message: string; model?: string };
  workflowEngine: { status: "ACTIVE" | "IDLE"; message: string; count: number };
  calendarEngine: { status: "READY" | "NOT_CONNECTED"; message: string };
  overallStatus: "ENGINE OPERATIONAL" | "PARTIALLY OPERATIONAL" | "ATTENTION REQUIRED";
}

export async function checkSystemHealth(
  supabaseClient: any,
  orgId: string
): Promise<SystemHealthStatus> {
  // 1. Database Health Check
  let dbStatus: "ACTIVE" | "ERROR" = "ACTIVE";
  let dbMessage = "Multi-tenant RLS database operational";
  try {
    const { error } = await supabaseClient
      .from("organizations")
      .select("id")
      .eq("id", orgId)
      .single();
    if (error) {
      dbStatus = "ERROR";
      dbMessage = error.message;
    }
  } catch {
    dbStatus = "ERROR";
    dbMessage = "Supabase connection failed";
  }

  // 2. Ollama AI Intelligence Health Check
  let aiStatus: "ACTIVE" | "UNAVAILABLE" = "UNAVAILABLE";
  let aiMessage = "Ollama endpoint not reachable";
  let aiModel = "Qwen";
  try {
    const baseUrl = await getOllamaBaseUrl();
    const model = await detectQwenModel(baseUrl);
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(2000), // 2s quick ping
    });

    if (res.ok) {
      aiStatus = "ACTIVE";
      aiModel = model;
      aiMessage = `Ollama ${model} inference active`;
    }
  } catch {
    aiStatus = "UNAVAILABLE";
    aiMessage = "Ollama offline — local endpoint required";
  }

  // 3. Workflow Engine Health Check
  let wfStatus: "ACTIVE" | "IDLE" = "IDLE";
  let wfCount = 0;
  let wfMessage = "No active workflow definitions";
  try {
    const { count } = await supabaseClient
      .from("workflows")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId);

    if (count !== null && count > 0) {
      wfCount = count;
      wfStatus = "ACTIVE";
      wfMessage = `${count} active automation workflows`;
    }
  } catch {
    // Ignored
  }

  // 4. Google Calendar Engine Health Check
  let calStatus: "READY" | "NOT_CONNECTED" = "NOT_CONNECTED";
  let calMessage = "Connect Google Calendar to enable Meet links";
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    calStatus = "READY";
    calMessage = "Google OAuth & Meet API configured";
  }

  // Overall Status Calculation
  let overallStatus: "ENGINE OPERATIONAL" | "PARTIALLY OPERATIONAL" | "ATTENTION REQUIRED" = "ENGINE OPERATIONAL";
  if (dbStatus === "ERROR") {
    overallStatus = "ATTENTION REQUIRED";
  } else if (aiStatus === "UNAVAILABLE" || calStatus === "NOT_CONNECTED") {
    overallStatus = "PARTIALLY OPERATIONAL";
  }

  return {
    database: { status: dbStatus, message: dbMessage },
    aiIntelligence: { status: aiStatus, message: aiMessage, model: aiModel },
    workflowEngine: { status: wfStatus, message: wfMessage, count: wfCount },
    calendarEngine: { status: calStatus, message: calMessage },
    overallStatus,
  };
}
