# ⚡ Rev AI — Workflow Automation Specification

## Overview

Rev AI provides a node-based workflow automation framework. Workflows combine triggers, AI intelligence operations, conditional logic branches, actions, and delays.

---

## Workflow Node Taxonomy

### 1. TRIGGER NODES (`type: "TRIGGER"`)
Initiates workflow execution upon event occurrence:
- `LEAD_CREATED`
- `LEAD_UPDATED`
- `FORM_SUBMITTED`
- `MESSAGE_RECEIVED`
- `MEETING_COMPLETED`
- `PAYMENT_RECEIVED`
- `WEBHOOK_RECEIVED`
- `SCHEDULED`

### 2. AI INTELLIGENCE NODES (`type: "AI"`)
Executes AI transformations:
- `ANALYZE` (Extract sentiment, intent, key signals)
- `CLASSIFY` (Categorize lead domain / industry)
- `EXTRACT` (Pull contact info, requirements)
- `SUMMARIZE` (Create concise summary)
- `GENERATE` (Draft personalized response)
- `SCORE` (Compute qualification score 0-100)

### 3. CONDITION NODES (`type: "CONDITION"`)
Evaluates logical criteria:
- Field (e.g., `lead.score`, `lead.intent`)
- Operator (`>`, font `=`, `==`, `<`, `!=`, `contains`)
- Value (e.g., `80`, `"high"`)

### 4. ACTION NODES (`type: "ACTION"`)
Performs business side-effects:
- `UPDATE_LEAD`
- `ASSIGN_LEAD`
- `CREATE_TASK`
- `SEND_NOTIFICATION`
- `WEBHOOK`

### 5. DELAY NODES (`type: "DELAY"`)
Suspends execution for specified duration (minutes, hours, days).

---

## Workflow Status Lifecycle

- **`DRAFT`**: Editing mode. Cannot be triggered by system events.
- **`ACTIVE`**: Enabled for production event triggering.
- **`PAUSED`**: Temporarily suspended. Incoming triggers bypass paused workflows.
