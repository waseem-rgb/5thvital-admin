-- Migration: Add waseem@predlabs.in as super_admin
-- Run this in Supabase SQL Editor if the user doesn't have access

-- First, ensure the admins table exists with correct structure
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS admins_user_id_idx ON public.admins(user_id);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Admins can read all admins" ON public.admins;
DROP POLICY IF EXISTS "Super admins can insert admins" ON public.admins;
DROP POLICY IF EXISTS "Super admins can update admins" ON public.admins;
DROP POLICY IF EXISTS "Super admins can delete admins" ON public.admins;

-- Policy: Any authenticated user can read admins (needed for auth check)
CREATE POLICY "Authenticated users can read admins"
  ON public.admins FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Super admins can manage other admins
CREATE POLICY "Super admins can insert admins"
  ON public.admins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Super admins can update admins"
  ON public.admins FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Super admins can delete admins"
  ON public.admins FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Insert waseem@predlabs.in as super_admin (skip if exists)
INSERT INTO public.admins (user_id, email, role)
VALUES (
  'e8970203-820a-4bc0-a576-84ab26ec6663',
  'waseem@predlabs.in',
  'super_admin'
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  updated_at = now();

-- Verify the insert
SELECT * FROM public.admins WHERE user_id = 'e8970203-820a-4bc0-a576-84ab26ec6663';
