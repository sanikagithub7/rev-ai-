-- REV AI LEADS MANAGEMENT & CONVERSATIONS 2.0 SCHEMA UPDATE
-- File: supabase/migrations/20260814_leads_conversations_v2.sql

-- 1. ALTER LEADS TABLE
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Website',
ADD COLUMN IF NOT EXISTS budget TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'NORMAL',
ADD COLUMN IF NOT EXISTS stated_requirement TEXT,
ADD COLUMN IF NOT EXISTS inbound_notes TEXT,
ADD COLUMN IF NOT EXISTS heat_level TEXT DEFAULT 'NOT ANALYZED';

-- 2. ALTER CONVERSATIONS TABLE
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'NORMAL',
ADD COLUMN IF NOT EXISTS assignee TEXT DEFAULT 'Unassigned',
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW();

-- 3. ALTER MESSAGES TABLE
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- 4. CONVERSATION EVENTS TABLE FOR WORKFLOW ENGINE
CREATE TABLE IF NOT EXISTS public.conversation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_leads_priority ON public.leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_heat ON public.leads(heat_level);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON public.conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conv_events_org ON public.conversation_events(organization_id);

-- RLS POLICIES FOR CONVERSATION EVENTS
ALTER TABLE public.conversation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can access conversation events" ON public.conversation_events
  FOR ALL USING (public.is_org_member(organization_id));
