-- =====================================================
-- USER MANAGEMENT MIGRATION
-- Run this in your Supabase SQL Editor.
-- Sets up admin_profiles table with role-based access.
-- =====================================================

-- 1. Create role enum
CREATE TYPE admin_role AS ENUM ('super_admin', 'branch_admin');

-- 2. Create admin_profiles table
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role admin_role NOT NULL DEFAULT 'branch_admin',
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Enable RLS
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own profile
CREATE POLICY "Users can read own profile"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Super admins can read all profiles (needed for the users management page)
CREATE POLICY "Super admins can read all profiles"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Super admins can insert/update/delete profiles
CREATE POLICY "Super admins can manage profiles"
  ON admin_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- 4. Auto-mark the FIRST user (oldest auth.users entry) as super_admin
--    This automatically tags your existing account.
INSERT INTO admin_profiles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- 5. Verify the result
SELECT
  ap.id,
  ap.role,
  ap.is_active,
  au.email,
  b.name AS branch_name
FROM admin_profiles ap
JOIN auth.users au ON au.id = ap.user_id
LEFT JOIN branches b ON b.id = ap.branch_id;
