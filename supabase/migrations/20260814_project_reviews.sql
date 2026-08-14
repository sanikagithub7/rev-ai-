-- REV AI PROJECT REVIEWS MIGRATION
-- File: supabase/migrations/20260814_project_reviews.sql

CREATE TABLE IF NOT EXISTS public.project_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  website_url TEXT,
  project_description TEXT NOT NULL,
  target_audience TEXT,
  product_service TEXT,
  current_goal TEXT,
  additional_context TEXT,
  overall_score INTEGER DEFAULT 0,
  review_result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_project_reviews_org ON public.project_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_reviews_created ON public.project_reviews(created_at DESC);

-- RLS POLICIES
ALTER TABLE public.project_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can access organization project reviews" ON public.project_reviews
  FOR ALL USING (public.is_org_member(organization_id));
