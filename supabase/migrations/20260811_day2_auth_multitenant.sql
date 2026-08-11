-- Rev AI Day 2 Migration: Multi-Tenant Database Schema & Row Level Security (RLS)
-- File: supabase/migrations/20260811_day2_auth_multitenant.sql

-- Enable UUID extension if not enabled
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ORGANIZATION MEMBERS (Role: OWNER, ADMIN, SALES, MEMBER)
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

-- 8. AI RUNS
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

-- 9. AUTOMATION RUNS
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

-- DROP IF EXISTS BEFORE CREATING TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- HELPER FUNCTION FOR RLS TENANT CHECK
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

-- HELPER FUNCTION FOR ROLE CHECK
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

-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR USERS
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS POLICIES FOR ORGANIZATIONS
CREATE POLICY "Members can view their organization" ON public.organizations
  FOR SELECT USING (public.is_org_member(id));

CREATE POLICY "Owners and Admins can update organization" ON public.organizations
  FOR UPDATE USING (public.has_org_role(id, ARRAY['OWNER', 'ADMIN']));

CREATE POLICY "Authenticated users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS POLICIES FOR ORGANIZATION MEMBERS
CREATE POLICY "Members can view org memberships" ON public.organization_members
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "Owners and Admins can manage org memberships" ON public.organization_members
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['OWNER', 'ADMIN']));

CREATE POLICY "Users can insert own membership on org creation" ON public.organization_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS POLICIES FOR BUSINESS PROFILES
CREATE POLICY "Members can view business profile" ON public.business_profiles
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "Owners and Admins can mutate business profile" ON public.business_profiles
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['OWNER', 'ADMIN']));

-- RLS POLICIES FOR SERVICES
CREATE POLICY "Members can view services" ON public.services
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "Owners and Admins can mutate services" ON public.services
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['OWNER', 'ADMIN']));

-- RLS POLICIES FOR BUSINESS FAQS
CREATE POLICY "Members can view faqs" ON public.business_faqs
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "Owners and Admins can mutate faqs" ON public.business_faqs
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['OWNER', 'ADMIN']));

-- RLS POLICIES FOR LEADS
CREATE POLICY "Members can view org leads" ON public.leads
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can mutate leads" ON public.leads
  FOR ALL USING (public.is_org_member(organization_id));

-- RLS POLICIES FOR AI RUNS
CREATE POLICY "Members can view ai runs" ON public.ai_runs
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "Members can create ai runs" ON public.ai_runs
  FOR INSERT WITH CHECK (public.is_org_member(organization_id));

-- RLS POLICIES FOR AUTOMATION RUNS
CREATE POLICY "Members can view automation runs" ON public.automation_runs
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "Members can create automation runs" ON public.automation_runs
  FOR INSERT WITH CHECK (public.is_org_member(organization_id));
