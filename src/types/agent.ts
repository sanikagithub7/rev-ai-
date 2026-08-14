export type AutonomyMode = "SUGGEST_ONLY" | "REQUIRE_APPROVAL" | "AUTONOMOUS";

export type AgentRunIntent = "HIGH" | "MEDIUM" | "LOW";
export type AgentRunPriority = "URGENT" | "HIGH" | "NORMAL" | "LOW";

export interface AIAgent {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "PAUSED" | "DISABLED";
  model: string;
  systemPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentRun {
  id: string;
  organizationId: string;
  agentId?: string;
  leadId?: string;
  triggerType: string;
  score: number;
  intent: AgentRunIntent;
  priority: AgentRunPriority;
  summary: string;
  recommendedAction: string;
  draftMessage: string;
  followUpRequired: boolean;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  error?: string;
  createdAt: string;
}

export type WorkflowNodeType =
  | "TRIGGER"
  | "AI_ANALYSIS"
  | "AI_AGENT_ACTION"
  | "CONDITION"
  | "SEND_EMAIL"
  | "FOLLOW_UP"
  | "DELAY"
  | "CRM_UPDATE"
  | "NOTIFICATION"
  | "HUMAN_APPROVAL"
  | "END";

export interface WorkflowNodeDef {
  id: string;
  type: WorkflowNodeType;
  name: string;
  config: Record<string, unknown>;
  positionX?: number;
  positionY?: number;
}

export interface WorkflowEdgeDef {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition?: string;
}

export interface WorkflowDefinition {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  triggerEvent: string;
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdgeDef[];
  status: "DRAFT" | "ACTIVE" | "PAUSED";
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  organizationId: string;
  workflowId?: string;
  leadId?: string;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "PENDING_APPROVAL" | "CANCELLED";
  currentStep?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface WorkflowStep {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: WorkflowNodeType;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED" | "WAITING_APPROVAL";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface ApprovalRequest {
  id: string;
  organizationId: string;
  executionId?: string;
  leadId?: string;
  actionType: string;
  title: string;
  description?: string;
  proposedPayload: Record<string, unknown>;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

export interface AIAction {
  id: string;
  organizationId: string;
  leadId?: string;
  actionType: string;
  payload: Record<string, unknown>;
  status: "PENDING" | "EXECUTED" | "FAILED" | "SIMULATED";
  simulated: boolean;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  organizationId: string;
  leadId?: string;
  scheduledAt: string;
  type: string;
  note?: string;
  status: "SCHEDULED" | "EXECUTED" | "CANCELLED";
  createdAt: string;
}

export interface LeadEvent {
  id: string;
  organizationId: string;
  leadId: string;
  eventType: string;
  title: string;
  details?: Record<string, unknown>;
  createdAt: string;
}
