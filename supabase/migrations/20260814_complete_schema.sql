-- REV AI COMPLETE SUPABASE DATABASE SCHEMA MIGRATION
-- File: supabase/migrations/20260814_complete_schema.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (Synced with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  description TEXT,
  autonomy_mode TEXT NOT NULL DEFAULT 'REQUIRE_APPROVAL' CHECK (autonomy_mode IN ('SUGGEST_ONLY', 'REQUIRE_APPROVAL', 'AUTONOMOUS')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ORGANIZATION MEMBERS
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'SALES', 'MEMBER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

-- 4. BUSINESS PROFILES
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  business_description TEXT,
  business_email TEXT,
  business_phone TEXT,
  working_hours TEXT,
  payment_terms TEXT,
  refund_policy TEXT,
  service_areas TEXT,
  target_customers TEXT,
  typical_budget TEXT,
  common_requirements TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SERVICES
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  description TEXT,
  starting_price TEXT,
  delivery_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. BUSINESS FAQS
CREATE TABLE IF NOT EXISTS public.business_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. LEADS
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'QUALIFIED', 'HOT', 'NURTURING', 'CONVERTED', 'LOST')),
  score INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. MEETINGS
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  lead_name TEXT NOT NULL,
  company TEXT,
  date_time TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Sales Qualification Call',
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'COMPLETED', 'CANCELLED')),
  meeting_link TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  lead_name TEXT NOT NULL,
  lead_company TEXT,
  channel TEXT NOT NULL DEFAULT 'EMAIL',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  last_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('lead', 'agent', 'user')),
  text TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. WORKFLOWS
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

-- 12. WORKFLOW NODES
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

-- 13. WORKFLOW EDGES
CREATE TABLE IF NOT EXISTS public.workflow_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
  condition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. WORKFLOW RUNS
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

-- 15. WORKFLOW RUN STEPS
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

-- 16. AI AGENTS
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

-- 17. AGENT RUNS
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

-- 18. APPROVAL REQUESTS
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  execution_id UUID,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  lead_name TEXT,
  company TEXT,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  draft_message TEXT,
  score INTEGER DEFAULT 80,
  proposed_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 19. AI ACTIONS
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

-- 20. FOLLOW UPS
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

-- 21. LEAD EVENTS (Activity Timeline)
CREATE TABLE IF NOT EXISTS public.lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. AI RUNS
CREATE TABLE IF NOT EXISTS public.ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  input JSONB NOT NULL,
  output JSONB,
  model TEXT NOT NULL,
  tokens INTEGER,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. AUTOMATION RUNS
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow TEXT NOT NULL,
  trigger TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_org ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_meetings_org ON public.meetings(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org ON public.conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_workflows_org ON public.workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_org ON public.ai_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_org ON public.automation_runs(organization_id);

-- TRIGGER FUNCTION TO SYNC AUTH USER TO PUBLIC USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- HELPER FUNCTIONS FOR RLS
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_org_role(org_id UUID, required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR ALL TABLES
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Members can view organization" ON public.organizations FOR SELECT USING (public.is_org_member(id));
CREATE POLICY "Owners and Admins can update organization" ON public.organizations FOR UPDATE USING (public.has_org_role(id, ARRAY['OWNER', 'ADMIN']));
CREATE POLICY "Authenticated users can create organizations" ON public.organizations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Members can view org memberships" ON public.organization_members FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Owners and Admins can manage org memberships" ON public.organization_members FOR ALL USING (public.has_org_role(organization_id, ARRAY['OWNER', 'ADMIN']));
CREATE POLICY "Users can insert own membership on org creation" ON public.organization_members FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can access business profile" ON public.business_profiles FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access services" ON public.services FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access faqs" ON public.business_faqs FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access leads" ON public.leads FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access meetings" ON public.meetings FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access conversations" ON public.conversations FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access messages" ON public.messages FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY "Members can view workflows" ON public.workflows FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Members can mutate workflows" ON public.workflows FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access workflow nodes" ON public.workflow_nodes FOR ALL USING (public.can_access_workflow(workflow_id));
CREATE POLICY "Members can access workflow edges" ON public.workflow_edges FOR ALL USING (public.can_access_workflow(workflow_id));
CREATE POLICY "Members can access workflow runs" ON public.workflow_runs FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access workflow run steps" ON public.workflow_run_steps FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workflow_runs r WHERE r.id = workflow_run_id AND public.is_org_member(r.organization_id))
);

CREATE POLICY "Members can access ai_agents" ON public.ai_agents FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access agent_runs" ON public.agent_runs FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access approval_requests" ON public.approval_requests FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access ai_actions" ON public.ai_actions FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access follow_ups" ON public.follow_ups FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access lead_events" ON public.lead_events FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access ai_runs" ON public.ai_runs FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access automation_runs" ON public.automation_runs FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Members can access project_reviews" ON public.project_reviews FOR ALL USING (public.is_org_member(organization_id));
