-- =====================================================
-- 5thVital Admin RLS Policies
-- Run this in Supabase SQL Editor to set up proper access controls
-- =====================================================

-- =====================================================
-- 1. ADMINS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator', 'editor', 'viewer', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policy: Any authenticated user can read admins (needed for auth check)
CREATE POLICY IF NOT EXISTS "admins_select_authenticated" ON public.admins
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only super_admin can insert new admins
CREATE POLICY IF NOT EXISTS "admins_insert_super_admin" ON public.admins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- Policy: Only super_admin can update admins
CREATE POLICY IF NOT EXISTS "admins_update_super_admin" ON public.admins
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- Policy: Only super_admin can delete admins
CREATE POLICY IF NOT EXISTS "admins_delete_super_admin" ON public.admins
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- =====================================================
-- 2. USER_ROLES TABLE (alternative to admins)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'moderator', 'editor', 'viewer', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Any authenticated user can read user_roles (needed for auth check)
CREATE POLICY IF NOT EXISTS "user_roles_select_authenticated" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only super_admin can manage user_roles
CREATE POLICY IF NOT EXISTS "user_roles_manage_super_admin" ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
    OR
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- =====================================================
-- 3. PACKAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  mrp INTEGER,
  price INTEGER,
  discount_percent INTEGER,
  reports_within_hours INTEGER,
  tests_included INTEGER,
  requisites TEXT,
  home_collection_minutes INTEGER,
  highlights TEXT,
  description TEXT,
  parameters JSONB DEFAULT '[]'::jsonb,
  faqs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- PUBLIC SITE: SELECT only published packages (using anon key)
CREATE POLICY IF NOT EXISTS "packages_select_published_anon" ON public.packages
  FOR SELECT
  TO anon
  USING (status = 'published');

-- ADMIN: SELECT all packages (authenticated with admin role checked in app)
CREATE POLICY IF NOT EXISTS "packages_select_authenticated" ON public.packages
  FOR SELECT
  TO authenticated
  USING (true);

-- ADMIN WRITES: Use service_role key (bypasses RLS) for insert/update/delete
-- The admin app uses createAdminClient() with SERVICE_ROLE_KEY

-- =====================================================
-- 4. LEADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
  notes TEXT,
  follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- PUBLIC SITE: Can INSERT leads (form submissions)
CREATE POLICY IF NOT EXISTS "leads_insert_anon" ON public.leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ADMIN: SELECT all leads
CREATE POLICY IF NOT EXISTS "leads_select_authenticated" ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ADMIN WRITES: Use service_role key for update/delete

-- =====================================================
-- 5. MEDICAL_TESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.medical_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_name TEXT NOT NULL,
  test_code TEXT,
  category TEXT,
  sample_type TEXT,
  description TEXT,
  normal_range TEXT,
  unit TEXT,
  price INTEGER,
  turnaround_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for search performance
CREATE INDEX IF NOT EXISTS idx_medical_tests_name ON public.medical_tests USING gin(to_tsvector('english', test_name));
CREATE INDEX IF NOT EXISTS idx_medical_tests_code ON public.medical_tests(test_code);
CREATE INDEX IF NOT EXISTS idx_medical_tests_category ON public.medical_tests(category);

ALTER TABLE public.medical_tests ENABLE ROW LEVEL SECURITY;

-- PUBLIC: SELECT all tests (for public site and admin search)
CREATE POLICY IF NOT EXISTS "medical_tests_select_all" ON public.medical_tests
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ADMIN WRITES: Use service_role key for insert/update/delete

-- =====================================================
-- 6. PAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content_json JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- PUBLIC: SELECT all pages
CREATE POLICY IF NOT EXISTS "pages_select_all" ON public.pages
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ADMIN WRITES: Use service_role key

-- =====================================================
-- 7. SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- PUBLIC: SELECT settings
CREATE POLICY IF NOT EXISTS "settings_select_all" ON public.settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ADMIN WRITES: Use service_role key

-- =====================================================
-- 8. MEDIA TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- PUBLIC: SELECT media
CREATE POLICY IF NOT EXISTS "media_select_all" ON public.media
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ADMIN WRITES: Use service_role key

-- =====================================================
-- HELPER: Add initial super_admin
-- Replace 'YOUR_AUTH_USER_ID' with the actual user ID from auth.users
-- Replace 'your@email.com' with the actual email
-- =====================================================
-- INSERT INTO public.admins (user_id, email, role)
-- VALUES ('YOUR_AUTH_USER_ID', 'your@email.com', 'super_admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- =====================================================
-- SUMMARY OF ACCESS CONTROL STRATEGY:
-- =====================================================
-- 1. Public site (anon key):
--    - SELECT published packages
--    - SELECT all pages, settings, media, medical_tests
--    - INSERT leads (form submissions)
--
-- 2. Admin site (anon key + auth):
--    - SELECT all data (authenticated users with admin role)
--    - READ operations use the server client with anon key
--
-- 3. Admin writes (service_role key):
--    - All INSERT/UPDATE/DELETE operations use createAdminClient()
--    - Service role bypasses RLS for full write access
--    - Role check is done in the application layer (checkAdmin())
-- =====================================================
