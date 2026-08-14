-- Rev AI Migration: Autonomous AI Sales Agent + Workflow Engine Schema
-- File: supabase/migrations/20260812_autonomous_agent_workflow.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Add Autonomy Setting to Organizations Table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS autonomy_mode TEXT NOT NULL DEFAULT 'REQUIRE_APPROVAL' 
CHECK (autonomy_mode IN ('SUGGEST_ONLY', 'REQUIRE_APPROVAL', 'AUTONOMOUS'));

-- 2. AI AGENTS TABLE
CREATE TABLE IF NOT EXISTS public.ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Sales Autopilot Agent',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'DISABLED')),
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  system_prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. AGENT RUNS TABLE
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  score INTEGER,
  intent TEXT CHECK (intent IN ('HIGH', 'MEDIUM', 'LOW')),
  priority TEXT CHECK (priority IN ('URGENT', 'HIGH', 'NORMAL', 'LOW')),
  summary TEXT,
  recommended_action TEXT,
  draft_message TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. WORKFLOW DEFINITIONS TABLE
CREATE TABLE IF NOT EXISTS public.workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL DEFAULT 'NEW_LEAD',
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. WORKFLOW EXECUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'PENDING_APPROVAL', 'CANCELLED')),
  current_step TEXT,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. WORKFLOW STEPS TABLE
CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED', 'WAITING_APPROVAL')),
  input JSONB,
  output JSONB,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 7. APPROVAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  proposed_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 8. AI ACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.ai_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'EXECUTED' CHECK (status IN ('PENDING', 'EXECUTED', 'FAILED', 'SIMULATED')),
  simulated BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. FOLLOW UPS TABLE
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL DEFAULT 'EMAIL_CHECK_IN',
  note TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'EXECUTED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. LEAD EVENTS TABLE (For Activity Timeline)
CREATE TABLE IF NOT EXISTS public.lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_ai_agents_org ON public.ai_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_org ON public.agent_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_defs_org ON public.workflow_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_execs_org ON public.workflow_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_org ON public.approval_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_actions_org ON public.ai_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_org ON public.follow_ups(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_lead ON public.lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_org ON public.lead_events(organization_id);

-- ENABLE RLS
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Members can access ai_agents" ON public.ai_agents
  FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY "Members can access agent_runs" ON public.agent_runs
  FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY "Members can access workflow_definitions" ON public.workflow_definitions
  FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY "Members can access workflow_executions" ON public.workflow_executions
  FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY "Members can access workflow_steps" ON public.workflow_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workflow_executions e
      WHERE e.id = execution_id
      AND public.is_org_member(e.organization_id)
    )
  );

CREATE POLICY "Members can access approval_requests" ON public.approval_requests
  FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY "Members can access ai_actions" ON public.ai_actions
  FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY "Members can access follow_ups" ON public.follow_ups
  FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY "Members can access lead_events" ON public.lead_events
  FOR ALL USING (public.is_org_member(organization_id));
