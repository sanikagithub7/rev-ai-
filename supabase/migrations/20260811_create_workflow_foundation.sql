-- Rev AI Phase 2 Migration: Workflow Automation Foundation
-- File: supabase/migrations/20260811_create_workflow_foundation.sql

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. WORKFLOWS TABLE
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED')),
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. WORKFLOW NODES TABLE
CREATE TABLE IF NOT EXISTS public.workflow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('TRIGGER', 'AI', 'CONDITION', 'ACTION', 'DELAY')),
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. WORKFLOW EDGES TABLE
CREATE TABLE IF NOT EXISTS public.workflow_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
  condition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. WORKFLOW RUNS TABLE (Execution Observability Foundation)
CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  trigger_type TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. WORKFLOW RUN STEPS TABLE
CREATE TABLE IF NOT EXISTS public.workflow_run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED')),
  input JSONB,
  output JSONB,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_workflows_org ON public.workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_wf ON public.workflow_nodes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_wf ON public.workflow_edges(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_wf ON public.workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_org ON public.workflow_runs(organization_id);

-- RLS SECURITY DEFINER HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.can_access_workflow(wf_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workflows w
    JOIN public.organization_members om ON w.organization_id = om.organization_id
    WHERE w.id = wf_id
    AND om.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_run_steps ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR WORKFLOWS
CREATE POLICY "Members can view org workflows" ON public.workflows
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "Members can create org workflows" ON public.workflows
  FOR INSERT WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Members can update org workflows" ON public.workflows
  FOR UPDATE USING (public.is_org_member(organization_id));

CREATE POLICY "Owners and Admins can delete workflows" ON public.workflows
  FOR DELETE USING (public.has_org_role(organization_id, ARRAY['OWNER', 'ADMIN']));

-- RLS POLICIES FOR WORKFLOW NODES
CREATE POLICY "Members can access workflow nodes" ON public.workflow_nodes
  FOR ALL USING (public.can_access_workflow(workflow_id));

-- RLS POLICIES FOR WORKFLOW EDGES
CREATE POLICY "Members can access workflow edges" ON public.workflow_edges
  FOR ALL USING (public.can_access_workflow(workflow_id));

-- RLS POLICIES FOR WORKFLOW RUNS
CREATE POLICY "Members can view org workflow runs" ON public.workflow_runs
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "Members can create org workflow runs" ON public.workflow_runs
  FOR INSERT WITH CHECK (public.is_org_member(organization_id));

-- RLS POLICIES FOR WORKFLOW RUN STEPS
CREATE POLICY "Members can view workflow run steps" ON public.workflow_run_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workflow_runs r
      WHERE r.id = workflow_run_id
      AND public.is_org_member(r.organization_id)
    )
  );
