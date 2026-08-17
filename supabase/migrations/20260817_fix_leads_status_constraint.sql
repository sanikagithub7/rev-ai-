-- REV AI LEADS MODULE: STATUS CONSTRAINT FIX
-- File: supabase/migrations/20260817_fix_leads_status_constraint.sql
-- Date: 2026-08-17
--
-- PROBLEM:
--   The original leads table was created with:
--     CHECK (status IN ('NEW', 'QUALIFIED', 'HOT', 'NURTURING', 'CONVERTED', 'LOST'))
--   This is missing 'CONTACTED', which the Leads UI and API both use as a valid status.
--   Any insert/update with status = 'CONTACTED' is rejected by Postgres with a
--   constraint violation error, causing silent data persistence failures.
--
-- FIX:
--   Drop the existing check constraint and recreate it with the correct status list
--   that matches what the application actually uses:
--   NEW, CONTACTED, QUALIFIED, CONVERTED, LOST
--
-- NOTE: 'HOT' and 'NURTURING' from the original constraint are removed because
--   'hot' is tracked via the heat_level column (NOT ANALYZED, HOT, WARM, COLD)
--   not the status column. The UI does not use HOT/NURTURING as statuses.
--
-- APPLIES TO: Live Supabase project at xlyzfjphqzhfpzeqcvru.supabase.co
-- RUN IN: Supabase Dashboard -> SQL Editor

-- Step 1: Drop the existing status check constraint (constraint name from pg_constraint)
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Step 2: Recreate with the correct status set matching the application
ALTER TABLE public.leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'));

-- Step 3: Verify the constraint was applied correctly
-- (Run this SELECT to confirm - it should return 1 row)
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name = 'leads_status_check';
