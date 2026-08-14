import {
  AutonomyMode,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowStep,
  ApprovalRequest,
  AIAction,
  FollowUp,
  LeadEvent,
} from "@/types";
import { analyzeLeadWithAI, LeadAnalysisInput } from "@/lib/ai/salesAgent";

export interface ExecutionContext {
  organizationId: string;
  leadId: string;
  leadName: string;
  leadEmail?: string;
  company?: string;
  autonomyMode: AutonomyMode;
}

export interface ExecutionResult {
  executionId: string;
  status: "COMPLETED" | "FAILED" | "PENDING_APPROVAL";
  stepsExecuted: number;
  approvalRequestId?: string;
  outputSummary: string;
  events: LeadEvent[];
}

/**
 * Autonomous Workflow Execution Runner Engine
 * Executes workflow graphs with per-org Autonomy controls (SUGGEST_ONLY | REQUIRE_APPROVAL | AUTONOMOUS)
 */
export async function runWorkflowExecution(
  workflowDef: WorkflowDefinition,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const executionId = crypto.randomUUID();
  const events: LeadEvent[] = [];
  let stepsExecuted = 0;
  let approvalRequestId: string | undefined = undefined;

  // 1. Log Lead Event: Workflow Triggered
  events.push({
    id: crypto.randomUUID(),
    organizationId: context.organizationId,
    leadId: context.leadId,
    eventType: "WORKFLOW_TRIGGERED",
    title: `Workflow "${workflowDef.name}" initiated`,
    details: { triggerEvent: workflowDef.triggerEvent, executionId },
    createdAt: new Date().toISOString(),
  });

  // 2. Perform AI Analysis Step
  const analysisInput: LeadAnalysisInput = {
    leadId: context.leadId,
    name: context.leadName,
    email: context.leadEmail,
    company: context.company,
  };

  const analysis = await analyzeLeadWithAI(analysisInput);
  stepsExecuted++;

  // Log Analysis Event
  events.push({
    id: crypto.randomUUID(),
    organizationId: context.organizationId,
    leadId: context.leadId,
    eventType: "AI_ANALYSIS_COMPLETED",
    title: `AI Score: ${analysis.score}/100 | Intent: ${analysis.intent}`,
    details: {
      score: analysis.score,
      intent: analysis.intent,
      priority: analysis.priority,
      recommendedAction: analysis.recommendedAction,
      draftMessage: analysis.draftMessage,
    },
    createdAt: new Date().toISOString(),
  });

  // 3. Condition Check: High Score (Score > 80)
  const isHighScore = analysis.score >= 80;

  if (isHighScore) {
    events.push({
      id: crypto.randomUUID(),
      organizationId: context.organizationId,
      leadId: context.leadId,
      eventType: "CONDITION_PASSED",
      title: "Condition Passed: High Intent Lead (Score > 80)",
      details: { score: analysis.score },
      createdAt: new Date().toISOString(),
    });

    // Handle Autonomy Gate
    if (context.autonomyMode === "SUGGEST_ONLY") {
      events.push({
        id: crypto.randomUUID(),
        organizationId: context.organizationId,
        leadId: context.leadId,
        eventType: "ACTION_SUGGESTED",
        title: "Agent Suggested Action (Autonomy: Suggest Only)",
        details: { action: analysis.recommendedAction, draft: analysis.draftMessage },
        createdAt: new Date().toISOString(),
      });

      return {
        executionId,
        status: "COMPLETED",
        stepsExecuted,
        outputSummary: `Suggested action: ${analysis.recommendedAction}`,
        events,
      };
    } else if (context.autonomyMode === "REQUIRE_APPROVAL") {
      approvalRequestId = crypto.randomUUID();
      events.push({
        id: crypto.randomUUID(),
        organizationId: context.organizationId,
        leadId: context.leadId,
        eventType: "APPROVAL_REQUESTED",
        title: `Approval Required: Send Outreach to ${context.leadName}`,
        details: {
          approvalRequestId,
          actionType: "SEND_EMAIL",
          draftMessage: analysis.draftMessage,
        },
        createdAt: new Date().toISOString(),
      });

      return {
        executionId,
        status: "PENDING_APPROVAL",
        stepsExecuted,
        approvalRequestId,
        outputSummary: `Execution paused awaiting human approval for outreach.`,
        events,
      };
    } else {
      // AUTONOMOUS MODE -> Execute Action Immediately
      events.push({
        id: crypto.randomUUID(),
        organizationId: context.organizationId,
        leadId: context.leadId,
        eventType: "MESSAGE_SENT",
        title: `[DEMO / SIMULATED] Outreach Email Sent to ${context.leadEmail || context.leadName}`,
        details: { message: analysis.draftMessage, simulated: true },
        createdAt: new Date().toISOString(),
      });
      stepsExecuted++;

      // Schedule Follow Up
      events.push({
        id: crypto.randomUUID(),
        organizationId: context.organizationId,
        leadId: context.leadId,
        eventType: "FOLLOW_UP_SCHEDULED",
        title: "Automated Follow-up Scheduled in 48 hours",
        details: { scheduledAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString() },
        createdAt: new Date().toISOString(),
      });
      stepsExecuted++;
    }
  } else {
    // Low / Medium Score -> Nurture Workflow Branch
    events.push({
      id: crypto.randomUUID(),
      organizationId: context.organizationId,
      leadId: context.leadId,
      eventType: "NURTURE_ADDED",
      title: "Lead added to Automated Nurture Sequence",
      details: { score: analysis.score },
      createdAt: new Date().toISOString(),
    });
  }

  return {
    executionId,
    status: "COMPLETED",
    stepsExecuted,
    outputSummary: `Workflow executed successfully (${stepsExecuted} steps).`,
    events,
  };
}
