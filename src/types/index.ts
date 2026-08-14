/**
 * Core Type Definitions for Rev AI — AI Sales Autopilot
 */

export * from "./workflow";
export * from "./agent";

export type UserRole = "OWNER" | "ADMIN" | "SALES" | "MEMBER";

export type LeadStatus = "NEW" | "QUALIFIED" | "HOT" | "NURTURING" | "CONVERTED" | "LOST";

export type AutomationRunStatus = "PENDING" | "SUCCESS" | "FAILED";

export type AIRunStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface User {
  id: string;
  email: string;
  name?: string;
  authId: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  description?: string;
  autonomyMode?: "SUGGEST_ONLY" | "REQUIRE_APPROVAL" | "AUTONOMOUS";
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  createdAt: string;
}

export interface BusinessProfile {
  id: string;
  organizationId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  organizationId: string;
  serviceName: string;
  description?: string;
  startingPrice?: string;
  deliveryTime?: string;
  createdAt: string;
}

export interface BusinessFAQ {
  id: string;
  organizationId: string;
  question: string;
  answer: string;
  category?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  score: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AIRun {
  id: string;
  organizationId: string;
  type: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  model: string;
  tokens?: number;
  status: AIRunStatus;
  error?: string;
  createdAt: string;
}

export interface AutomationRun {
  id: string;
  organizationId: string;
  workflow: string;
  trigger: string;
  status: AutomationRunStatus;
  error?: string;
  startedAt: string;
  completedAt?: string;
}
