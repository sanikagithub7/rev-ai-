# 🏗️ Rev AI System Architecture & Workflow Blueprint

## Overview

Rev AI is an **AI-Powered Business Workflow Automation Platform**. The core product centers on an event-driven, node-based workflow automation engine where AI serves as an intelligence layer inside structured business workflows.

---

## Conceptual Workflow Execution Pipeline

```text
USER / SENDER
   │
   ▼
WORKFLOW DEFINITION (Organization-Scoped)
   │
   ▼
TRIGGER (LEAD_CREATED, FORM_SUBMITTED, MESSAGE_RECEIVED, etc.)
   │
   ▼
NODE GRAPH EXECUTION (Sequential & Branching Nodes)
   │
   ├──────► TRIGGER NODE (Origin Context)
   ├──────► AI NODE (ANALYZE, CLASSIFY, EXTRACT, SUMMARIZE, GENERATE, SCORE)
   ├──────► CONDITION NODE (e.g., lead.score > 80)
   ├──────► ACTION NODE (UPDATE_LEAD, ASSIGN_LEAD, CREATE_TASK, WEBHOOK)
   └──────► DELAY NODE (Wait duration)
   │
   ▼
EXECUTION ENGINE (Async Workflow Runner — Implemented in later Phase)
   │
   ▼
EXECUTION AUDIT LOG (`workflow_runs` & `workflow_run_steps`)
   │
   ▼
DATABASE PERSISTENCE (Supabase PostgreSQL with RLS)
```

---

## 5-Layer Architectural Blueprint

```text
1. PRESENTATION LAYER
   Next.js 15 App Router, Tailwind CSS, Rev AI Swiss Grid Visual Engine.
   Workflows UI: /dashboard/workflows, /dashboard/workflows/new, /dashboard/workflows/[id]

2. AUTHENTICATION & MULTI-TENANCY LAYER
   Supabase Auth SSR, Tenant Context (`getTenantContext`), Role Authorization (`OWNER`, `ADMIN`, `SALES`, `MEMBER`).
   Row-Level Security (RLS) on all workflow tables (`is_org_member(organization_id)`).

3. WORKFLOW AUTOMATION ENGINE LAYER (Core Product)
   Workflow Graph definitions (`workflows`, `workflow_nodes`, `workflow_edges`).
   State Management (`DRAFT`, `ACTIVE`, `PAUSED`).

4. AI INTELLIGENCE LAYER
   Centralized LLM abstraction (`src/lib/ai/client.ts`).
   AI operations (`ANALYZE`, `CLASSIFY`, `EXTRACT`, `SUMMARIZE`, `GENERATE`, `SCORE`).

5. OBSERVABILITY & PERSISTENCE LAYER
   Workflow execution logs (`workflow_runs`, `workflow_run_steps`).
   Auditability for every node execution step.
```

---

## Multi-Tenant Security Model

Every workflow belongs strictly to an `organization_id`. Database policies enforce that users can only read, construct, or alter workflows belonging to organizations where they possess verified active membership.
