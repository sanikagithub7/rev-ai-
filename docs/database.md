# 💾 Rev AI Database Specification & Schema

> **Engine:** Supabase PostgreSQL  
> **Security:** Enforced Row-Level Security (RLS) on all tenant-scoped tables.

---

## Workflow Automation Tables (`supabase/migrations/20260811_create_workflow_foundation.sql`)

### 1. `workflows`
- `id` (uuid, primary key)
- `organization_id` (uuid, references organizations(id) on delete cascade)
- `name` (text, not null)
- `description` (text)
- `status` (text, check status in ('DRAFT', 'ACTIVE', 'PAUSED'), default 'DRAFT')
- `version` (integer, default 1)
- `created_by` (uuid, references users(id) on delete set null)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### 2. `workflow_nodes`
- `id` (uuid, primary key)
- `workflow_id` (uuid, references workflows(id) on delete cascade)
- `type` (text, check type in ('TRIGGER', 'AI', 'CONDITION', 'ACTION', 'DELAY'))
- `name` (text, not null)
- `config` (jsonb, default '{}'::jsonb)
- `position_x` (integer, default 0)
- `position_y` (integer, default 0)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### 3. `workflow_edges`
- `id` (uuid, primary key)
- `workflow_id` (uuid, references workflows(id) on delete cascade)
- `source_node_id` (uuid, references workflow_nodes(id) on delete cascade)
- `target_node_id` (uuid, references workflow_nodes(id) on delete cascade)
- `condition` (text)
- `created_at` (timestamptz, default now())

### 4. `workflow_runs`
- `id` (uuid, primary key)
- `workflow_id` (uuid, references workflows(id) on delete cascade)
- `organization_id` (uuid, references organizations(id) on delete cascade)
- `status` (text, check status in ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'))
- `trigger_type` (text, not null)
- `started_at` (timestamptz, default now())
- `completed_at` (timestamptz)
- `error` (text)
- `created_at` (timestamptz, default now())

### 5. `workflow_run_steps`
- `id` (uuid, primary key)
- `workflow_run_id` (uuid, references workflow_runs(id) on delete cascade)
- `node_id` (uuid, references workflow_nodes(id) on delete cascade)
- `status` (text, not null)
- `input` (jsonb)
- `output` (jsonb)
- `error` (text)
- `started_at` (timestamptz, default now())
- `completed_at` (timestamptz)
