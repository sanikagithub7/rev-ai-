/**
 * Core Type Definitions for Rev AI Workflow Automation Foundation
 */

export type WorkflowStatus = "DRAFT" | "ACTIVE" | "PAUSED";

export type WorkflowNodeType = "TRIGGER" | "AI" | "CONDITION" | "ACTION" | "DELAY";

export type TriggerType =
  | "LEAD_CREATED"
  | "LEAD_UPDATED"
  | "FORM_SUBMITTED"
  | "MESSAGE_RECEIVED"
  | "MEETING_COMPLETED"
  | "PAYMENT_RECEIVED"
  | "WEBHOOK_RECEIVED"
  | "SCHEDULED";

export type AIOperationType =
  | "ANALYZE"
  | "CLASSIFY"
  | "EXTRACT"
  | "SUMMARIZE"
  | "GENERATE"
  | "SCORE";

export type ActionType =
  | "UPDATE_LEAD"
  | "ASSIGN_LEAD"
  | "CREATE_TASK"
  | "SEND_NOTIFICATION"
  | "WEBHOOK";

export interface TriggerNodeConfig {
  triggerType: TriggerType;
  filters?: Record<string, string>;
}

export interface AINodeConfig {
  operation: AIOperationType;
  promptTemplate?: string;
  targetField?: string;
}

export interface ConditionNodeConfig {
  field: string;
  operator: ">" | "=" | "==" | "<" | "!=" | "contains";
  value: string;
}

export interface ActionNodeConfig {
  actionType: ActionType;
  parameters?: Record<string, string>;
}

export interface DelayNodeConfig {
  duration: number;
  unit: "minutes" | "hours" | "days";
}

export type NodeConfig =
  | TriggerNodeConfig
  | AINodeConfig
  | ConditionNodeConfig
  | ActionNodeConfig
  | DelayNodeConfig
  | Record<string, unknown>;

export interface WorkflowNode {
  id: string;
  workflowId: string;
  type: WorkflowNodeType;
  name: string;
  config: NodeConfig;
  positionX: number;
  positionY: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowEdge {
  id: string;
  workflowId: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition?: string;
  createdAt?: string;
}

export interface Workflow {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  version: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  executionCount?: number;
  lastRunAt?: string;
}

export type WorkflowRunStatus = "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface WorkflowRun {
  id: string;
  workflowId: string;
  organizationId: string;
  status: WorkflowRunStatus;
  triggerType: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
  createdAt: string;
}

export interface WorkflowRunStep {
  id: string;
  workflowRunId: string;
  nodeId: string;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt: string;
  completedAt?: string;
}
